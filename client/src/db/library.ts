import { eq, and, sql } from 'drizzle-orm';
import { db } from './index';
import { boards, pieceSets, customPieces } from './schema';
import type { SavedBoard, PieceSet, CustomPiece } from '@/types/firestore';

export type { SavedBoard, PieceSet, CustomPiece };

// ==================== BOARDS ====================

function parseCustomDate(val: any): Date {
  if (!val) return new Date();
  if (val instanceof Date) return val;
  if (val.toDate) return val.toDate();
  return new Date(val);
}

export async function saveBoard(board: SavedBoard): Promise<string> {
  const data = {
    userId: board.userId,
    name: board.name,
    description: board.description || '',
    isStarred: board.isStarred || false,
    projectId: board.projectId || null,
    forkedFrom: board.forkedFrom || null,
    topologyType: board.topologyType || null,
    topologyParams: board.topologyParams || null,
    rows: board.rows,
    cols: board.cols,
    gridType: board.gridType || 'square',
    activeSquares: board.activeSquares || [],
    placedPieces: board.placedPieces || {},
    squareStates: board.squareStates || null,
    version: board.version || null,
    updatedAt: new Date(),
  };

  if (board.id) {
    await db.update(boards)
      .set(data as any)
      .where(eq(boards.id, board.id));
    return board.id;
  } else {
    const [row] = await db.insert(boards)
      .values({ ...data, createdAt: new Date() } as any)
      .returning({ id: boards.id });
    return row.id;
  }
}

export async function getUserBoards(userId: string): Promise<SavedBoard[]> {
  const rows = await db.select()
    .from(boards)
    .where(eq(boards.userId, userId));
  return rows.map(r => r as unknown as SavedBoard);
}

export async function getBoard(boardId: string, userId: string): Promise<SavedBoard | null> {
  const [row] = await db.select()
    .from(boards)
    .where(and(eq(boards.id, boardId), eq(boards.userId, userId)))
    .limit(1);
  if (!row) return null;
  return row as unknown as SavedBoard;
}

export async function deleteBoard(boardId: string, userId: string): Promise<void> {
  await db.delete(boards)
    .where(and(eq(boards.id, boardId), eq(boards.userId, userId)));
}

export async function toggleBoardStar(boardId: string, userId: string): Promise<boolean> {
  const [row] = await db.select({ isStarred: boards.isStarred })
    .from(boards)
    .where(and(eq(boards.id, boardId), eq(boards.userId, userId)))
    .limit(1);
  if (!row) return false;
  const newVal = !row.isStarred;
  await db.update(boards)
    .set({ isStarred: newVal, updatedAt: new Date() } as any)
    .where(eq(boards.id, boardId));
  return newVal;
}

// ==================== CUSTOM PIECES ====================

export async function saveCustomPiece(piece: CustomPiece): Promise<string> {
  const data = {
    setId: piece.setId || null,
    projectId: piece.projectId || null,
    userId: piece.userId,
    name: piece.name,
    description: piece.description || '',
    pixelsWhite: Array.isArray(piece.pixelsWhite) ? piece.pixelsWhite : (typeof piece.pixelsWhite === 'string' ? JSON.parse(piece.pixelsWhite) : piece.pixelsWhite),
    pixelsBlack: Array.isArray(piece.pixelsBlack) ? piece.pixelsBlack : (typeof piece.pixelsBlack === 'string' ? JSON.parse(piece.pixelsBlack) : piece.pixelsBlack),
    imageWhite: piece.imageWhite || null,
    imageBlack: piece.imageBlack || null,
    moves: piece.moves || [],
    logic: typeof piece.logic !== 'string' ? piece.logic : JSON.parse(piece.logic),
    variables: piece.variables || null,
    shape: piece.shape || null,
    color: piece.color || null,
    pixels: piece.pixels || null,
    updatedAt: new Date(),
  };

  if (piece.id) {
    await db.update(customPieces)
      .set(data as any)
      .where(eq(customPieces.id, piece.id));
    return piece.id;
  } else {
    const [row] = await db.insert(customPieces)
      .values({ ...data, createdAt: new Date() } as any)
      .returning({ id: customPieces.id });
    return row.id;
  }
}

export async function getCustomPiece(pieceId: string, userId: string): Promise<CustomPiece | null> {
  const [row] = await db.select()
    .from(customPieces)
    .where(and(eq(customPieces.id, pieceId), eq(customPieces.userId, userId)))
    .limit(1);
  if (!row) return null;
  return row as unknown as CustomPiece;
}

export async function getUserCustomPieces(userId: string): Promise<CustomPiece[]> {
  const rows = await db.select()
    .from(customPieces)
    .where(eq(customPieces.userId, userId));
  return rows as unknown as CustomPiece[];
}

export async function deleteCustomPiece(pieceId: string, userId: string): Promise<void> {
  await db.delete(customPieces)
    .where(and(eq(customPieces.id, pieceId), eq(customPieces.userId, userId)));
}

// ==================== PIECE SETS ====================

export async function savePieceSet(set: PieceSet): Promise<string> {
  const data = {
    userId: set.userId,
    name: set.name,
    description: set.description || '',
    isStarred: set.isStarred || false,
    projectId: set.projectId || null,
    forkedFrom: set.forkedFrom || null,
    updatedAt: new Date(),
  };

  if (set.id) {
    await db.update(pieceSets)
      .set(data as any)
      .where(eq(pieceSets.id, set.id));
    return set.id;
  } else {
    const [row] = await db.insert(pieceSets)
      .values({ ...data, createdAt: new Date() } as any)
      .returning({ id: pieceSets.id });
    return row.id;
  }
}

export async function getUserPieceSets(userId: string): Promise<PieceSet[]> {
  const rows = await db.select()
    .from(pieceSets)
    .where(eq(pieceSets.userId, userId));
  return rows as unknown as PieceSet[];
}

export async function getPieceSet(setId: string, userId: string): Promise<PieceSet | null> {
  const [row] = await db.select()
    .from(pieceSets)
    .where(eq(pieceSets.id, setId))
    .limit(1);
  if (!row) return null;
  return row as unknown as PieceSet;
}

export async function getSetPieces(setId: string, userId: string): Promise<CustomPiece[]> {
  const rows = await db.select()
    .from(customPieces)
    .where(eq(customPieces.setId, setId));
  return rows as unknown as CustomPiece[];
}

export async function deletePieceSet(setId: string, userId: string): Promise<void> {
  await db.delete(pieceSets)
    .where(and(eq(pieceSets.id, setId), eq(pieceSets.userId, userId)));
}

export async function togglePieceSetStar(setId: string, userId: string): Promise<boolean> {
  const [row] = await db.select({ isStarred: pieceSets.isStarred })
    .from(pieceSets)
    .where(and(eq(pieceSets.id, setId), eq(pieceSets.userId, userId)))
    .limit(1);
  if (!row) return false;
  const newVal = !row.isStarred;
  await db.update(pieceSets)
    .set({ isStarred: newVal, updatedAt: new Date() } as any)
    .where(eq(pieceSets.id, setId));
  return newVal;
}
