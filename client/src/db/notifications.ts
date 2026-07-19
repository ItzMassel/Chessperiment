import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from './index';
import { notifications } from './schema';
import type { AppNotification } from '@/app/actions/notifications';

function rowToNotification(row: any): AppNotification {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type,
    message: row.message,
    link: row.link || undefined,
    read: row.read,
    createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
    actorHandle: row.actorHandle || undefined,
    actorPhotoUrl: row.actorPhotoUrl || undefined,
  };
}

export async function createNotification(
  userId: string,
  type: AppNotification['type'],
  message: string,
  link?: string,
  actorHandle?: string,
  actorPhotoUrl?: string,
): Promise<void> {
  await db.insert(notifications).values({
    userId,
    type,
    message,
    link: link || null,
    read: false,
    createdAt: new Date(),
    actorHandle: actorHandle || null,
    actorPhotoUrl: actorPhotoUrl || null,
  });
}

export async function getNotifications(userId: string, limitNum: number = 20): Promise<AppNotification[]> {
  const rows = await db.select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limitNum);
  return rows.map(rowToNotification);
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const [row] = await db.select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
  return row?.count || 0;
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await db.update(notifications)
    .set({ read: true })
    .where(eq(notifications.id, notificationId));
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await db.update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
}
