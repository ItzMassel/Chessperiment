import { Square, SquareState } from './types';
import { Piece, Pawn, Rook, Knight, Bishop, Queen, King, CustomPiece } from './piece';
import { BoardStateManager } from './state';
import { toCoords, toSquare } from './utils';
import { GridType } from '../lib/grid/GridType';
import { SquareGrid } from '../lib/grid/SquareGrid';
import { HexGrid } from '../lib/grid/HexGrid';
import { SquareLogicRunner, SquareLogic } from './logic/SquareLogicRunner';
import { BoardTopology } from './topology';

export class BoardClass {
    private stateManager: BoardStateManager;
    public readonly width: number;
    public readonly height: number;
    public gridType: 'square' | 'hex';
    private grid: GridType;
    private effectListeners: ((effect: { type: string, position: Square, params?: Record<string, any> }) => void)[] = [];
    public squareLogic: Record<Square, SquareLogic> = {};
    private squareStates: Record<Square, SquareState> = {}; // Runtime square state
    public topology?: BoardTopology; // For serialization support

    constructor(initialPieces?: Record<Square, Piece | null>, activeSquares?: Square[], width: number = 8, height: number = 8, gridType: 'square' | 'hex' = 'square', squareLogic?: Record<Square, SquareLogic>) {
        this.width = width;
        this.height = height;
        this.gridType = gridType;
        this.grid = gridType === 'hex' ? new HexGrid() : new SquareGrid();
        const squares = initialPieces || this.setupInitialBoard();
        this.stateManager = new BoardStateManager(squares, activeSquares);
        if (squareLogic) this.squareLogic = squareLogic;
    }

    addEffectListener(fn: (effect: { type: string, position: Square, params?: Record<string, any> }) => void) {
        this.effectListeners.push(fn);
    }

    removeEffectListener(fn: (effect: { type: string, position: Square, params?: Record<string, any> }) => void) {
        this.effectListeners = this.effectListeners.filter(l => l !== fn);
    }

    triggerEffect(type: string, position: Square, params?: Record<string, any>) {
        this.effectListeners.forEach(fn => fn({ type, position, params }));
    }

    getGrid(): GridType {
        return this.grid;
    }

    isActive(square: Square): boolean {
        return this.stateManager.isActive(square);
    }

    setActive(square: Square, active: boolean) {
        this.stateManager.setActive(square, active);
    }

    /**
     * Get the runtime state of a square.
     */
    getSquareState(square: Square): SquareState {
        if (!this.squareStates[square]) {
            this.squareStates[square] = {
                tags: new Set<string>(),
                disabled: false,
                customProps: {}
            };
        }
        return this.squareStates[square];
    }

    /**
     * Set the runtime state of a square.
     */
    setSquareState(square: Square, state: SquareState) {
        this.squareStates[square] = state;
    }

    private setupInitialBoard(): Record<Square, Piece | null> {
        const squares: Partial<Record<Square, Piece>> = {};

        // Place Pawns
        for (let i = 0; i < 8; i++) {
            const file = String.fromCharCode('a'.charCodeAt(0) + i);
            squares[`${file}2`] = new Pawn(`${file}2_w_pawn`, 'white', `${file}2`);
            squares[`${file}7`] = new Pawn(`${file}7_b_pawn`, 'black', `${file}7`);
        }

        // Place Rooks, Knights, Bishops
        squares['a1'] = new Rook('a1_w_rook', 'white', 'a1');
        squares['h1'] = new Rook('h1_w_rook', 'white', 'h1');
        squares['a8'] = new Rook('a8_b_rook', 'black', 'a8');
        squares['h8'] = new Rook('h8_b_rook', 'black', 'h8');

        squares['b1'] = new Knight('b1_w_knight', 'white', 'b1');
        squares['g1'] = new Knight('g1_w_knight', 'white', 'g1');
        squares['b8'] = new Knight('b8_b_knight', 'black', 'b8');
        squares['g8'] = new Knight('g8_b_knight', 'black', 'g8');

        squares['c1'] = new Bishop('c1_w_bishop', 'white', 'c1');
        squares['f1'] = new Bishop('f1_w_bishop', 'white', 'f1');
        squares['c8'] = new Bishop('c8_b_bishop', 'black', 'c8');
        squares['f8'] = new Bishop('f8_b_bishop', 'black', 'f8');

        // Place Queens and Kings
        squares['d1'] = new Queen('d1_w_queen', 'white', 'd1');
        squares['d8'] = new Queen('d8_b_queen', 'black', 'd8');
        squares['e1'] = new King('e1_w_king', 'white', 'e1');
        squares['e8'] = new King('e8_b_king', 'black', 'e8');

        // Fill empty squares for 8x8 default
        const allSquares: Record<Square, Piece | null> = {};
        for (let col = 0; col < 8; col++) {
            for (let row = 0; row < 8; row++) {
                const square = `${String.fromCharCode('a'.charCodeAt(0) + col)}${row + 1}`;
                allSquares[square] = squares[square] || null;
            }
        }
        return allSquares;
    }

    getPiece(square: Square): Piece | null {
        return this.stateManager.getPiece(square) as Piece | null;
    }

    getSharedPieces(square: Square): Piece[] {
        return this.stateManager.getSharedPieces(square) as Piece[];
    }

    getAllSharedPieces(): Record<Square, Piece[]> {
        return this.stateManager.getAllSharedPieces() as Record<Square, Piece[]>;
    }

    findNearestEmptySquare(target: Square): Square | null {
        const [targetX, targetY] = toCoords(target);
        const useAlgebraic = !target.includes(',');
        
        if (this.gridType === 'hex') {
            for (let d = 1; d < Math.max(this.width, this.height); d++) {
                let q = targetX;
                let r = targetY + d; 
                
                const directions = [
                    {dq: 1, dr: -1}, {dq: 0, dr: -1}, {dq: -1, dr: 0},
                    {dq: -1, dr: 1}, {dq: 0, dr: 1}, {dq: 1, dr: 0}
                ];

                for (const dir of directions) {
                    for (let i = 0; i < d; i++) {
                        const sq = `${q},${r}` as Square;
                        if (this.isActive(sq) && this.getPiece(sq) === null) {
                            return sq;
                        }
                        q += dir.dq;
                        r += dir.dr;
                    }
                }
            }
            return null;
        }

        // Square spiral search
        for (let d = 1; d < Math.max(this.width, this.height); d++) {
            for (let dx = -d; dx <= d; dx++) {
                for (let dy = -d; dy <= d; dy++) {
                    if (Math.abs(dx) !== d && Math.abs(dy) !== d) continue;
                    
                    const x = targetX + dx;
                    const y = targetY + dy;
                    
                    const sq = toSquare([x, y], useAlgebraic);
                    if (this.isActive(sq) && this.getPiece(sq) === null) {
                        return sq;
                    }
                }
            }
        }
        return null;
    }

    isPromotionMove(from: Square, to: Square): boolean {
        const piece = this.getPiece(from);
        if (!piece || piece.type.toLowerCase() !== 'pawn') return false;

        const coords = toCoords(to);
        const toRow = coords[1];

        if (this.gridType === 'square') {
            return (piece.color === 'white' && toRow === this.height - 1) ||
                   (piece.color === 'black' && toRow === 0);
        } else {
            // Hex grid: check if the next step in the forward direction is outside active squares
            const dr = piece.color === 'white' ? -1 : 1;
            const nextSquare = toSquare([coords[0], toRow + dr]);
            return !this.isActive(nextSquare);
        }
    }

    movePiece(from: Square, to: Square, promotion?: string, force: boolean = false): boolean {
        const piece = this.getPiece(from);
        if (piece) {
            this.saveSnapshot(); // Save state before any potential logic execution or move

            let destinationPiece = this.getPiece(to);
            // Also consider shared pieces at the destination for capture detection
            const sharedAtDest = this.getSharedPieces(to);

            if (!force && destinationPiece && destinationPiece.color === piece.color) {
                console.warn(`[Engine] Move rejected: Cannot capture own pieces (${piece.color} at ${from} vs ${destinationPiece.color} at ${to})`);
                this.snapshots.pop();
                return false;
            }

            const isCapture = (destinationPiece !== null && destinationPiece.color !== piece.color)
                || sharedAtDest.some(p => p.color !== piece.color && p.id !== piece.id);

            let pieceToMove = piece;
            if (promotion) {
                const newPiece = Piece.create(`${piece.id}_promo`, promotion as any, piece.color, to);
                if (newPiece) pieceToMove = newPiece;
            }

            let movePrevented = false;
            let capturePrevented = false;
            let preventAction = 'Jump Back';

            // Execute logic hooks BEFORE actually moving
            const moveContext = {
                from, to,
                capturedPiece: isCapture ? destinationPiece : null,
                prevented: false,
                movePrevented: false,
                capturePrevented: false,
                preventAction: 'Jump Back',
                gameWon: false,
                winner: null as string | null
            };

            if (pieceToMove && (pieceToMove as any).isCustom) {
                (pieceToMove as any).executeLogic('on-move', moveContext, this);

                // Refresh reference in case of transformation
                pieceToMove = this.getPiece(from) || pieceToMove;

                if (moveContext.prevented || moveContext.movePrevented) {
                    movePrevented = true;
                    preventAction = moveContext.preventAction || 'Jump Back';
                }

                if (moveContext.gameWon) {
                    this.triggerEffect('win', moveContext.winner === 'white' ? 'white_win' as any : 'black_win' as any);
                }
            }

            // on-capture trigger (only if move not prevented and it's a capture)
            let commonContext: any = null;
            if (!movePrevented && isCapture) {
                commonContext = {
                    attacker: pieceToMove,
                    capturedPiece: destinationPiece,
                    from, to,
                    prevented: false,
                    movePrevented: false,
                    capturePrevented: false,
                    preventAction: 'Jump Back',
                    gameWon: false,
                    winner: null as string | null
                };

                // Fire on-captured on the attacker (when this piece captures another)
                if ((pieceToMove as any).isCustom) {
                    (pieceToMove as any).executeLogic('on-captured', commonContext, this);
                    if (commonContext.prevented || commonContext.movePrevented || commonContext.capturePrevented) {
                        movePrevented = true;
                        preventAction = commonContext.preventAction || 'Jump Back';
                    }
                }

                // Fire on-is-captured on the victim (legacy: also fire on attacker for on-capture alias)
                if ((pieceToMove as any).isCustom) {
                    (pieceToMove as any).executeLogic('on-is-captured', commonContext, this);
                    if (commonContext.prevented || commonContext.movePrevented || commonContext.capturePrevented) {
                        movePrevented = true;
                        preventAction = commonContext.preventAction || preventAction;
                    }
                }

                if (destinationPiece && (destinationPiece as any).isCustom) {
                    (destinationPiece as any).executeLogic('on-is-captured', commonContext, this);

                    if (commonContext.prevented || commonContext.movePrevented || commonContext.capturePrevented) {
                        capturePrevented = true;
                        preventAction = commonContext.preventAction || preventAction;
                    }
                }

                // Also fire on-is-captured for shared pieces at destination
                for (const sharedPiece of sharedAtDest) {
                    if ((sharedPiece as any).isCustom && sharedPiece.color !== piece.color) {
                        (sharedPiece as any).executeLogic('on-is-captured', commonContext, this);
                        if (commonContext.prevented || commonContext.movePrevented || commonContext.capturePrevented) {
                            capturePrevented = true;
                            preventAction = commonContext.preventAction || preventAction;
                        }
                    }
                }

                if (commonContext.gameWon) {
                    this.triggerEffect('win', commonContext.winner === 'white' ? 'white_win' as any : 'black_win' as any);
                }
            }

            // NOW decide what to do based on prevention flags
            if (movePrevented || capturePrevented) {
                // Check if the attacker was KILLED or removed during logic execution
                if (this.getPiece(from) !== pieceToMove) {
                    this.stateManager.addMoveToHistory(from, to, pieceToMove.id);
                    return true;
                }

                // Handle Nearest Square: move attacker to nearest free neighbour instead
                if (preventAction === 'Nearest Square' && isCapture) {
                    const nearest = this.findNearestEmptySquare(to);
                    if (nearest) {
                        this.stateManager.setPiece(nearest, pieceToMove);
                        this._leaveSquare(from, pieceToMove);
                        pieceToMove.position = nearest;
                        pieceToMove.hasMoved = true;
                        this.stateManager.addMoveToHistory(from, nearest, pieceToMove.id);
                        return true;
                    }
                    // Fall through to Jump Back if no free square found
                }

                // Handle Share Square: attacker coexists with defender
                if (preventAction === 'Share Square' && isCapture) {
                    // Defender (current primary at 'to') becomes shared, attacker becomes primary
                    const defender = this.getPiece(to);
                    if (defender) {
                        this.stateManager.addSharedPiece(to, defender);
                    }
                    // Also demote existing shared pieces that were already there
                    // (they stay as shared alongside the new arrival)
                    this.stateManager.setPiece(to, pieceToMove);
                    this._leaveSquare(from, pieceToMove);
                    pieceToMove.position = to;
                    pieceToMove.hasMoved = true;
                    this.stateManager.addMoveToHistory(from, to, pieceToMove.id);
                    this.triggerEffect('share-square', to);
                    return true;
                }

                // Default: Jump Back (move denied, attacker returns to origin)
                console.warn(`[Engine] Move rejected by logic: ${from} -> ${to} (preventAction: ${preventAction})`);
                this.snapshots.pop();
                return false;
            }

            // No prevention - execute the move normally
            // Remove all enemy pieces at 'to' (primary + any shared)
            if (isCapture) {
                for (const sp of sharedAtDest) {
                    if (sp.color !== piece.color) {
                        this.stateManager.removeSharedPiece(to, sp.id);
                    }
                }
                this.stateManager.setPiece(to, null);
            }
            this.stateManager.setPiece(to, pieceToMove);
            this._leaveSquare(from, pieceToMove);
            pieceToMove.position = to;
            pieceToMove.hasMoved = true;
            this.stateManager.addMoveToHistory(from, to, pieceToMove.id);

            // Execute Square Logic: on-step
            const squareCtx = {
                piece: pieceToMove,
                from, to,
                movePrevented: false,
                gameWon: false,
                winner: null as string | null
            };
            SquareLogicRunner.execute(to, 'on-step', squareCtx, this);
            
            // Execute proximity logic for all squares that have it
            for (const s in this.squareLogic) {
                SquareLogicRunner.execute(s as Square, 'on-proximity', squareCtx, this);
            }

            if (squareCtx.gameWon) {
                this.triggerEffect('win', squareCtx.winner === 'white' ? 'white_win' as any : 'black_win' as any);
            }
            
            // Turn Lifecycle: Update all custom pieces for the player whose turn it is now
            const currentTurn = this.stateManager.turn;
            const allSquares = this.getSquares();
            for (const s in allSquares) {
                const p = allSquares[s as Square];
                if (p && (p as any).isCustom && p.color === currentTurn) {
                    (p as any).updateTurnState(this);
                }
            }

            // Threat Detection
            this.checkThreats();
            
            return true;
        }
        return false;
    }

    isSquareAttacked(square: Square, byColor: string): boolean {
        const squares = this.getSquares();
        for (const pos in squares) {
            const piece = squares[pos as Square];
            if (piece && piece.color === byColor) {
                if (piece.canAttack(square, this)) {
                    return true;
                }
            }
        }
        return false;
    }

    private checkThreats(): void {
        const squares = this.getSquares();
        for (const s in squares) {
            const piece = squares[s as Square];
            if (piece && (piece as any).isCustom) {
                const opponentColor = piece.color === 'white' ? 'black' : 'white';
                // Find potential attackers
                for (const attackerPos in squares) {
                    const attacker = squares[attackerPos as Square];
                    if (attacker && attacker.color === opponentColor) {
                        if (attacker.canAttack(s as Square, this)) {
                            (piece as any).executeLogic('on-threat', { attacker, square: s }, this);
                        }
                    }
                }
            }
        }
    }

    /**
     * Handle a piece leaving a square. If there are shared pieces waiting there,
     * promote the first one to primary. Otherwise just clear the square.
     */
    private _leaveSquare(square: Square, leavingPiece: Piece) {
        const shared = this.getSharedPieces(square);
        const remaining = shared.filter(p => p.id !== leavingPiece.id);
        if (remaining.length > 0) {
            const newPrimary = remaining[0];
            this.stateManager.removeSharedPiece(square, newPrimary.id);
            this.stateManager.setPiece(square, newPrimary);
            // remaining[1..] stay as shared
        } else {
            this.stateManager.setPiece(square, null);
        }
    }

    setPiece(square: Square, piece: Piece | null): void {
        this.stateManager.setPiece(square, piece);
    }

    getSquares(): Record<Square, Piece | null> {
        return this.stateManager.getSquares() as Record<Square, Piece | null>;
    }

    getHistory() {
        return this.stateManager.getHistory();
    }

    getTurn(): "white" | "black" {
        return this.stateManager.turn;
    }

    clone(): BoardClass {
        const clonedBoard = new BoardClass(undefined, undefined, this.width, this.height, this.gridType);
        clonedBoard.stateManager = this.stateManager.clone();
        return clonedBoard;
    }

    private snapshots: Array<{
        squares: Record<Square, Piece | null>;
        turn: 'white' | 'black';
        pieceVariables: Record<string, Record<string, number>>;
        sharedPieces: Record<Square, Piece[]>;
    }> = [];

    private saveSnapshot() {
        const currentSquares = this.getSquares();
        const squaresCopy: Record<Square, Piece | null> = {} as any;
        const pieceVariables: Record<string, Record<string, any>> = {};
        const sharedCopy: Record<Square, Piece[]> = {};

        for (const s in currentSquares) {
            const piece = currentSquares[s as Square];
            if (piece) {
                const clonedPiece = (piece as any).clone ? (piece as any).clone() : piece;
                squaresCopy[s as Square] = clonedPiece;
                if (piece instanceof CustomPiece) {
                    pieceVariables[piece.id] = JSON.parse(JSON.stringify(piece.variables || {}));
                }
            } else {
                squaresCopy[s as Square] = null;
            }
        }

        const allShared = this.getAllSharedPieces();
        for (const s in allShared) {
            sharedCopy[s as Square] = allShared[s as Square].map(p =>
                (p as any).clone ? (p as any).clone() : p
            ) as Piece[];
        }

        this.snapshots.push({
            squares: squaresCopy,
            turn: this.getTurn(),
            pieceVariables,
            sharedPieces: sharedCopy
        });
    }

    undo() {
        if (this.snapshots.length > 0) {
            const snapshot = this.snapshots.pop();
            if (!snapshot) return;

            // Restore board state
            for (const s in snapshot.squares) {
                const p = snapshot.squares[s as Square];
                this.setPiece(s as Square, p);
                if (p) p.position = s as Square;
            }

            // Restore shared pieces: clear current, then restore from snapshot
            const allSquares = this.getSquares();
            for (const s in allSquares) {
                this.stateManager.clearSharedPieces(s as Square);
            }
            if (snapshot.sharedPieces) {
                for (const s in snapshot.sharedPieces) {
                    for (const p of snapshot.sharedPieces[s as Square]) {
                        this.stateManager.addSharedPiece(s as Square, p);
                    }
                }
            }

            // Restore variables
            const currentSquares = this.getSquares();
            for (const s in currentSquares) {
                const p = currentSquares[s as Square];
                if (p instanceof CustomPiece && snapshot.pieceVariables[p.id]) {
                    p.variables = { ...snapshot.pieceVariables[p.id] };
                }
            }

            this.stateManager.revertLastMove();
            if (this.stateManager.turn !== snapshot.turn) {
                this.stateManager.turn = snapshot.turn;
            }
        }
    }
}
