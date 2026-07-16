import { Square } from './types';
import type { BoardClass } from './board';
import { Piece } from './piece';
import { toCoords, toSquare } from './utils';

/**
 * Effect phase - determines when effects execute during a turn.
 */
export type EffectPhase = 'pre-move' | 'on-move' | 'post-move' | 'end-of-turn';

/**
 * Effect - represents a state mutation to be executed.
 * ALL game state changes must flow through the effect system.
 */
export interface Effect {
    type: 'transform' | 'remove' | 'spawn' | 'move' | 'setSquareState' | 'addSquareTag' | 'removeSquareTag' | 'cancelMove' | 'win' | 'explode';
    phase: EffectPhase;
    target: Square | string; // Square or piece ID
    params: Record<string, any>;
}

/**
 * Single source of truth for all state mutations.
 * Enforces the invariant: triggers/logic enqueue effects, never mutate directly.
 */
export class EffectExecutor {
    private queue: Effect[] = [];
    private moveWasCancelled: boolean = false;

    /**
     * Enqueue an effect to be processed.
     */
    enqueue(effect: Effect): void {
        this.queue.push(effect);
    }

    /**
     * Check if a move was cancelled by a previous effect.
     */
    wasMoveCancelled(): boolean {
        return this.moveWasCancelled;
    }

    /**
     * Process all effects for a specific phase.
     */
    processPhase(phase: EffectPhase, board: BoardClass): void {
        // Filter effects for this phase
        const phaseEffects = this.queue.filter(e => e.phase === phase);
        
        // Execute each effect
        for (const effect of phaseEffects) {
            this.executeEffect(effect, board);
        }
        
        // Remove processed effects
        this.queue = this.queue.filter(e => e.phase !== phase);
    }

    /**
     * Execute a single effect.
     */
    private executeEffect(effect: Effect, board: BoardClass): void {
        switch (effect.type) {
            case 'transform':
                this.executeTransform(effect, board);
                break;
            
            case 'remove':
                this.executeRemove(effect, board);
                break;
            
            case 'spawn':
                this.executeSpawn(effect, board);
                break;
            
            case 'move':
                this.executeMove(effect, board);
                break;
            
            case 'setSquareState':
                this.executeSetSquareState(effect, board);
                break;
            
            case 'addSquareTag':
                this.executeAddSquareTag(effect, board);
                break;
            
            case 'removeSquareTag':
                this.executeRemoveSquareTag(effect, board);
                break;
            
            case 'cancelMove':
                this.executeCancelMove(effect);
                break;
            
            case 'win':
                this.executeWin(effect, board);
                break;
            
            case 'explode':
                this.executeExplode(effect, board);
                break;
        }
    }

    private executeTransform(effect: Effect, board: BoardClass): void {
        const { target, params } = effect;
        const { newType, newColor } = params;
        
        // Target can be square or piece ID
        let square: Square;
        if (typeof target === 'string' && target.includes(',')) {
            square = target as Square;
        } else {
            // Find piece by ID
            const squares = board.getSquares();
            const found = Object.entries(squares).find(([_, p]) => p?.id === target);
            if (!found) return;
            square = found[0] as Square;
        }
        
        const piece = board.getPiece(square);
        if (!piece) return;
        
        // Create new piece with same position
        const newPiece = Piece.create(
            `${piece.id}_transformed`,
            newType || piece.type,
            newColor || piece.color,
            square
        );
        
        if (newPiece) {
            board.setPiece(square, newPiece);
        }
    }

    private executeRemove(effect: Effect, board: BoardClass): void {
        const square = effect.target as Square;
        board.setPiece(square, null);
    }

    private executeSpawn(effect: Effect, board: BoardClass): void {
        const square = effect.target as Square;
        const { pieceType, color, pieceId } = effect.params;
        
        // Don't spawn if square occupied
        if (board.getPiece(square)) return;
        
        const piece = Piece.create(
            pieceId || `spawned_${square}_${Date.now()}`,
            pieceType,
            color,
            square
        );
        
        if (piece) {
            board.setPiece(square, piece);
        }
    }

    private executeMove(effect: Effect, board: BoardClass): void {
        const { from, to } = effect.params;
        const piece = board.getPiece(from as Square);
        
        if (!piece) return;
        
        board.setPiece(to as Square, piece);
        board.setPiece(from as Square, null);
        piece.position = to as Square;
        piece.hasMoved = true;
    }

    private executeSetSquareState(effect: Effect, board: BoardClass): void {
        const square = effect.target as Square;
        const { state } = effect.params;
        
        // Merge with existing state
        const currentState = board.getSquareState(square);
        board.setSquareState(square, {
            ...currentState,
            ...state
        });
    }

    private executeAddSquareTag(effect: Effect, board: BoardClass): void {
        const square = effect.target as Square;
        const { tag } = effect.params;
        
        const state = board.getSquareState(square);
        if (!state.tags) {
            state.tags = new Set();
        }
        state.tags.add(tag);
        board.setSquareState(square, state);
    }

    private executeRemoveSquareTag(effect: Effect, board: BoardClass): void {
        const square = effect.target as Square;
        const { tag } = effect.params;
        
        const state = board.getSquareState(square);
        if (state.tags) {
            state.tags.delete(tag);
            board.setSquareState(square, state);
        }
    }

    private executeCancelMove(effect: Effect): void {
        this.moveWasCancelled = true;
    }

    private executeWin(effect: Effect, board: BoardClass): void {
        const { winner } = effect.params;
        board.triggerEffect('win', winner === 'white' ? 'white_win' as any : 'black_win' as any);
    }

    private executeExplode(effect: Effect, board: BoardClass): void {
        const square = effect.target as Square;
        const { radius } = effect.params;
        const r = Number(radius) || 0;
        
        const [targetCol, targetRow] = toCoords(square);
        const useAlgebraic = !square.includes(',');

        for (let col = targetCol - r; col <= targetCol + r; col++) {
            for (let row = targetRow - r; row <= targetRow + r; row++) {
                const sq = toSquare([col, row], useAlgebraic);
                if (board.isActive(sq)) {
                    board.setPiece(sq, null);
                    board.triggerEffect('kill', sq); // Reuse kill effect visual for each exploded square
                }
            }
        }
    }

    /**
     * Clear all queued effects.
     */
    clear(): void {
        this.queue = [];
        this.moveWasCancelled = false;
    }

    /**
     * Reset the cancellation flag for a new move.
     */
    resetCancellation(): void {
        this.moveWasCancelled = false;
    }

    /**
     * Get current queue size (for debugging).
     */
    getQueueSize(): number {
        return this.queue.length;
    }
}

/**
 * Helper functions to create effects more easily.
 */
export class EffectFactory {
    /**
     * Transform a piece at a square to a new type.
     */
    static transform(target: Square | string, newType: string, phase: EffectPhase = 'on-move', newColor?: string): Effect {
        return {
            type: 'transform',
            phase,
            target,
            params: { newType, newColor }
        };
    }

    /**
     * Remove a piece from a square.
     */
    static remove(square: Square, phase: EffectPhase = 'on-move'): Effect {
        return {
            type: 'remove',
            phase,
            target: square,
            params: {}
        };
    }

    /**
     * Spawn a new piece on a square.
     */
    static spawn(square: Square, pieceType: string, color: string, phase: EffectPhase = 'post-move', pieceId?: string): Effect {
        return {
            type: 'spawn',
            phase,
            target: square,
            params: { pieceType, color, pieceId }
        };
    }

    /**
     * Move a piece from one square to another.
     */
    static move(from: Square, to: Square, phase: EffectPhase = 'on-move'): Effect {
        return {
            type: 'move',
            phase,
            target: from,
            params: { from, to }
        };
    }

    /**
     * Set the state of a square.
     */
    static setSquareState(square: Square, state: Partial<any>, phase: EffectPhase = 'post-move'): Effect {
        return {
            type: 'setSquareState',
            phase,
            target: square,
            params: { state }
        };
    }

    /**
     * Add a tag to a square.
     */
    static addSquareTag(square: Square, tag: string, phase: EffectPhase = 'post-move'): Effect {
        return {
            type: 'addSquareTag',
            phase,
            target: square,
            params: { tag }
        };
    }

    /**
     * Remove a tag from a square.
     */
    static removeSquareTag(square: Square, tag: string, phase: EffectPhase = 'post-move'): Effect {
        return {
            type: 'removeSquareTag',
            phase,
            target: square,
            params: { tag }
        };
    }

    /**
     * Cancel the current move.
     */
    static cancelMove(phase: EffectPhase = 'pre-move'): Effect {
        return {
            type: 'cancelMove',
            phase,
            target: '' as Square,
            params: {}
        };
    }

    /**
     * Declare a winner and end the game.
     */
    static win(winner: 'white' | 'black', phase: EffectPhase = 'post-move'): Effect {
        return {
            type: 'win',
            phase,
            target: '' as Square,
            params: { winner }
        };
    }

    /**
     * Explode all pieces within a radius.
     */
    static explode(square: Square, radius: number, phase: EffectPhase = 'on-move'): Effect {
        return {
            type: 'explode',
            phase,
            target: square,
            params: { radius }
        };
    }
}
