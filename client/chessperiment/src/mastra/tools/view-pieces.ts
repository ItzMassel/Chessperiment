import { createTool } from '@mastra/core/tools'
import { Chess } from 'chess.js'
import { z } from 'zod'

export const viewPiecesTool = createTool({
  id: 'view-pieces',
  description: 'List all pieces on the board with their positions, types, and colors.',
  inputSchema: z.object({
    fen: z.string().describe('FEN string representing the board state.'),
  }),
  outputSchema: z.object({
    pieces: z.array(z.object({
      type: z.string(),
      color: z.enum(['w', 'b']),
      square: z.string(),
    })),
    whiteCount: z.number(),
    blackCount: z.number(),
  }),
  execute: async ({ fen }) => {
    const chess = new Chess(fen)
    const board = chess.board()
    const pieces: Array<{ type: string; color: 'w' | 'b'; square: string }> = []

    for (const row of board) {
      for (const cell of row) {
        if (cell) {
          pieces.push({
            type: cell.type,
            color: cell.color,
            square: cell.square,
          })
        }
      }
    }

    return {
      pieces,
      whiteCount: pieces.filter(p => p.color === 'w').length,
      blackCount: pieces.filter(p => p.color === 'b').length,
    }
  },
})
