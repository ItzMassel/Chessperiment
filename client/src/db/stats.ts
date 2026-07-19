import { eq, desc, sql } from 'drizzle-orm';
import { db } from './index';
import { userStats, gameHistory } from './schema';
import type { GameResult, UserStats } from '@/types/firestore';

export async function saveGameResult(gameResult: GameResult): Promise<void> {
  const [existing] = await db.select()
    .from(userStats)
    .where(eq(userStats.userId, gameResult.userId))
    .limit(1);

  if (existing) {
    await db.update(userStats)
      .set({
        gamesPlayed: sql`${userStats.gamesPlayed} + 1`,
        wins: sql`${userStats.wins} + ${gameResult.result === 'win' ? 1 : 0}`,
        losses: sql`${userStats.losses} + ${gameResult.result === 'loss' ? 1 : 0}`,
        draws: sql`${userStats.draws} + ${gameResult.result === 'draw' ? 1 : 0}`,
      })
      .where(eq(userStats.userId, gameResult.userId));
  } else {
    await db.insert(userStats).values({
      userId: gameResult.userId,
      gamesPlayed: 1,
      wins: gameResult.result === 'win' ? 1 : 0,
      losses: gameResult.result === 'loss' ? 1 : 0,
      draws: gameResult.result === 'draw' ? 1 : 0,
      rating: 1500,
    });
  }

  await db.insert(gameHistory).values({
    userId: gameResult.userId,
    result: gameResult.result,
    opponent: gameResult.opponent || null,
    timestamp: gameResult.timestamp || new Date(),
    roomId: gameResult.roomId || null,
  });
}

export async function getUserStats(userId: string): Promise<UserStats | null> {
  const [row] = await db.select()
    .from(userStats)
    .where(eq(userStats.userId, userId))
    .limit(1);
  if (!row) return null;
  return row as unknown as UserStats;
}

export async function getUserGameHistory(userId: string, limitNum: number = 10): Promise<GameResult[]> {
  const rows = await db.select()
    .from(gameHistory)
    .where(eq(gameHistory.userId, userId))
    .orderBy(desc(gameHistory.timestamp))
    .limit(limitNum);
  return rows.map(row => ({
    id: row.id,
    userId: row.userId,
    result: row.result as 'win' | 'loss' | 'draw',
    opponent: row.opponent || undefined,
    timestamp: row.timestamp instanceof Date ? row.timestamp : new Date(row.timestamp),
    roomId: row.roomId || undefined,
  }));
}

export async function deleteUserAccount(userId: string): Promise<void> {
  await db.delete(userStats).where(eq(userStats.userId, userId));
  await db.delete(gameHistory).where(eq(gameHistory.userId, userId));
}

export async function updateUserName(userId: string, newName: string): Promise<void> {
}
