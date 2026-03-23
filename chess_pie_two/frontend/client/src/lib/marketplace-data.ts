'use server';

import 'server-only';
import { db } from '@/lib/firebase-admin';
import { MarketplaceItem, SortOption } from './marketplace-types';

const SEED_ITEMS_ENABLED = process.env.NODE_ENV === 'development';

export interface MarketplaceQuery {
    type?: 'board' | 'pieces' | 'game';
    priceFilter?: 'free';
    sort?: SortOption;
    limit?: number;
}

function sortItems(items: MarketplaceItem[], sort: SortOption): MarketplaceItem[] {
    return [...items].sort((a, b) => {
        switch (sort) {
            case 'rating': return b.rating - a.rating;
            case 'most_reviewed': return b.reviewCount - a.reviewCount;
            case 'most_viewed': return b.views - a.views;
            case 'newest':
            default: {
                const aDate = a.date_published instanceof Date ? a.date_published : new Date(a.date_published);
                const bDate = b.date_published instanceof Date ? b.date_published : new Date(b.date_published);
                return bDate.getTime() - aDate.getTime();
            }
        }
    });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDoc(doc: any): MarketplaceItem {
    const data = doc.data()!;
    const stars_total = data.stars_total || 0;
    const stars_count = data.stars_count || 0;

    // Convert Firestore Timestamp to ISO string
    let datePublished: any = data.date_published;
    if (data.date_published) {
        if (typeof data.date_published.toDate === 'function') {
            // Firestore Timestamp
            datePublished = data.date_published.toDate().toISOString();
        } else if (data.date_published instanceof Date) {
            datePublished = data.date_published.toISOString();
        } else if (typeof data.date_published === 'string') {
            datePublished = data.date_published;
        }
    }

    return {
        id: doc.id,
        ...data,
        date_published: datePublished,
        price: data.price === 0 ? 'Free' : data.price,
        creator_handle: data.creator_handle || data.author || '@unknown',
        rating: stars_count > 0 ? parseFloat((stars_total / stars_count).toFixed(1)) : 0,
        reviewCount: data.reviewCount || data.reviews?.length || 0,
        views: data.views || 0,
        forkCount: data.forkCount || 0,
    } as MarketplaceItem;
}

function applySeedFilters(items: MarketplaceItem[], query?: MarketplaceQuery): MarketplaceItem[] {
    let filtered = items;
    if (query?.type) {
        filtered = filtered.filter(i => i.type === query.type);
    }
    if (query?.priceFilter === 'free') {
        filtered = filtered.filter(i => i.price === 'Free' || i.price === 0);
    }
    if (query?.sort) {
        filtered = sortItems(filtered, query.sort);
    }
    if (query?.limit) {
        filtered = filtered.slice(0, query.limit);
    }
    return filtered;
}

export async function getMarketplaceItems(query?: MarketplaceQuery): Promise<MarketplaceItem[]> {
    try {
        if (!db) {
            console.error("Firestore not initialized");
            if (SEED_ITEMS_ENABLED) {
                const { SEED_MARKETPLACE_ITEMS } = await import('./marketplace-seed');
                return applySeedFilters(SEED_MARKETPLACE_ITEMS, query);
            }
            return [];
        }

        let ref: FirebaseFirestore.Query = db.collection('marketplace');

        if (query?.type) {
            ref = ref.where('type', '==', query.type);
        }
        if (query?.priceFilter === 'free') {
            ref = ref.where('price', 'in', ['Free', 0]);
        }

        ref = ref.limit(query?.limit || 100);

        const snapshot = await ref.get();

        if (snapshot.empty) {
            if (SEED_ITEMS_ENABLED) {
                const { SEED_MARKETPLACE_ITEMS } = await import('./marketplace-seed');
                return applySeedFilters(SEED_MARKETPLACE_ITEMS, query);
            }
            return [];
        }

        let items = snapshot.docs.map(mapDoc);

        if (query?.sort) {
            items = sortItems(items, query.sort);
        }

        return items;
    } catch (error) {
        console.error("Error fetching marketplace items:", error);
        if (SEED_ITEMS_ENABLED) {
            const { SEED_MARKETPLACE_ITEMS } = await import('./marketplace-seed');
            return applySeedFilters(SEED_MARKETPLACE_ITEMS, query);
        }
        return [];
    }
}

export async function getMarketplaceItem(id: string): Promise<MarketplaceItem | null> {
    try {
        if (!db) return null;
        const doc = await db.collection('marketplace').doc(id).get();
        if (!doc.exists) {
            if (SEED_ITEMS_ENABLED) {
                const { SEED_MARKETPLACE_ITEMS } = await import('./marketplace-seed');
                return SEED_MARKETPLACE_ITEMS.find(i => i.id === id) || null;
            }
            return null;
        }
        return mapDoc(doc);
    } catch (error) {
        console.error(`Error fetching item ${id}:`, error);
        return null;
    }
}

export async function createMarketplaceItem(item: Omit<MarketplaceItem, 'id' | 'rating' | 'reviewCount' | 'isNew' | 'stars_total' | 'stars_count' | 'views' | 'forkCount' | 'date_published'>): Promise<string> {
    if (!db) throw new Error("Firestore not initialized");
    try {
        const newItem = {
            ...item,
            rating: 0,
            reviewCount: 0,
            stars_total: 0,
            stars_count: 0,
            views: 0,
            forkCount: 0,
            isNew: true,
            date_published: new Date(),
        };
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
        const queryHandle = handle.startsWith('@') ? handle : `@${handle}`;
        const snapshot = await db.collection('marketplace')
            .where('creator_handle', '==', queryHandle)
            .limit(50)
            .get();
        if (snapshot.empty) return [];
        return snapshot.docs.map(mapDoc);
    } catch (error) {
        console.error("Error fetching creator items:", error);
        return [];
    }
}
