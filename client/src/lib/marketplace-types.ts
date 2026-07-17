export interface MarketplaceItem {
    id: string;
    title: string;
    creator_handle: string; // @handle
    type: 'board' | 'pieces' | 'game';

    // Rating system
    rating: number; // Average (denormalized: stars_total / stars_count)
    reviewCount: number;
    stars_total: number;
    stars_count: number;

    // Metadata
    views: number;
    forkCount: number;
    date_published: Date;
    config_data?: any; // The logic blob (loaded lazily)

    // Source tracking (what was published)
    sourceType?: 'project' | 'board' | 'pieceSet';
    sourceId?: string;

    // Fork attribution
    forkedFrom?: { marketplaceId: string; creatorHandle: string };

    // UI flags
    isNew: boolean;
    imageUrl: string;
    description: string;

    // Search keywords for Firestore-based search
    searchKeywords?: string[];

    // Auto-generated board preview snapshot (populated at publish time)
    preview_config?: {
        rows: number;
        cols: number;
        gridType: string;
        activeSquares: string[];
        placedPieces: Record<string, { type: string; color: string }>;
        customPieces: Array<{ id?: string; name?: string; imageWhite?: string; imageBlack?: string }>;
        // For pieces-type items only
        pieceShowcase?: Array<{ name: string; imageWhite?: string; imageBlack?: string }>;
    } | null;
}

export interface Review {
    id?: string;
    userId: string;
    creatorHandle?: string;
    displayName: string;
    rating: number; // 1-5
    text: string;
    createdAt: Date;
    updatedAt?: Date;
}

export type SortOption = 'newest' | 'rating' | 'most_reviewed' | 'most_viewed';

export const MARKETPLACE_FILTER_PILLS: { id: string; labelKey: string }[] = [
    { id: 'all', labelKey: 'filters.all' },
    { id: 'game', labelKey: 'filters.game' },
    { id: 'board', labelKey: 'filters.board' },
    { id: 'pieces', labelKey: 'filters.pieces' },
];

export const SORT_OPTIONS: { value: SortOption; labelKey: string }[] = [
    { value: 'newest', labelKey: 'sort.newest' },
    { value: 'rating', labelKey: 'sort.rating' },
    { value: 'most_reviewed', labelKey: 'sort.mostReviewed' },
    { value: 'most_viewed', labelKey: 'sort.mostViewed' },
];
