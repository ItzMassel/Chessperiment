'use client';

import { Project } from '@/types/Project';
import { Star, Trash2, Share2, Box, Grid3X3 } from 'lucide-react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';

interface ProjectCardProps {
    project: Project;
    onToggleStar: (projectId: string) => void;
    onDelete: (projectId: string) => void;
    onPublish: (projectId: string) => void;
}

export default function ProjectCard({ project, onToggleStar, onDelete, onPublish }: ProjectCardProps) {
    const t = useTranslations('Editor');
    const locale = useLocale();
    // Generate a deterministed gradient based on project ID or name
    const gradients = [
        "from-blue-500/10 to-cyan-500/10 border-blue-500/20",
        "from-purple-500/10 to-pink-500/10 border-purple-500/20",
        "from-emerald-500/10 to-teal-500/10 border-emerald-500/20",
        "from-amber-500/10 to-orange-500/10 border-amber-500/20",
        "from-indigo-500/10 to-violet-500/10 border-indigo-500/20",
    ];

    // Simple hash to pick a gradient
    const hash = (project.name || "").split("").reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
    const gradientClass = gradients[Math.abs(hash) % gradients.length];
    const iconColorClass = gradientClass.split(" ")[0].replace("from-", "text-").replace("/10", "");

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`group relative bg-white dark:bg-gray-800/50 rounded-2xl shadow-sm border hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full hover:-translate-y-1 ${gradientClass}`}
        >
            {/* Header / Decoration */}
            <div className={`absolute top-0 left-0 w-full h-1 bg-linear-to-r ${gradientClass.replace('border-', 'from-').replace(' to-', ' to-')}`} />

            <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0 mr-4">
                        <Link href={`/${locale}/editor/${project.id}`}>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-accent transition-colors truncate">
                                {project.name}
                            </h3>
                        </Link>
                        <p className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-wider">
                            {t('lastEdited')} {new Date(project.updatedAt).toLocaleDateString()}
                        </p>
                    </div>

                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            onToggleStar(project.id!);
                        }}
                        className={`p-2 rounded-xl transition-all duration-200 ${project.isStarred
                            ? 'bg-yellow-400/10 text-yellow-500'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                    >
                        <Star className={`w-5 h-5 ${project.isStarred ? 'fill-yellow-500' : ''}`} />
                    </button>
                </div>

                {project.description ? (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 line-clamp-2 leading-relaxed flex-1">
                        {project.description}
                    </p>
                ) : (
                    <div className="flex-1" />
                )}

                <div className="flex items-center gap-3 mb-6 mt-auto">
                    <div className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 text-xs font-medium flex items-center gap-1.5">
                        <Grid3X3 size={14} className="opacity-70" />
                        {project.rows} × {project.cols}
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 text-xs font-medium flex items-center gap-1.5">
                        <Box size={14} className="opacity-70" />
                        {project.customPieces.length} {t('piecesCount')}
                    </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-700/50">
                    <Link
                        href={`/${locale}/editor/${project.id}/board-editor`}
                        className="flex-1 text-center py-2.5 px-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 text-sm font-bold transition-all shadow-lg shadow-gray-200 dark:shadow-none"
                    >
                        {t('editBoard')}
                    </Link>

                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            onPublish(project.id!);
                        }}
                        className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold transition-all shadow-lg shadow-blue-500/30"
                    >
                        <Share2 className="w-4 h-4" />
                        Publish
                    </button>

                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            onDelete(project.id!);
                        }}
                        className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700/50 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors"
                        title={t('deleteProject')}
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
