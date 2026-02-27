'use server';

import { auth } from "@/auth";
import { db } from "@/lib/firebase";
import { revalidatePath } from "next/cache";

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

// Check if user has a profile
export async function getMyCreatorProfile() {
    const session = await auth();
    if (!session?.user?.id) return null;

    try {
        if (!db) return null;
        const profileRef = db.collection('creators').doc(session.user.id);
        const doc = await profileRef.get();
        if (doc.exists) {
            const data = doc.data() as CreatorProfile;
            // Serializing Date object
            return {
                ...data,
                date_joined: data.date_joined ? data.date_joined.toISOString() : null
            };
        }
        return null;
    } catch (error) {
        console.error("Error fetching my creator profile:", error);
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
            date_joined: data.date_joined ? data.date_joined.toISOString() : null
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
                date_joined: data.date_joined ? data.date_joined.toISOString() : null
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
    const userImage = session?.user?.image; // Basic auth image

    if (!userId) {
        return { success: false, error: "Unauthorized" };
    }

    // Validate handle format (alphanumeric, 3-20 chars)
    // Validate handle format (alphanumeric, 3-20 chars, optionally starting with @)
    // We expect the handle to start with @ as per client logic, but let's be flexible
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
        
        revalidatePath('/dashboard');
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
         // Sanitize update data - only allow specific fields
         const updateData: any = {};
         if (data.displayName) updateData.displayName = data.displayName;
         if (data.bio !== undefined) updateData.bio = data.bio;
         if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl;

         await db.collection('creators').doc(userId).update(updateData);
         revalidatePath('/dashboard');
         revalidatePath(`/u/${data.handle}`); // If we had handle
         return { success: true };
    } catch (error) {
        console.error("Error updating profile:", error);
        return { success: false, error: "Update failed" };
    }
}
