import { ValidatorClass } from "./rules.js";
import { BoardClass } from "./board.js";
import { EffectExecutor } from "./effects.js";

export class EngineGame {
  constructor(customBoard) {
    this.board = customBoard || new BoardClass();
    this.validator = new ValidatorClass(this.board);
    this.effectExecutor = new EffectExecutor();
  }

  makeMove(from, to, promotion) {
    // Clear effect executor for new move
    this.effectExecutor.clear();

    if (this.validator.isLegal(from, to, promotion, this.effectExecutor)) {
      // Process pre-move phase again just in case (isLegal already does it, but to be sure)
      this.effectExecutor.processPhase("pre-move", this.board);

      // Execute move on board
      const moveSuccess = this.board.movePiece(from, to, promotion);

      if (moveSuccess) {
        // Process on-move and post-move phases
        this.effectExecutor.processPhase("on-move", this.board);
        this.effectExecutor.processPhase("post-move", this.board);
        this.effectExecutor.processPhase("end-of-turn", this.board);
        return true;
      }
    }
    return false;
  }

  forceMove(from, to, promotion) {
    return this.board.movePiece(from, to, promotion, true);
  }

  getBoard() {
    return this.board;
  }

  getTurn() {
    return this.board.getTurn();
  }

  getLegalMoves(color) {
    return this.validator.getLegalMoves(color || this.getTurn());
  }
}
