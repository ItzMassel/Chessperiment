import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { loadProject, saveProject } from './project-store'

export const editProjectTool = createTool({
  id: 'edit-project',
  description: 'Edit project name and/or description.',
  inputSchema: z.object({
    name: z.string().optional().describe('New project name.'),
    description: z.string().optional().describe('New project description.'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    name: z.string(),
    description: z.string().nullable(),
  }),
  execute: async ({ name, description }) => {
    let project = await loadProject()
    if (!project) {
      project = {
        userId: 'agent',
        name: name ?? 'Untitled Project',
        description: description ?? '',
        isStarred: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        rows: 8,
        cols: 8,
        gridType: 'square',
        activeSquares: [],
        placedPieces: {},
        customPieces: [],
      }
    }
    if (name !== undefined) project.name = name
    if (description !== undefined) project.description = description
    await saveProject(project)
    return { success: true, name: project.name, description: project.description ?? null }
  },
})
