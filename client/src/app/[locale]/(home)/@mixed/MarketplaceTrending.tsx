import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { TrendingUp, Star } from 'lucide-react';
import { getMarketplaceItems } from '@/lib/marketplace-data';

const typeColors = {
    board: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    pieces: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    game: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
};

export default async function MarketplaceTrending() {
    const t = await getTranslations('Sidebar');
    const allItems = await getMarketplaceItems();
    const items = allItems.sort((a, b) => b.views - a.views).slice(0, 3);

    return (
        <section className="p-6 bg-islands lg:bg-white/50 dark:lg:bg-stone-900/50 lg:backdrop-blur-sm border border-gray-200/50 dark:border-stone-700/50 rounded-3xl h-full flex flex-col">
            <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {t('trending')}
                </h2>
            </div>

            <div className="space-y-3 flex-1">
                {items.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">{t('noItems')}</p>
                ) : items.map((item) => (
                    <Link
                        key={item.id}
                        href={`/marketplace/${item.id}`}
                        className="group block p-3 rounded-xl hover:bg-white/40 dark:hover:bg-stone-800/40 transition-colors"
                    >
                        <div className="flex gap-3 items-center">
                            <div className="w-12 h-12 bg-linear-to-br from-gray-100 to-gray-50 dark:from-stone-800 dark:to-stone-900 rounded-xl flex items-center justify-center shrink-0 text-xl">
                                {item.type === 'game' ? '♟' : item.type === 'board' ? '⬜' : '♞'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate mb-1.5">
                                    {item.title}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${typeColors[item.type as keyof typeof typeColors] || ''}`}>
                                        {t(item.type as 'board' | 'pieces' | 'game')}
                                    </span>
                                    <span className="flex items-center gap-1 text-xs text-gray-500">
                                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                        {item.rating || '—'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <Link
                href="/marketplace"
                className="w-full mt-5 py-2.5 text-sm font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-xl transition-colors text-center block"
            >
                {t('exploreMarketplace')} →
            </Link>
        </section>
    );
}