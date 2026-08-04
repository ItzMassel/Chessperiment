import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const PROJECT_PATH = join(process.cwd(), 'workspace', 'project.json')

export interface ProjectData {
  id?: string
  userId: string
  name: string
  description?: string
  isStarred: boolean
  createdAt: string
  updatedAt: string
  rows: number
  cols: number
  gridType: 'square' | 'hex'
  activeSquares: string[]
  placedPieces: Record<string, { type: string; color: string; movement?: 'run' | 'jump' }>
  customPieces: Array<{
    id?: string
    name: string
    description?: string
    pixelsWhite: string[][]
    pixelsBlack: string[][]
    moves: any[]
    logic?: any
    variables?: { id: string; name: string }[]
    shape?: { anchor: [number, number]; extensions: [number, number][] }
    createdAt: string
    updatedAt: string
  }>
  squareLogic?: Record<string, {
    squareId: string
    logic: any[]
    variables?: { id: string; name: string; value: any }[]
    createdAt: string
    updatedAt: string
  }>
  history?: string[]
}

export async function loadProject(): Promise<ProjectData | null> {
  try {
    const raw = await readFile(PROJECT_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export async function saveProject(data: ProjectData): Promise<void> {
  data.updatedAt = new Date().toISOString()
  await writeFile(PROJECT_PATH, JSON.stringify(data, null, 2), 'utf-8')
}
