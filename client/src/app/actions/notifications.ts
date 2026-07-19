"use server";
import 'server-only';
import { auth } from "@/auth";
import { createNotification as createNotif, getNotifications as getNotifs, getUnreadNotificationCount as getUnreadCount, markNotificationRead as markRead, markAllNotificationsRead as markAllRead } from "@/db";

export interface AppNotification {
    id?: string;
    userId: string;
    type: 'new_review' | 'item_forked' | 'new_publish' | 'new_follower';
    message: string;
    link?: string;
    read: boolean;
    createdAt: Date;
    actorHandle?: string;
    actorPhotoUrl?: string;
}

export async function createNotification(
    userId: string,
    type: AppNotification['type'],
    message: string,
    link?: string,
    actorHandle?: string,
    actorPhotoUrl?: string
) {
    try {
        await createNotif(userId, type as any, message, link, actorHandle, actorPhotoUrl);
    } catch (error) {
        console.error("Error creating notification:", error);
    }
}

export async function getNotifications(userId: string, limit = 20): Promise<AppNotification[]> {
    try {
        return await getNotifs(userId, limit);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return [];
    }
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
    try {
        return await getUnreadCount(userId);
    } catch (error) {
        console.error("Error counting notifications:", error);
        return 0;
    }
}

export async function markNotificationRead(notificationId: string) {
    try {
        await markRead(notificationId);
    } catch (error) {
        console.error("Error marking notification read:", error);
    }
}

export async function markAllNotificationsRead(userId: string) {
    try {
        await markAllRead(userId);
    } catch (error) {
        console.error("Error marking all notifications read:", error);
    }
}
