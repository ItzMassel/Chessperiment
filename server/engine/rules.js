import { King, Pawn, CustomPiece } from "./piece.js";
import { toCoords, toSquare } from "./utils.js";

export class ValidatorClass {
  constructor(board) {
    this.board = board;
  }

  isSquareAttacked(square, attackerColor, board) {
    const squares = board.getSquares();
    for (const s in squares) {
      const piece = squares[s];
      if (piece && piece.color === attackerColor && board.isActive(s)) {
        if (piece.canAttack(square, board)) {
          return true;
        }
      }
    }
    return false;
  }

  _pieceMove(from, to) {
    const piece = this.board.getPiece(from);
    if (!piece) {
      return false;
    }
    return piece.isValidMove(from, to, this.board);
  }

  _isEnPassant(from, to) {
    const piece = this.board.getPiece(from);
    if (!piece || piece.type !== "pawn") {
      return false;
    }

    const fromCoords = toCoords(from);
    const toCoordsCoords = toCoords(to);
    const diffX = Math.abs(fromCoords[0] - toCoordsCoords[0]);
    const diffY = toCoordsCoords[1] - fromCoords[1];
    const direction = piece.color === "white" ? 1 : -1;

    if (diffX === 1 && diffY === direction) {
      const capturedPawnSquare = toSquare(
        [toCoordsCoords[0], toCoordsCoords[1] - direction],
        this.board.gridType === "square",
      );
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

  _isCastling(from, to) {
    const piece = this.board.getPiece(from);
    if (!piece || piece.type !== "king" || piece.hasMoved) {
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
    const rookSquare = toSquare(
      [rookFile, rank],
      this.board.gridType === "square",
    );
    const rook = this.board.getPiece(rookSquare);

    if (!rook || rook.hasMoved) {
      return false;
    }

    const direction = diffX > 0 ? 1 : -1;
    for (let i = 1; i < Math.abs(diffX); i++) {
      const square = toSquare(
        [fromCoords[0] + i * direction, rank],
        this.board.gridType === "square",
      );
      if (this.board.getPiece(square) !== null) {
        return false;
      }
    }

    const attackerColor = piece.color === "white" ? "black" : "white";
    if (this.isSquareAttacked(from, attackerColor, this.board)) {
      return false;
    }
    for (let i = 1; i <= Math.abs(diffX); i++) {
      const square = toSquare(
        [fromCoords[0] + i * (diffX > 0 ? 1 : -1), fromCoords[1]],
        this.board.gridType === "square",
      );
      if (this.isSquareAttacked(square, attackerColor, this.board)) {
        return false;
      }
    }

    return true;
  }

  isLegal(from, to, promotion, effectExecutor) {
    if (!this.isStructurallyLegal(from, to)) {
      return false;
    }

    if (!this.isRuleLegal(from, to, promotion)) {
      return false;
    }

    if (effectExecutor && this.isTriggerVetoed(from, to, effectExecutor)) {
      return false;
    }

    return true;
  }

  isStructurallyLegal(from, to) {
    const piece = this.board.getPiece(from);
    if (!piece || piece.color !== this.board.getTurn()) {
      return false;
    }

    if (!this.board.isActive(to)) {
      return false;
    }

    if (
      piece instanceof CustomPiece &&
      piece.shape &&
      piece.shape.extensions.length > 0
    ) {
      if (!piece.canFitAt(to, this.board)) {
        return false;
      }
    }

    return true;
  }

  isRuleLegal(from, to, promotion) {
    const piece = this.board.getPiece(from);
    if (!piece) return false;

    const toState = this.board.getSquareState(to);
    if (toState.disabled) {
      return false;
    }

    if (piece instanceof CustomPiece) {
      if (piece.variables["cooldown"] && piece.variables["cooldown"] > 0) {
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

    if (!moveSuccess) {
      return false;
    }

    const kingSquare = this.findKing(piece.color, tempBoard);
    if (!kingSquare) {
      return true;
    }

    const attackerColor = piece.color === "white" ? "black" : "white";
    return !this.isSquareAttacked(kingSquare, attackerColor, tempBoard);
  }

  isTriggerVetoed(from, to, effectExecutor) {
    const piece = this.board.getPiece(from);
    if (!piece || !(piece instanceof CustomPiece)) {
      return false;
    }

    effectExecutor.resetCancellation();

    const context = {
      from,
      to,
      prevented: false,
      movePrevented: false,
    };

    piece.executeLogic("on-move", context, this.board);

    effectExecutor.processPhase("pre-move", this.board);

    return effectExecutor.wasMoveCancelled() || context.movePrevented;
  }

  getLegalMoves(color) {
    const legalMoves = [];
    const squares = this.board.getSquares();

    for (const from in squares) {
      const piece = squares[from];
      if (piece && piece.color === color) {
        for (const to in squares) {
          if (this.isLegal(from, to)) {
            legalMoves.push({ from, to });
          }
        }
      }
    }
    return legalMoves;
  }

  findKing(color, board) {
    const squares = board.getSquares();
    for (const s in squares) {
      const piece = squares[s];
      if (
        piece &&
        piece.type.toLowerCase() === "king" &&
        piece.color === color
      ) {
        return s;
      }
    }
    return null;
  }
}
