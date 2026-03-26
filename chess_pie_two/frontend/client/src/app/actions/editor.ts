"use server";
import 'server-only';

import { auth } from "@/auth";
import { 
    migrateUserData, 
    hasUserMigrated, 
    getUserProjects, 
    deleteProject, 
    toggleProjectStar,
    getProject,
    saveProject,
    saveProjectBoard 
} from "@/lib/firestore";
import { revalidatePath } from "next/cache";
import { Project } from "@/types/Project";

import { adminAuth } from "@/lib/firebase-admin";

/**
 * Server action to trigger lazy data migration for the authenticated user.
 * This runs on the server using the Firebase Admin SDK.
 * Accepts an optional idToken to bypass NextAuth session check if needed.
 */
export async function migrateUserAction(idToken?: string) {
    let userId: string | undefined;

    // Try to verify via ID token first if provided (more reliable for client-side calls)
    if (idToken && adminAuth) {
        try {
            const decodedToken = await adminAuth.verifyIdToken(idToken);
            userId = decodedToken.uid;
        } catch (error) {
            console.error("Invalid ID token provided to migrateUserAction:", error);
        }
    }

    // Fallback to NextAuth session
    if (!userId) {
        const session = await auth();
        userId = session?.user?.id;
    }
    
    if (!userId) {
        throw new Error("Unauthorized: No user session found during migration");
    }

    try {
        console.log(`Checking migration doc for user: ${userId}`);
        const alreadyMigrated = await hasUserMigrated(userId);
        console.log(`Already migrated: ${alreadyMigrated}`);
        
        if (!alreadyMigrated) {
            console.log(`Starting migration for user: ${userId}`);
            await migrateUserData(userId);
            console.log(`Migration completed for user: ${userId}`);
            revalidatePath("/editor");
        }
        return { success: true };
    } catch (error) {
        console.error("Migration error:", error);
        return { success: false, error: "Failed to migrate user data" };
    }
}

/**
 * Server action to fetch all projects for the authenticated user.
 */
export async function getUserProjectsAction() {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false, error: "Unauthorized" };

    try {
        const projects = await getUserProjects(userId);
        return { success: true, data: projects };
    } catch (error) {
        console.error("Error fetching projects:", error);
        return { success: false, error: "Failed to fetch projects" };
    }
}

/**
 * Server action to delete a project.
 */
export async function deleteProjectAction(projectId: string) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false, error: "Unauthorized" };

    try {
        await deleteProject(projectId, userId);
        revalidatePath("/editor");
        return { success: true };
    } catch (error) {
        console.error("Error deleting project:", error);
        return { success: false, error: "Failed to delete project" };
    }
}

/**
 * Server action to toggle project star status.
 */
export async function toggleProjectStarAction(projectId: string) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false, error: "Unauthorized" };

    try {
        const newState = await toggleProjectStar(projectId, userId);
        revalidatePath("/editor");
        return { success: true, isStarred: newState };
    } catch (error) {
        console.error("Error toggling project star:", error);
        return { success: false, error: "Failed to update project" };
    }
}

/**
 * Server action to fetch a single project.
 */
export async function getProjectAction(projectId: string) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false, error: "Unauthorized" };

    try {
        const project = await getProject(projectId, userId);
        if (!project) return { success: false, error: "Project not found" };
        return { success: true, data: project };
    } catch (error) {
        console.error("Error fetching project:", error);
        return { success: false, error: "Failed to fetch project" };
    }
}

/**
 * Server action to save or update a project.
 */
export async function saveProjectAction(project: Project) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false, error: "Unauthorized" };

    try {
        // Ensure userId matches session
        const projectToSave = { ...project, userId, customPieces: project.customPieces || [] };
        const projectId = await saveProject(projectToSave);
        revalidatePath(`/editor/${projectId}`);
        revalidatePath("/editor");
        return { success: true, projectId };
    } catch (error) {
        console.error("Error saving project:", error);
        return { success: false, error: "Failed to save project" };
    }
}

/**
 * Server action to save only the board-related data of a project.
 * This is optimized for the auto-save in the board editor.
 */
export async function saveProjectBoardAction(projectId: string, boardData: {
    rows: number,
    cols: number,
    gridType?: 'square' | 'hex',
    activeSquares: string[],
    placedPieces: Record<string, { type: string; color: string; movement?: 'run' | 'jump' }>
}) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false, error: "Unauthorized" };

    try {
        await saveProjectBoard(projectId, userId, boardData);
        revalidatePath(`/editor/${projectId}`);
        // We don't necessarily need to revalidate /editor for board-only changes 
        // unless they affect the preview, but let's keep it for now.
        return { success: true };
    } catch (error) {
        console.error("Error saving board data:", error);
        return { success: false, error: "Failed to save board" };
    }
}
