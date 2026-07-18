"use server";
import 'server-only';
import { auth } from "@/auth";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

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
    if (!db) return;
    try {
        const notification: Omit<AppNotification, 'id'> = {
            userId,
            type,
            message,
            link,
            read: false,
            createdAt: new Date(),
            actorHandle,
            actorPhotoUrl,
        };
        await db.collection('notifications').add(notification);
    } catch (error) {
        console.error("Error creating notification:", error);
    }
}

export async function getNotifications(userId: string, limit = 20): Promise<AppNotification[]> {
    if (!db) return [];
    try {
        const snapshot = await db.collection('notifications')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
        })) as AppNotification[];
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return [];
    }
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
    if (!db) return 0;
    try {
        const snapshot = await db.collection('notifications')
            .where('userId', '==', userId)
            .where('read', '==', false)
            .count()
            .get();
        return snapshot.data()?.count || 0;
    } catch (error) {
        console.error("Error counting notifications:", error);
        return 0;
    }
}

export async function markNotificationRead(notificationId: string) {
    if (!db) return;
    try {
        await db.collection('notifications').doc(notificationId).update({ read: true });
    } catch (error) {
        console.error("Error marking notification read:", error);
    }
}

export async function markAllNotificationsRead(userId: string) {
    if (!db) return;
    try {
        const snapshot = await db.collection('notifications')
            .where('userId', '==', userId)
            .where('read', '==', false)
            .get();
        const batch = db.batch();
        snapshot.docs.forEach(doc => batch.update(doc.ref, { read: true }));
        await batch.commit();
    } catch (error) {
        console.error("Error marking all notifications read:", error);
    }
}
