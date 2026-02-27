'use client';

import { MarketplaceItem } from '@/lib/marketplace-types';
import Image from 'next/image';
import { Star, Gamepad2 } from 'lucide-react';

interface MarketplaceItemCardProps {
    item: MarketplaceItem;
}

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

export function MarketplaceItemCard({ item }: MarketplaceItemCardProps) {
    const t = useTranslations('Marketplace');
    return (
        <Link href={`/marketplace/${item.id}`} className="block group h-full">
            <div className="flex flex-col gap-2 p-2 bg-islands dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-xl transition-all hover:bg-gray-50 dark:hover:bg-white/10 hover:shadow-md cursor-pointer h-full">
                {/* Thumbnail */}
                <div className="aspect-square w-full bg-gray-100 dark:bg-gray-700/50 rounded-lg overflow-hidden relative">
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500 font-bold text-sm">
                        {item.imageUrl ? (
                            <Image src={item.imageUrl} alt={item.title} fill className="object-cover" />
                        ) : (
                            <Gamepad2 size={48} className="text-gray-300 dark:text-gray-600" />
                        )}
                    </div>
                    {item.isNew && (
                        <div className="absolute top-2 right-2 bg-yellow-400 text-black text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md shadow-sm">
                            {t('new')}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex flex-col gap-0.5 px-1 flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-gray-200 truncate" title={item.title}>
                        {item.title}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {item.creator_handle}
                    </p>

                    <div className="flex justify-between items-end mt-auto pt-2">
                        <div className="flex items-center gap-0.5 text-yellow-600 dark:text-yellow-500">
                            <Star size={12} fill="currentColor" />
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{item.rating}</span>
                            <span className="text-[10px] text-gray-400">({item.stars_count})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                <span>👁️</span> {item.views}
                            </div>
                            <div className="font-bold text-sm text-gray-900 dark:text-white">
                                {item.price === 0 || item.price === 'Free' ? t('free') : `$${item.price}`}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
