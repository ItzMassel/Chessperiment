'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Project } from '@/types/Project';
import { saveProjectAction } from '@/app/actions/editor';
import { LocalProjectStore } from '@/lib/local-persistence';
import { Loader2, ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function PageClient() {
    const t = useTranslations('Editor');
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        rows: 8,
        cols: 8,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSaving) return;

        setIsSaving(true);
        try {
            const newProject: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> = {
                userId: user?.uid || 'guest',
                name: formData.name || t('unnamedProject'),
                description: formData.description,
                rows: formData.rows,
                cols: formData.cols,
                gridType: 'square',
                activeSquares: Array.from({ length: formData.rows * formData.cols }, (_, i) => {
                    const r = Math.floor(i / formData.cols);
                    const c = i % formData.cols;
                    return `${c},${r}`;
                }),
                placedPieces: {},
                isStarred: false,
                customPieces: []
            };

            if (user) {
                const result = await saveProjectAction(newProject as Project);
                if (result.success && result.projectId) {
                    router.push(`/editor/${result.projectId}/board-editor`);
                } else {
                    console.error('Failed to create project:', result.error);
                    setIsSaving(false);
                }
            } else {
                const projectId = LocalProjectStore.saveProject(newProject);
                router.push(`/editor/${projectId}/board-editor`);
            }
        } catch (error) {
            console.error('Error creating project:', error);
            setIsSaving(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-32 max-w-2xl">
            <Link
                href="/editor"
                className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-8"
            >
                <ArrowLeft className="w-4 h-4" />
                {t('backToProjects')}
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-8"
            >
                <h1 className="text-3xl font-black mb-8">{t('newProject')}</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
                            {t('projectNameLabel')}
                        </label>
                        <input
                            type="text"
                            required
                            placeholder={t('projectNamePlaceholder')}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-accent outline-none transition-all"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
                            {t('descriptionLabel')}
                        </label>
                        <textarea
                            placeholder={t('descriptionPlaceholder')}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-accent outline-none transition-all h-24 resize-none"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
                                {t('rowsLabel')}
                            </label>
                            <input
                                type="number"
                                min="2"
                                max="32"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-accent outline-none transition-all"
                                value={formData.rows}
                                onChange={(e) => setFormData({ ...formData, rows: parseInt(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
                                {t('colsLabel')}
                            </label>
                            <input
                                type="number"
                                min="2"
                                max="32"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-accent outline-none transition-all"
                                value={formData.cols}
                                onChange={(e) => setFormData({ ...formData, cols: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-accent hover:bg-accent-hover text-white rounded-xl font-bold transition-all shadow-lg shadow-accent/25 hover:shadow-accent/40 active:scale-95 disabled:opacity-50"
                    >
                        {isSaving ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Plus className="w-5 h-5" />
                                {t('createProject')}
                            </>
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
