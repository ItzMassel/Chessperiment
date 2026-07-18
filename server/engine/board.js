import { Piece, Pawn, Rook, Knight, Bishop, Queen, King, CustomPiece } from './piece.js';
import { BoardStateManager } from './state.js';
import { toCoords, toSquare } from './utils.js';
import { SquareGrid } from '../lib/grid/SquareGrid.js';
import { HexGrid } from '../lib/grid/HexGrid.js';
import { SquareLogicRunner } from './logic/SquareLogicRunner.js';
export class BoardClass {
    constructor(initialPieces, activeSquares, width = 8, height = 8, gridType = 'square', squareLogic) {
        this.effectListeners = [];
        this.squareLogic = {};
        this.snapshots = [];
        this.width = width;
        this.height = height;
        this.gridType = gridType;
        this.grid = gridType === 'hex' ? new HexGrid() : new SquareGrid();
        const squares = initialPieces || this.setupInitialBoard();
        this.stateManager = new BoardStateManager(squares, activeSquares);
        if (squareLogic)
            this.squareLogic = squareLogic;
    }
    addEffectListener(fn) {
        this.effectListeners.push(fn);
    }
    removeEffectListener(fn) {
        this.effectListeners = this.effectListeners.filter(l => l !== fn);
    }
    triggerEffect(type, position) {
        this.effectListeners.forEach(fn => fn({ type, position }));
    }
    getGrid() {
        return this.grid;
    }
    isActive(square) {
        return this.stateManager.isActive(square);
    }
    setActive(square, active) {
        this.stateManager.setActive(square, active);
    }
    setupInitialBoard() {
        const squares = {};
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
        const allSquares = {};
        for (let col = 0; col < 8; col++) {
            for (let row = 0; row < 8; row++) {
                const square = `${String.fromCharCode('a'.charCodeAt(0) + col)}${row + 1}`;
                allSquares[square] = squares[square] || null;
            }
        }
        return allSquares;
    }
    getPiece(square) {
        return this.stateManager.getPiece(square);
    }
    getSharedPieces(square) {
        return this.stateManager.getSharedPieces(square);
    }
    getAllSharedPieces() {
        return this.stateManager.getAllSharedPieces();
    }
    /**
     * Handle a piece leaving a square. Promotes a shared piece to primary if present.
     */
    _leaveSquare(square, leavingPiece) {
        const shared = this.getSharedPieces(square);
        const remaining = shared.filter(p => p.id !== leavingPiece.id);
        if (remaining.length > 0) {
            const newPrimary = remaining[0];
            this.stateManager.removeSharedPiece(square, newPrimary.id);
            this.stateManager.setPiece(square, newPrimary);
        }
        else {
            this.stateManager.setPiece(square, null);
        }
    }
    findNearestEmptySquare(target) {
        const [targetX, targetY] = toCoords(target);
        const useAlgebraic = !target.includes(',');
        if (this.gridType === 'hex') {
            for (let d = 1; d < Math.max(this.width, this.height); d++) {
                let q = targetX;
                let r = targetY + d;
                const directions = [
                    { dq: 1, dr: -1 }, { dq: 0, dr: -1 }, { dq: -1, dr: 0 },
                    { dq: -1, dr: 1 }, { dq: 0, dr: 1 }, { dq: 1, dr: 0 }
                ];
                for (const dir of directions) {
                    for (let i = 0; i < d; i++) {
                        const sq = `${q},${r}`;
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
                    if (Math.abs(dx) !== d && Math.abs(dy) !== d)
                        continue;
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
    isPromotionMove(from, to) {
        const piece = this.getPiece(from);
        if (!piece || piece.type.toLowerCase() !== 'pawn')
            return false;
        const coords = toCoords(to);
        const toRow = coords[1];
        if (this.gridType === 'square') {
            return (piece.color === 'white' && toRow === this.height - 1) ||
                (piece.color === 'black' && toRow === 0);
        }
        else {
            // Hex grid: check if the next step in the forward direction is outside active squares
            const dr = piece.color === 'white' ? -1 : 1;
            const nextSquare = toSquare([coords[0], toRow + dr]);
            return !this.isActive(nextSquare);
        }
    }
    movePiece(from, to, promotion) {
        const piece = this.getPiece(from);
        if (piece) {
            this.saveSnapshot();
            let destinationPiece = this.getPiece(to);
            const sharedAtDest = this.getSharedPieces(to);
            if (destinationPiece && destinationPiece.color === piece.color) {
                console.warn(`[Engine] Move rejected: Cannot capture own pieces (${piece.color} at ${from} vs ${destinationPiece.color} at ${to})`);
                this.snapshots.pop();
                return false;
            }
            const isCapture = (destinationPiece !== null && destinationPiece.color !== piece.color)
                || sharedAtDest.some(p => p.color !== piece.color && p.id !== piece.id);
            let pieceToMove = piece;
            if (promotion) {
                const newPiece = Piece.create(`${piece.id}_promo`, promotion, piece.color, to);
                if (newPiece)
                    pieceToMove = newPiece;
            }
            let movePrevented = false;
            let capturePrevented = false;
            let preventAction = 'Jump Back';
            const moveContext = {
                from, to,
                capturedPiece: isCapture ? destinationPiece : null,
                prevented: false,
                movePrevented: false,
                capturePrevented: false,
                preventAction: 'Jump Back',
                gameWon: false,
                winner: null
            };
            if (pieceToMove && pieceToMove.isCustom) {
                pieceToMove.executeLogic('on-move', moveContext, this);
                pieceToMove = this.getPiece(from) || pieceToMove;
                if (moveContext.prevented || moveContext.movePrevented) {
                    movePrevented = true;
                    preventAction = moveContext.preventAction || 'Jump Back';
                }
                if (moveContext.gameWon) {
                    this.triggerEffect('win', moveContext.winner === 'white' ? 'white_win' : 'black_win');
                }
            }
            let commonContext = null;
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
                    winner: null
                };
                if (pieceToMove.isCustom) {
                    pieceToMove.executeLogic('on-is-captured', commonContext, this);
                    if (commonContext.prevented || commonContext.movePrevented || commonContext.capturePrevented) {
                        movePrevented = true;
                        preventAction = commonContext.preventAction || 'Jump Back';
                    }
                }
                if (destinationPiece && destinationPiece.isCustom) {
                    destinationPiece.executeLogic('on-is-captured', commonContext, this);
                    if (commonContext.prevented || commonContext.movePrevented || commonContext.capturePrevented) {
                        capturePrevented = true;
                        preventAction = commonContext.preventAction || preventAction;
                    }
                }
                for (const sharedPiece of sharedAtDest) {
                    if (sharedPiece.isCustom && sharedPiece.color !== piece.color) {
                        sharedPiece.executeLogic('on-is-captured', commonContext, this);
                        if (commonContext.prevented || commonContext.movePrevented || commonContext.capturePrevented) {
                            capturePrevented = true;
                            preventAction = commonContext.preventAction || preventAction;
                        }
                    }
                }
                if (commonContext.gameWon) {
                    this.triggerEffect('win', commonContext.winner === 'white' ? 'white_win' : 'black_win');
                }
            }
            // NOW decide what to do based on prevention flags
            if (movePrevented || capturePrevented) {
                if (this.getPiece(from) !== pieceToMove) {
                    this.stateManager.addMoveToHistory(from, to, pieceToMove.id);
                    return true;
                }
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
                }
                if (preventAction === 'Share Square' && isCapture) {
                    const defender = this.getPiece(to);
                    if (defender) {
                        this.stateManager.addSharedPiece(to, defender);
                    }
                    this.stateManager.setPiece(to, pieceToMove);
                    this._leaveSquare(from, pieceToMove);
                    pieceToMove.position = to;
                    pieceToMove.hasMoved = true;
                    this.stateManager.addMoveToHistory(from, to, pieceToMove.id);
                    this.triggerEffect('share-square', to);
                    return true;
                }
                console.warn(`[Engine] Move rejected by logic: ${from} -> ${to} (preventAction: ${preventAction})`);
                this.snapshots.pop();
                return false;
            }
            // No prevention - execute the move normally
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
                winner: null
            };
            SquareLogicRunner.execute(to, 'on-step', squareCtx, this);
            // Execute proximity logic for all squares that have it
            for (const s in this.squareLogic) {
                SquareLogicRunner.execute(s, 'on-proximity', squareCtx, this);
            }
            if (squareCtx.gameWon) {
                this.triggerEffect('win', squareCtx.winner === 'white' ? 'white_win' : 'black_win');
            }
            // Turn Lifecycle: Update all custom pieces for the player whose turn it is now
            const currentTurn = this.stateManager.turn;
            const allSquares = this.getSquares();
            for (const s in allSquares) {
                const p = allSquares[s];
                if (p && p.isCustom && p.color === currentTurn) {
                    p.updateTurnState(this);
                }
            }
            // Threat Detection
            this.checkThreats();
            return true;
        }
        return false;
    }
    isSquareAttacked(square, byColor) {
        const squares = this.getSquares();
        for (const pos in squares) {
            const piece = squares[pos];
            if (piece && piece.color === byColor) {
                if (piece.canAttack(square, this)) {
                    return true;
                }
            }
        }
        return false;
    }
    getSquareState(square) {
        if (!this.squareStates) this.squareStates = {};
        if (!this.squareStates[square]) {
            this.squareStates[square] = { disabled: false, tags: new Set() };
        }
        return this.squareStates[square];
    }
    setSquareState(square, state) {
        if (!this.squareStates) this.squareStates = {};
        this.squareStates[square] = state;
    }
    getSnapshot() {
        return {
            squares: this.getSquares(),
            turn: this.getTurn(),
            history: this.getHistory(),
            width: this.width,
            height: this.height,
            gridType: this.gridType,
        };
    }
    checkThreats() {
        const squares = this.getSquares();
        for (const s in squares) {
            const piece = squares[s];
            if (piece && piece.isCustom) {
                const opponentColor = piece.color === 'white' ? 'black' : 'white';
                // Find potential attackers
                for (const attackerPos in squares) {
                    const attacker = squares[attackerPos];
                    if (attacker && attacker.color === opponentColor) {
                        if (attacker.canAttack(s, this)) {
                            piece.executeLogic('on-threat', { attacker, square: s }, this);
                        }
                    }
                }
            }
        }
    }
    setPiece(square, piece) {
        this.stateManager.setPiece(square, piece);
    }
    getSquares() {
        return this.stateManager.getSquares();
    }
    getHistory() {
        return this.stateManager.getHistory();
    }
    getTurn() {
        return this.stateManager.turn;
    }
    clone() {
        const clonedBoard = new BoardClass(undefined, undefined, this.width, this.height, this.gridType);
        clonedBoard.stateManager = this.stateManager.clone();
        return clonedBoard;
    }
    saveSnapshot() {
        const currentSquares = this.getSquares();
        const squaresCopy = {};
        const pieceVariables = {};
        const sharedCopy = {};
        for (const s in currentSquares) {
            const piece = currentSquares[s];
            if (piece) {
                const clonedPiece = piece.clone ? piece.clone() : piece;
                squaresCopy[s] = clonedPiece;
                if (piece instanceof CustomPiece) {
                    pieceVariables[piece.id] = JSON.parse(JSON.stringify(piece.variables || {}));
                }
            }
            else {
                squaresCopy[s] = null;
            }
        }
        const allShared = this.getAllSharedPieces();
        for (const s in allShared) {
            sharedCopy[s] = allShared[s].map(p => p.clone ? p.clone() : p);
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
            if (!snapshot)
                return;
            for (const s in snapshot.squares) {
                const p = snapshot.squares[s];
                this.setPiece(s, p);
                if (p)
                    p.position = s;
            }
            // Restore shared pieces
            const allSquares = this.getSquares();
            for (const s in allSquares) {
                this.stateManager.clearSharedPieces(s);
            }
            if (snapshot.sharedPieces) {
                for (const s in snapshot.sharedPieces) {
                    for (const p of snapshot.sharedPieces[s]) {
                        this.stateManager.addSharedPiece(s, p);
                    }
                }
            }
            const currentSquares = this.getSquares();
            for (const s in currentSquares) {
                const p = currentSquares[s];
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
