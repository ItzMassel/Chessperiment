import { getTranslations } from 'next-intl/server';
import { Library, Grid3x3, Palette, Star } from 'lucide-react';
import { getUserBoardsAction, getUserPieceSetsAction } from '@/app/actions/library';
import Link from 'next/link';

export default async function UserLibrary() {
    const t = await getTranslations('Sidebar');

    // Fetch real data
    const [boards, pieces] = await Promise.all([
        getUserBoardsAction(),
        getUserPieceSetsAction()
    ]);

    const favoritesCount = [...boards, ...pieces].filter((item: any) => item.isStarred).length;

    const stats = [
        {
            icon: Grid3x3,
            label: t('boards'),
            value: boards.length,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            href: '/library?tab=boards'
        },
        {
            icon: Palette,
            label: t('designs'),
            value: pieces.length,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
            href: '/library?tab=pieces'
        },
        {
            icon: Star,
            label: t('favorites'),
            value: favoritesCount,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
            fill: true,
            href: '/library?tab=favorites'
        },
    ];

    return (
        <section className="p-6 bg-islands lg:bg-white/50 dark:lg:bg-stone-900/50 lg:backdrop-blur-sm border border-gray-200/50 dark:border-stone-700/50 rounded-3xl h-full flex flex-col">
            <div className="flex items-center gap-2 mb-5">
                <Library className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {t('yourLibrary')}
                </h2>
            </div>

            {/* Real Stats */}
            <div className="space-y-2.5 flex-1">
                {stats.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <Link
                            key={idx}
                            href={stat.href}
                            className="flex items-center justify-between p-3.5 bg-linear-to-br from-gray-50 to-white dark:from-stone-800 dark:to-stone-900 rounded-xl border border-gray-100 dark:border-stone-700 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 ${stat.bg} rounded-lg group-hover:scale-110 transition-transform`}>
                                    <Icon className={`w-4 h-4 ${stat.color} ${stat.fill ? 'fill-current' : ''}`} />
                                </div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {stat.label}
                                </span>
                            </div>
                            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {stat.value}
                            </span>
                        </Link>
                    );
                })}
            </div>

            <Link href="/library" className="w-full mt-5 py-2.5 text-center text-sm font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-xl transition-colors">
                {t('viewAll')} →
            </Link>
        </section>
    );
}
