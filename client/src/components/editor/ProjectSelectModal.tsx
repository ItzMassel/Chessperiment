'use client';

import { useState, useEffect } from 'react';
import { Project } from '@/types/Project';
import { getUserProjectsAction } from '@/app/actions/editor';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Plus, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ProjectSelectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (projectId: string) => void;
    title: string;
}

export default function ProjectSelectModal({ isOpen, onClose, onSelect, title }: ProjectSelectModalProps) {
    const t = useTranslations('Library');
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && user) {
            loadProjects();
        }
    }, [isOpen, user]);

    async function loadProjects() {
        if (!user) return;
        setLoading(true);
        try {
            const result = await getUserProjectsAction();
            if (result.success && result.data) {
                setProjects(result.data);
            }
        } catch (error) {
            console.error('Error loading projects:', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl shadow-2xl overflow-hidden border border-stone-200 dark:border-white/10"
                    >
                        <div className="p-6 border-b border-stone-100 dark:border-white/5 flex items-center justify-between bg-stone-50/50 dark:bg-white/5">
                            <h2 className="text-xl font-black text-stone-900 dark:text-white uppercase tracking-tight">
                                {title}
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-stone-200 dark:hover:bg-white/10 rounded-full transition-colors text-stone-400"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-4">
                                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                                    <span className="text-stone-400 text-sm font-bold uppercase tracking-widest">{t('loadingProjects')}</span>
                                </div>
                            ) : projects.length === 0 ? (
                                <div className="text-center py-12 px-4">
                                    <p className="text-stone-500 dark:text-stone-400 mb-6">{t('noProjectsFound')}</p>
                                    <button
                                        onClick={() => window.location.href = '/editor/new'}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-bg rounded-xl font-bold shadow-lg shadow-amber-500/20 hover:scale-105 transition-transform"
                                    >
                                        <Plus size={18} />
                                        {t('createNewProject')}
                                    </button>
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {projects.map((project) => (
                                        <button
                                            key={project.id}
                                            onClick={() => onSelect(project.id!)}
                                            className="group flex items-center justify-between p-4 rounded-2xl bg-stone-50 dark:bg-white/5 hover:bg-amber-500 dark:hover:bg-amber-500 border border-stone-200 dark:border-white/10 hover:border-amber-400 transition-all text-left"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-stone-900 dark:text-white group-hover:text-bg transition-colors truncate">
                                                        {project.name}
                                                    </span>
                                                    {project.isStarred && <Star size={12} className="fill-amber-400 text-amber-400 group-hover:text-bg group-hover:fill-bg" />}
                                                </div>
                                                <p className="text-xs text-stone-400 group-hover:text-bg/60 transition-colors truncate">
                                                    {project.rows}×{project.cols} • {project.customPieces.length} pieces
                                                </p>
                                            </div>
                                            <Plus size={18} className="text-stone-300 group-hover:text-bg transition-colors" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-stone-50 dark:bg-white/5 border-t border-stone-100 dark:border-white/5">
                            <p className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase tracking-widest text-center">
                                {t('importWarning')}
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
