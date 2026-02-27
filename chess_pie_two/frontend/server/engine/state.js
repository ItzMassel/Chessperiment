class BoardStateManager {
  constructor(initialSquares, activeSquares) {
    this.squares = initialSquares;
    this.history = [];
    this.turn = "white";
    this.activeSquares = activeSquares ? new Set(activeSquares) : null;
  }

  isActive(square) {
    if (!this.activeSquares) return true;
    return this.activeSquares.has(square);
  }

  setActive(square, active) {
    if (!this.activeSquares) return;
    if (active) this.activeSquares.add(square);
    else this.activeSquares.delete(square);
  }

  getPiece(square) {
    return this.squares[square] || null;
  }

  setPiece(square, piece) {
    this.squares[square] = piece;
  }

  addMoveToHistory(from, to, pieceId) {
    this.history.push({ from, to, pieceId });
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

  clone() {
    const squaresCopy = {};
    for (const s in this.squares) {
      const piece = this.squares[s];
      if (piece && typeof piece.clone === "function") {
        squaresCopy[s] = piece.clone();
      } else if (piece) {
        squaresCopy[s] = { ...piece };
      } else {
        squaresCopy[s] = null;
      }
    }
    const clonedManager = new BoardStateManager(
      squaresCopy,
      this.activeSquares ? Array.from(this.activeSquares) : undefined,
    );
    clonedManager.history = [...this.history];
    clonedManager.turn = this.turn;
    return clonedManager;
  }
}

module.exports = { BoardStateManager };
