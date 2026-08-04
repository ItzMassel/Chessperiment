import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { loadProject, saveProject } from './project-store'

export const editSquareTool = createTool({
  id: 'edit-square',
  description: 'Edit a square on the board. Can toggle disabled/enabled state or update its Blockly logic code.',
  inputSchema: z.object({
    position: z.string().describe('Square position, e.g. "e4" or "0,0" for hex grids.'),
    disabled: z.boolean().optional().describe('Set square disabled (true) or enabled (false).'),
    blocklyXml: z.string().optional().describe('Blockly XML code for the square logic.'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    position: z.string(),
    disabled: z.boolean().nullable(),
    hasBlocklyLogic: z.boolean(),
  }),
  execute: async ({ position, disabled, blocklyXml }) => {
    const project = await loadProject()
    if (!project) {
      return { success: false, position, disabled: null, hasBlocklyLogic: false }
    }

    if (disabled !== undefined) {
      if (disabled) {
        project.activeSquares = project.activeSquares.filter(s => s !== position)
      } else if (!project.activeSquares.includes(position)) {
        project.activeSquares.push(position)
      }
    }

    if (blocklyXml !== undefined) {
      if (!project.squareLogic) project.squareLogic = {}
      project.squareLogic[position] = {
        squareId: position,
        logic: [{ blocklyXml }],
        createdAt: project.squareLogic[position]?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }

    await saveProject(project)
    return {
      success: true,
      position,
      disabled: disabled ?? null,
      hasBlocklyLogic: !!(project.squareLogic && project.squareLogic[position]),
    }
  },
})
