import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { loadProject } from './project-store'

export const viewProjectTool = createTool({
  id: 'view-project',
  description: 'View project details like name, description, board dimensions, and grid type.',
  inputSchema: z.object({}),
  outputSchema: z.object({
    found: z.boolean(),
    project: z.object({
      name: z.string(),
      description: z.string().nullable(),
      rows: z.number(),
      cols: z.number(),
      gridType: z.string(),
      activeSquares: z.array(z.string()),
      pieceCount: z.number(),
      customPieceCount: z.number(),
      squareLogicCount: z.number(),
      createdAt: z.string(),
      updatedAt: z.string(),
    }).nullable(),
  }),
  execute: async () => {
    const project = await loadProject()
    if (!project) {
      return { found: false, project: null }
    }
    return {
      found: true,
      project: {
        name: project.name,
        description: project.description ?? null,
        rows: project.rows,
        cols: project.cols,
        gridType: project.gridType,
        activeSquares: project.activeSquares,
        pieceCount: Object.keys(project.placedPieces).length,
        customPieceCount: project.customPieces.length,
        squareLogicCount: project.squareLogic ? Object.keys(project.squareLogic).length : 0,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    }
  },
})
