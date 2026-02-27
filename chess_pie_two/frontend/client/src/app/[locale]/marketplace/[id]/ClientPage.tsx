'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { Star, ArrowLeft, User, Gamepad2, Globe, Eye } from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import { MarketplaceItem } from '@/lib/marketplace-types';
import { incrementView, rateItem } from '@/app/actions/marketplace';
import { useTranslations } from 'next-intl';

interface ClientPageProps {
    item: MarketplaceItem;
}

export default function ClientPage({ item }: ClientPageProps) {
    const router = useRouter();
    const t = useTranslations('Marketplace');

    useEffect(() => {
        incrementView(item.id);
    }, [item.id]);

    const handlePlayLocal = () => {
        router.push(`/play?marketplaceId=${item.id}&mode=local`);
    };

    const handlePlayOnline = () => {
        const roomId = Math.random().toString(36).substring(2, 12);
        router.push(`/play?marketplaceId=${item.id}&mode=online&roomId=${roomId}`);
    };

    const handleRate = async (rating: number) => {
        try {
            await rateItem(item.id, rating);
            router.refresh();
        } catch (error) {
            console.error("Failed to rate", error);
        }
    };

    return (
        <main className="min-h-screen bg-bg pt-8 pb-20 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Back Button */}
                <Link href="/marketplace" className="inline-flex items-center gap-2 text-gray-500 hover:text-amber-400 mb-6 transition-colors font-medium">
                    <ArrowLeft size={20} />
                    {t('backToMarketplace')}
                </Link>

                {/* Content Grid */}
                <div className="grid md:grid-cols-2 gap-8 md:gap-12">

                    {/* Left: Image */}
                    <div className="aspect-square bg-gray-200 dark:bg-gray-800 rounded-3xl overflow-hidden relative shadow-2xl border border-gray-200 dark:border-gray-700">
                        {item.imageUrl ? (
                            <Image
                                src={item.imageUrl}
                                alt={item.title}
                                fill
                                className="object-cover"
                                priority
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-bold text-xl">
                                {t('noImage')}
                            </div>
                        )}
                        {item.isNew && (
                            <div className="absolute top-4 left-4 bg-yellow-400 text-black font-black uppercase tracking-wider text-xs px-3 py-1 rounded-full shadow-lg">
                                {t('newArrival')}
                            </div>
                        )}
                    </div>

                    {/* Right: Info */}
                    <div className="flex flex-col">
                        <div className="mb-2">
                            <span className="text-amber-500 font-bold text-sm tracking-wide uppercase px-2 py-1 bg-amber-500/10 rounded-md">
                                {item.type}
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-black text-gray-800 dark:text-white mb-2 leading-tight">
                            {item.title}
                        </h1>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
                                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                                    <User size={14} className="text-gray-600" />
                                </div>
                                <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                                    {item.creator_handle}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 text-yellow-500 font-bold group relative">
                                <Star fill="currentColor" size={18} />
                                <span>{item.rating}</span>
                                <span className="text-gray-400 font-normal text-sm">({item.stars_count})</span>

                                {/* Hover Rating Input */}
                                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:flex bg-white dark:bg-stone-800 p-2 rounded-lg shadow-xl gap-1 z-10">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => handleRate(star)}
                                            className="hover:scale-110 transition-transform text-gray-300 hover:text-yellow-500"
                                        >
                                            <Star size={16} fill="currentColor" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-gray-400 text-sm">
                                <Eye size={16} />
                                <span>{item.views}</span>
                            </div>
                        </div>

                        <div className="prose dark:prose-invert text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                            {item.description || t('noDescription')}
                        </div>

                        <div className="mt-auto space-y-4">
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-800">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-gray-500 dark:text-gray-400 font-medium">{t('price')}</span>
                                    <span className="text-3xl font-black text-gray-800 dark:text-white">
                                        {item.price === 0 || item.price === 'Free' ? t('free') : `$${item.price}`}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={handlePlayLocal}
                                        className="bg-amber-400 hover:bg-amber-300 text-bg text-lg font-bold py-4 rounded-xl transition-all transform active:scale-[0.98] shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2"
                                    >
                                        <Gamepad2 size={24} />
                                        {t('playLocal')}
                                    </button>
                                    <button
                                        onClick={handlePlayOnline}
                                        className="bg-stone-800 hover:bg-stone-700 text-white text-lg font-bold py-4 rounded-xl transition-all transform active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 border border-stone-700"
                                    >
                                        <Globe size={24} />
                                        {t('playFriend')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
