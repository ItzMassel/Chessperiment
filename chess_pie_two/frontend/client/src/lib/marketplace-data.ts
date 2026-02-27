'use server';
import { db } from '@/lib/firebase';
import { MarketplaceItem } from './marketplace-types';

export async function getMarketplaceItems(): Promise<MarketplaceItem[]> {
  try {
    if (!db) {
        console.error("Firestore not initialized");
        return [];
    }
    const snapshot = await db.collection('marketplace')
        .select('title', 'description', 'price', 'type', 'imageUrl', 'creator_handle', 'author', 'stars_total', 'stars_count', 'views', 'reviews', 'isNew', 'date_published')
        .get();
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Handle the case where price is stored as number but we want 'Free'
      price: doc.data().price === 0 ? 'Free' : doc.data().price,
      // Map author to creator_handle if needed, or ensure creator_handle is stored
      creator_handle: doc.data().creator_handle || doc.data().author || '@unknown',
      rating: doc.data().stars_count > 0 ? (doc.data().stars_total / doc.data().stars_count).toFixed(1) : 0,
      reviewCount: doc.data().reviews?.length || 0,
      views: doc.data().views || 0,
    })) as MarketplaceItem[];
  } catch (error) {
    console.error("Error fetching marketplace items:", error);
    return [];
  }
}

export async function getMarketplaceItem(id: string): Promise<MarketplaceItem | null> {
    try {
      if (!db) return null;
      const doc = await db.collection('marketplace').doc(id).get();
      // We don't need config_data for details view
      // But currently get() on doc ref doesn't support select() easily in admin SDK without mask?
      // Actually doc().get() returns everything. Maybe we leave it for now as details view is usually one item.
      // But to be consistent with 'metadata only', we should strip it if possible.
      // However, for a single item read, fetching 1MB is fine compared to listing 50 items x 1MB.
      // Let's leave getMarketplaceItem fetching full doc for now, as it simplifies things if we ever need to show some config details.
      // User requested "load only metadata in gallery".
      // Gallery uses getMarketplaceItems. Checked.
      
      // Wait, if I change getMarketplaceItems to use select(), I am satisfying the requirement.
      if (!doc.exists) {
        return null;
      }
      return {
          id: doc.id,
          ...doc.data(),
          price: doc.data()!.price === 0 ? 'Free' : doc.data()!.price,
          creator_handle: doc.data()!.creator_handle || doc.data()!.author || '@unknown',
          rating: (doc.data()!.stars_count || 0) > 0 ? (doc.data()!.stars_total / doc.data()!.stars_count).toFixed(1) : 0,
          reviewCount: doc.data()!.reviews?.length || 0,
          views: doc.data()!.views || 0,
      } as MarketplaceItem;
    } catch (error) {
      console.error(`Error fetching item ${id}:`, error);
      return null;
    }
}

export async function createMarketplaceItem(item: Omit<MarketplaceItem, 'id' | 'rating' | 'reviewCount' | 'isNew' | 'stars_total' | 'stars_count' | 'reviews' | 'views' | 'date_published'>): Promise<string> {
    try {
        const newItem = {
            ...item,
            rating: 0,
            reviewCount: 0,
            stars_total: 0,
            stars_count: 0,
            reviews: [],
            views: 0,
            isNew: true,
            date_published: new Date(),
        };
        if (!db) throw new Error("Firestore not initialized");
        const res = await db.collection('marketplace').add(newItem);
        return res.id;
    } catch (error) {
        console.error("Error creating marketplace item:", error);
        throw new Error("Failed to create item");
    }
}

export async function getCreatorMarketplaceItems(handle: string): Promise<MarketplaceItem[]> {
    try {
        if (!db) return [];
        // Ensure handle has @ prefix if stored that way
        const queryHandle = handle.startsWith('@') ? handle : `@${handle}`;
        
        const snapshot = await db.collection('marketplace')
            .where('creator_handle', '==', queryHandle)
            .select('title', 'description', 'price', 'type', 'imageUrl', 'creator_handle', 'author', 'stars_total', 'stars_count', 'views', 'reviews', 'isNew', 'date_published')
            .get();
            
        if (snapshot.empty) return [];
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Ensure derived fields are correct just in case
            price: doc.data().price === 0 ? 'Free' : doc.data().price,
            rating: (doc.data().stars_count || 0) > 0 ? (doc.data().stars_total / doc.data().stars_count).toFixed(1) : 0,
            reviewCount: doc.data().reviews?.length || 0,
            views: doc.data().views || 0,
        })) as MarketplaceItem[];
    } catch (error) {
        console.error("Error fetching creator items:", error);
        return [];
    }
}
