const { BoardStateManager } = require("./state");
const { Piece, CustomPiece } = require("./piece");
const { toSquare, toCoords } = require("./utils");
const { LogicRunner } = require("./logic/LogicRunner");
const { SquareLogicRunner } = require("./logic/SquareLogicRunner");
const { EffectExecutor, EffectFactory } = require("./effects");

class BoardClass {
  constructor(config = {}) {
    this.width = config.width || 8;
    this.height = config.height || 8;
    this.topology = config.topology || "rect";
    this.squareLogic = config.squareLogic || {};
    this.stateManager = new BoardStateManager({}, config.activeSquares);
    this.squareStates = {}; // For visual effects or temp states

    // Piece management
    if (config.pieces) {
      for (const [pos, data] of Object.entries(config.pieces)) {
        if (!data) continue;

        const piece = Piece.create(
          data.type,
          data.color,
          pos,
          data.id,
          data.isCustom ? data : null,
        );

        if (data.isCustom) {
          piece.variables = { ...data.variables };
          piece.hasMoved = data.hasMoved || false;
        }

        this.stateManager.setPiece(pos, piece);
      }
    }
  }

  isActive(square) {
    return this.stateManager.isActive(square);
  }

  setActive(square, active) {
    this.stateManager.setActive(square, active);
  }

  getPiece(square) {
    return this.stateManager.getPiece(square);
  }

  setPiece(square, piece) {
    this.stateManager.setPiece(square, piece);
  }

  getTurn() {
    return this.stateManager.turn;
  }

  movePiece(from, to, effectExecutor) {
    const piece = this.getPiece(from);
    if (!piece) return false;

    const capturedPiece = this.getPiece(to);
    const context = {
      from,
      to,
      piece,
      capturedPiece,
      attacker: piece,
      board: this,
      movePrevented: false,
    };

    // 1. Pre-move logic (triggers on the square and piece)
    SquareLogicRunner.execute(to, "on-step", context, this);
    if (piece.isCustom) {
      piece.executeLogic("on-move", context, this, effectExecutor);
    }

    if (context.movePrevented) return false;

    // 2. Perform the move
    this.setPiece(from, null);
    this.setPiece(to, piece);
    piece.position = to;
    piece.hasMoved = true;

    // 3. Post-move logic (captures, etc.)
    if (capturedPiece) {
      capturedPiece.capturedAt = to;
      if (capturedPiece.isCustom) {
        capturedPiece.executeLogic(
          "on-is-captured",
          context,
          this,
          effectExecutor,
        );
      }
    }

    this.stateManager.addMoveToHistory(from, to, piece.id);

    // 4. Update all custom pieces turn state (cooldowns etc)
    const allSquares = this.getSquares();
    for (const sq in allSquares) {
      const p = allSquares[sq];
      if (p && p.isCustom) {
        p.updateTurnState(this.getTurn());
      }
    }

    return true;
  }

  triggerEffect(type, data) {
    // This is mainly for visual effects, but on server we might want to log or track them
    console.log(`[Board] Effect triggered: ${type}`, data);
  }

  getSquares() {
    return this.stateManager.getSquares();
  }

  getSnapshot() {
    const squares = this.getSquares();
    const serialized = {};
    for (const pos in squares) {
      const p = squares[pos];
      if (p) {
        serialized[pos] = {
          id: p.id,
          type: p.type,
          color: p.color,
          isCustom: p.isCustom,
          name: p.name,
          variables: p.isCustom ? { ...p.variables } : undefined,
          hasMoved: p.hasMoved,
          shape: p.isCustom ? p.shape : undefined,
          image: p.isCustom ? p.image : undefined,
          pixels: p.isCustom ? p.pixels : undefined,
          movementRules: p.isCustom ? p.movementRules : undefined,
          logic: p.isCustom ? p.logic : undefined,
        };
      } else {
        serialized[pos] = null;
      }
    }
    return {
      squares: serialized,
      turn: this.getTurn(),
      width: this.width,
      height: this.height,
      activeSquares: this.stateManager.activeSquares
        ? Array.from(this.stateManager.activeSquares)
        : null,
      topology: this.topology,
      squareLogic: this.squareLogic,
    };
  }

  clone() {
    const config = {
      width: this.width,
      height: this.height,
      topology: this.topology,
      activeSquares: this.stateManager.activeSquares
        ? Array.from(this.stateManager.activeSquares)
        : undefined,
      squareLogic: JSON.parse(JSON.stringify(this.squareLogic)),
      pieces: {},
    };

    const squares = this.getSquares();
    for (const pos in squares) {
      const p = squares[pos];
      if (p) {
        config.pieces[pos] = {
          id: p.id,
          type: p.type,
          color: p.color,
          isCustom: p.isCustom,
          name: p.name,
          variables: p.isCustom ? { ...p.variables } : undefined,
          hasMoved: p.hasMoved,
          shape: p.isCustom ? p.shape : undefined,
          image: p.isCustom ? p.image : undefined,
          pixels: p.isCustom ? p.pixels : undefined,
          movementRules: p.isCustom ? p.movementRules : undefined,
          logic: p.isCustom ? p.logic : undefined,
        };
      }
    }

    const cloned = new BoardClass(config);
    cloned.stateManager.history = [...this.stateManager.history];
    cloned.stateManager.turn = this.stateManager.turn;
    return cloned;
  }
}

module.exports = { BoardClass };
