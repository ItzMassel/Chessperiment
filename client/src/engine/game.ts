import { type Square } from './types'
import { ValidatorClass } from './rules'
import { BoardClass } from './board'

export class Game {
    private board: BoardClass;
    private validator: ValidatorClass;

    constructor(customBoard?: BoardClass) {
        this.board = customBoard || new BoardClass();
        this.validator = new ValidatorClass(this.board);
    }

    makeMove(from: Square, to: Square, promotion?: string): boolean {
        if (this.validator.isLegal(from, to, promotion)) {
            return this.board.movePiece(from, to, promotion);
        }
        return false;
    }

    forceMove(from: Square, to: Square, promotion?: string): boolean {
        return this.board.movePiece(from, to, promotion, true);
    }

    getBoard(): BoardClass {
        return this.board;
    }

    getTurn(): "white" | "black" {
        return this.board.getTurn();
    }

    getLegalMoves(color?: 'white' | 'black'): { from: Square, to: Square }[] {
        return this.validator.getLegalMoves(color || this.getTurn());
    }

    isCheckmate(): boolean {
        const turn = this.board.getTurn();
        const legalMoves = this.getLegalMoves(turn);
        return legalMoves.length === 0 && this.validator.isInCheck(turn);
    }

    isStalemate(): boolean {
        const turn = this.board.getTurn();
        const legalMoves = this.getLegalMoves(turn);
        return legalMoves.length === 0 && !this.validator.isInCheck(turn);
    }

    isGameOver(): boolean {
        return this.isCheckmate() || this.isStalemate();
    }
}
