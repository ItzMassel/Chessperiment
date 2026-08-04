import { createTool } from '@mastra/core/tools'
import { Chess } from 'chess.js'
import { z } from 'zod'

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

const pieceTypeMap: Record<string, string> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
}

export const viewBoardStatusTool = createTool({
  id: 'view-board-status',
  description: 'Returns every square on the board (with id), every active square (squares with pieces), and every piece with its id, position, color, and type.',
  inputSchema: z.object({
    fen: z.string().optional().describe('FEN string representing the board state. Defaults to starting position.'),
  }),
  outputSchema: z.object({
    fen: z.string(),
    turn: z.enum(['w', 'b']),
    allSquares: z.array(z.object({
      id: z.string(),
      position: z.string(),
    })),
    activeSquares: z.array(z.string()),
    pieces: z.array(z.object({
      id: z.string(),
      type: z.string(),
      color: z.enum(['w', 'b']),
      position: z.string(),
    })),
    isCheck: z.boolean(),
    isCheckmate: z.boolean(),
    isStalemate: z.boolean(),
    isGameOver: z.boolean(),
    fullMoveNumber: z.number(),
    halfMoveClock: z.number(),
  }),
  execute: async ({ fen }) => {
    const chess = fen ? new Chess(fen) : new Chess()
    const board = chess.board()

    const allSquares: Array<{ id: string; position: string }> = []
    const pieces: Array<{ id: string; type: string; color: 'w' | 'b'; position: string }> = []
    const activeSquares: string[] = []
    const typeCounters: Record<string, number> = {}

    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const position = `${FILES[file]}${8 - rank}`
        allSquares.push({ id: position, position })

        const cell = board[rank][file]
        if (cell) {
          activeSquares.push(position)
          typeCounters[cell.color + cell.type] = (typeCounters[cell.color + cell.type] || 0) + 1
          pieces.push({
            id: `${cell.color}-${cell.type}-${typeCounters[cell.color + cell.type]}`,
            type: pieceTypeMap[cell.type] || cell.type,
            color: cell.color,
            position,
          })
        }
      }
    }

    return {
      fen: chess.fen(),
      turn: chess.turn(),
      allSquares,
      activeSquares,
      pieces,
      isCheck: chess.isCheck(),
      isCheckmate: chess.isCheckmate(),
      isStalemate: chess.isStalemate(),
      isGameOver: chess.isGameOver(),
      fullMoveNumber: chess.moveNumber(),
      halfMoveClock: chess.halfMoveNumber(),
    }
  },
})
