'use server';

import 'server-only';
import { getMarketplaceItems as getMI, getMarketplaceItem as getMItem, searchMarketplaceItems as searchMI, getCreatorMarketplaceItems as getCreatorItems } from '@/db';
import { MarketplaceItem, SortOption } from './marketplace-types';

export interface MarketplaceQuery {
    type?: 'board' | 'pieces' | 'game';
    sort?: SortOption;
    limit?: number;
}

export async function getMarketplaceItems(query?: MarketplaceQuery): Promise<MarketplaceItem[]> {
    try {
        return await getMI(query as any);
    } catch (error) {
        console.error("Error fetching marketplace items:", error);
        return [];
    }
}

export async function getMarketplaceItem(id: string): Promise<MarketplaceItem | null> {
    try {
        return await getMItem(id);
    } catch (error) {
        console.error(`Error fetching item ${id}:`, error);
        return null;
    }
}

export async function createMarketplaceItem(item: Omit<MarketplaceItem, 'id' | 'rating' | 'reviewCount' | 'isNew' | 'stars_total' | 'stars_count' | 'views' | 'forkCount' | 'date_published'>): Promise<string> {
    const { createMarketplaceItem: createItem } = await import('@/db');
    return createItem(item);
}

export async function searchMarketplaceItems(query: string, type?: 'board' | 'pieces' | 'game'): Promise<MarketplaceItem[]> {
    try {
        return await searchMI(query, type);
    } catch (error) {
        console.error("Error searching marketplace items:", error);
        return [];
    }
}

export async function getCreatorMarketplaceItems(handle: string): Promise<MarketplaceItem[]> {
    try {
        return await getCreatorItems(handle);
    } catch (error) {
        console.error("Error fetching creator items:", error);
        return [];
    }
}
