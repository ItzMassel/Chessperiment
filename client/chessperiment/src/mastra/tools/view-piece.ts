import { createTool } from '@mastra/core/tools'
import { Chess } from 'chess.js'
import { z } from 'zod'

export const viewPieceTool = createTool({
  id: 'view-piece',
  description: 'Get details about a specific piece on the board: its type, color, position, and legal moves. Provide either a square (e.g. "e2"), or piece type+color (e.g. "white pawn").',
  inputSchema: z.object({
    fen: z.string().describe('FEN string representing the board state.'),
    square: z.string().optional().describe('Square to look up, e.g. "e2".'),
    type: z.enum(['p', 'n', 'b', 'r', 'q', 'k']).optional().describe('Piece type letter (pawn, knight, bishop, rook, queen, king).'),
    color: z.enum(['w', 'b']).optional().describe('Piece color.'),
  }),
  outputSchema: z.object({
    found: z.boolean(),
    piece: z.object({
      type: z.string(),
      color: z.enum(['w', 'b']),
      square: z.string(),
    }).nullable(),
    legalMoves: z.array(z.string()),
    captures: z.array(z.string()),
  }),
  execute: async ({ fen, square, type, color }) => {
    const chess = new Chess(fen)

    if (square) {
      const piece = chess.get(square)
      if (!piece) {
        return { found: false, piece: null, legalMoves: [], captures: [] }
      }
      const moves = chess.moves({ square, verbose: true })
      return {
        found: true,
        piece: { type: piece.type, color: piece.color, square },
        legalMoves: moves.map(m => m.to),
        captures: moves.filter(m => m.captured).map(m => m.to),
      }
    }

    if (type && color) {
      const board = chess.board()
      for (const row of board) {
        for (const cell of row) {
          if (cell && cell.type === type && cell.color === color) {
            const moves = chess.moves({ square: cell.square, verbose: true })
            return {
              found: true,
              piece: { type: cell.type, color: cell.color, square: cell.square },
              legalMoves: moves.map(m => m.to),
              captures: moves.filter(m => m.captured).map(m => m.to),
            }
          }
        }
      }
      return { found: false, piece: null, legalMoves: [], captures: [] }
    }

    return { found: false, piece: null, legalMoves: [], captures: [] }
  },
})
