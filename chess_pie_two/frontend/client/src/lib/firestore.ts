import { db } from "@/lib/firebase";
import { GameResult, UserStats, SavedBoard, PieceSet, CustomPiece } from "@/types/firestore";
import { Project } from "@/types/Project";

export type { GameResult, UserStats, SavedBoard, PieceSet, CustomPiece };


export async function saveGameResult(gameResult: GameResult) {
    if (!db) throw new Error("Firestore not initialized")

    const userStatsRef = db.collection("userStats").doc(gameResult.userId)
    const gameHistoryRef = db.collection("gameHistory")

    // Save game to history
    await gameHistoryRef.add({
        ...gameResult,
        timestamp: gameResult.timestamp,
    })

    // Update user stats
    const userStatsDoc = await userStatsRef.get()

    if (userStatsDoc.exists) {
        const currentStats = userStatsDoc.data() as UserStats
        const updates: Partial<UserStats> = {
            gamesPlayed: currentStats.gamesPlayed + 1,
            wins: currentStats.wins + (gameResult.result === "win" ? 1 : 0),
            losses: currentStats.losses + (gameResult.result === "loss" ? 1 : 0),
            draws: currentStats.draws + (gameResult.result === "draw" ? 1 : 0),
        }

        await userStatsRef.update(updates)
    } else {
        // Create new stats document
        const newStats: UserStats = {
            userId: gameResult.userId,
            gamesPlayed: 1,
            wins: gameResult.result === "win" ? 1 : 0,
            losses: gameResult.result === "loss" ? 1 : 0,
            draws: gameResult.result === "draw" ? 1 : 0,
            rating: 1500, // Default starting rating
        }

        await userStatsRef.set(newStats)
    }
}

export async function getUserStats(userId: string): Promise<UserStats | null> {
    if (!db) throw new Error("Firestore not initialized")

    const userStatsRef = db.collection("userStats").doc(userId)
    const doc = await userStatsRef.get()

    if (!doc.exists) {
        return null
    }

    return doc.data() as UserStats
}

export async function getUserGameHistory(userId: string, limit: number = 10) {
    if (!db) throw new Error("Firestore not initialized")

    try {
        const snapshot = await db
            .collection("gameHistory")
            .where("userId", "==", userId)
            .orderBy("timestamp", "desc")
            .limit(limit)
            .get();

        return snapshot.docs.map((doc) => {
            const data = doc.data()
            return {
                id: doc.id,
                ...data,
                timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : data.timestamp,
            }
        }) as GameResult[];
    } catch (error: any) {
        // Fallback for missing index: fetch recent docs (without order) and sort in memory
        // Note: This might not get the absolute latest if there are many docs, but it's better than crashing
        console.warn("Firestore index missing, falling back to client-side sort:", error.message);
        
        try {
            const snapshot = await db
                .collection("gameHistory")
                .where("userId", "==", userId)
                .limit(50) // Fetch a bit more to increase chance of getting latest
                .get();

            const results = snapshot.docs.map((doc) => {
                const data = doc.data()
                return {
                    id: doc.id,
                    ...data,
                    timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : data.timestamp,
                }
            }) as GameResult[];

            return results.sort((a, b) => {
                const tA = a.timestamp instanceof Date ? a.timestamp.getTime() : 0;
                const tB = b.timestamp instanceof Date ? b.timestamp.getTime() : 0;
                return tB - tA;
            }).slice(0, limit);
        } catch (innerError) {
            console.error("Failed to fetch game history:", innerError);
            return [];
        }
    }
}



export async function deleteUserAccount(userId: string) {
    if (!db) throw new Error("Firestore not initialized");

    const batch = db.batch();

    // 1. Delete user document
    batch.delete(db.collection("users").doc(userId));

    // 2. Delete accounts associated with user
    const accounts = await db.collection("accounts").where("userId", "==", userId).get();
    accounts.forEach(doc => batch.delete(doc.ref));

    // 3. Delete sessions associated with user
    const sessions = await db.collection("sessions").where("userId", "==", userId).get();
    sessions.forEach(doc => batch.delete(doc.ref));

    // 4. Delete user stats
    batch.delete(db.collection("userStats").doc(userId));

    // 5. Delete game history
    const history = await db.collection("gameHistory").where("userId", "==", userId).get();
    history.forEach(doc => batch.delete(doc.ref));

    // 6. Delete projects
    const projects = await db.collection("projects").where("userId", "==", userId).get();
    projects.forEach(doc => batch.delete(doc.ref));

    // 7. Delete legacy content (optional but good practice)
    const boards = await db.collection("boards").where("userId", "==", userId).get();
    boards.forEach(doc => batch.delete(doc.ref));

    const sets = await db.collection("pieceSets").where("userId", "==", userId).get();
    sets.forEach(doc => batch.delete(doc.ref));

    const pieces = await db.collection("customPieces").where("userId", "==", userId).get();
    pieces.forEach(doc => batch.delete(doc.ref));

    await batch.commit();
}

export async function updateUserName(userId: string, newName: string) {
    if (!db) throw new Error("Firestore not initialized");
    await db.collection("users").doc(userId).update({ name: newName });
}

// ==================== PROJECT FUNCTIONS ====================

// Project functions are handled below using the imported Project type from @/types/Project

export async function saveProject(project: Project) {
    if (!db) throw new Error("Firestore not initialized");
    const projectsRef = db.collection("projects");

    // Helper to recursively remove undefined values which Firestore rejects
    const removeUndefinedValues = (obj: any): any => {
        if (obj instanceof Date) return obj;
        if (Array.isArray(obj)) return obj.map(removeUndefinedValues);
        if (obj !== null && typeof obj === 'object') {
            const newObj: any = {};
            for (const key in obj) {
                if (obj[key] !== undefined) {
                    newObj[key] = removeUndefinedValues(obj[key]);
                }
            }
            return newObj;
        }
        return obj;
    };

    // Serialize custom pieces
    const customPieces = (project.customPieces || []).map(piece => ({
        ...piece,
        pixelsWhite: Array.isArray(piece.pixelsWhite) ? JSON.stringify(piece.pixelsWhite) : (piece.pixelsWhite || "[]"),
        pixelsBlack: Array.isArray(piece.pixelsBlack) ? JSON.stringify(piece.pixelsBlack) : (piece.pixelsBlack || "[]"),
        logic: (piece.logic !== undefined && typeof piece.logic !== 'string') ? JSON.stringify(piece.logic) : piece.logic
    }));

    // Serialize square logic
    const squareLogic: Record<string, any> = {};
    if (project.squareLogic) {
        for (const [key, val] of Object.entries(project.squareLogic)) {
            squareLogic[key] = {
                ...val,
                logic: (val.logic !== undefined && typeof val.logic !== 'string') ? JSON.stringify(val.logic) : val.logic
            };
        }
    }

    // Build base update object with explicit fields
    let data: any = {
        userId: project.userId,
        name: project.name || "Untitled Project",
        description: project.description || "",
        isStarred: !!project.isStarred,
        rows: project.rows || 8,
        cols: project.cols || 8,
        gridType: project.gridType || 'square',
        activeSquares: project.activeSquares || [],
        placedPieces: project.placedPieces || {},
        customPieces: customPieces,
        squareLogic: squareLogic,
        updatedAt: new Date()
    };

    // Clean undefined values from the entire data object
    data = removeUndefinedValues(data);

    if (project.id) {
        await projectsRef.doc(project.id).update(data);
        return project.id;
    } else {
        data.createdAt = new Date();
        const docRef = await projectsRef.add(data);
        return docRef.id;
    }
}

export async function getUserProjects(userId: string): Promise<Project[]> {
    if (!db) throw new Error("Firestore not initialized");
    const snapshot = await db.collection("projects")
        .where("userId", "==", userId)
        .get();

    const projects = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            customPieces: (data.customPieces || []).map((piece: any) => ({
                ...piece,
                pixelsWhite: typeof piece.pixelsWhite === 'string' ? JSON.parse(piece.pixelsWhite) : piece.pixelsWhite,
                pixelsBlack: typeof piece.pixelsBlack === 'string' ? JSON.parse(piece.pixelsBlack) : piece.pixelsBlack,
                logic: typeof piece.logic === 'string' ? JSON.parse(piece.logic) : piece.logic,
            })),
            squareLogic: data.squareLogic ? Object.fromEntries(
                Object.entries(data.squareLogic).map(([k, v]: [string, any]) => [
                    k,
                    {
                        ...v,
                        logic: typeof v.logic === 'string' ? JSON.parse(v.logic) : v.logic,
                        createdAt: v.createdAt?.toDate ? v.createdAt.toDate() : v.createdAt,
                        updatedAt: v.updatedAt?.toDate ? v.updatedAt.toDate() : v.updatedAt
                    }
                ])
            ) : {},
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        } as Project;
    });

    return projects.sort((a, b) => {
        const dateA = a.updatedAt instanceof Date ? a.updatedAt.getTime() : 0;
        const dateB = b.updatedAt instanceof Date ? b.updatedAt.getTime() : 0;
        return dateB - dateA;
    });
}

export async function getProject(projectId: string, userId: string): Promise<Project | null> {
    if (!db) throw new Error("Firestore not initialized");
    if (!projectId) return null;
    
    const projectRef = db.collection("projects").doc(projectId);
    const doc = await projectRef.get();

    if (!doc.exists || doc.data()?.userId !== userId) {
        return null;
    }

    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        customPieces: (data?.customPieces || []).map((piece: any) => {
            let pixelsWhite = piece.pixelsWhite;
            let pixelsBlack = piece.pixelsBlack;

            // Handle legacy fields if new ones are missing
            if (!pixelsWhite && !pixelsBlack && piece.pixels) {
                const legacyPixels = typeof piece.pixels === 'string' ? JSON.parse(piece.pixels) : piece.pixels;
                if (piece.color === 'black') pixelsBlack = legacyPixels;
                else pixelsWhite = legacyPixels;
            }

            return {
                ...piece,
                pixelsWhite: typeof pixelsWhite === 'string' ? JSON.parse(pixelsWhite) : (pixelsWhite || Array(64).fill(null).map(() => Array(64).fill('transparent'))),
                pixelsBlack: typeof pixelsBlack === 'string' ? JSON.parse(pixelsBlack) : (pixelsBlack || Array(64).fill(null).map(() => Array(64).fill('transparent'))),
                logic: typeof piece.logic === 'string' ? JSON.parse(piece.logic) : piece.logic,
            };
        }),
        squareLogic: data?.squareLogic ? Object.fromEntries(
            Object.entries(data.squareLogic).map(([k, v]: [string, any]) => [
                k,
                {
                    ...v,
                    logic: typeof v.logic === 'string' ? JSON.parse(v.logic) : v.logic,
                    createdAt: v.createdAt?.toDate ? v.createdAt.toDate() : v.createdAt,
                    updatedAt: v.updatedAt?.toDate ? v.updatedAt.toDate() : v.updatedAt
                }
            ])
        ) : {},
        createdAt: data?.createdAt?.toDate ? data.createdAt.toDate() : data?.createdAt,
        updatedAt: data?.updatedAt?.toDate ? data.updatedAt.toDate() : data?.updatedAt,
    } as Project;
}

export async function deleteProject(projectId: string, userId: string) {
    if (!db) throw new Error("Firestore not initialized");
    const projectRef = db.collection("projects").doc(projectId);
    const projectDoc = await projectRef.get();

    if (!projectDoc.exists || projectDoc.data()?.userId !== userId) {
        throw new Error("Project not found or unauthorized");
    }

    await projectRef.delete();
}

export async function toggleProjectStar(projectId: string, userId: string): Promise<boolean> {
    if (!db) throw new Error("Firestore not initialized");
    if (!projectId) return false;
    
    const projectRef = db.collection("projects").doc(projectId);
    const projectDoc = await projectRef.get();

    if (!projectDoc.exists || projectDoc.data()?.userId !== userId) {
        throw new Error("Project not found or unauthorized");
    }

    const currentStarred = projectDoc.data()?.isStarred || false;
    await projectRef.update({ isStarred: !currentStarred, updatedAt: new Date() });
    return !currentStarred;
}

export async function saveProjectBoard(
    projectId: string, 
    userId: string, 
    boardData: { 
        rows: number, 
        cols: number, 
        activeSquares: string[], 
        placedPieces: Record<string, { type: string; color: string; movement?: 'run' | 'jump' }> 
    }
) {
    if (!db) throw new Error("Firestore not initialized");
    
    // Verify ownership
    const projectRef = db.collection("projects").doc(projectId);
    const doc = await projectRef.get();
    
    if (!doc.exists || doc.data()?.userId !== userId) {
        throw new Error("Project not found or unauthorized");
    }

    await projectRef.update({
        rows: boardData.rows,
        cols: boardData.cols,
        activeSquares: boardData.activeSquares,
        placedPieces: boardData.placedPieces,
        updatedAt: new Date()
    });
}


// ==================== MIGRATION UTILITIES ====================

export async function hasUserMigrated(userId: string): Promise<boolean> {
    if (!db) throw new Error("Firestore not initialized");
    const migrationRef = db.collection("user_migrations").doc(userId);
    const doc = await migrationRef.get();
    return doc.exists;
}

export async function markUserMigrated(userId: string) {
    if (!db) throw new Error("Firestore not initialized");
    const migrationRef = db.collection("user_migrations").doc(userId);
    await migrationRef.set({
        userId,
        migratedAt: new Date(),
        version: 1
    });
}

export async function getUserLegacyBoards(userId: string): Promise<SavedBoard[]> {
    if (!db) throw new Error("Firestore not initialized");
    const snapshot = await db.collection("legacy_boards")
        .where("userId", "==", userId)
        .get();

    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        } as SavedBoard;
    });
}

export async function getUserLegacyPieceSets(userId: string): Promise<PieceSet[]> {
    if (!db) throw new Error("Firestore not initialized");
    const snapshot = await db.collection("legacy_pieceSets")
        .where("userId", "==", userId)
        .get();

    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        } as PieceSet;
    });
}

export async function getLegacySetPieces(setId: string, userId: string): Promise<CustomPiece[]> {
    if (!db) throw new Error("Firestore not initialized");
    const snapshot = await db.collection("legacy_customPieces")
        .where("setId", "==", setId)
        .where("userId", "==", userId)
        .get();

    return snapshot.docs.map(doc => {
        const data = doc.data();
        
        let pixelsWhite = data.pixelsWhite ? JSON.parse(data.pixelsWhite) : null;
        let pixelsBlack = data.pixelsBlack ? JSON.parse(data.pixelsBlack) : null;
        
        if (!pixelsWhite && !pixelsBlack && data.pixels) {
            const legacyPixels = typeof data.pixels === 'string' ? JSON.parse(data.pixels) : data.pixels;
            if (data.color === 'black') pixelsBlack = legacyPixels;
            else pixelsWhite = legacyPixels;
        }

        return {
            id: doc.id,
            ...data,
            pixelsWhite: pixelsWhite || Array(64).fill(null).map(() => Array(64).fill('transparent')),
            pixelsBlack: pixelsBlack || Array(64).fill(null).map(() => Array(64).fill('transparent')),
            logic: typeof data.logic === 'string' ? JSON.parse(data.logic) : data.logic,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        } as CustomPiece;
    });
}

export async function migrateUserData(userId: string): Promise<void> {
    console.log(`[MIGRATE] Function called for: ${userId}`);
    if (!db) throw new Error("Firestore not initialized");
    
    // Check if user has already migrated
    const already = await hasUserMigrated(userId);
    console.log(`[MIGRATE] Check hasUserMigrated: ${already}`);
    if (already) {
        return;
    }

    // Get all legacy boards
    console.log(`[MIGRATE] Fetching legacy boards...`);
    const legacyBoards = await getUserLegacyBoards(userId);
    console.log(`[MIGRATE] Found ${legacyBoards.length} legacy boards.`);
    
    // For each legacy board, create a new project (parallelized)
    await Promise.all(legacyBoards.map(async (board) => {
        const project: Project = {
            userId: board.userId,
            name: board.name,
            description: `Migrated from board: ${board.name}`,
            isStarred: board.isStarred,
            createdAt: board.createdAt,
            updatedAt: board.updatedAt,
            rows: board.rows,
            cols: board.cols,
            gridType: board.gridType,
            activeSquares: board.activeSquares,
            placedPieces: board.placedPieces,
            customPieces: []
        };
        
        return saveProject(project);
    }));
    
    // Mark user as migrated
    await markUserMigrated(userId);
}

// ==================== LEGACY PIECE & BOARD FUNCTIONS ====================
// (Restored for Piece Editor & Library compatibility)

export async function saveCustomPiece(piece: CustomPiece) {
    if (!db) throw new Error("Firestore not initialized");
    const piecesRef = db.collection("customPieces");
    
    const data = { ...piece };
    if (Array.isArray(data.pixelsWhite)) data.pixelsWhite = JSON.stringify(data.pixelsWhite) as any;
    if (Array.isArray(data.pixelsBlack)) data.pixelsBlack = JSON.stringify(data.pixelsBlack) as any;
    if (typeof data.logic !== 'string') data.logic = JSON.stringify(data.logic) as any;

    if (piece.id) {
        await piecesRef.doc(piece.id).update({ ...data, updatedAt: new Date() });
        return piece.id;
    } else {
        const docRef = await piecesRef.add({ ...data, createdAt: new Date(), updatedAt: new Date() });
        return docRef.id;
    }
}

export async function getCustomPiece(pieceId: string, userId: string): Promise<CustomPiece | null> {
    if (!db) throw new Error("Firestore not initialized");
    const doc = await db.collection("customPieces").doc(pieceId).get();
    if (!doc.exists || doc.data()?.userId !== userId) return null;
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        pixelsWhite: typeof data?.pixelsWhite === 'string' ? JSON.parse(data.pixelsWhite) : data?.pixelsWhite,
        pixelsBlack: typeof data?.pixelsBlack === 'string' ? JSON.parse(data.pixelsBlack) : data?.pixelsBlack,
        logic: typeof data?.logic === 'string' ? JSON.parse(data.logic) : data?.logic,
    } as CustomPiece;
}

export async function getUserCustomPieces(userId: string): Promise<CustomPiece[]> {
    if (!db) throw new Error("Firestore not initialized");
    const snapshot = await db.collection("customPieces").where("userId", "==", userId).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomPiece));
}

export async function deleteCustomPiece(pieceId: string, userId: string) {
    if (!db) throw new Error("Firestore not initialized");
    await db.collection("customPieces").doc(pieceId).delete();
}

export async function savePieceSet(set: PieceSet) {
    if (!db) throw new Error("Firestore not initialized");
    const setsRef = db.collection("pieceSets");
    if (set.id) {
        await setsRef.doc(set.id).update({ ...set, updatedAt: new Date() });
        return set.id;
    } else {
        const docRef = await setsRef.add({ ...set, createdAt: new Date(), updatedAt: new Date() });
        return docRef.id;
    }
}

export async function getUserPieceSets(userId: string): Promise<PieceSet[]> {
    if (!db) throw new Error("Firestore not initialized");
    const snapshot = await db.collection("pieceSets").where("userId", "==", userId).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
}

export async function getPieceSet(setId: string, userId: string): Promise<PieceSet | null> {
    if (!db) throw new Error("Firestore not initialized");
    const doc = await db.collection("pieceSets").doc(setId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as any;
}

export async function getSetPieces(setId: string, userId: string): Promise<CustomPiece[]> {
    if (!db) throw new Error("Firestore not initialized");
    const snapshot = await db.collection("customPieces").where("setId", "==", setId).get();
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            pixelsWhite: typeof data?.pixelsWhite === 'string' ? JSON.parse(data.pixelsWhite) : data?.pixelsWhite,
            pixelsBlack: typeof data?.pixelsBlack === 'string' ? JSON.parse(data.pixelsBlack) : data?.pixelsBlack,
            logic: typeof data?.logic === 'string' ? JSON.parse(data.logic) : data?.logic,
        } as CustomPiece;
    });
}

export async function deletePieceSet(setId: string, userId: string) {
    if (!db) throw new Error("Firestore not initialized");
    await db.collection("pieceSets").doc(setId).delete();
}

export async function togglePieceSetStar(setId: string, userId: string) {
    if (!db) throw new Error("Firestore not initialized");
    const ref = db.collection("pieceSets").doc(setId);
    const doc = await ref.get();
    if (!doc.exists) return;
    const current = doc.data()?.isStarred || false;
    await ref.update({ isStarred: !current });
    return !current;
}

export async function saveBoard(board: SavedBoard) {
    if (!db) throw new Error("Firestore not initialized");
    if (board.id) {
        await db.collection("boards").doc(board.id).update({ ...board, updatedAt: new Date() });
        return board.id;
    } else {
        const docRef = await db.collection("boards").add({ ...board, createdAt: new Date(), updatedAt: new Date() });
        return docRef.id;
    }
}

export async function getUserBoards(userId: string): Promise<SavedBoard[]> {
    if (!db) throw new Error("Firestore not initialized");
    const snapshot = await db.collection("boards").where("userId", "==", userId).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
}

export async function getBoard(boardId: string, userId: string): Promise<SavedBoard | null> {
    if (!db) throw new Error("Firestore not initialized");
    const doc = await db.collection("boards").doc(boardId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as any;
}

export async function deleteBoard(boardId: string, userId: string) {
    if (!db) throw new Error("Firestore not initialized");
    await db.collection("boards").doc(boardId).delete();
}

export async function toggleBoardStar(boardId: string, userId: string) {
    if (!db) throw new Error("Firestore not initialized");
    const ref = db.collection("boards").doc(boardId);
    const doc = await ref.get();
    if (!doc.exists) return;
    const current = doc.data()?.isStarred || false;
    await ref.update({ isStarred: !current });
    return !current;
}
