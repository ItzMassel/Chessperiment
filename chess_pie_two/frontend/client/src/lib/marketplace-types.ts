export interface MarketplaceItem {
    id: string;
    title: string;
    creator_handle: string; // @handle
    type: 'board' | 'pieces' | 'design' | 'game';
    price: number | 'Free'; // Updated to allow 'Free' string or number
    
    // Rating system
    rating: number; // Average
    reviewCount: number;
    stars_total: number;
    stars_count: number;
    reviews: string[]; // IDs or objects, keep simple for now

    // Metadata
    views: number;
    date_published: Date;
    config_data?: any; // The logic blob (loaded lazily)
    
    // UI flags
    isNew: boolean;
    imageUrl: string;
    description: string;
}

export interface MarketplaceFilter {
    id: string;
    label: string;
    options: {
        value: string;
        label: string;
    }[];
}

export const MARKETPLACE_FILTERS: MarketplaceFilter[] = [
    {
        id: 'type',
        label: 'Type',
        options: [
            { value: 'all', label: 'All' },
            { value: 'board', label: 'Board' },
            { value: 'pieces', label: 'Pieces' },
            { value: 'design', label: 'Design' },
            { value: 'game', label: 'Game' },
        ],
    },
    {
        id: 'price',
        label: 'Price',
        options: [
            { value: 'all', label: 'All' },
            { value: 'free', label: 'Free' },
            { value: 'paid', label: 'Paid' },
        ],
    },
    {
        id: 'sort',
        label: 'Sort by',
        options: [
            { value: 'newest', label: 'Newest' },
            { value: 'rating', label: 'Rating' },
            { value: 'reviews', label: 'Reviews' },
        ],
    },
];
