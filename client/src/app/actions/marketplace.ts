"use server";
import 'server-only';
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { getCreatorProfile } from "@/app/actions/creator";
import { createNotification } from "./notifications";
import { MarketplaceItem, Review } from "@/lib/marketplace-types";
import {
  getProject,
  saveProject,
  getBoard,
  saveBoard,
  getPieceSet,
  savePieceSet,
  getSetPieces,
  saveCustomPiece,
} from "@/db";
import {
  getMarketplaceItem,
  getMarketplaceItems,
  createMarketplaceItem,
  incrementView as incrementViewDb,
  incrementForkCount,
  updateMarketplaceItem as updateMI,
  deleteMarketplaceItem as deleteMI,
  getReviews as getReviewsDb,
  addReview,
  deleteReviewFromItem,
  hasUserReviewed,
  getCreatorMarketplaceItems,
  createReport,
  searchMarketplaceItems,
} from "@/db";

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

        const searchKeywords = [
            ...(meta.title || title || '').toLowerCase().split(/\s+/),
            ...(meta.description || description || '').toLowerCase().split(/\s+/),
            creator.handle.toLowerCase(),
            itemType,
        ].filter(Boolean);

        const marketplaceId = await createMarketplaceItem({
            title: meta.title || title,
            description: meta.description || description || "No description provided.",
            creator_handle: creator.handle,
            type: itemType,
            imageUrl: "",
            searchKeywords,
            preview_config,
            sourceType,
            sourceId,
        });

        if (creator.followers?.length > 0) {
            for (const followerId of creator.followers) {
                await createNotification(
                    followerId,
                    'new_publish',
                    `${creator.displayName || creator.handle} published "${title}"`,
                    `/marketplace/${marketplaceId}`,
                    creator.handle,
                    creator.photoUrl
                );
            }
        }

        revalidatePath('/marketplace');
        revalidatePath(`/u/${creator.handle}`);

        return { success: true, marketplaceId };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error("Error publishing to marketplace:", errorMsg);
        return { success: false, error: "Failed to publish." };
    }
}

export async function publishProjectCmd(projectId: string) {
    return publishToMarketplace({ type: 'game', projectId });
}

export async function incrementView(marketplaceId: string) {
    try {
        await incrementViewDb(marketplaceId);
    } catch (error) {
        console.error("Error incrementing view:", error);
    }
}

export async function submitReview(marketplaceId: string, rating: number, text: string) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false, error: "Unauthorized" };
    if (rating < 1 || rating > 5) return { success: false, error: "Invalid rating" };
    if (!text.trim() || text.length > 2000) return { success: false, error: "Review text must be 1-2000 characters." };

    try {
        const item = await getMarketplaceItem(marketplaceId);
        if (!item) return { success: false, error: "Item not found" };

        const existing = await hasUserReviewed(marketplaceId, userId);
        if (existing) return { success: false, error: "You have already reviewed this item." };

        const creator = await getCreatorProfile(userId);
        const displayName = creator?.displayName || creator?.handle || 'Anonymous';

        await addReview(marketplaceId, {
            userId,
            creatorHandle: creator?.handle,
            displayName,
            rating,
            text: text.trim(),
        });

        if (item.creator_handle) {
            const handle = item.creator_handle.replace('@', '');
            const creatorByHandle = await getCreatorProfileByHandleFromDB(handle);
            if (creatorByHandle && creatorByHandle.userId !== userId) {
                await createNotification(
                    creatorByHandle.userId,
                    'new_review',
                    `${displayName} reviewed "${item.title || 'your item'}"`,
                    `/marketplace/${marketplaceId}`,
                    creator?.handle,
                    creator?.photoUrl
                );
            }
        }

        revalidatePath(`/marketplace/${marketplaceId}`);
        return { success: true };
    } catch (error) {
        console.error("Error submitting review:", error);
        return { success: false, error: "Failed to submit review." };
    }
}

async function getCreatorProfileByHandleFromDB(handle: string) {
    const { getCreatorProfileByHandle } = await import("@/db");
    return getCreatorProfileByHandle(handle);
}

export async function getReviews(marketplaceId: string): Promise<Review[]> {
    try {
        return await getReviewsDb(marketplaceId);
    } catch (error) {
        console.error("Error fetching reviews:", error);
        return [];
    }
}

export async function deleteReview(marketplaceId: string, reviewId: string) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false, error: "Unauthorized" };

    try {
        await deleteReviewFromItem(marketplaceId, reviewId, userId);
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

function algebraicToGrid(sq: string, boardHeight: number): string {
    if (sq.includes(',')) return sq;
    const x = sq.charCodeAt(0) - 97;
    const rank = parseInt(sq.slice(1), 10);
    const y = boardHeight - rank;
    return `${x},${y}`;
}

function convertBlockCoords(block: any, boardHeight: number): any {
    if (!block?.socketValues) return block;
    const sv = { ...block.socketValues };
    if (typeof sv.targetSquare === 'string' && !sv.targetSquare.includes(',')) {
        sv.targetSquare = algebraicToGrid(sv.targetSquare, boardHeight);
    }
    return { ...block, socketValues: sv };
}

async function resolveConfigData(item: MarketplaceItem): Promise<any | null> {
    if (item.config_data) return item.config_data;
    if (!item.sourceId) return null;

    if (item.sourceType === 'project' || item.type === 'game') {
        const doc = await getProject(item.sourceId, '');
        if (!doc) return null;
        return doc;
    }
    if (item.sourceType === 'board') {
        const boardsModule = await import("@/db");
        const doc = await boardsModule.getBoard(item.sourceId, '');
        if (!doc) return null;
        return doc;
    }
    if (item.sourceType === 'pieceSet') {
        const setDoc = await getPieceSet(item.sourceId, '');
        if (!setDoc) return null;
        const pieces = await getSetPieces(item.sourceId, '');
        return { set: setDoc, pieces };
    }
    return null;
}

export async function forkMarketplaceItem(marketplaceId: string) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false, error: "Unauthorized" };

    try {
        let item = await getMarketplaceItem(marketplaceId);

        if (!item) {
            const { SEED_MARKETPLACE_ITEMS } = await import('@/lib/marketplace-seed');
            item = SEED_MARKETPLACE_ITEMS.find(i => i.id === marketplaceId) as any;
            if (!item) return { success: false, error: "Item not found" };
        }

        const configData = await resolveConfigData(item);
        if (!configData) return { success: false, error: "No data to fork" };
        item = { ...item, config_data: configData };

        const forkedFrom = { marketplaceId, creatorHandle: item.creator_handle };
        let newItemId: string;

        switch (item.type) {
            case 'game': {
                const projectData = item.config_data;
                const boardHeight = projectData.rows || 8;

                const sampleSquare = (projectData.activeSquares || [])[0];
                const needsConversion = !!sampleSquare && !sampleSquare.includes(',');

                let activeSquares = projectData.activeSquares || [];
                let placedPieces = { ...(projectData.placedPieces || {}) };
                let squareLogic = { ...(projectData.squareLogic || {}) };

                if (needsConversion) {
                    activeSquares = activeSquares.map((sq: string) => algebraicToGrid(sq, boardHeight));
                    const convertedPieces: Record<string, any> = {};
                    for (const [sq, piece] of Object.entries(placedPieces)) {
                        convertedPieces[algebraicToGrid(sq, boardHeight)] = piece;
                    }
                    placedPieces = convertedPieces;

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
                break;
            }
            case 'board': {
                const boardData = item.config_data;
                const newBoard = {
                    ...(typeof boardData.toJSON === 'function' ? boardData.toJSON() : boardData),
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

        await incrementForkCount(marketplaceId);

        if (item?.creator_handle) {
            const handle = item.creator_handle.replace('@', '');
            const creatorByHandle = await getCreatorProfileByHandleFromDB(handle);
            if (creatorByHandle && creatorByHandle.userId !== userId) {
                const currentCreator = await getCreatorProfile(userId);
                await createNotification(
                    creatorByHandle.userId,
                    'item_forked',
                    `${currentCreator?.displayName || 'Someone'} forked "${item.title}"`,
                    `/marketplace/${marketplaceId}`,
                    currentCreator?.handle,
                    currentCreator?.photoUrl
                );
            }
        }

        revalidatePath(`/marketplace/${marketplaceId}`);
        return { success: true, newItemId, itemType: item.type };
    } catch (error) {
        console.error("Error forking item:", error);
        return { success: false, error: "Failed to fork item." };
    }
}

export async function getMarketplaceProjectAction(marketplaceId: string) {
    try {
        const item = await getMarketplaceItem(marketplaceId);
        if (!item) return { success: false, error: "Marketplace item not found" };
        const configData = await resolveConfigData(item);
        if (!configData) return { success: false, error: "Project data missing from marketplace item" };
        return { success: true, data: configData };
    } catch (error) {
        console.error("Error fetching marketplace project:", error);
        return { success: false, error: "Failed to fetch project" };
    }
}

export async function reportMarketplaceItem(
    marketplaceId: string,
    reason: string,
    details: string
) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false, error: "Unauthorized" };
    if (!reason) return { success: false, error: "Reason required" };

    try {
        const item = await getMarketplaceItem(marketplaceId);
        if (!item) return { success: false, error: "Item not found" };

        const reporter = await getCreatorProfile(userId);
        const reporterEmail = session?.user?.email || '';

        let creatorUserId = '';
        if (item.creator_handle) {
            const handle = item.creator_handle.replace('@', '');
            const creatorByHandle = await getCreatorProfileByHandleFromDB(handle);
            if (creatorByHandle) creatorUserId = creatorByHandle.userId;
        }

        await createReport({
            marketplaceId,
            itemTitle: item.title || 'Untitled',
            creatorHandle: item.creator_handle || '',
            creatorUserId,
            reporterUserId: userId,
            reporterHandle: reporter?.handle || '',
            reporterEmail,
            reason,
            details: details.trim(),
        });

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

export async function updateMarketplaceItem(
    marketplaceId: string,
    updates: { title?: string; description?: string; imageUrl?: string }
) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false, error: "Unauthorized" };

    try {
        const item = await getMarketplaceItem(marketplaceId);
        if (!item) return { success: false, error: "Item not found" };

        const creator = await getCreatorProfile(userId);
        if (item.creator_handle !== creator?.handle) {
            return { success: false, error: "You can only edit your own items" };
        }

        if (updates.title !== undefined && !updates.title.trim()) {
            return { success: false, error: "Title cannot be empty" };
        }

        await updateMI(marketplaceId, updates);
        revalidatePath('/marketplace');
        revalidatePath('/creator');
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

    try {
        const item = await getMarketplaceItem(marketplaceId);
        if (!item) return { success: false, error: "Item not found" };

        const creator = await getCreatorProfile(userId);
        if (item.creator_handle !== creator?.handle) {
            return { success: false, error: "You can only delete your own items" };
        }

        await deleteMI(marketplaceId);
        revalidatePath('/marketplace');
        revalidatePath('/creator');
        return { success: true };
    } catch (error) {
        console.error("Error deleting marketplace item:", error);
        return { success: false, error: "Failed to delete item" };
    }
}
