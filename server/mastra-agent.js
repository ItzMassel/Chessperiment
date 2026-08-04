import { Agent } from '@mastra/core/agent'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { Chess } from 'chess.js'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Router } from 'express'
import { createOpenAI } from '@ai-sdk/openai'

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

const pieceTypeMap = {
  p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king',
}

const pieceSymbolMap = {
  p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king',
}

const PROJECT_PATH = join(process.cwd(), 'workspace', 'project.json')

async function loadProject() {
  try {
    const raw = await readFile(PROJECT_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

async function saveProject(data) {
  data.updatedAt = new Date().toISOString()
  await writeFile(PROJECT_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

const viewBoardStatusTool = createTool({
  id: 'view-board-status',
  description: 'Returns every square on the board, active squares, and every piece with id, position, color, type.',
  inputSchema: z.object({
    fen: z.string().optional().describe('FEN string. Defaults to starting position.'),
  }),
  outputSchema: z.object({
    fen: z.string(),
    turn: z.enum(['w', 'b']),
    allSquares: z.array(z.object({ id: z.string(), position: z.string() })),
    activeSquares: z.array(z.string()),
    pieces: z.array(z.object({ id: z.string(), type: z.string(), color: z.enum(['w', 'b']), position: z.string() })),
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
    const allSquares = []
    const pieces = []
    const activeSquares = []
    const typeCounters = {}

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
      fen: chess.fen(), turn: chess.turn(), allSquares, activeSquares, pieces,
      isCheck: chess.isCheck(), isCheckmate: chess.isCheckmate(),
      isStalemate: chess.isStalemate(), isGameOver: chess.isGameOver(),
      fullMoveNumber: chess.moveNumber(), halfMoveClock: chess.halfMoveNumber(),
    }
  },
})

const viewPieceTool = createTool({
  id: 'view-piece',
  description: 'Get details about a specific piece: type, color, position, legal moves.',
  inputSchema: z.object({
    fen: z.string().describe('FEN string.'),
    square: z.string().optional().describe('Square, e.g. "e2".'),
    type: z.enum(['p', 'n', 'b', 'r', 'q', 'k']).optional(),
    color: z.enum(['w', 'b']).optional(),
  }),
  outputSchema: z.object({
    found: z.boolean(),
    piece: z.object({ type: z.string(), color: z.enum(['w', 'b']), square: z.string() }).nullable(),
    legalMoves: z.array(z.string()),
    captures: z.array(z.string()),
  }),
  execute: async ({ fen, square, type, color }) => {
    const chess = new Chess(fen)
    if (square) {
      const piece = chess.get(square)
      if (!piece) return { found: false, piece: null, legalMoves: [], captures: [] }
      const moves = chess.moves({ square, verbose: true })
      return { found: true, piece: { type: piece.type, color: piece.color, square }, legalMoves: moves.map(m => m.to), captures: moves.filter(m => m.captured).map(m => m.to) }
    }
    if (type && color) {
      const board = chess.board()
      for (const row of board) {
        for (const cell of row) {
          if (cell && cell.type === type && cell.color === color) {
            const moves = chess.moves({ square: cell.square, verbose: true })
            return { found: true, piece: { type: cell.type, color: cell.color, square: cell.square }, legalMoves: moves.map(m => m.to), captures: moves.filter(m => m.captured).map(m => m.to) }
          }
        }
      }
      return { found: false, piece: null, legalMoves: [], captures: [] }
    }
    return { found: false, piece: null, legalMoves: [], captures: [] }
  },
})

const viewPiecesTool = createTool({
  id: 'view-pieces',
  description: 'List all pieces on the board.',
  inputSchema: z.object({ fen: z.string().describe('FEN string.') }),
  outputSchema: z.object({
    pieces: z.array(z.object({ type: z.string(), color: z.enum(['w', 'b']), square: z.string() })),
    whiteCount: z.number(), blackCount: z.number(),
  }),
  execute: async ({ fen }) => {
    const chess = new Chess(fen)
    const board = chess.board()
    const pieces = []
    for (const row of board) {
      for (const cell of row) {
        if (cell) pieces.push({ type: cell.type, color: cell.color, square: cell.square })
      }
    }
    return { pieces, whiteCount: pieces.filter(p => p.color === 'w').length, blackCount: pieces.filter(p => p.color === 'b').length }
  },
})

const viewSquaresTool = createTool({
  id: 'view-squares',
  description: 'Returns all 64 squares with id, position, file, rank, and color.',
  inputSchema: z.object({ fen: z.string().optional().describe('FEN string. Defaults to starting position.') }),
  outputSchema: z.object({
    squares: z.array(z.object({ id: z.string(), position: z.string(), file: z.string(), rank: z.number(), color: z.enum(['light', 'dark']), hasPiece: z.boolean() })),
  }),
  execute: async ({ fen }) => {
    const chess = fen ? new Chess(fen) : new Chess()
    const board = chess.board()
    const squares = []
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const position = `${'abcdefgh'[file]}${8 - rank}`
        squares.push({ id: position, position, file: 'abcdefgh'[file], rank: 8 - rank, color: (file + rank) % 2 === 0 ? 'light' : 'dark', hasPiece: board[rank][file] !== null })
      }
    }
    return { squares }
  },
})

const viewSquareTool = createTool({
  id: 'view-square',
  description: 'Returns details about a specific square.',
  inputSchema: z.object({ fen: z.string().describe('FEN string.'), position: z.string().describe('Square, e.g. "e4".') }),
  outputSchema: z.object({
    id: z.string(), position: z.string(), file: z.string(), rank: z.number(),
    color: z.enum(['light', 'dark']),
    piece: z.object({ id: z.string(), type: z.string(), color: z.enum(['w', 'b']) }).nullable(),
    legalMovesFrom: z.array(z.string()),
    legalMovesTo: z.array(z.object({ from: z.string(), to: z.string() })),
    isAttacked: z.boolean(),
  }),
  execute: async ({ fen, position }) => {
    const chess = new Chess(fen)
    const board = chess.board()
    const file = position[0]
    const rank = parseInt(position[1])
    const fileIndex = 'abcdefgh'.indexOf(file)
    const rankIndex = 8 - rank
    const cell = board[rankIndex][fileIndex]
    let piece = null
    if (cell) piece = { id: `${cell.color}-${cell.type}`, type: pieceSymbolMap[cell.type] || cell.type, color: cell.color }
    const movesFrom = chess.moves({ square: position, verbose: true }).filter(m => !m.flags.includes('k')).map(m => m.to)
    const movesTo = chess.moves({ verbose: true }).filter(m => m.to === position).map(m => ({ from: m.from, to: m.to }))
    return { id: position, position, file, rank, color: (fileIndex + rankIndex) % 2 === 0 ? 'light' : 'dark', piece, legalMovesFrom: movesFrom, legalMovesTo: movesTo, isAttacked: movesTo.length > 0 }
  },
})

const viewProjectTool = createTool({
  id: 'view-project',
  description: 'View project details like name, description, board dimensions.',
  inputSchema: z.object({}),
  outputSchema: z.object({
    found: z.boolean(),
    project: z.object({
      name: z.string(), description: z.string().nullable(),
      rows: z.number(), cols: z.number(), gridType: z.string(),
      activeSquares: z.array(z.string()), pieceCount: z.number(),
      customPieceCount: z.number(), squareLogicCount: z.number(),
      createdAt: z.string(), updatedAt: z.string(),
    }).nullable(),
  }),
  execute: async () => {
    const project = await loadProject()
    if (!project) return { found: false, project: null }
    return {
      found: true,
      project: {
        name: project.name, description: project.description ?? null,
        rows: project.rows, cols: project.cols, gridType: project.gridType,
        activeSquares: project.activeSquares,
        pieceCount: Object.keys(project.placedPieces || {}).length,
        customPieceCount: (project.customPieces || []).length,
        squareLogicCount: project.squareLogic ? Object.keys(project.squareLogic).length : 0,
        createdAt: project.createdAt, updatedAt: project.updatedAt,
      },
    }
  },
})

const editProjectTool = createTool({
  id: 'edit-project',
  description: 'Edit project name and/or description.',
  inputSchema: z.object({
    name: z.string().optional().describe('New project name.'),
    description: z.string().optional().describe('New project description.'),
  }),
  outputSchema: z.object({ success: z.boolean(), name: z.string(), description: z.string().nullable() }),
  execute: async ({ name, description }) => {
    let project = await loadProject()
    if (!project) {
      project = { userId: 'agent', name: name ?? 'Untitled Project', description: description ?? '', isStarred: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), rows: 8, cols: 8, gridType: 'square', activeSquares: [], placedPieces: {}, customPieces: [] }
    }
    if (name !== undefined) project.name = name
    if (description !== undefined) project.description = description
    await saveProject(project)
    return { success: true, name: project.name, description: project.description ?? null }
  },
})

const editSquareTool = createTool({
  id: 'edit-square',
  description: 'Edit a square. Can toggle disabled/enabled or update Blockly logic.',
  inputSchema: z.object({
    position: z.string().describe('Square position.'),
    disabled: z.boolean().optional().describe('Set square disabled/enabled.'),
    blocklyXml: z.string().optional().describe('Blockly XML for square logic.'),
  }),
  outputSchema: z.object({ success: z.boolean(), position: z.string(), disabled: z.boolean().nullable(), hasBlocklyLogic: z.boolean() }),
  execute: async ({ position, disabled, blocklyXml }) => {
    const project = await loadProject()
    if (!project) return { success: false, position, disabled: null, hasBlocklyLogic: false }
    if (disabled !== undefined) {
      if (disabled) project.activeSquares = project.activeSquares.filter(s => s !== position)
      else if (!project.activeSquares.includes(position)) project.activeSquares.push(position)
    }
    if (blocklyXml !== undefined) {
      if (!project.squareLogic) project.squareLogic = {}
      project.squareLogic[position] = { squareId: position, logic: [{ blocklyXml }], createdAt: project.squareLogic[position]?.createdAt ?? new Date().toISOString(), updatedAt: new Date().toISOString() }
    }
    await saveProject(project)
    return { success: true, position, disabled: disabled ?? null, hasBlocklyLogic: !!(project.squareLogic && project.squareLogic[position]) }
  },
})

const editPieceTool = createTool({
  id: 'edit-piece',
  description: 'Edit a piece: position, design, rename, delete, movement rules, Blockly logic.',
  inputSchema: z.object({
    id: z.string().describe('Piece identifier.'),
    position: z.string().optional().describe('New starting position. Empty string to remove from board.'),
    name: z.string().optional(), type: z.string().optional(),
    color: z.enum(['white', 'black']).optional(),
    movement: z.enum(['run', 'jump']).optional(),
    pixelsWhite: z.array(z.array(z.string())).optional(),
    pixelsBlack: z.array(z.array(z.string())).optional(),
    moves: z.array(z.any()).optional(),
    blocklyXml: z.string().optional(),
    delete: z.boolean().optional().describe('Delete this piece entirely.'),
  }),
  outputSchema: z.object({ success: z.boolean(), id: z.string(), deleted: z.boolean(), position: z.string().nullable() }),
  execute: async (input) => {
    const project = await loadProject()
    if (!project) return { success: false, id: input.id, deleted: false, position: null }
    const placedEntry = project.placedPieces?.[input.id]
    const customIdx = (project.customPieces || []).findIndex(p => p.id === input.id || p.name === input.id)
    if (input.delete) {
      delete project.placedPieces[input.id]
      if (customIdx !== -1) project.customPieces.splice(customIdx, 1)
      await saveProject(project)
      return { success: true, id: input.id, deleted: true, position: null }
    }
    const existingCustom = customIdx !== -1 ? project.customPieces[customIdx] : null
    if (input.position !== undefined) {
      if (input.position === '') delete project.placedPieces[input.id]
      else project.placedPieces[input.id] = { ...(placedEntry ?? { type: 'pawn', color: 'white' }), type: input.type ?? placedEntry?.type ?? existingCustom?.name ?? 'pawn', color: input.color ?? placedEntry?.color ?? 'white', movement: input.movement ?? placedEntry?.movement }
    }
    if (input.name || input.type || input.pixelsWhite || input.pixelsBlack || input.moves || input.blocklyXml) {
      if (existingCustom) {
        if (input.name) existingCustom.name = input.name
        if (input.pixelsWhite) existingCustom.pixelsWhite = input.pixelsWhite
        if (input.pixelsBlack) existingCustom.pixelsBlack = input.pixelsBlack
        if (input.moves) existingCustom.moves = input.moves
        if (input.blocklyXml) existingCustom.logic = { blocklyXml: input.blocklyXml }
        existingCustom.updatedAt = new Date().toISOString()
      } else {
        project.customPieces.push({ id: input.id, setId: '', userId: project.userId, name: input.name ?? input.id, pixelsWhite: input.pixelsWhite ?? [], pixelsBlack: input.pixelsBlack ?? [], moves: input.moves ?? [], logic: input.blocklyXml ? { blocklyXml: input.blocklyXml } : undefined, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
      }
    }
    const finalPosition = project.placedPieces[input.id] ? Object.keys(project.placedPieces).find(k => k === input.id) || null : null
    await saveProject(project)
    return { success: true, id: input.id, deleted: false, position: finalPosition }
  },
})

const editBoardSizeTool = createTool({
  id: 'edit-board-size',
  description: 'Change board dimensions and grid type.',
  inputSchema: z.object({
    rows: z.number().int().min(1).max(26).optional(),
    cols: z.number().int().min(1).max(26).optional(),
    gridType: z.enum(['square', 'hex']).optional(),
  }),
  outputSchema: z.object({ success: z.boolean(), rows: z.number(), cols: z.number(), gridType: z.string() }),
  execute: async ({ rows, cols, gridType }) => {
    let project = await loadProject()
    if (!project) project = { userId: 'agent', name: 'Untitled Project', isStarred: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), rows: rows ?? 8, cols: cols ?? 8, gridType: gridType ?? 'square', activeSquares: [], placedPieces: {}, customPieces: [] }
    if (rows !== undefined) project.rows = rows
    if (cols !== undefined) project.cols = cols
    if (gridType !== undefined) project.gridType = gridType
    await saveProject(project)
    return { success: true, rows: project.rows, cols: project.cols, gridType: project.gridType }
  },
})

const openaiProvider = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
})

const editorAgent = new Agent({
  id: 'editor-agent',
  name: 'Editor Agent',
  model: openaiProvider.chat('deepseek/deepseek-v4-flash'),
  instructions: `You are a creative chess variant designer. You use the tools available to design and build custom chess games.

CREATION PROCESS:
1. Use viewProject to check the current project state
2. Use editBoardSize to set board dimensions (rows/cols 1-26, square or hex grid)
3. Use editPiece to create or modify pieces
4. Use editSquare to configure individual squares
5. Use editProject to set the game name and description

PIECE MOVEMENT RULES:
Each piece has move rules with conditions (diffX, diffY, absDiffX, absDiffY, dist) and operators (===, >, <, >=, <=). Type 'run' = sliding, 'jump' = leaping. Standard presets: King, Queen, Rook, Bishop, Knight, Pawn.

PIECE BLOCKLY LOGIC:
Triggers: on-move, on-is-captured (by: Any/P/K/B/R/Q/K), on-captured, on-threat, on-environment (White Square/Black Square/Is Attacked), on-var (varName, op: ==/!=/>/</>=/<=, value)
Effects: kill (Selected Piece/Attacker), transformation (P/K/B/R/Q/K), explode (radius), prevent (Jump Back/Nearest Square/Share Square), modify-var (+=/-=/=), cooldown (duration), win, tell-user

SQUARE BLOCKLY LOGIC:
Triggers: on-step (pieceType, pieceColor), on-proximity (distance)
Effects: teleport (targetSquare), disable-square, enable-square, kill, win (Trigger Side/White/Black)

VARIABLES: Built-in x (column), y (row). Custom variables creatable and usable in conditions and modify-var.

BOARD: square or hex grid, rows/cols 1-26. Active squares toggle playable areas.

Be creative! Combine triggers, effects, movement rules, and variables.`,
  tools: {
    viewBoardStatus: viewBoardStatusTool,
    viewPiece: viewPieceTool,
    viewPieces: viewPiecesTool,
    viewSquares: viewSquaresTool,
    viewSquare: viewSquareTool,
    viewProject: viewProjectTool,
    editProject: editProjectTool,
    editSquare: editSquareTool,
    editPiece: editPieceTool,
    editBoardSize: editBoardSizeTool,
  },
})

export function createMastraRouter() {
  const router = Router()

  router.post('/mastra', async (req, res) => {
    try {
      const { messages } = req.body
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'messages array required' })
      }

      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
      if (!lastUserMsg) {
        return res.status(400).json({ error: 'No user message found' })
      }

      const response = await editorAgent.generate(lastUserMsg.content)

      res.json({ role: 'assistant', content: response.text })
    } catch (err) {
      console.error('Mastra agent error:', err)
      res.status(500).json({ error: err.message || 'Internal server error' })
    }
  })

  return router
}

export { editorAgent }
