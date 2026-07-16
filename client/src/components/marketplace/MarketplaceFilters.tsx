'use client';

import { Search } from 'lucide-react';
import { MARKETPLACE_FILTER_PILLS, SORT_OPTIONS, SortOption } from '@/lib/marketplace-types';
import { useTranslations } from 'next-intl';

interface MarketplaceFiltersProps {
    activeFilter: string;
    onFilterChange: (id: string) => void;
    sortOption: SortOption;
    onSortChange: (sort: SortOption) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
}

export function MarketplaceFilters({
    activeFilter,
    onFilterChange,
    sortOption,
    onSortChange,
    searchQuery,
    onSearchChange,
}: MarketplaceFiltersProps) {
    const t = useTranslations('Marketplace');

    return (
        <div className="flex flex-col gap-4 mb-8">
            {/* Search Bar */}
            <div className="relative w-full max-w-2xl mx-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Search size={20} />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition duration-150 ease-in-out sm:text-sm shadow-sm"
                    placeholder={t('searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            {/* Filter Pills + Sort */}
            <div className="flex flex-wrap items-center justify-center gap-2">
                {MARKETPLACE_FILTER_PILLS.map((pill) => (
                    <button
                        key={pill.id}
                        onClick={() => onFilterChange(pill.id)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                            activeFilter === pill.id
                                ? 'bg-amber-400 text-black border-amber-500 shadow-md scale-105'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                        {t(pill.labelKey as Parameters<typeof t>[0])}
                    </button>
                ))}

                <div className="h-5 border-l border-gray-300 dark:border-gray-600 mx-1" />

                <select
                    value={sortOption}
                    onChange={(e) => onSortChange(e.target.value as SortOption)}
                    className="px-3 py-1.5 rounded-full text-sm font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400/50 cursor-pointer"
                >
                    {SORT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {t(opt.labelKey as Parameters<typeof t>[0])}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
