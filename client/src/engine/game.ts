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

    /** Drop a piece from the bench onto the board (a full turn), if the drop is legal. */
    dropPiece(pieceId: string, to: Square): boolean {
        if (this.validator.isLegalDrop(pieceId, to)) {
            return this.board.dropPiece(pieceId, to);
        }
        return false;
    }

    /** Like dropPiece but skips the legality check (used when validation is switched off). */
    forceDrop(pieceId: string, to: Square): boolean {
        return this.board.dropPiece(pieceId, to);
    }

    getLegalDropSquares(pieceId: string): Square[] {
        return this.validator.getLegalDropSquares(pieceId);
    }

    /** Every legal drop for `color`: each bench piece paired with each square it can go to. */
    getLegalDrops(color?: 'white' | 'black'): { pieceId: string, to: Square }[] {
        const drops: { pieceId: string, to: Square }[] = [];
        for (const piece of this.board.getBench(color || this.getTurn())) {
            for (const to of this.validator.getLegalDropSquares(piece.id)) {
                drops.push({ pieceId: piece.id, to });
            }
        }
        return drops;
    }

    getGameStatus(): 'checkmate' | 'stalemate' | 'check' | 'normal' {
        const turn = this.board.getTurn();
        const inCheck = this.validator.isInCheck(turn);
        // A player who can still drop a bench piece is neither mated nor stalemated.
        const canAct = this.getLegalMoves(turn).length > 0 || this.validator.hasLegalDrop(turn);
        if (canAct) {
            return inCheck ? 'check' : 'normal';
        }
        return inCheck ? 'checkmate' : 'stalemate';
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
