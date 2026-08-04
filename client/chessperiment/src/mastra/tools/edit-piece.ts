import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { loadProject, saveProject } from './project-store'

export const editPieceTool = createTool({
  id: 'edit-piece',
  description: 'Edit a piece on the board. Can change starting position, design (pixels), rename, delete, or update movement rules and Blockly logic.',
  inputSchema: z.object({
    id: z.string().describe('Piece identifier.'),
    position: z.string().optional().describe('New starting position, e.g. "e2". Empty string to remove from board.'),
    name: z.string().optional().describe('New piece name.'),
    type: z.string().optional().describe('Piece type, e.g. "pawn", "knight", "custom_piece".'),
    color: z.enum(['white', 'black']).optional().describe('Piece color.'),
    movement: z.enum(['run', 'jump']).optional().describe('Movement type.'),
    pixelsWhite: z.array(z.array(z.string())).optional().describe('White piece pixel art grid.'),
    pixelsBlack: z.array(z.array(z.string())).optional().describe('Black piece pixel art grid.'),
    moves: z.array(z.any()).optional().describe('Move rule definitions.'),
    blocklyXml: z.string().optional().describe('Blockly XML code for piece logic.'),
    delete: z.boolean().optional().describe('Delete this piece entirely.'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    id: z.string(),
    deleted: z.boolean(),
    position: z.string().nullable(),
  }),
  execute: async (input) => {
    const project = await loadProject()
    if (!project) {
      return { success: false, id: input.id, deleted: false, position: null }
    }

    const placedEntry = project.placedPieces[input.id]
    const customIdx = project.customPieces.findIndex(p => p.id === input.id || p.name === input.id)

    if (input.delete) {
      delete project.placedPieces[input.id]
      if (customIdx !== -1) project.customPieces.splice(customIdx, 1)
      await saveProject(project)
      return { success: true, id: input.id, deleted: true, position: null }
    }

    const existingCustom = customIdx !== -1 ? project.customPieces[customIdx] : null

    if (input.position !== undefined) {
      if (input.position === '') {
        delete project.placedPieces[input.id]
      } else {
        project.placedPieces[input.id] = {
          ...(placedEntry ?? { type: 'pawn', color: 'white' }),
          type: input.type ?? placedEntry?.type ?? existingCustom?.name ?? 'pawn',
          color: input.color ?? placedEntry?.color ?? 'white',
          movement: input.movement ?? placedEntry?.movement,
        }
      }
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
        const newPiece = {
          id: input.id,
          setId: '',
          userId: project.userId,
          name: input.name ?? input.id,
          pixelsWhite: input.pixelsWhite ?? [],
          pixelsBlack: input.pixelsBlack ?? [],
          moves: input.moves ?? [],
          logic: input.blocklyXml ? { blocklyXml: input.blocklyXml } : undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        project.customPieces.push(newPiece)
      }
    }

    const finalPosition = project.placedPieces[input.id] ? (input.position ?? placedEntry ? Object.entries(project.placedPieces).find(([k]) => k === input.id)?.[0] : null) ?? null : null

    await saveProject(project)
    return {
      success: true,
      id: input.id,
      deleted: false,
      position: finalPosition as string | null,
    }
  },
})
