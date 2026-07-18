"use server";
import 'server-only';
import { auth } from "@/auth";
import { db } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notifications";

export interface CreatorProfile {
    userId: string;
    handle: string;
    displayName: string; // Defaults to session.user.name or handle
    bio?: string; // New: User bio
    photoUrl?: string; // New: Profile picture URL
    date_joined: Date;
    rating: number; // For marketplace reputation
    followers: string[]; // User IDs
    following: string[]; // User IDs
}

// Serialize Firestore Timestamp / Date / string to ISO string
function serializeDateJoined(dateJoined: any): string | null {
    if (!dateJoined) return null;
    if (typeof dateJoined.toDate === 'function') {
        return dateJoined.toDate().toISOString();
    }
    if (dateJoined instanceof Date) {
        return dateJoined.toISOString();
    }
    if (typeof dateJoined === 'string') {
        return dateJoined;
    }
    return null;
}

// Check if user has a profile
export async function getMyCreatorProfile() {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return null;

    try {
        if (!db) return null;
        const profileRef = db.collection('creators').doc(userId);
        const doc = await profileRef.get();
        if (doc.exists) {
            const data = doc.data() as CreatorProfile;
            return {
                ...data,
                date_joined: serializeDateJoined(data.date_joined),
            };
        }
        return null;
    } catch (error) {
        console.error("Error fetching creator profile:", error);
        return null;
    }
}

// Get public profile by handle
export async function getCreatorProfileByHandle(handle: string) {
    try {
        if (!db) return null;
        const snapshot = await db.collection('creators').where('handle', '==', handle).limit(1).get();
        if (snapshot.empty) return null;

        const data = snapshot.docs[0].data() as CreatorProfile;
        return {
            ...data,
            date_joined: serializeDateJoined(data.date_joined),
        };
    } catch (error) {
        console.error("Error fetching creator profile by handle:", error);
        return null;
    }
}

export async function getCreatorProfile(userId: string) {
    try {
        if (!db) return null;
        const doc = await db.collection('creators').doc(userId).get();
        if (doc.exists) {
            const data = doc.data() as CreatorProfile;
            return {
                ...data,
                date_joined: serializeDateJoined(data.date_joined),
            };
        }
        return null;
    } catch (error) {
        console.error("Error fetching creator profile:", error);
        return null;
    }
}

// Register a new creator handle
export async function registerCreatorHandle(handle: string) {
    const session = await auth();
    const userId = session?.user?.id;
    const userName = session?.user?.name;
    const userImage = session?.user?.image;

    if (!userId) {
        return { success: false, error: "Unauthorized" };
    }

    // Validate handle format (alphanumeric, 3-20 chars, optionally starting with @)
    const handleRegex = /^@?[a-zA-Z0-9_]{3,20}$/;
    if (!handleRegex.test(handle)) {
        return { success: false, error: "Handle must be 3-20 characters, alphanumeric or underscore." };
    }

    if (!db) {
        return { success: false, error: "Database connection failed" };
    }

    try {
        // Check uniqueness
        const snapshot = await db.collection('creators').where('handle', '==', handle).get();
        if (!snapshot.empty) {
            return { success: false, error: "Handle already taken." };
        }

        const newProfile: CreatorProfile = {
            userId,
            handle,
            displayName: userName || handle,
            photoUrl: userImage || "",
            date_joined: new Date(),
            rating: 0,
            followers: [],
            following: []
        };

        await db.collection('creators').doc(userId).set(newProfile);

        revalidatePath('/editor');
        return { success: true };

    } catch (error) {
        console.error("Error registering handle:", error);
        return { success: false, error: "Registration failed." };
    }
}

// Update profile (Bio, Photo, etc.)
export async function updateCreatorProfile(data: Partial<CreatorProfile>) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false, error: "Unauthorized" };
    if (!db) return { success: false, error: "Database error" };

    try {
         const updateData: Record<string, string> = {};
         if (data.displayName) updateData.displayName = data.displayName;
         if (data.bio !== undefined) updateData.bio = data.bio;
         if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl;

         await db.collection('creators').doc(userId).update(updateData);
         revalidatePath('/dashboard');
         revalidatePath(`/u/${data.handle}`);
         return { success: true };
    } catch (error) {
        console.error("Error updating profile:", error);
        return { success: false, error: "Update failed" };
    }
}

// ==================== FOLLOW SYSTEM ====================

export async function followCreator(targetUserId: string) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false, error: "Unauthorized" };
    if (!db) return { success: false, error: "Database error" };
    if (userId === targetUserId) return { success: false, error: "Cannot follow yourself" };

    try {
        const targetRef = db.collection('creators').doc(targetUserId);
        const currentRef = db.collection('creators').doc(userId);

        let targetHandle = '';
        await db.runTransaction(async (transaction) => {
            const targetDoc = await transaction.get(targetRef);
            const currentDoc = await transaction.get(currentRef);

            if (!targetDoc.exists) throw new Error("Creator not found");
            if (!currentDoc.exists) throw new Error("Your creator profile not found");

            const targetData = targetDoc.data()!;
            const currentData = currentDoc.data()!;

            targetHandle = targetData.handle || '';

            const followers = targetData.followers || [];
            const following = currentData.following || [];

            if (followers.includes(userId)) throw new Error("ALREADY_FOLLOWING");

            transaction.update(targetRef, {
                followers: [...followers, userId]
            });
            transaction.update(currentRef, {
                following: [...following, targetUserId]
            });
        });

        await createNotification(
            targetUserId,
            'new_follower',
            `${session?.user?.name || 'Someone'} started following you`,
            undefined,
            session?.user?.name || undefined,
            session?.user?.image || undefined
        );

        revalidatePath(`/u/${targetHandle}`);
        return { success: true };
    } catch (error) {
        if (error instanceof Error && error.message === "ALREADY_FOLLOWING") {
            return { success: false, error: "Already following this creator" };
        }
        console.error("Error following creator:", error);
        return { success: false, error: "Failed to follow creator" };
    }
}

export async function unfollowCreator(targetUserId: string) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false, error: "Unauthorized" };
    if (!db) return { success: false, error: "Database error" };

    try {
        const targetRef = db.collection('creators').doc(targetUserId);
        const currentRef = db.collection('creators').doc(userId);

        await db.runTransaction(async (transaction) => {
            const targetDoc = await transaction.get(targetRef);
            const currentDoc = await transaction.get(currentRef);

            if (!targetDoc.exists) throw new Error("Creator not found");
            if (!currentDoc.exists) throw new Error("Your creator profile not found");

            const targetData = targetDoc.data()!;
            const currentData = currentDoc.data()!;

            transaction.update(targetRef, {
                followers: (targetData.followers || []).filter((id: string) => id !== userId)
            });
            transaction.update(currentRef, {
                following: (currentData.following || []).filter((id: string) => id !== targetUserId)
            });
        });

        revalidatePath(`/u/${(await targetRef.get()).data()?.handle}`);
        return { success: true };
    } catch (error) {
        console.error("Error unfollowing creator:", error);
        return { success: false, error: "Failed to unfollow creator" };
    }
}

export async function isFollowing(targetUserId: string) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId || !db) return false;

    try {
        const doc = await db.collection('creators').doc(userId).get();
        if (!doc.exists) return false;
        const data = doc.data()!;
        return (data.following || []).includes(targetUserId);
    } catch (error) {
        console.error("Error checking follow status:", error);
        return false;
    }
}
