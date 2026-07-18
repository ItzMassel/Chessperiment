"use server";
import 'server-only';
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notifications";
import {
  getCreatorProfile as getProfile,
  getCreatorProfileByHandle as getProfileByHandle,
  registerCreatorHandle as registerHandle,
  updateCreatorProfile as updateProfile,
  followCreator as doFollow,
  unfollowCreator as doUnfollow,
  isFollowing as checkFollowing,
} from "@/db";

export interface CreatorProfile {
    userId: string;
    handle: string;
    displayName: string;
    bio?: string;
    photoUrl?: string;
    date_joined: Date;
    rating: number;
    followers: string[];
    following: string[];
}

export async function getMyCreatorProfile() {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return null;

    try {
        const profile = await getProfile(userId);
        return profile;
    } catch (error) {
        console.error("Error fetching creator profile:", error);
        return null;
    }
}

export async function getCreatorProfileByHandle(handle: string) {
    try {
        return await getProfileByHandle(handle);
    } catch (error) {
        console.error("Error fetching creator profile by handle:", error);
        return null;
    }
}

export async function getCreatorProfile(userId: string) {
    try {
        return await getProfile(userId);
    } catch (error) {
        console.error("Error fetching creator profile:", error);
        return null;
    }
}

export async function registerCreatorHandle(handle: string) {
    const session = await auth();
    const userId = session?.user?.id;
    const userName = session?.user?.name;
    const userImage = session?.user?.image;

    if (!userId) {
        return { success: false, error: "Unauthorized" };
    }

    const handleRegex = /^@?[a-zA-Z0-9_]{3,20}$/;
    if (!handleRegex.test(handle)) {
        return { success: false, error: "Handle must be 3-20 characters, alphanumeric or underscore." };
    }

    try {
        await registerHandle(userId, handle, userName || handle, userImage || undefined);
        revalidatePath('/editor');
        return { success: true };
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Registration failed.";
        if (msg.includes("already taken")) {
            return { success: false, error: "Handle already taken." };
        }
        console.error("Error registering handle:", error);
        return { success: false, error: "Registration failed." };
    }
}

export async function updateCreatorProfile(data: Partial<CreatorProfile>) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false, error: "Unauthorized" };

    try {
        await updateProfile(userId, data);
        revalidatePath('/dashboard');
        if (data.handle) revalidatePath(`/u/${data.handle}`);
        return { success: true };
    } catch (error) {
        console.error("Error updating profile:", error);
        return { success: false, error: "Update failed" };
    }
}

export async function followCreator(targetUserId: string) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false, error: "Unauthorized" };
    if (userId === targetUserId) return { success: false, error: "Cannot follow yourself" };

    try {
        await doFollow(userId, targetUserId);

        await createNotification(
            targetUserId,
            'new_follower',
            `${session?.user?.name || 'Someone'} started following you`,
            undefined,
            session?.user?.name || undefined,
            session?.user?.image || undefined
        );

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

    try {
        await doUnfollow(userId, targetUserId);
        return { success: true };
    } catch (error) {
        console.error("Error unfollowing creator:", error);
        return { success: false, error: "Failed to unfollow creator" };
    }
}

export async function isFollowing(targetUserId: string) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return false;

    try {
        return await checkFollowing(userId, targetUserId);
    } catch (error) {
        console.error("Error checking follow status:", error);
        return false;
    }
}
