import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { loadProject, saveProject } from './project-store'

export const editBoardSizeTool = createTool({
  id: 'edit-board-size',
  description: 'Change the board dimensions (rows and columns). Optionally change grid type between square and hex.',
  inputSchema: z.object({
    rows: z.number().int().min(1).max(26).optional().describe('Number of rows.'),
    cols: z.number().int().min(1).max(26).optional().describe('Number of columns.'),
    gridType: z.enum(['square', 'hex']).optional().describe('Grid type.'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    rows: z.number(),
    cols: z.number(),
    gridType: z.string(),
  }),
  execute: async ({ rows, cols, gridType }) => {
    let project = await loadProject()
    if (!project) {
      project = {
        userId: 'agent',
        name: 'Untitled Project',
        isStarred: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        rows: rows ?? 8,
        cols: cols ?? 8,
        gridType: gridType ?? 'square',
        activeSquares: [],
        placedPieces: {},
        customPieces: [],
      }
    }
    if (rows !== undefined) project.rows = rows
    if (cols !== undefined) project.cols = cols
    if (gridType !== undefined) project.gridType = gridType
    await saveProject(project)
    return { success: true, rows: project.rows, cols: project.cols, gridType: project.gridType }
  },
})
