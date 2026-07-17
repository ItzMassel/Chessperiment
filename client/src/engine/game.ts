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

    getGameStatus(): 'checkmate' | 'stalemate' | 'check' | 'normal' {
        const turn = this.board.getTurn();
        const legalMoves = this.getLegalMoves(turn);
        if (legalMoves.length > 0) {
            return this.validator.isInCheck(turn) ? 'check' : 'normal';
        }
        return this.validator.isInCheck(turn) ? 'checkmate' : 'stalemate';
    }

    isCheckmate(): boolean {
        return this.getGameStatus() === 'checkmate';
    }

    isStalemate(): boolean {
        return this.getGameStatus() === 'stalemate';
    }

    isGameOver(): boolean {
        const status = this.getGameStatus();
        return status === 'checkmate' || status === 'stalemate';
    }
}
