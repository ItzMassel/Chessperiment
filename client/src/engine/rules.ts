import { Square } from './types';
import { BoardClass as Board } from './board';
import { King, Pawn, CustomPiece } from './piece';
import { toCoords, toSquare } from './utils';
import { EffectExecutor } from './effects';

export class ValidatorClass {
    private board: Board;

    constructor(board: Board) {
        this.board = board;
    }

    private isSquareAttacked(square: Square, attackerColor: 'white' | 'black', board: Board): boolean {
        const squares = board.getSquares();
        for (const s in squares) {
            const piece = squares[s as Square];
            if (piece && piece.color === attackerColor && board.isActive(s as Square)) {
                if (piece.canAttack(square, board)) {
                    return true;
                }
            }
        }
        return false;
    }

    private _pieceMove(from: Square, to: Square): boolean {
        const piece = this.board.getPiece(from);
        if (!piece) {
            return false;
        }
        // [RESEARCH] This delegates move validation to the individual piece classes.
        // For CustomPiece, this will trigger the custom rules defined in the Piece Editor.
        return piece.isValidMove(from, to, this.board);
    }

    private _isEnPassant(from: Square, to: Square): boolean {
        const piece = this.board.getPiece(from);
        if (!piece || piece.type !== 'pawn') {
            return false;
        }

        const fromCoords = toCoords(from);
        const toCoordsCoords = toCoords(to);
        const diffX = Math.abs(fromCoords[0] - toCoordsCoords[0]);
        const diffY = toCoordsCoords[1] - fromCoords[1];
        const direction = piece.color === 'white' ? 1 : -1;

        if (diffX === 1 && diffY === direction) {
            const capturedPawnSquare = toSquare([toCoordsCoords[0], toCoordsCoords[1] - direction], this.board.gridType === 'square');
            const capturedPawn = this.board.getPiece(capturedPawnSquare);

            if (capturedPawn instanceof Pawn && capturedPawn.color !== piece.color) {
                const history = this.board.getHistory();
                const lastMove = history[history.length - 1];
                if (
                    lastMove &&
                    lastMove.pieceId === capturedPawn.id &&
                    lastMove.to === capturedPawnSquare &&
                    Math.abs(toCoords(lastMove.from)[1] - toCoords(lastMove.to)[1]) === 2
                ) {
                    return true;
                }
            }
        }
        return false;
    }

    private _isCastling(from: Square, to: Square): boolean {
        const piece = this.board.getPiece(from);
        if (!piece || piece.type !== 'king' || piece.hasMoved) {
            return false;
        }

        const fromCoords = toCoords(from);
        const toCoordsCoords = toCoords(to);
        const diffX = toCoordsCoords[0] - fromCoords[0];

        if (Math.abs(diffX) !== 2 || fromCoords[1] !== toCoordsCoords[1]) {
            return false;
        }

        const rank = fromCoords[1];
        const rookFile = diffX > 0 ? 7 : 0;
        const rookSquare = toSquare([rookFile, rank], this.board.gridType === 'square');
        const rook = this.board.getPiece(rookSquare);

        if (!rook || rook.hasMoved) {
            return false;
        }

        const direction = diffX > 0 ? 1 : -1;
        for (let i = 1; i < Math.abs(diffX); i++) {
            const square = toSquare([fromCoords[0] + i * direction, rank], this.board.gridType === 'square');
            if (this.board.getPiece(square) !== null) {
                return false;
            }
        }

        const attackerColor = piece.color === 'white' ? 'black' : 'white';
        if (this.isSquareAttacked(from, attackerColor, this.board)) {
            return false;
        }
        for (let i = 1; i <= Math.abs(diffX); i++) {
            const square = toSquare([fromCoords[0] + i * (diffX > 0 ? 1 : -1), fromCoords[1]], this.board.gridType === 'square');
            if (this.isSquareAttacked(square, attackerColor, this.board)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Layered legality check:
     * 1. Structural (topology, multi-cell collision)
     * 2. Rule-based (disabled squares, cooldowns)
     * 3. Trigger vetoes (cancelMove effects)
     */
    isLegal(from: Square, to: Square, promotion?: string, effectExecutor?: EffectExecutor): boolean {
        // Layer 1: Structural checks
        if (!this.isStructurallyLegal(from, to)) {
            return false;
        }
        
        // Layer 2: Rule-based checks
        if (!this.isRuleLegal(from, to, promotion)) {
            return false;
        }
        
        // Layer 3: Trigger vetoes (check if triggers cancel the move)
        if (effectExecutor && this.isTriggerVetoed(from, to, effectExecutor)) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Layer 1: Structural legality
     * - Topology valid
     * - Multi-cell collision check
     * - Target square active
     */
    private isStructurallyLegal(from: Square, to: Square): boolean {
        const piece = this.board.getPiece(from);
        if (!piece || piece.color !== this.board.getTurn()) {
            return false;
        }

        if (!this.board.isActive(to)) {
            return false;
        }
        
        // Multi-cell collision: check if all cells fit
        if (piece instanceof CustomPiece && piece.shape && piece.shape.extensions.length > 0) {
            if (!piece.canFitAt(to, this.board)) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Layer 2: Rule-based legality
     * - Disabled squares
     * - Cooldowns
     * - Standard chess rules (castling, en passant)
     * - King safety
     */
    private isRuleLegal(from: Square, to: Square, promotion?: string): boolean {
        const piece = this.board.getPiece(from);
        if (!piece) return false;
        
        // Check if target square is disabled
        const toState = this.board.getSquareState(to);
        if (toState.disabled) {
            return false;
        }
        
        // Check cooldown for custom pieces
        if (piece instanceof CustomPiece) {
            if (piece.variables['cooldown'] && piece.variables['cooldown'] > 0) {
                return false;
            }
        }

        if (this._isCastling(from, to)) {
            return true;
        }

        if (!this._pieceMove(from, to) && !this._isEnPassant(from, to)) {
            return false;
        }

        const tempBoard = this.board.clone();
        const moveSuccess = tempBoard.movePiece(from, to, promotion);
        
        // If the move itself failed (e.g. blocked by logic), it's not legal
        if (!moveSuccess) {
            return false;
        }

        const kingSquare = this.findKing(piece.color, tempBoard);
        if (!kingSquare) {
            // If No King exists, we don't enforce King safety (allows pieces to move in testing or King-less variants)
            return true;
        }

        const attackerColor = piece.color === 'white' ? 'black' : 'white';
        return !this.isSquareAttacked(kingSquare, attackerColor, tempBoard);
    }
    
    /**
     * Layer 3: Trigger vetoes
     * - Execute pre-move triggers
     * - Check for cancelMove effects
     */
    private isTriggerVetoed(from: Square, to: Square, effectExecutor: EffectExecutor): boolean {
        const piece = this.board.getPiece(from);
        if (!piece || !(piece instanceof CustomPiece)) {
            return false; // No triggers to check
        }
        
        // Reset cancellation flag
        effectExecutor.resetCancellation();
        
        // Execute pre-move logic to check for vetoes
        const context = {
            from,
            to,
            prevented: false,
            movePrevented: false
        };
        
        piece.executeLogic('on-move', context, this.board);
        
        // Process pre-move phase effects
        effectExecutor.processPhase('pre-move', this.board);
        
        // Check if move was cancelled
        return effectExecutor.wasMoveCancelled() || context.movePrevented;
    }

    /**
     * Can the bench piece `pieceId` be dropped on `to` right now?
     * A drop is the player's whole turn, so it needs the right turn, an empty
     * active square, and it must not leave the player's own king in check
     * (which also means a drop can block a check).
     */
    isLegalDrop(pieceId: string, to: Square): boolean {
        const piece = this.board.getBench().find(p => p.id === pieceId);
        if (!piece || piece.color !== this.board.getTurn()) return false;

        if (!this.board.isActive(to) || this.board.getPiece(to) !== null) return false;
        if (this.board.getSquareState(to).disabled) return false;
        if (this.board.isDeadPawnDrop(piece, to)) return false;
        if (piece instanceof CustomPiece && piece.shape && piece.shape.extensions.length > 0) {
            if (!piece.canFitAt(to, this.board)) return false;
        }

        const tempBoard = this.board.clone();
        if (!tempBoard.dropPiece(pieceId, to)) return false;

        const kingSquare = this.findKing(piece.color, tempBoard);
        if (!kingSquare) return true; // King-less variants don't enforce king safety

        const attackerColor = piece.color === 'white' ? 'black' : 'white';
        return !this.isSquareAttacked(kingSquare, attackerColor, tempBoard);
    }

    /** Every square the bench piece `pieceId` could legally be dropped on. */
    getLegalDropSquares(pieceId: string): Square[] {
        const squares = this.board.getSquares();
        const result: Square[] = [];
        for (const to in squares) {
            if (this.isLegalDrop(pieceId, to as Square)) result.push(to as Square);
        }
        return result;
    }

    /** Does `color` have at least one legal drop? (Stops at the first one found.) */
    hasLegalDrop(color: 'white' | 'black'): boolean {
        if (this.board.getTurn() !== color) return false;
        const squares = Object.keys(this.board.getSquares()) as Square[];
        // Identical pieces behave identically, so only try one of each kind.
        const tried = new Set<string>();
        for (const piece of this.board.getBench(color)) {
            const kind = `${piece.type}|${JSON.stringify((piece as any).variables ?? {})}`;
            if (tried.has(kind)) continue;
            tried.add(kind);
            if (squares.some(to => this.isLegalDrop(piece.id, to))) return true;
        }
        return false;
    }

    isInCheck(color: 'white' | 'black'): boolean {
        const kingSquare = this.findKing(color, this.board);
        if (!kingSquare) return false;
        const attackerColor = color === 'white' ? 'black' : 'white';
        return this.isSquareAttacked(kingSquare, attackerColor, this.board);
    }

    getLegalMoves(color: 'white' | 'black'): { from: Square, to: Square }[] {
        const legalMoves: { from: Square, to: Square }[] = [];
        const squares = this.board.getSquares();

        for (const from in squares) {
            const piece = squares[from as Square];
            if (piece && piece.color === color) {
                for (const to in squares) {
                    if (this.isLegal(from as Square, to as Square)) {
                        legalMoves.push({ from: from as Square, to: to as Square });
                    }
                }
            }
        }
        return legalMoves;
    }

    private findKing(color: 'white' | 'black', board: Board): Square | null {
        const squares = board.getSquares();
        for (const s in squares) {
            const piece = squares[s as Square];
            if (piece && piece.type.toLowerCase() === 'king' && piece.color === color) {
                return s as Square;
            }
        }
        return null;
    }
}
