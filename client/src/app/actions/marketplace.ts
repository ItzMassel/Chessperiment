"use server";
import 'server-only';
import { auth } from "@/auth";
import { db } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { getCreatorProfile } from "@/app/actions/creator";
import { getProject, getBoard, getPieceSet, getSetPieces, saveProject, saveBoard, savePieceSet, saveCustomPiece } from "@/lib/firestore";
import { MarketplaceItem, Review } from "@/lib/marketplace-types";
import { createNotification } from "./notifications";

// ==================== PUBLISHING ====================

type PublishPayload =
    | { type: 'game'; projectId: string }
    | { type: 'board'; boardId: string }
    | { type: 'pieces'; pieceSetId: string };

export async function publishToMarketplace(
    payload: PublishPayload,
    meta: { title?: string; description?: string } = {}
) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
        return { success: false, error: "Unauthorized - Please log in" };
    }
    if (!db) return { success: false, error: "Database not initialized" };

    try {
        const creator = await getCreatorProfile(userId);
        if (!creator) return { success: false, error: "CREATOR_PROFILE_MISSING" };

        let title = "Untitled";
        let description = "";
        let itemType: MarketplaceItem['type'];
        let sourceType: MarketplaceItem['sourceType'];
        let sourceId: string;
        let preview_config: MarketplaceItem['preview_config'] = null;

        switch (payload.type) {
            case 'game': {
                const project = await getProject(payload.projectId, userId);
                if (!project) return { success: false, error: "Project not found." };
                title = project.name || "Untitled Project";
                description = project.description || "";
                itemType = 'game';
                sourceType = 'project';
                sourceId = payload.projectId;
                preview_config = {
                    rows: project.rows,
                    cols: project.cols,
                    gridType: project.gridType || 'square',
                    activeSquares: project.activeSquares || [],
                    placedPieces: project.placedPieces || {},
                    customPieces: (project.customPieces || []).map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        imageWhite: p.imageWhite || undefined,
                        imageBlack: p.imageBlack || undefined,
                    })),
                };
                break;
            }
            case 'board': {
                const board = await getBoard(payload.boardId, userId);
                if (!board) return { success: false, error: "Board not found." };
                title = board.name || "Untitled Board";
                description = board.description || "";
                itemType = 'board';
                sourceType = 'board';
                sourceId = payload.boardId;
                preview_config = {
                    rows: (board as any).rows,
                    cols: (board as any).cols,
                    gridType: (board as any).gridType || 'square',
                    activeSquares: (board as any).activeSquares || [],
                    placedPieces: (board as any).placedPieces || {},
                    customPieces: ((board as any).customPieces || []).map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        imageWhite: p.imageWhite || undefined,
                        imageBlack: p.imageBlack || undefined,
                    })),
                };
                break;
            }
            case 'pieces': {
                const set = await getPieceSet(payload.pieceSetId, userId);
                if (!set) return { success: false, error: "Piece set not found." };
                const pieces = await getSetPieces(payload.pieceSetId, userId);
                title = set.name || "Untitled Piece Set";
                description = set.description || "";
                itemType = 'pieces';
                sourceType = 'pieceSet';
                sourceId = payload.pieceSetId;
                preview_config = {
                    rows: 0,
                    cols: 0,
                    gridType: 'square',
                    activeSquares: [],
                    placedPieces: {},
                    customPieces: [],
                    pieceShowcase: (pieces || []).slice(0, 12).map((p: any) => ({
                        name: p.name,
                        imageWhite: p.imageWhite || undefined,
                        imageBlack: p.imageBlack || undefined,
                    })),
                };
                break;
            }
        }

        // Don't store the full config - just store a reference via sourceId
        // When someone forks, we'll fetch the original from the source
        const searchKeywords = [
            ...(meta.title || title || '').toLowerCase().split(/\s+/),
            ...(meta.description || description || '').toLowerCase().split(/\s+/),
            creator.handle.toLowerCase(),
            itemType,
        ].filter(Boolean);

        const marketplaceItem: Omit<MarketplaceItem, 'id'> = {
            title: meta.title || title,
            description: meta.description || description || "No description provided.",
            creator_handle: creator.handle,
            type: itemType,
            rating: 0,
            reviewCount: 0,
            stars_total: 0,
            stars_count: 0,
            views: 0,
            forkCount: 0,
            date_published: new Date(),
            isNew: true,
            imageUrl: "",
            sourceType,
            sourceId,
            config_data: null,
            preview_config,
            searchKeywords,
        };

        const res = await db.collection('marketplace').add(marketplaceItem);

        // Notify followers about new publish
        if (creator.followers?.length > 0) {
            for (const followerId of creator.followers) {
                await createNotification(
                    followerId,
                    'new_publish',
                    `${creator.displayName || creator.handle} published "${title}"`,
                    `/marketplace/${res.id}`,
                    creator.handle,
                    creator.photoUrl
                );
            }
        }

        revalidatePath('/marketplace');
        revalidatePath(`/u/${creator.handle}`);

        return { success: true, marketplaceId: res.id };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error("Error publishing to marketplace:", errorMsg);
        return { success: false, error: "Failed to publish." };
    }
}

// Backward-compatible wrapper
export async function publishProjectCmd(projectId: string) {
    return publishToMarketplace({ type: 'game', projectId });
}

// ==================== VIEWS ====================

export async function incrementView(marketplaceId: string) {
    if (!db) return;
    try {
        await db.collection('marketplace').doc(marketplaceId).update({
            views: FieldValue.increment(1)
        });
    } catch (error) {
        console.error("Error incrementing view:", error);
    }
}

// ==================== REVIEWS ====================

export async function submitReview(marketplaceId: string, rating: number, text: string) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false, error: "Unauthorized" };
    if (!db) return { success: false, error: "Database error" };
    if (rating < 1 || rating > 5) return { success: false, error: "Invalid rating" };
    if (!text.trim() || text.length > 2000) return { success: false, error: "Review text must be 1-2000 characters." };

    try {
        const itemRef = db.collection('marketplace').doc(marketplaceId);

        // Get creator profile for display info
        const creator = await getCreatorProfile(userId);
        const displayName = creator?.displayName || creator?.handle || 'Anonymous';

        // Use a transaction to ensure atomic rating update
        await db.runTransaction(async (transaction) => {
            const itemDoc = await transaction.get(itemRef);

            // Create the item doc if it doesn't exist (seed fallback)
            if (!itemDoc.exists) {
                transaction.set(itemRef, {
                    stars_total: 0,
                    stars_count: 0,
                    rating: 0,
                    reviewCount: 0,
                });
            }

            // Check for existing review by this user
            const existing = await itemRef.collection('reviews')
                .where('userId', '==', userId)
                .limit(1)
                .get();
            if (!existing.empty) {
                throw new Error("ALREADY_REVIEWED");
            }

            const review: Omit<Review, 'id'> = {
                userId,
                creatorHandle: creator?.handle,
                displayName,
                rating,
                text: text.trim(),
                createdAt: new Date(),
            };

            // Add review to subcollection
            const reviewRef = itemRef.collection('reviews').doc();
            transaction.set(reviewRef, review);

            // Update parent document rating atomically within the transaction
            const data = itemDoc.exists ? itemDoc.data()! : { stars_total: 0, stars_count: 0 };
            const newStarsTotal = (data.stars_total || 0) + rating;
            const newStarsCount = (data.stars_count || 0) + 1;
            transaction.update(itemRef, {
                stars_total: newStarsTotal,
                stars_count: newStarsCount,
                rating: parseFloat((newStarsTotal / newStarsCount).toFixed(1)),
                reviewCount: FieldValue.increment(1),
            });
        });

        // Notify the item creator about the new review
        const itemData = (await db.collection('marketplace').doc(marketplaceId).get()).data();
        if (itemData?.creator_handle) {
            const handle = itemData.creator_handle.replace('@', '');
            const creatorSnap = await db.collection('creators').where('handle', '==', handle).limit(1).get();
            if (!creatorSnap.empty) {
                const creatorDoc = creatorSnap.docs[0];
                if (creatorDoc.id !== userId) {
                    await createNotification(
                        creatorDoc.id,
                        'new_review',
                        `${displayName} reviewed "${itemData.title || 'your item'}"`,
                        `/marketplace/${marketplaceId}`,
                        creator?.handle,
                        creator?.photoUrl
                    );
                }
            }
        }

        revalidatePath(`/marketplace/${marketplaceId}`);
        return { success: true };
    } catch (error) {
        if (error instanceof Error && error.message === "ALREADY_REVIEWED") {
            return { success: false, error: "You have already reviewed this item." };
        }
        console.error("Error submitting review:", error);
        return { success: false, error: "Failed to submit review." };
    }
}

export async function getReviews(marketplaceId: string): Promise<Review[]> {
    if (!db) return [];
    try {
        const snapshot = await db.collection('marketplace').doc(marketplaceId)
            .collection('reviews')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
        })) as Review[];
    } catch (error) {
        console.error("Error fetching reviews:", error);
        return [];
    }
}

export async function deleteReview(marketplaceId: string, reviewId: string) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false, error: "Unauthorized" };
    if (!db) return { success: false, error: "Database error" };

    try {
        const itemRef = db.collection('marketplace').doc(marketplaceId);
        const reviewRef = itemRef.collection('reviews').doc(reviewId);

        // Use a transaction to ensure atomic rating update on delete
        await db.runTransaction(async (transaction) => {
            const reviewDoc = await transaction.get(reviewRef);
            if (!reviewDoc.exists) throw new Error("REVIEW_NOT_FOUND");
            if (reviewDoc.data()?.userId !== userId) throw new Error("NOT_OWNER");

            const oldRating = reviewDoc.data()!.rating || 0;
            transaction.delete(reviewRef);

            const itemDoc = await transaction.get(itemRef);
            if (itemDoc.exists) {
                const data = itemDoc.data()!;
                const newStarsTotal = Math.max(0, (data.stars_total || 0) - oldRating);
                const newStarsCount = Math.max(0, (data.stars_count || 0) - 1);
                transaction.update(itemRef, {
                    stars_total: newStarsTotal,
                    stars_count: newStarsCount,
                    rating: newStarsCount > 0 ? parseFloat((newStarsTotal / newStarsCount).toFixed(1)) : 0,
                    reviewCount: FieldValue.increment(-1),
                });
            }
        });

        revalidatePath(`/marketplace/${marketplaceId}`);
        return { success: true };
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "REVIEW_NOT_FOUND") return { success: false, error: "Review not found" };
            if (error.message === "NOT_OWNER") return { success: false, error: "Not your review" };
        }
        console.error("Error deleting review:", error);
        return { success: false, error: "Failed to delete review." };
    }
}

// ==================== HELPERS ====================

/**
 * Convert an algebraic square (e.g. "c3") to the x,y grid format (e.g. "2,5")
 * used by the board editor. Leaves x,y coords untouched.
 */
function algebraicToGrid(sq: string, boardHeight: number): string {
    if (sq.includes(',')) return sq; // already x,y
    const x = sq.charCodeAt(0) - 97; // 'a' -> 0
    const rank = parseInt(sq.slice(1), 10);
    const y = boardHeight - rank;
    return `${x},${y}`;
}

/**
 * Convert any targetSquare socket value inside a logic block from algebraic to x,y.
 */
function convertBlockCoords(block: any, boardHeight: number): any {
    if (!block?.socketValues) return block;
    const sv = { ...block.socketValues };
    if (typeof sv.targetSquare === 'string' && !sv.targetSquare.includes(',')) {
        sv.targetSquare = algebraicToGrid(sv.targetSquare, boardHeight);
    }
    return { ...block, socketValues: sv };
}

/** Convert a Firestore Timestamp (or Date) to an ISO string safe for client components */
function toISOSafe(val: any): string | undefined {
    if (!val) return undefined;
    if (typeof val.toDate === 'function') return val.toDate().toISOString();
    if (val instanceof Date) return val.toISOString();
    if (typeof val._seconds === 'number') return new Date(val._seconds * 1000).toISOString();
    if (typeof val === 'string') return val;
    return undefined;
}

/** Deserialize a project document fetched directly from Firestore */
function deserializeProjectDoc(id: string, data: FirebaseFirestore.DocumentData) {
    return {
        id,
        ...data,
        createdAt: toISOSafe(data.createdAt),
        updatedAt: toISOSafe(data.updatedAt),
        customPieces: (data.customPieces || []).map((piece: any) => ({
            ...piece,
            pixelsWhite: typeof piece.pixelsWhite === 'string' ? JSON.parse(piece.pixelsWhite) : (piece.pixelsWhite || []),
            pixelsBlack: typeof piece.pixelsBlack === 'string' ? JSON.parse(piece.pixelsBlack) : (piece.pixelsBlack || []),
            logic: typeof piece.logic === 'string' ? JSON.parse(piece.logic) : (piece.logic || []),
            createdAt: toISOSafe(piece.createdAt),
            updatedAt: toISOSafe(piece.updatedAt),
        })),
        squareLogic: data.squareLogic ? Object.fromEntries(
            Object.entries(data.squareLogic).map(([k, v]: [string, any]) => [
                k,
                {
                    ...v,
                    logic: typeof v.logic === 'string' ? JSON.parse(v.logic) : (v.logic || []),
                    createdAt: toISOSafe(v.createdAt),
                    updatedAt: toISOSafe(v.updatedAt),
                },
            ])
        ) : {},
    };
}

/** Resolve config_data for a marketplace item, falling back to sourceId when config_data is null */
async function resolveConfigData(item: MarketplaceItem): Promise<any | null> {
    if (item.config_data) return item.config_data;
    if (!item.sourceId || !db) return null;

    if (item.sourceType === 'project' || item.type === 'game') {
        const doc = await db.collection('projects').doc(item.sourceId).get();
        if (!doc.exists) return null;
        return deserializeProjectDoc(doc.id, doc.data()!);
    }
    if (item.sourceType === 'board') {
        const doc = await db.collection('boards').doc(item.sourceId).get();
        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() };
    }
    if (item.sourceType === 'pieceSet') {
        const setDoc = await db.collection('pieceSets').doc(item.sourceId).get();
        if (!setDoc.exists) return null;
        const piecesSnap = await db.collection('customPieces').where('setId', '==', item.sourceId).get();
        return { set: { id: setDoc.id, ...setDoc.data() }, pieces: piecesSnap.docs.map(d => ({ id: d.id, ...d.data() })) };
    }
    return null;
}

// ==================== FORK ====================

export async function forkMarketplaceItem(marketplaceId: string) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false, error: "Unauthorized" };
    if (!db) return { success: false, error: "Database error" };

    try {
        const itemRef = db.collection('marketplace').doc(marketplaceId);
        let itemDoc = await itemRef.get();

        // For seed items, fetch from seed data
        let item: MarketplaceItem | undefined;
        if (!itemDoc.exists) {
            const { SEED_MARKETPLACE_ITEMS } = await import('@/lib/marketplace-seed');
            item = SEED_MARKETPLACE_ITEMS.find(i => i.id === marketplaceId);
            if (!item) return { success: false, error: "Item not found" };
        } else {
            item = itemDoc.data() as MarketplaceItem;
        }

        const configData = await resolveConfigData(item);
        if (!configData) return { success: false, error: "No data to fork" };
        // Temporarily attach so the switch below can use it uniformly
        item = { ...item, config_data: configData };

        const forkedFrom = { marketplaceId, creatorHandle: item.creator_handle };
        let newItemId: string;

        switch (item.type) {
            case 'game': {
                const projectData = item.config_data;
                const boardHeight = projectData.rows || 8;

                // Detect if the source project uses algebraic notation (e.g. "a1") instead of
                // the x,y format (e.g. "0,7") that the board editor requires.
                const sampleSquare: string | undefined = (projectData.activeSquares || [])[0];
                const needsConversion = !!sampleSquare && !sampleSquare.includes(',');

                let activeSquares: string[] = projectData.activeSquares || [];
                let placedPieces: Record<string, any> = { ...(projectData.placedPieces || {}) };
                let squareLogic: Record<string, any> = { ...(projectData.squareLogic || {}) };

                if (needsConversion) {
                    // Convert activeSquares from algebraic to x,y
                    activeSquares = activeSquares.map((sq: string) => algebraicToGrid(sq, boardHeight));

                    // Convert placedPieces keys from algebraic to x,y
                    const convertedPieces: Record<string, any> = {};
                    for (const [sq, piece] of Object.entries(placedPieces)) {
                        convertedPieces[algebraicToGrid(sq, boardHeight)] = piece;
                    }
                    placedPieces = convertedPieces;

                    // Convert squareLogic keys + squareId + targetSquare inside logic blocks
                    const convertedLogic: Record<string, any> = {};
                    for (const [sq, def] of Object.entries(squareLogic) as [string, any][]) {
                        const newKey = algebraicToGrid(sq, boardHeight);
                        convertedLogic[newKey] = {
                            ...def,
                            squareId: algebraicToGrid(def.squareId || sq, boardHeight),
                            userId,
                            logic: Array.isArray(def.logic)
                                ? def.logic.map((block: any) => convertBlockCoords(block, boardHeight))
                                : def.logic,
                        };
                    }
                    squareLogic = convertedLogic;
                } else {
                    // Even without coord conversion, update squareLogic ownership to current user
                    const updatedLogic: Record<string, any> = {};
                    for (const [sq, def] of Object.entries(squareLogic) as [string, any][]) {
                        updatedLogic[sq] = { ...def, userId };
                    }
                    squareLogic = updatedLogic;
                }

                const newProject = {
                    ...projectData,
                    id: undefined,
                    userId,
                    name: `${projectData.name || item.title} (Fork)`,
                    isStarred: false,
                    forkedFrom,
                    activeSquares,
                    placedPieces,
                    squareLogic,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                newItemId = await saveProject(newProject);

                // Back-fill the new projectId into every squareLogic entry
                if (Object.keys(squareLogic).length > 0) {
                    const updates: Record<string, string> = {};
                    for (const sqKey of Object.keys(squareLogic)) {
                        updates[`squareLogic.${sqKey}.projectId`] = newItemId;
                    }
                    await db.collection('projects').doc(newItemId).update(updates);
                }
                break;
            }
            case 'board': {
                const boardData = item.config_data;
                const newBoard = {
                    ...boardData,
                    id: undefined,
                    userId,
                    name: `${boardData.name || item.title} (Fork)`,
                    isStarred: false,
                    forkedFrom,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                newItemId = await saveBoard(newBoard);
                break;
            }
            case 'pieces': {
                const { set, pieces } = item.config_data;
                const newSet = {
                    ...set,
                    id: undefined,
                    userId,
                    name: `${set.name || item.title} (Fork)`,
                    isStarred: false,
                    forkedFrom,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                const newSetId = await savePieceSet(newSet);
                // Copy all pieces to the new set
                for (const piece of pieces || []) {
                    await saveCustomPiece({
                        ...piece,
                        id: undefined,
                        setId: newSetId,
                        userId,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                }
                newItemId = newSetId;
                break;
            }
            default:
                return { success: false, error: "Unknown item type" };
        }

        // Increment fork count on the marketplace item
        if (itemDoc.exists) {
            await itemRef.update({ forkCount: FieldValue.increment(1) });
        } else {
            // Create a stub doc with fork count for seed items
            await itemRef.set({
                forkCount: 1,
                stars_total: 0,
                stars_count: 0,
                rating: 0,
                reviewCount: 0,
            }, { merge: true });
        }

        // Notify the item creator about the fork
        if (item?.creator_handle) {
            const handle = item.creator_handle.replace('@', '');
            const creatorSnap = await db.collection('creators').where('handle', '==', handle).limit(1).get();
            if (!creatorSnap.empty) {
                const creatorDoc = creatorSnap.docs[0];
                if (creatorDoc.id !== userId) {
                    const currentCreator = await getCreatorProfile(userId);
                    await createNotification(
                        creatorDoc.id,
                        'item_forked',
                        `${currentCreator?.displayName || 'Someone'} forked "${item.title}"`,
                        `/marketplace/${marketplaceId}`,
                        currentCreator?.handle,
                        currentCreator?.photoUrl
                    );
                }
            }
        }

        revalidatePath(`/marketplace/${marketplaceId}`);
        return { success: true, newItemId, itemType: item.type };
    } catch (error) {
        console.error("Error forking item:", error);
        return { success: false, error: "Failed to fork item." };
    }
}

// ==================== GET PROJECT DATA ====================

export async function getMarketplaceProjectAction(marketplaceId: string) {
    if (!db) return { success: false, error: "Database not initialized" };
    try {
        const doc = await db.collection('marketplace').doc(marketplaceId).get();
        if (!doc.exists) return { success: false, error: "Marketplace item not found" };
        const item = doc.data() as MarketplaceItem;
        const configData = await resolveConfigData(item);
        if (!configData) return { success: false, error: "Project data missing from marketplace item" };
        return { success: true, data: configData };
    } catch (error) {
        console.error("Error fetching marketplace project:", error);
        return { success: false, error: "Failed to fetch project" };
    }
}

// ==================== REPORTS ====================

export async function reportMarketplaceItem(
    marketplaceId: string,
    reason: string,
    details: string
) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false, error: "Unauthorized" };
    if (!db) return { success: false, error: "Database error" };
    if (!reason) return { success: false, error: "Reason required" };

    try {
        const itemRef = db.collection('marketplace').doc(marketplaceId);
        const itemDoc = await itemRef.get();
        if (!itemDoc.exists) return { success: false, error: "Item not found" };
        const item = itemDoc.data()!;

        const reporter = await getCreatorProfile(userId);
        const reporterEmail = session?.user?.email || '';

        // Resolve creator's userId from their handle
        let creatorUserId = '';
        if (item.creator_handle) {
            const handle = item.creator_handle.replace('@', '');
            const creatorSnap = await db.collection('creators').where('handle', '==', handle).limit(1).get();
            if (!creatorSnap.empty) creatorUserId = creatorSnap.docs[0].id;
        }

        const report = {
            marketplaceId,
            itemTitle: item.title || 'Untitled',
            creatorHandle: item.creator_handle || '',
            creatorUserId,
            reporterUserId: userId,
            reporterHandle: reporter?.handle || '',
            reporterEmail,
            reason,
            details: details.trim(),
            status: 'new',
            createdAt: new Date(),
        };

        await db.collection('marketplace_reports').add(report);

        // Send email notification
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
            from: 'Marketplace Reports <onboarding@resend.dev>',
            to: ['lasse.secaccbs@gmail.com'],
            subject: `New Marketplace Report: ${item.title || 'Untitled'}`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333; line-height: 1.6;">
                    <h2 style="color: #ef4444;">New Marketplace Report</h2>
                    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                        <tr><td style="padding: 6px 0; color: #666; font-weight: 600;">Item</td><td style="padding: 6px 0;">${item.title || 'Untitled'}</td></tr>
                        <tr><td style="padding: 6px 0; color: #666; font-weight: 600;">Creator</td><td style="padding: 6px 0;">${item.creator_handle || '—'}</td></tr>
                        <tr><td style="padding: 6px 0; color: #666; font-weight: 600;">Reporter</td><td style="padding: 6px 0;">${reporter?.handle || userId} (${reporterEmail})</td></tr>
                        <tr><td style="padding: 6px 0; color: #666; font-weight: 600;">Reason</td><td style="padding: 6px 0;">${reason}</td></tr>
                    </table>
                    ${details.trim() ? `<div style="background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444; margin-top: 8px;"><strong>Details:</strong><br/>${details.trim()}</div>` : ''}
                    <p style="margin-top: 20px; font-size: 0.8em; color: #666;">
                        Marketplace ID: ${marketplaceId}<br/>
                        View in admin dashboard to take action.
                    </p>
                </div>
            `,
        });

        return { success: true };
    } catch (error) {
        console.error("Error submitting report:", error);
        return { success: false, error: "Failed to submit report." };
    }
}

// ==================== CREATOR MANAGEMENT ====================

export async function updateMarketplaceItem(
    marketplaceId: string,
    updates: { title?: string; description?: string; imageUrl?: string }
) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false, error: "Unauthorized" };
    if (!db) return { success: false, error: "Database not initialized" };

    try {
        const itemRef = db.collection('marketplace').doc(marketplaceId);
        const itemDoc = await itemRef.get();
        if (!itemDoc.exists) return { success: false, error: "Item not found" };

        // Verify ownership - check if current user is the creator
        const item = itemDoc.data() as MarketplaceItem;
        const creator = await getCreatorProfile(userId);
        if (item.creator_handle !== creator?.handle) {
            return { success: false, error: "You can only edit your own items" };
        }

        // Validate: title must not be empty if provided
        if (updates.title !== undefined && !updates.title.trim()) {
            return { success: false, error: "Title cannot be empty" };
        }

        const updateData: Record<string, string> = {};
        if (updates.title !== undefined) updateData.title = updates.title.trim();
        if (updates.description !== undefined) updateData.description = updates.description.trim();
        if (updates.imageUrl !== undefined) updateData.imageUrl = updates.imageUrl.trim();

        await itemRef.update(updateData);
        revalidatePath('/marketplace');
        revalidatePath(`/creator`);
        return { success: true };
    } catch (error) {
        console.error("Error updating marketplace item:", error);
        return { success: false, error: "Failed to update item" };
    }
}

export async function deleteMarketplaceItem(marketplaceId: string) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false, error: "Unauthorized" };
    if (!db) return { success: false, error: "Database not initialized" };

    try {
        const itemRef = db.collection('marketplace').doc(marketplaceId);
        const itemDoc = await itemRef.get();
        if (!itemDoc.exists) return { success: false, error: "Item not found" };

        // Verify ownership
        const item = itemDoc.data() as MarketplaceItem;
        const creator = await getCreatorProfile(userId);
        if (item.creator_handle !== creator?.handle) {
            return { success: false, error: "You can only delete your own items" };
        }

        // Delete reviews subcollection first
        const reviewsSnapshot = await itemRef.collection('reviews').get();
        for (const doc of reviewsSnapshot.docs) {
            await doc.ref.delete();
        }

        // Delete the item
        await itemRef.delete();
        revalidatePath('/marketplace');
        revalidatePath(`/creator`);
        return { success: true };
    } catch (error) {
        console.error("Error deleting marketplace item:", error);
        return { success: false, error: "Failed to delete item" };
    }
}
