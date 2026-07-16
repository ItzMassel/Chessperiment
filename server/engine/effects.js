import { Piece } from "./piece.js";
import { toCoords, toSquare } from "./utils.js";

/**
 * Single source of truth for all state mutations.
 * Enforces the invariant: triggers/logic enqueue effects, never mutate directly.
 */
export class EffectExecutor {
  constructor() {
    this.queue = [];
    this.moveWasCancelled = false;
  }

  /**
   * Enqueue an effect to be processed.
   */
  enqueue(effect) {
    this.queue.push(effect);
  }

  /**
   * Check if a move was cancelled by a previous effect.
   */
  wasMoveCancelled() {
    return this.moveWasCancelled;
  }

  /**
   * Process all effects for a specific phase.
   */
  processPhase(phase, board) {
    // Filter effects for this phase
    const phaseEffects = this.queue.filter((e) => e.phase === phase);

    // Execute each effect
    for (const effect of phaseEffects) {
      this.executeEffect(effect, board);
    }

    // Remove processed effects
    this.queue = this.queue.filter((e) => e.phase !== phase);
  }

  /**
   * Execute a single effect.
   */
  executeEffect(effect, board) {
    switch (effect.type) {
      case "transform":
        this.executeTransform(effect, board);
        break;

      case "remove":
        this.executeRemove(effect, board);
        break;

      case "spawn":
        this.executeSpawn(effect, board);
        break;

      case "move":
        this.executeMove(effect, board);
        break;

      case "setSquareState":
        this.executeSetSquareState(effect, board);
        break;

      case "addSquareTag":
        this.executeAddSquareTag(effect, board);
        break;

      case "removeSquareTag":
        this.executeRemoveSquareTag(effect, board);
        break;

      case "cancelMove":
        this.executeCancelMove(effect);
        break;

      case "win":
        this.executeWin(effect, board);
        break;

      case "explode":
        this.executeExplode(effect, board);
        break;
    }
  }

  executeTransform(effect, board) {
    const { target, params } = effect;
    const { newType, newColor } = params;

    // Target can be square or piece ID
    let square;
    if (typeof target === "string" && target.includes(",")) {
      square = target;
    } else {
      // Find piece by ID
      const squares = board.getSquares();
      const found = Object.entries(squares).find(([_, p]) => p?.id === target);
      if (!found) return;
      square = found[0];
    }

    const piece = board.getPiece(square);
    if (!piece) return;

    // Create new piece with same position
    const newPiece = Piece.create(
      `${piece.id}_transformed`,
      newType || piece.type,
      newColor || piece.color,
      square,
    );

    if (newPiece) {
      board.setPiece(square, newPiece);
    }
  }

  executeRemove(effect, board) {
    const square = effect.target;
    board.setPiece(square, null);
  }

  executeSpawn(effect, board) {
    const square = effect.target;
    const { pieceType, color, pieceId } = effect.params;

    // Don't spawn if square occupied
    if (board.getPiece(square)) return;

    const piece = Piece.create(
      pieceId || `spawned_${square}_${Date.now()}`,
      pieceType,
      color,
      square,
    );

    if (piece) {
      board.setPiece(square, piece);
    }
  }

  executeMove(effect, board) {
    const { from, to } = effect.params;
    const piece = board.getPiece(from);

    if (!piece) return;

    board.setPiece(to, piece);
    board.setPiece(from, null);
    piece.position = to;
    piece.hasMoved = true;
  }

  executeSetSquareState(effect, board) {
    const square = effect.target;
    const { state } = effect.params;

    // Merge with existing state
    const currentState = board.getSquareState(square);
    board.setSquareState(square, {
      ...currentState,
      ...state,
    });
  }

  executeAddSquareTag(effect, board) {
    const square = effect.target;
    const { tag } = effect.params;

    const state = board.getSquareState(square);
    if (!state.tags) {
      state.tags = new Set();
    }
    state.tags.add(tag);
    board.setSquareState(square, state);
  }

  executeRemoveSquareTag(effect, board) {
    const square = effect.target;
    const { tag } = effect.params;

    const state = board.getSquareState(square);
    if (state.tags) {
      state.tags.delete(tag);
      board.setSquareState(square, state);
    }
  }

  executeCancelMove(effect) {
    this.moveWasCancelled = true;
  }

  executeWin(effect, board) {
    const { winner } = effect.params;
    board.triggerEffect("win", winner === "white" ? "white_win" : "black_win");
  }

  executeExplode(effect, board) {
    const square = effect.target;
    const { radius } = effect.params;
    const r = Number(radius) || 0;

    const [targetCol, targetRow] = toCoords(square);
    const useAlgebraic = !square.includes(",");

    for (let col = targetCol - r; col <= targetCol + r; col++) {
      for (let row = targetRow - r; row <= targetRow + r; row++) {
        const sq = toSquare([col, row], useAlgebraic);
        if (board.isActive(sq)) {
          board.setPiece(sq, null);
          board.triggerEffect("kill", sq);
        }
      }
    }
  }

  /**
   * Clear all queued effects.
   */
  clear() {
    this.queue = [];
    this.moveWasCancelled = false;
  }

  /**
   * Reset the cancellation flag for a new move.
   */
  resetCancellation() {
    this.moveWasCancelled = false;
  }

  /**
   * Get current queue size (for debugging).
   */
  getQueueSize() {
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
  static transform(target, newType, phase = "on-move", newColor) {
    return {
      type: "transform",
      phase,
      target,
      params: { newType, newColor },
    };
  }

  /**
   * Remove a piece from a square.
   */
  static remove(square, phase = "on-move") {
    return {
      type: "remove",
      phase,
      target: square,
      params: {},
    };
  }

  /**
   * Spawn a new piece on a square.
   */
  static spawn(square, pieceType, color, phase = "post-move", pieceId) {
    return {
      type: "spawn",
      phase,
      target: square,
      params: { pieceType, color, pieceId },
    };
  }

  /**
   * Move a piece from one square to another.
   */
  static move(from, to, phase = "on-move") {
    return {
      type: "move",
      phase,
      target: from,
      params: { from, to },
    };
  }

  /**
   * Set the state of a square.
   */
  static setSquareState(square, state, phase = "post-move") {
    return {
      type: "setSquareState",
      phase,
      target: square,
      params: { state },
    };
  }

  /**
   * Add a tag to a square.
   */
  static addSquareTag(square, tag, phase = "post-move") {
    return {
      type: "addSquareTag",
      phase,
      target: square,
      params: { tag },
    };
  }

  /**
   * Remove a tag from a square.
   */
  static removeSquareTag(square, tag, phase = "post-move") {
    return {
      type: "removeSquareTag",
      phase,
      target: square,
      params: { tag },
    };
  }

  /**
   * Cancel the current move.
   */
  static cancelMove(phase = "pre-move") {
    return {
      type: "cancelMove",
      phase,
      target: "",
      params: {},
    };
  }

  /**
   * Declare a winner and end the game.
   */
  static win(winner, phase = "post-move") {
    return {
      type: "win",
      phase,
      target: "",
      params: { winner },
    };
  }

  /**
   * Explode all pieces within a radius.
   */
  static explode(square, radius, phase = "on-move") {
    return {
      type: "explode",
      phase,
      target: square,
      params: { radius },
    };
  }
}
