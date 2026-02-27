const { LogicRunner } = require("./logic/LogicRunner");

class Piece {
  constructor(color, position, id) {
    this.color = color;
    this.position = position;
    this.id = id || Math.random().toString(36).substr(2, 9);
    this.type = "piece";
    this.name = "Piece";
    this.hasMoved = false;
    this.capturedAt = null;
  }

  isValidMove(to, board) {
    return false;
  }

  canAttack(to, board) {
    return this.isValidMove(to, board);
  }

  static create(type, color, position, id, customData) {
    const pieceMap = {
      pawn: Pawn,
      knight: Knight,
      bishop: Bishop,
      rook: Rook,
      queen: Queen,
      king: King,
    };

    if (customData) {
      return new CustomPiece(color, position, id, type, customData);
    }

    const PieceClass = pieceMap[type.toLowerCase()];
    if (PieceClass) {
      return new PieceClass(color, position, id);
    }
    return new Piece(color, position, id);
  }

  clone() {
    const cloned = new this.constructor(this.color, this.position, this.id);
    cloned.hasMoved = this.hasMoved;
    cloned.capturedAt = this.capturedAt;
    return cloned;
  }

  updateTurnState() {
    // Standard pieces don't have turn-based state updates like cooldowns
  }
}

class CustomPiece extends Piece {
  constructor(color, position, id, type, customData) {
    super(color, position, id);
    this.type = type;
    this.isCustom = true;
    this.name = customData.name || type;
    this.movementRules = customData.movementRules || [];
    this.logic = customData.logic || [];
    this.variables = customData.variables || {};
    this.pixels = customData.pixels;
    this.image = customData.image;

    // Visual and layout settings
    this.shape = customData.shape || [{ x: 0, y: 0 }];
    this.extensions = customData.extensions || [];
  }

  getOccupiedSquares(position = this.position) {
    const { toCoords, toSquare } = require("./utils");
    const [x, y] = toCoords(position);
    return this.shape.map((offset) => toSquare([x + offset.x, y + offset.y]));
  }

  canFitAt(position, board, ignoreSelf = false) {
    const occupied = this.getOccupiedSquares(position);
    for (const sq of occupied) {
      if (!board.isActive(sq)) return false;
      const existing = board.getPiece(sq);
      if (existing && (!ignoreSelf || existing.id !== this.id)) return false;
    }
    return true;
  }

  isValidMove(to, board) {
    const { ValidatorClass } = require("./rules");
    const validator = new ValidatorClass(board);
    return validator.isPseudoLegal(this, to);
  }

  executeLogic(type, context, board, effectExecutor) {
    LogicRunner.execute(this, type, context, board, effectExecutor);
  }

  updateTurnState(currentTurn) {
    // Cooldown depletion
    if (this.color === currentTurn && this.variables.cooldown > 0) {
      this.variables.cooldown--;
    }
  }

  clone() {
    const cloned = new CustomPiece(
      this.color,
      this.position,
      this.id,
      this.type,
      {
        name: this.name,
        movementRules: JSON.parse(JSON.stringify(this.movementRules)),
        logic: JSON.parse(JSON.stringify(this.logic)),
        variables: JSON.parse(JSON.stringify(this.variables)),
        pixels: this.pixels,
        image: this.image,
        shape: JSON.parse(JSON.stringify(this.shape)),
        extensions: JSON.parse(JSON.stringify(this.extensions)),
      },
    );
    cloned.hasMoved = this.hasMoved;
    cloned.capturedAt = this.capturedAt;
    return cloned;
  }
}

class Pawn extends Piece {
  constructor(color, position, id) {
    super(color, position, id);
    this.type = "pawn";
    this.name = "Pawn";
  }

  isValidMove(to, board) {
    const { toCoords } = require("./utils");
    const [fromX, fromY] = toCoords(this.position);
    const [toX, toY] = toCoords(to);
    const direction = this.color === "white" ? 1 : -1;
    const startRow = this.color === "white" ? 1 : 6;

    // Move forward
    if (fromX === toX && toY === fromY + direction) {
      return board.getPiece(to) === null;
    }

    // Double move from start
    if (fromX === toX && fromY === startRow && toY === fromY + 2 * direction) {
      return (
        board.getPiece(to) === null &&
        board.getPiece(toCoords([fromX, fromY + direction])) === null
      );
    }

    // Capture
    if (Math.abs(fromX - toX) === 1 && toY === fromY + direction) {
      const piece = board.getPiece(to);
      return piece !== null && piece.color !== this.color;
    }

    return false;
  }

  canAttack(to, board) {
    const { toCoords } = require("./utils");
    const [fromX, fromY] = toCoords(this.position);
    const [toX, toY] = toCoords(to);
    const direction = this.color === "white" ? 1 : -1;
    return Math.abs(fromX - toX) === 1 && toY === fromY + direction;
  }
}

class Knight extends Piece {
  constructor(color, position, id) {
    super(color, position, id);
    this.type = "knight";
    this.name = "Knight";
  }

  isValidMove(to, board) {
    const { toCoords } = require("./utils");
    const [fromX, fromY] = toCoords(this.position);
    const [toX, toY] = toCoords(to);
    const dx = Math.abs(toX - fromX);
    const dy = Math.abs(toY - fromY);
    if ((dx === 1 && dy === 2) || (dx === 2 && dy === 1)) {
      const piece = board.getPiece(to);
      return piece === null || piece.color !== this.color;
    }
    return false;
  }
}

class Bishop extends Piece {
  constructor(color, position, id) {
    super(color, position, id);
    this.type = "bishop";
    this.name = "Bishop";
  }

  isValidMove(to, board) {
    const { toCoords, toSquare } = require("./utils");
    const [fromX, fromY] = toCoords(this.position);
    const [toX, toY] = toCoords(to);

    if (Math.abs(toX - fromX) !== Math.abs(toY - fromY)) return false;

    const dx = toX > fromX ? 1 : -1;
    const dy = toY > fromY ? 1 : -1;

    let x = fromX + dx;
    let y = fromY + dy;
    while (x !== toX || y !== toY) {
      if (board.getPiece(toSquare([x, y]))) return false;
      x += dx;
      y += dy;
    }

    const piece = board.getPiece(to);
    return piece === null || piece.color !== this.color;
  }
}

class Rook extends Piece {
  constructor(color, position, id) {
    super(color, position, id);
    this.type = "rook";
    this.name = "Rook";
  }

  isValidMove(to, board) {
    const { toCoords, toSquare } = require("./utils");
    const [fromX, fromY] = toCoords(this.position);
    const [toX, toY] = toCoords(to);

    if (fromX !== toX && fromY !== toY) return false;

    const dx = fromX === toX ? 0 : toX > fromX ? 1 : -1;
    const dy = fromY === toY ? 0 : toY > fromY ? 1 : -1;

    let x = fromX + dx;
    let y = fromY + dy;
    while (x !== toX || y !== toY) {
      if (board.getPiece(toSquare([x, y]))) return false;
      x += dx;
      y += dy;
    }

    const piece = board.getPiece(to);
    return piece === null || piece.color !== this.color;
  }
}

class Queen extends Piece {
  constructor(color, position, id) {
    super(color, position, id);
    this.type = "queen";
    this.name = "Queen";
  }

  isValidMove(to, board) {
    const rook = new Rook(this.color, this.position, this.id);
    const bishop = new Bishop(this.color, this.position, this.id);
    return rook.isValidMove(to, board) || bishop.isValidMove(to, board);
  }
}

class King extends Piece {
  constructor(color, position, id) {
    super(color, position, id);
    this.type = "king";
    this.name = "King";
  }

  isValidMove(to, board) {
    const { toCoords } = require("./utils");
    const [fromX, fromY] = toCoords(this.position);
    const [toX, toY] = toCoords(to);

    if (Math.abs(toX - fromX) <= 1 && Math.abs(toY - fromY) <= 1) {
      const piece = board.getPiece(to);
      return piece === null || piece.color !== this.color;
    }
    return false;
  }
}

module.exports = {
  Piece,
  CustomPiece,
  Pawn,
  Knight,
  Bishop,
  Rook,
  Queen,
  King,
};
