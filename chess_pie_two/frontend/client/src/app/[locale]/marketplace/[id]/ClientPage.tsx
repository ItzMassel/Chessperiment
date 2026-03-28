'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Star, ArrowLeft, User, Gamepad2, Globe, Eye, GitFork, Loader2 } from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import { MarketplaceItem, Review } from '@/lib/marketplace-types';
import { incrementView, forkMarketplaceItem } from '@/app/actions/marketplace';
import { useAuth } from '@/context/AuthContext';
import ReviewSection from '@/components/marketplace/ReviewSection';
import { ReportModal } from '@/components/marketplace/ReportModal';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

interface ClientPageProps {
    item: MarketplaceItem;
    reviews: Review[];
}

export default function ClientPage({ item, reviews }: ClientPageProps) {
    const router = useRouter();
    const { user } = useAuth();
    const t = useTranslations('Marketplace');
    const [forking, setForking] = useState(false);

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

    const handleFork = async () => {
        if (!user) {
            toast.error(t('fork.loginRequired'));
            return;
        }
        setForking(true);
        try {
            const result = await forkMarketplaceItem(item.id);
            if (result.success) {
                toast.success(t('fork.success', { creator: item.creator_handle }));
                if (result.itemType === 'game') {
                    router.push(`/editor/${result.newItemId}`);
                } else {
                    router.push('/library');
                }
            } else {
                toast.error(result.error || t('fork.failed'));
            }
        } catch {
            toast.error(t('fork.failed'));
        } finally {
            setForking(false);
        }
    };

    const creatorHandleClean = item.creator_handle?.replace('@', '') || '';

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

                        {/* Fork attribution */}
                        {item.forkedFrom && (
                            <p className="text-sm text-gray-400 mb-2">
                                {t('fork.basedOn')}{' '}
                                <Link href={`/u/${item.forkedFrom.creatorHandle.replace('@', '')}`} className="text-amber-500 hover:underline">
                                    {item.forkedFrom.creatorHandle}
                                </Link>
                            </p>
                        )}

                        <div className="flex items-center gap-4 mb-6 flex-wrap">
                            {/* Creator link */}
                            <Link href={`/u/${creatorHandleClean}`} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                                    <User size={14} className="text-gray-600" />
                                </div>
                                <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                                    {item.creator_handle}
                                </span>
                            </Link>

                            {/* Rating (links to reviews) */}
                            <a href="#reviews" className="flex items-center gap-1 text-yellow-500 font-bold hover:opacity-80 transition-opacity">
                                <Star fill="currentColor" size={18} />
                                <span>{item.rating || 0}</span>
                                <span className="text-gray-400 font-normal text-sm">({item.reviewCount || 0})</span>
                            </a>

                            <div className="flex items-center gap-1 text-gray-400 text-sm">
                                <Eye size={16} />
                                <span>{item.views}</span>
                            </div>

                            {(item.forkCount || 0) > 0 && (
                                <div className="flex items-center gap-1 text-gray-400 text-sm">
                                    <GitFork size={16} />
                                    <span>{item.forkCount}</span>
                                </div>
                            )}
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

                                {/* Action buttons based on type */}
                                {item.type === 'game' ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={handlePlayLocal}
                                            className="bg-amber-400 hover:bg-amber-300 text-black text-lg font-bold py-4 rounded-xl transition-all transform active:scale-[0.98] shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2"
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
                                ) : (
                                    <div className="text-center text-sm text-gray-400 py-2">
                                        {item.type === 'board' ? t('fork.importBoard') : t('fork.importPieces')}
                                    </div>
                                )}

                                {/* Fork / Remix button */}
                                <button
                                    onClick={handleFork}
                                    disabled={forking}
                                    className="w-full mt-3 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {forking ? <Loader2 size={16} className="animate-spin" /> : <GitFork size={16} />}
                                    {item.type === 'game' ? t('fork.forkToEditor') : t('fork.importToLibrary')}
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <ReportModal marketplaceId={item.id} itemTitle={item.title} />
                        </div>
                    </div>
                </div>

                {/* Reviews Section */}
                <ReviewSection marketplaceId={item.id} initialReviews={reviews} />
            </div>
        </main>
    );
}