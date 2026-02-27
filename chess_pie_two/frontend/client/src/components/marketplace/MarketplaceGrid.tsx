'use client';

import { useState, useEffect } from 'react';
import { getMarketplaceItems } from '@/lib/marketplace-data';
import { MarketplaceItem, MarketplaceFilter, MARKETPLACE_FILTERS } from '@/lib/marketplace-types';
import { MarketplaceItemCard } from './MarketplaceItemCard';
import { MarketplaceFilters } from './MarketplaceFilters';
import { useTranslations } from 'next-intl';

export function MarketplaceGrid() {
    const [items, setItems] = useState<MarketplaceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const t = useTranslations('Marketplace');

    useEffect(() => {
        async function fetchItems() {
            setLoading(true);
            try {
                const data = await getMarketplaceItems();
                setItems(data);
            } catch (error) {
                console.error("Failed to load marketplace items", error);
            } finally {
                setLoading(false);
            }
        }
        fetchItems();
    }, []);

    const filteredItems = items.filter((item) => {
        const matchesFilter =
            activeFilter === 'all' ||
            (activeFilter === 'free' ? (item.price === 0 || item.price === 'Free') : false) ||
            (activeFilter === 'paid' ? (typeof item.price === 'number' && item.price > 0) : false) ||
            item.type === activeFilter;

        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.creator_handle.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <MarketplaceFilters
                filters={MARKETPLACE_FILTERS}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            />

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    {/* Simple loading spinner or skeleton could go here */}
                    <div className="animate-pulse text-amber-400 font-bold">{t('loading')}</div>
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-xl text-gray-500">{t('noResults')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                    {filteredItems.map((item) => (
                        <MarketplaceItemCard key={item.id} item={item} />
                    ))}
                </div>
            )}
        </div>
    );
}
