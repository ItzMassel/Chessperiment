import { getTranslations } from 'next-intl/server';
import { Grid3x3, Crown, Star, LayoutGrid } from 'lucide-react';
import { getUserProjectsAction } from '@/app/actions/editor';
import Link from 'next/link';

export default async function UserProjects() {
    const t = await getTranslations('Sidebar');
    const projectT = await getTranslations('Projects');

    // Fetch real projects data
    const result = await getUserProjectsAction();
    const projects = result.success ? (result.data as any[]) : [];

    const totalProjects = projects.length;
    const itemsCount = projects.reduce((acc: number, p: any) => acc + (p.customPieces?.length || 0), 0);
    const favoritesCount = projects.filter((p: any) => p.isStarred).length;

    const stats = [
        {
            icon: LayoutGrid,
            label: projectT('title') || 'Projects',
            value: totalProjects,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            href: '/editor'
        },
        {
            icon: Crown,
            label: t('pieceDesigns'),
            value: itemsCount,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
            href: '/editor'
        },
        {
            icon: Star,
            label: t('favorites') || 'Favorites',
            value: favoritesCount,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
            fill: true,
            href: '/editor'
        },
    ];

    return (
        <section className="p-6 bg-islands lg:bg-white/50 dark:lg:bg-stone-900/50 lg:backdrop-blur-sm border border-gray-200/50 dark:border-stone-700/50 rounded-3xl h-full flex flex-col">
            <div className="flex items-center gap-2 mb-5">
                <Grid3x3 className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {t('yourProjects')}
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

            <Link href="/editor" className="w-full mt-5 py-2.5 text-center text-sm font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-xl transition-colors">
                {t('viewAll') || 'View All'} →
            </Link>
        </section>
    );
}
