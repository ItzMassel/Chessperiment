import type { BoardState, Square, PieceState } from "./types";

export class BoardStateManager {
    private squares: Record<Square, PieceState | null>;
    private history: Array<{ from: Square; to: Square; pieceId: string }>;
    public turn: "white" | "black";
    private activeSquares: Set<Square> | null;
    // Extra pieces sharing a square (square sharing mechanic)
    private sharedPieces: Record<Square, PieceState[]> = {};

    constructor(initialSquares: Record<Square, PieceState | null>, activeSquares?: Square[]) {
        this.squares = initialSquares;
        this.history = [];
        this.turn = "white";
        this.activeSquares = activeSquares ? new Set(activeSquares) : null;
    }

    getSharedPieces(square: Square): PieceState[] {
        return this.sharedPieces[square] || [];
    }

    addSharedPiece(square: Square, piece: PieceState) {
        if (!this.sharedPieces[square]) this.sharedPieces[square] = [];
        if (!this.sharedPieces[square].find(p => p.id === piece.id)) {
            this.sharedPieces[square].push(piece);
        }
    }

    removeSharedPiece(square: Square, pieceId: string) {
        if (!this.sharedPieces[square]) return;
        this.sharedPieces[square] = this.sharedPieces[square].filter(p => p.id !== pieceId);
        if (this.sharedPieces[square].length === 0) delete this.sharedPieces[square];
    }

    clearSharedPieces(square: Square) {
        delete this.sharedPieces[square];
    }

    getAllSharedPieces(): Record<Square, PieceState[]> {
        const copy: Record<Square, PieceState[]> = {};
        for (const s in this.sharedPieces) {
            copy[s as Square] = [...this.sharedPieces[s as Square]];
        }
        return copy;
    }

    isActive(square: Square): boolean {
        if (!this.activeSquares) return true;
        return this.activeSquares.has(square);
    }

    setActive(square: Square, active: boolean) {
        if (!this.activeSquares) return; // Cannot toggle if no active board is defined
        if (active) this.activeSquares.add(square);
        else this.activeSquares.delete(square);
    }

    getPiece(square: Square): PieceState | null {
        return this.squares[square] || null;
    }

    setPiece(square: Square, piece: PieceState | null) {
        this.squares[square] = piece;
    }

    addMoveToHistory(from: Square, to: Square, pieceId: string) {
        this.history.push({ from, to, pieceId });
        const oldTurn = this.turn;
        this.turn = this.turn === "white" ? "black" : "white";
    }

    getHistory() {
        return this.history;
    }

    revertLastMove() {
        if (this.history.length === 0) return;
        this.history.pop();
        this.turn = this.turn === "white" ? "black" : "white";
    }

    getSquares() {
        return { ...this.squares };
    }

    clone(): BoardStateManager {
        const squaresCopy: Record<Square, PieceState | null> = {} as any;
        for (const s in this.squares) {
            const piece = this.squares[s as Square];
            if (piece && typeof (piece as any).clone === 'function') {
                squaresCopy[s as Square] = (piece as any).clone();
            } else if (piece) {
                squaresCopy[s as Square] = { ...piece };
            } else {
                squaresCopy[s as Square] = null;
            }
        }
        const clonedManager = new BoardStateManager(squaresCopy, this.activeSquares ? Array.from(this.activeSquares) : undefined);
        clonedManager.history = [...this.history];
        clonedManager.turn = this.turn;
        // Clone shared pieces
        for (const s in this.sharedPieces) {
            clonedManager.sharedPieces[s as Square] = this.sharedPieces[s as Square].map(p =>
                typeof (p as any).clone === 'function' ? (p as any).clone() : { ...p }
            );
        }
        return clonedManager;
    }
}
