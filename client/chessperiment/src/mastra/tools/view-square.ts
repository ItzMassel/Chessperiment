import { createTool } from '@mastra/core/tools'
import { Chess } from 'chess.js'
import { z } from 'zod'

const pieceSymbolMap: Record<string, string> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
}

export const viewSquareTool = createTool({
  id: 'view-square',
  description: 'Returns details about a specific square: position, file, rank, color, the piece on it (if any), and legal moves to/from that square.',
  inputSchema: z.object({
    fen: z.string().describe('FEN string representing the board state.'),
    position: z.string().describe('Square position, e.g. "e4".'),
  }),
  outputSchema: z.object({
    id: z.string(),
    position: z.string(),
    file: z.string(),
    rank: z.number(),
    color: z.enum(['light', 'dark']),
    piece: z.object({
      id: z.string(),
      type: z.string(),
      color: z.enum(['w', 'b']),
    }).nullable(),
    legalMovesFrom: z.array(z.string()),
    legalMovesTo: z.array(z.object({
      from: z.string(),
      to: z.string(),
    })),
    isAttacked: z.boolean(),
  }),
  execute: async ({ fen, position }) => {
    const chess = new Chess(fen)
    const board = chess.board()

    const file = position[0]
    const rank = parseInt(position[1])
    const fileIndex = 'abcdefgh'.indexOf(file)
    const rankIndex = 8 - rank
    const isLight = (fileIndex + rankIndex) % 2 === 0

    const cell = board[rankIndex][fileIndex]
    let piece = null
    if (cell) {
      piece = {
        id: `${cell.color}-${cell.type}`,
        type: pieceSymbolMap[cell.type] || cell.type,
        color: cell.color,
      }
    }

    const movesFrom = chess.moves({ square: position, verbose: true })
      .filter(m => !m.flags.includes('k'))
      .map(m => m.to)

    const movesTo = chess.moves({ verbose: true })
      .filter(m => m.to === position)
      .map(m => ({ from: m.from, to: m.to }))

    return {
      id: position,
      position,
      file,
      rank,
      color: isLight ? 'light' : 'dark',
      piece,
      legalMovesFrom: movesFrom,
      legalMovesTo: movesTo,
      isAttacked: movesTo.length > 0,
    }
  },
})
