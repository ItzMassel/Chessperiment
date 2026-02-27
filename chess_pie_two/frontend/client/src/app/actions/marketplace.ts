'use server';
import { auth } from "@/auth";
import { db } from "@/lib/firebase";
import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { getCreatorProfile } from "@/app/actions/creator"; // explicit path
import { getProject } from "@/lib/firestore";
import { MarketplaceItem } from "@/lib/marketplace-types";

// Publish a project to the marketplace
export async function publishProjectCmd(projectId: string, price: number | 'Free' = 'Free') {
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
        return { success: false, error: "Unauthorized" };
    }

    if (!db) {
        return { success: false, error: "Database not initialized" };
    }

    try {
        // 1. Verify creator profile
        const creator = await getCreatorProfile(userId);
        if (!creator) {
            return { success: false, error: "CREATOR_PROFILE_MISSING" };
        }

        // 2. Get the project
        const project = await getProject(projectId, userId);
        if (!project) {
            return { success: false, error: "Project not found." };
        }

        // 3. Create Marketplace Item
        // We'll use the project ID as the marketplace ID for simplicity, or generate a new one.
        // If we want versioning, we might want new IDs. For now, let's generate a new ID to allow multiple publishes? 
        // Or keep it 1:1? The spec says "unique project identifier".
        // Let's generate a new ID for the marketplace entry to separate it from the private project.

        const marketplaceItem: Omit<MarketplaceItem, 'id'> = {
            title: project.name || "Untitled Project",
            description: project.description || "No description provided.",
            creator_handle: creator.handle,
            type: 'game', // Defaulting to 'game' for now, logic determines if it's board/pieces/etc.
            price: price,
            
            rating: 0,
            reviewCount: 0,
            stars_total: 0,
            stars_count: 0,
            reviews: [],
            
            views: 0,
            date_published: new Date(),
            isNew: true,
            imageUrl: "", // We need a way to generate/store a thumbnail. For now empty or default.
            
            // The Logic Blob
            config_data: project
        };

        // Saving to 'marketplace' collection
        const res = await db.collection('marketplace').add(marketplaceItem);
        
        revalidatePath('/marketplace');
        revalidatePath(`/u/${creator.handle}`); // If we have a profile page

        return { success: true, marketplaceId: res.id };

    } catch (error) {
        console.error("Error publishing project:", error);
        return { success: false, error: "Failed to publish project." };
    }
}

// Increment view count
export async function incrementView(marketplaceId: string) {
    if (!db) return;
    try {
        const ref = db.collection('marketplace').doc(marketplaceId);
        await ref.update({
            views: FieldValue.increment(1)
        });
    } catch (error) {
        console.error("Error incrementing view:", error);
    }
}

// Rate an item
export async function rateItem(marketplaceId: string, rating: number) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false, error: "Unauthorized" };
    
    if (rating < 1 || rating > 5) return { success: false, error: "Invalid rating" };
    if (!db) return { success: false, error: "Database error" };

    try {
        const itemRef = db.collection('marketplace').doc(marketplaceId);
        const itemDoc = await itemRef.get();
        
        if (!itemDoc.exists) return { success: false, error: "Item not found" };

        const data = itemDoc.data() as MarketplaceItem;
        
        // Check if user already reviewed (if we stored user IDs in reviews array)
        // For now, simple implementation
        
        await itemRef.update({
            stars_total: (data.stars_total || 0) + rating,
            stars_count: (data.stars_count || 0) + 1,
            reviews: FieldValue.arrayUnion(userId) // Prevent double rating basic check?
        });

        revalidatePath(`/marketplace/${marketplaceId}`);
        return { success: true };
    } catch (error) {
        console.error("Error rating item:", error);
        return { success: false, error: "Failed to submit rating" };
    }
}

// Get project data from marketplace item
export async function getMarketplaceProjectAction(marketplaceId: string) {
    if (!db) return { success: false, error: "Database not initialized" };
    
    try {
        const itemRef = db.collection('marketplace').doc(marketplaceId);
        const itemDoc = await itemRef.get();
        
        if (!itemDoc.exists) {
            return { success: false, error: "Marketplace item not found" };
        }
        
        const data = itemDoc.data() as MarketplaceItem;
        if (!data.config_data) {
            return { success: false, error: "Project data missing from marketplace item" };
        }
        
        return { success: true, data: data.config_data };
    } catch (error) {
        console.error("Error fetching marketplace project:", error);
        return { success: false, error: "Failed to fetch project" };
    }
}
