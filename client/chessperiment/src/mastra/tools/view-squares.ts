import { createTool } from '@mastra/core/tools'
import { Chess } from 'chess.js'
import { z } from 'zod'

export const viewSquaresTool = createTool({
  id: 'view-squares',
  description: 'Returns a list of all 64 squares on the board with their id, position, file, rank, and color (light/dark).',
  inputSchema: z.object({
    fen: z.string().optional().describe('FEN string. Defaults to starting position.'),
  }),
  outputSchema: z.object({
    squares: z.array(z.object({
      id: z.string(),
      position: z.string(),
      file: z.string(),
      rank: z.number(),
      color: z.enum(['light', 'dark']),
      hasPiece: z.boolean(),
    })),
  }),
  execute: async ({ fen }) => {
    const chess = fen ? new Chess(fen) : new Chess()
    const board = chess.board()
    const squares: Array<{ id: string; position: string; file: string; rank: number; color: 'light' | 'dark'; hasPiece: boolean }> = []

    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const position = `${'abcdefgh'[file]}${8 - rank}`
        const isLight = (file + rank) % 2 === 0
        squares.push({
          id: position,
          position,
          file: 'abcdefgh'[file],
          rank: 8 - rank,
          color: isLight ? 'light' : 'dark',
          hasPiece: board[rank][file] !== null,
        })
      }
    }

    return { squares }
  },
})
