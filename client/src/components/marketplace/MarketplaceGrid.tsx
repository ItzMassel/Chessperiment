'use client';

import { useState, useEffect, useCallback } from 'react';
import { getMarketplaceItems, searchMarketplaceItems } from '@/lib/marketplace-data';
import { MarketplaceItem, SortOption } from '@/lib/marketplace-types';
import { MarketplaceItemCard } from './MarketplaceItemCard';
import { MarketplaceFilters } from './MarketplaceFilters';
import { useTranslations } from 'next-intl';

export function MarketplaceGrid() {
    const [items, setItems] = useState<MarketplaceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const [sortOption, setSortOption] = useState<SortOption>('newest');
    const [searchQuery, setSearchQuery] = useState('');
    const t = useTranslations('Marketplace');

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const type = ['game', 'board', 'pieces'].includes(activeFilter)
                ? (activeFilter as 'game' | 'board' | 'pieces')
                : undefined;

            if (searchQuery.trim()) {
                const data = await searchMarketplaceItems(searchQuery, type);
                setItems(data);
            } else {
                const data = await getMarketplaceItems({ type, sort: sortOption });
                setItems(data);
            }
        } catch (error) {
            console.error("Failed to load marketplace items", error);
        } finally {
            setLoading(false);
        }
    }, [activeFilter, sortOption, searchQuery]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const validItems = items.filter((item) => item.id && item.type);

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <MarketplaceFilters
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                sortOption={sortOption}
                onSortChange={setSortOption}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            />

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-pulse text-amber-400 font-bold">{t('loading')}</div>
                </div>
            ) : validItems.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-xl text-gray-500">{t('noResults')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                    {validItems.map((item) => (
                        <MarketplaceItemCard key={item.id} item={item} />
                    ))}
                </div>
            )}
        </div>
    );
}
