'use client';

import { Project } from '@/types/Project';
import ProjectCard from './ProjectCard';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProjectListProps {
    projects: Project[];
    onToggleStar: (projectId: string) => void;
    onDelete: (projectId: string) => void;
    onCreateNew: () => void;
    onPublish: (projectId: string) => void;
}

export default function ProjectList({ projects, onToggleStar, onDelete, onCreateNew, onPublish }: ProjectListProps) {
    const t = useTranslations('Editor');

    if (projects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm flex items-center justify-center mb-6">
                    <Plus className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">{t('noProjects')}</h3>
                <p className="text-gray-500 mb-8 max-w-xs text-center">{t('noProjectsDescription')}</p>
                <button
                    onClick={onCreateNew}
                    className="flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-bold transition-all shadow-lg shadow-accent/25 hover:shadow-accent/40 active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    {t('createFirstProject')}
                </button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Create New Project Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={onCreateNew}
                className="group relative bg-gray-50 dark:bg-gray-800/30 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-accent dark:hover:border-accent hover:bg-accent/5 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center p-8 min-h-[200px] h-full"
            >
                <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-180 transition-all duration-500 group-hover:shadow-accent/25 group-hover:shadow-lg border border-gray-100 dark:border-gray-700">
                    <Plus className="w-8 h-8 text-gray-400 group-hover:text-accent transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-accent transition-colors">
                    {t('newProject')}
                </h3>
                <p className="text-sm text-gray-500 text-center max-w-[200px]">
                    {t('noProjectsDescription').split('.')[0]}
                </p>
            </motion.div>

            {projects.map((project) => (
                <ProjectCard
                    key={project.id}
                    project={project}
                    onToggleStar={onToggleStar}
                    onDelete={onDelete}
                    onPublish={onPublish}
                />
            ))}
        </div>
    );
}
