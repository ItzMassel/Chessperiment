export class BoardStateManager {
    constructor(initialSquares, activeSquares) {
        // Extra pieces sharing a square (square sharing mechanic)
        this.sharedPieces = {};
        this.squares = initialSquares;
        this.history = [];
        this.turn = "white";
        this.activeSquares = activeSquares ? new Set(activeSquares) : null;
    }
    getSharedPieces(square) {
        return this.sharedPieces[square] || [];
    }
    addSharedPiece(square, piece) {
        if (!this.sharedPieces[square])
            this.sharedPieces[square] = [];
        if (!this.sharedPieces[square].find(p => p.id === piece.id)) {
            this.sharedPieces[square].push(piece);
        }
    }
    removeSharedPiece(square, pieceId) {
        if (!this.sharedPieces[square])
            return;
        this.sharedPieces[square] = this.sharedPieces[square].filter(p => p.id !== pieceId);
        if (this.sharedPieces[square].length === 0)
            delete this.sharedPieces[square];
    }
    clearSharedPieces(square) {
        delete this.sharedPieces[square];
    }
    getAllSharedPieces() {
        const copy = {};
        for (const s in this.sharedPieces) {
            copy[s] = [...this.sharedPieces[s]];
        }
        return copy;
    }
    isActive(square) {
        if (!this.activeSquares)
            return true;
        return this.activeSquares.has(square);
    }
    setActive(square, active) {
        if (!this.activeSquares)
            return; // Cannot toggle if no active board is defined
        if (active)
            this.activeSquares.add(square);
        else
            this.activeSquares.delete(square);
    }
    getPiece(square) {
        return this.squares[square] || null;
    }
    setPiece(square, piece) {
        this.squares[square] = piece;
    }
    addMoveToHistory(from, to, pieceId) {
        this.history.push({ from, to, pieceId });
        const oldTurn = this.turn;
        this.turn = this.turn === "white" ? "black" : "white";
    }
    getHistory() {
        return this.history;
    }
    revertLastMove() {
        if (this.history.length === 0)
            return;
        this.history.pop();
        this.turn = this.turn === "white" ? "black" : "white";
    }
    getSquares() {
        return { ...this.squares };
    }
    clone() {
        const squaresCopy = {};
        for (const s in this.squares) {
            const piece = this.squares[s];
            if (piece && typeof piece.clone === 'function') {
                squaresCopy[s] = piece.clone();
            }
            else if (piece) {
                squaresCopy[s] = { ...piece };
            }
            else {
                squaresCopy[s] = null;
            }
        }
        const clonedManager = new BoardStateManager(squaresCopy, this.activeSquares ? Array.from(this.activeSquares) : undefined);
        clonedManager.history = [...this.history];
        clonedManager.turn = this.turn;
        // Clone shared pieces
        for (const s in this.sharedPieces) {
            clonedManager.sharedPieces[s] = this.sharedPieces[s].map(p => typeof p.clone === 'function' ? p.clone() : { ...p });
        }
        return clonedManager;
    }
}
