"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Box, Library, ChevronRight, Loader2 } from 'lucide-react';
import { PieceSet } from '@/types/firestore';
import { savePieceSetAction, getUserPieceSetsAction } from '@/app/actions/library';
import { useTranslations } from 'next-intl';

interface SaveToSetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectSet: (setId: string) => void;
    currentPieceName: string;
}

export default function SaveToSetModal({ isOpen, onClose, onSelectSet, currentPieceName }: SaveToSetModalProps) {
    const t = useTranslations('Editor.Piece.saveToSetModal');
    const [sets, setSets] = useState<(PieceSet & { id: string })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newSetName, setNewSetName] = useState('My New Set');
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadSets();
        }
    }, [isOpen]);

    const loadSets = async () => {
        setIsLoading(true);
        try {
            const data = await getUserPieceSetsAction();
            setSets(data as any);
        } catch (e) {
            setError(t('failedToLoadSets'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateSet = async () => {
        if (!newSetName.trim()) return;
        setIsCreating(true);
        try {
            const setId = await savePieceSetAction({
                name: newSetName,
                description: "A new collection of custom pieces.",
                isStarred: false
            });
            onSelectSet(setId);
            onClose();
        } catch (e) {
            setError(t('failedToCreateSet'));
        } finally {
            setIsCreating(false);
        }
    };

    const filteredSets = sets.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative w-full max-w-xl bg-white dark:bg-stone-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-stone-200 dark:border-white/10"
                    >
                        {/* Header */}
                        <div className="p-8 pb-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-3xl font-black text-stone-900 dark:text-white uppercase tracking-tight">
                                    {t('title')}
                                </h3>
                                <p className="text-stone-500 dark:text-white/40 text-sm font-bold uppercase tracking-widest mt-1">
                                    {t('selectSet')} <span className="text-amber-500">{currentPieceName}</span>
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-3 rounded-2xl bg-stone-100 dark:bg-white/5 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 pt-4 space-y-8">
                            {/* Create New Set Section */}
                            <div className="space-y-4">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-stone-900 dark:text-white/30 ml-1">
                                    {t('createNewSet')}
                                </label>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={newSetName}
                                        onChange={(e) => setNewSetName(e.target.value)}
                                        placeholder={t('setName')}
                                        className="flex-1 bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-2xl px-6 py-4 text-stone-900 dark:text-white placeholder:text-stone-300 dark:placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-bold"
                                        onKeyDown={(e) => e.key === 'Enter' && handleCreateSet()}
                                    />
                                    <button
                                        onClick={handleCreateSet}
                                        disabled={isCreating || !newSetName.trim()}
                                        className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white dark:text-bg p-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center min-w-[64px]"
                                    >
                                        {isCreating ? <Loader2 className="animate-spin" /> : <Plus size={24} />}
                                    </button>
                                </div>
                            </div>

                            <div className="h-px bg-stone-100 dark:bg-white/5" />

                            {/* Existing Sets Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-stone-900 dark:text-white/30 ml-1">
                                        {t('chooseExistingSet')}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder={t('searchSets')}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-stone-900 dark:text-white/40 focus:outline-none border-b border-stone-200 dark:border-white/10 py-1"
                                        />
                                    </div>
                                </div>

                                <div className="max-h-[280px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                                    {isLoading ? (
                                        <div className="py-12 flex flex-col items-center justify-center text-stone-400 dark:text-white/20">
                                            <Loader2 size={32} className="animate-spin mb-4" />
                                            <p className="text-xs font-black uppercase tracking-widest">{t('loadingSets')}</p>
                                        </div>
                                    ) : filteredSets.length > 0 ? (
                                        filteredSets.map(set => (
                                            <button
                                                key={set.id}
                                                onClick={() => onSelectSet(set.id)}
                                                className="w-full flex items-center justify-between p-5 bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/5 rounded-3xl hover:border-amber-500/50 hover:bg-stone-100 dark:hover:bg-white/10 transition-all group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                                                        <Box size={24} />
                                                    </div>
                                                    <div className="text-left">
                                                        <h4 className="font-black text-stone-900 dark:text-white uppercase tracking-tight group-hover:text-amber-500 transition-colors">
                                                            {set.name}
                                                        </h4>
                                                        <p className="text-[10px] text-stone-900/60 dark:text-white/20 font-bold uppercase tracking-widest">
                                                            {set.description || t('existingCollection')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <ChevronRight size={20} className="text-stone-300 dark:text-white/10 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                                            </button>
                                        ))
                                    ) : (
                                        <div className="py-12 bg-stone-50 dark:bg-white/5 rounded-3xl border border-dashed border-stone-200 dark:border-white/10 text-center">
                                            <Library size={32} className="mx-auto text-stone-200 dark:text-white/10 mb-4" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-stone-900 dark:text-white/20">
                                                {t('noSetsFound')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-500/10 border-t border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest text-center">
                                {error}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
