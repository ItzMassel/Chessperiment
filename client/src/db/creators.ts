import { eq, and, sql } from 'drizzle-orm';
import { db } from './index';
import { creatorProfiles } from './schema';
import type { CreatorProfile } from '@/app/actions/creator';

function rowToProfile(row: any): CreatorProfile {
  return {
    userId: row.userId,
    handle: row.handle,
    displayName: row.displayName,
    bio: row.bio || undefined,
    photoUrl: row.photoUrl || undefined,
    date_joined: row.dateJoined instanceof Date ? row.dateJoined : new Date(row.dateJoined),
    rating: row.rating || 0,
    followers: row.followers || [],
    following: row.following || [],
  };
}

export async function getCreatorProfile(userId: string): Promise<CreatorProfile | null> {
  const [row] = await db.select()
    .from(creatorProfiles)
    .where(eq(creatorProfiles.userId, userId))
    .limit(1);
  if (!row) return null;
  return rowToProfile(row);
}

export async function getCreatorProfileByHandle(handle: string): Promise<CreatorProfile | null> {
  const [row] = await db.select()
    .from(creatorProfiles)
    .where(eq(creatorProfiles.handle, handle))
    .limit(1);
  if (!row) return null;
  return rowToProfile(row);
}

export async function registerCreatorHandle(userId: string, handle: string, displayName: string, photoUrl?: string): Promise<void> {
  const existing = await db.select({ handle: creatorProfiles.handle })
    .from(creatorProfiles)
    .where(eq(creatorProfiles.handle, handle))
    .limit(1);

  if (existing.length > 0) {
    throw new Error('Handle already taken.');
  }

  await db.insert(creatorProfiles).values({
    userId,
    handle,
    displayName: displayName || handle,
    photoUrl: photoUrl || '',
    dateJoined: new Date(),
    rating: 0,
    followers: [],
    following: [],
  });
}

export async function updateCreatorProfile(userId: string, data: Partial<CreatorProfile>): Promise<void> {
  const updateData: any = {};
  if (data.displayName) updateData.displayName = data.displayName;
  if (data.bio !== undefined) updateData.bio = data.bio;
  if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl;

  await db.update(creatorProfiles)
    .set(updateData)
    .where(eq(creatorProfiles.userId, userId));
}

export async function followCreator(userId: string, targetUserId: string): Promise<void> {
  const [target] = await db.select({ followers: creatorProfiles.followers })
    .from(creatorProfiles)
    .where(eq(creatorProfiles.userId, targetUserId))
    .limit(1);
  if (!target) throw new Error('Creator not found');
  if ((target.followers as string[] || []).includes(userId)) throw new Error('ALREADY_FOLLOWING');

  await db.update(creatorProfiles)
    .set({
      followers: sql`${creatorProfiles.followers} || ${JSON.stringify([userId])}::jsonb`,
    })
    .where(eq(creatorProfiles.userId, targetUserId));

  await db.update(creatorProfiles)
    .set({
      following: sql`${creatorProfiles.following} || ${JSON.stringify([targetUserId])}::jsonb`,
    })
    .where(eq(creatorProfiles.userId, userId));
}

export async function unfollowCreator(userId: string, targetUserId: string): Promise<void> {
  await db.update(creatorProfiles)
    .set({
      followers: sql`${creatorProfiles.followers} - ${userId}`,
    })
    .where(eq(creatorProfiles.userId, targetUserId));

  await db.update(creatorProfiles)
    .set({
      following: sql`${creatorProfiles.following} - ${targetUserId}`,
    })
    .where(eq(creatorProfiles.userId, userId));
}

export async function isFollowing(userId: string, targetUserId: string): Promise<boolean> {
  const [row] = await db.select({ following: creatorProfiles.following })
    .from(creatorProfiles)
    .where(eq(creatorProfiles.userId, userId))
    .limit(1);
  if (!row) return false;
  return (row.following as string[] || []).includes(targetUserId);
}
