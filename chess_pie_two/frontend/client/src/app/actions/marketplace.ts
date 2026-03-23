"use server";
import 'server-only';
import { auth } from "@/auth";
import { db } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { getCreatorProfile } from "@/app/actions/creator";
import { getProject, getBoard, getPieceSet, getSetPieces, saveProject, saveBoard, savePieceSet, saveCustomPiece } from "@/lib/firestore";
import { MarketplaceItem, Review } from "@/lib/marketplace-types";

// ==================== PUBLISHING ====================

type PublishPayload =
    | { type: 'game'; projectId: string }
    | { type: 'board'; boardId: string }
    | { type: 'pieces'; pieceSetId: string };

export async function publishToMarketplace(
    payload: PublishPayload,
    meta: { title?: string; description?: string; price?: number | 'Free' } = {}
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

        switch (payload.type) {
            case 'game': {
                const project = await getProject(payload.projectId, userId);
                if (!project) return { success: false, error: "Project not found." };
                title = project.name || "Untitled Project";
                description = project.description || "";
                itemType = 'game';
                sourceType = 'project';
                sourceId = payload.projectId;
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
                break;
            }
            case 'pieces': {
                const set = await getPieceSet(payload.pieceSetId, userId);
                if (!set) return { success: false, error: "Piece set not found." };
                await getSetPieces(payload.pieceSetId, userId);
                title = set.name || "Untitled Piece Set";
                description = set.description || "";
                itemType = 'pieces';
                sourceType = 'pieceSet';
                sourceId = payload.pieceSetId;
                break;
            }
        }

        // Don't store the full config - just store a reference via sourceId
        // When someone forks, we'll fetch the original from the source
        const marketplaceItem: Omit<MarketplaceItem, 'id'> = {
            title: meta.title || title,
            description: meta.description || description || "No description provided.",
            creator_handle: creator.handle,
            type: itemType,
            price: meta.price ?? 'Free',
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
            config_data: null, // Don't store config - fetch from source when needed for forking
        };

        const res = await db.collection('marketplace').add(marketplaceItem);

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
export async function publishProjectCmd(projectId: string, price: number | 'Free' = 'Free') {
    return publishToMarketplace({ type: 'game', projectId }, { price });
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

            // Get creator profile for display info
            const creator = await getCreatorProfile(userId);
            const displayName = creator?.displayName || creator?.handle || 'Anonymous';

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

        if (!item.config_data) return { success: false, error: "No data to fork" };

        const forkedFrom = { marketplaceId, creatorHandle: item.creator_handle };
        let newItemId: string;

        switch (item.type) {
            case 'game': {
                const projectData = item.config_data;
                const newProject = {
                    ...projectData,
                    id: undefined,
                    userId,
                    name: `${projectData.name || item.title} (Fork)`,
                    isStarred: false,
                    forkedFrom,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                newItemId = await saveProject(newProject);
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
        const data = doc.data() as MarketplaceItem;
        if (!data.config_data) return { success: false, error: "Project data missing from marketplace item" };
        return { success: true, data: data.config_data };
    } catch (error) {
        console.error("Error fetching marketplace project:", error);
        return { success: false, error: "Failed to fetch project" };
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

        const updateData: Record<string, string> = {};
        if (updates.title !== undefined) updateData.title = updates.title;
        if (updates.description !== undefined) updateData.description = updates.description;
        if (updates.imageUrl !== undefined) updateData.imageUrl = updates.imageUrl;

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
