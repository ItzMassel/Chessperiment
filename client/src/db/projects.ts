import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from './index';
import { projects } from './schema';
import type { Project } from '@/types/Project';

function rowToProject(row: any): Project {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    description: row.description || '',
    isStarred: row.isStarred || false,
    forkedFrom: row.forkedFrom || undefined,
    createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updatedAt),
    rows: row.rows || 8,
    cols: row.cols || 8,
    gridType: row.gridType || 'square',
    activeSquares: row.activeSquares || [],
    placedPieces: row.placedPieces || {},
    customPieces: (row.customPieces || []).map((p: any) => ({
      ...p,
      pixelsWhite: p.pixelsWhite || Array.from({ length: 64 }, () => Array(64).fill('transparent')),
      pixelsBlack: p.pixelsBlack || Array.from({ length: 64 }, () => Array(64).fill('transparent')),
    })),
    squareLogic: row.squareLogic || {},
    history: row.history || [],
  };
}

export async function saveProject(project: Project): Promise<string> {
  const data = {
    userId: project.userId,
    name: project.name || 'Untitled Project',
    description: project.description || '',
    isStarred: project.isStarred || false,
    forkedFrom: project.forkedFrom || null,
    rows: project.rows || 8,
    cols: project.cols || 8,
    gridType: project.gridType || 'square',
    activeSquares: project.activeSquares || [],
    placedPieces: project.placedPieces || {},
    customPieces: (project.customPieces || []).map(p => ({
      ...p,
      pixelsWhite: Array.isArray(p.pixelsWhite) ? p.pixelsWhite : p.pixelsWhite,
      pixelsBlack: Array.isArray(p.pixelsBlack) ? p.pixelsBlack : p.pixelsBlack,
      logic: typeof p.logic !== 'string' ? p.logic : JSON.parse(p.logic),
    })),
    squareLogic: project.squareLogic || {},
    updatedAt: new Date(),
  };

  if (project.id) {
    await db.update(projects)
      .set(data as any)
      .where(eq(projects.id, project.id));
    return project.id;
  } else {
    const [row] = await db.insert(projects)
      .values({ ...data, createdAt: new Date() } as any)
      .returning({ id: projects.id });
    return row.id;
  }
}

export async function getUserProjects(userId: string): Promise<Project[]> {
  const rows = await db.select()
    .from(projects)
    .where(eq(projects.userId, userId));
  return rows.map(rowToProject).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export async function getProject(projectId: string, userId: string): Promise<Project | null> {
  const [row] = await db.select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);
  if (!row) return null;
  return rowToProject(row);
}

export async function deleteProject(projectId: string, userId: string): Promise<void> {
  const [row] = await db.select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);
  if (!row) throw new Error('Project not found or unauthorized');
  await db.delete(projects).where(eq(projects.id, projectId));
}

export async function toggleProjectStar(projectId: string, userId: string): Promise<boolean> {
  const [row] = await db.select({ isStarred: projects.isStarred })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);
  if (!row) throw new Error('Project not found or unauthorized');
  const newValue = !row.isStarred;
  await db.update(projects)
    .set({ isStarred: newValue, updatedAt: new Date() } as any)
    .where(eq(projects.id, projectId));
  return newValue;
}

export async function saveProjectBoard(
  projectId: string,
  userId: string,
  boardData: {
    rows: number;
    cols: number;
    gridType?: 'square' | 'hex';
    activeSquares: string[];
    placedPieces: Record<string, { type: string; color: string; movement?: 'run' | 'jump' }>;
  }
): Promise<void> {
  const [row] = await db.select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);
  if (!row) throw new Error('Project not found or unauthorized');

  const update: any = {
    rows: boardData.rows,
    cols: boardData.cols,
    activeSquares: boardData.activeSquares,
    placedPieces: boardData.placedPieces,
    updatedAt: new Date(),
  };
  if (boardData.gridType) update.gridType = boardData.gridType;

  await db.update(projects).set(update).where(eq(projects.id, projectId));
}

// Legacy migration stubs — no longer needed with Supabase
export async function hasUserMigrated(userId: string): Promise<boolean> {
  return true;
}

export async function migrateUserData(userId: string): Promise<void> {
}
