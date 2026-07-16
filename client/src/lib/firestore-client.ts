'use client';

import { 
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import { db as firestoreDb, isConfigured } from './firebase-client';
import { Project } from '@/types/Project';
import { GameResult, UserStats, SavedBoard, PieceSet, CustomPiece } from '@/types/firestore';

export type { GameResult, UserStats, SavedBoard, PieceSet, CustomPiece };

const db = isConfigured ? firestoreDb : null;

function requireDb() {
    if (!db) {
        throw new Error('Firestore is not configured. This feature is only available with a Firebase project setup.');
    }
    return db;
}

// Client-side Project CRUD operations using Firebase client SDK

export async function saveProject(project: Project): Promise<string> {
    requireDb();
    const projectsRef = collection(db!, 'projects');
    
    // Serialize custom pieces like on the server side
    const serializedProject = {
        ...project,
        customPieces: (project.customPieces || []).map(piece => ({
            ...piece,
            pixelsWhite: typeof piece.pixelsWhite !== 'string' ? JSON.stringify(piece.pixelsWhite) : piece.pixelsWhite,
            pixelsBlack: typeof piece.pixelsBlack !== 'string' ? JSON.stringify(piece.pixelsBlack) : piece.pixelsBlack,
            logic: (piece.logic !== undefined && typeof piece.logic !== 'string') ? JSON.stringify(piece.logic) : piece.logic
        })),
        squareLogic: project.squareLogic ? Object.fromEntries(
            Object.entries(project.squareLogic).map(([k, v]: [string, any]) => [
                k,
                { ...v, logic: (v.logic !== undefined && typeof v.logic !== 'string') ? JSON.stringify(v.logic) : v.logic }
            ])
        ) : {}
    };

    if (project.id) {
        const projectDoc = doc(projectsRef, project.id);
        const { id, ...projectData } = serializedProject as any;
        await updateDoc(projectDoc, {
            ...projectData,
            updatedAt: Timestamp.now(),
        });
        return project.id;
    } else {
        console.log('[saveProject] Creating new project...', project.name);
        try {
            const newProjectDoc = doc(projectsRef);
            console.log('[saveProject] Generated ID:', newProjectDoc.id);

            // Create a timeout promise
            const timeout = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Firestore operation timed out after 10000ms')), 10000);
            });

            // Race the write against the timeout
            await Promise.race([
                setDoc(newProjectDoc, {
                    ...serializedProject,
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                }),
                timeout
            ]);

            console.log('[saveProject] Document written successfully.');
            return newProjectDoc.id;
        } catch (e) {
            console.error('[saveProject] Error writing document:', e);
            throw e;
        }
    }
}

export async function getUserProjects(userId: string): Promise<Project[]> {
    requireDb();
    const projectsRef = collection(db!, 'projects');
    const q = query(
        projectsRef,
        where('userId', '==', userId)
    );
    
    console.time('firestore-get-projects');
    const snapshot = await getDocs(q);
    console.timeEnd('firestore-get-projects');
    console.log(`Fetched ${snapshot.docs.length} projects`);
    
    const projects = snapshot.docs.map((doc) => {
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
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Project;
    });

    // Sort in memory to avoid needing a composite index
    return projects.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export async function getProject(projectId: string, userId?: string): Promise<Project | null> {
    requireDb();
    const projectDoc = doc(db!, 'projects', projectId);
    const snapshot = await getDoc(projectDoc);
    
    if (!snapshot.exists()) {
        return null;
    }
    
    const data = snapshot.data();
    return {
        id: snapshot.id,
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
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Project;
}

export async function deleteProject(projectId: string): Promise<void> {
    requireDb();
    const projectDoc = doc(db!, 'projects', projectId);
    await deleteDoc(projectDoc);
}

export async function toggleProjectStar(projectId: string, isStarred: boolean): Promise<void> {
    requireDb();
    const projectDoc = doc(db!, 'projects', projectId);
    await updateDoc(projectDoc, {
        isStarred,
        updatedAt: Timestamp.now(),
    });
}

// Migration utilities
export async function hasUserMigrated(userId: string): Promise<boolean> {
    requireDb();
    const migrationDoc = doc(db!, 'user_migrations', userId);
    const snapshot = await getDoc(migrationDoc);
    return snapshot.exists();
}

export async function markUserMigrated(userId: string): Promise<void> {
    requireDb();
    const migrationDoc = doc(db!, 'user_migrations', userId);
    await setDoc(migrationDoc, {
        migratedAt: Timestamp.now(),
        userId,
    });
}

export async function getPieceSetPieces(setId: string): Promise<CustomPiece[]> {
    requireDb();
    const piecesRef = collection(db!, 'custom_pieces');
    const q = query(piecesRef, where('setId', '==', setId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
        } as CustomPiece;
    });
}

export async function importToProject(
    projectId: string, 
    sourceData: SavedBoard | PieceSet, 
    type: 'board' | 'set'
): Promise<void> {
    requireDb();
    const project = await getProject(projectId);
    if (!project) throw new Error('Project not found');

    const projectDoc = doc(db!, 'projects', projectId);

    if (type === 'board') {
        const board = sourceData as SavedBoard;
        await updateDoc(projectDoc, {
            rows: board.rows,
            cols: board.cols,
            gridType: board.gridType || 'square',
            activeSquares: board.activeSquares,
            placedPieces: board.placedPieces,
            updatedAt: Timestamp.now()
        });
    } else {
        const set = sourceData as PieceSet;
        const pieces = await getPieceSetPieces(set.id!);
        
        // Map pieces to project format (remove setId, add projectId)
        const updatedPieces: CustomPiece[] = [
            ...project.customPieces,
            ...pieces.map(p => ({
                ...p,
                projectId,
                setId: ''
            }))
        ];

        await updateDoc(projectDoc, {
            customPieces: updatedPieces,
            updatedAt: Timestamp.now()
        });
    }
}
