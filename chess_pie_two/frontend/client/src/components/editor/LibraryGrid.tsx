"use client";
import React, { useState } from 'react';
import { Star, Trash2, LayoutGrid, Calendar, MoreVertical, Play, Edit2, Shield, Layout, Box, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SavedBoard, PieceSet } from '@/types/firestore';
import { toggleBoardStarAction, deleteBoardAction, togglePieceSetStarAction, deletePieceSetAction } from '@/app/actions/library';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import PublishModal from '@/components/marketplace/PublishModal';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

type LibraryItem = (SavedBoard & { _type: 'board' }) | (PieceSet & { _type: 'set' });

// export default function LibraryGrid({ initialBoards, initialSets }: { initialBoards: SavedBoard[], initialSets: PieceSet[] }) {
export default function LibraryGrid({ initialBoards, initialSets }: { initialBoards: SavedBoard[], initialSets: any }) {

    const t = useTranslations('Library');
    const { user } = useAuth();
    const [publishTarget, setPublishTarget] = useState<{ type: 'board' | 'pieces'; id: string; name: string; description?: string } | null>(null);

    const handlePublish = (item: LibraryItem) => {
        if (!user) {
            toast.error("You must be logged in to publish.");
            return;
        }
        setPublishTarget({
            type: item._type === 'board' ? 'board' : 'pieces',
            id: item.id!,
            name: item.name,
            description: item.description,
        });
    };

    const [items, setItems] = useState<LibraryItem[]>(() => {
        const boards = (initialBoards || []).map(b => ({
            ...b,
            createdAt: b.createdAt ? new Date(b.createdAt) : new Date(),
            updatedAt: b.updatedAt ? new Date(b.updatedAt) : new Date(),
            _type: 'board' as const
        }));
        const sets = (initialSets || []).map((s: any) => ({
            ...s,
            createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
            updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
            _type: 'set' as const
        }));
        return [...boards, ...sets].sort((a, b) => {
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [showOnlyStarred, setShowOnlyStarred] = useState(false);
    const router = useRouter();

    const handleToggleStar = async (id: string, type: 'board' | 'set') => {
        try {
            const result = type === 'board'
                ? await toggleBoardStarAction(id)
                : await togglePieceSetStarAction(id);

            const isNowStarred = result ?? false;

            setItems(prev => prev.map(item => {
                if (item.id === id && item._type === type) {
                    return { ...item, isStarred: isNowStarred } as LibraryItem;
                }
                return item;
            }).sort((a, b) => {
                if (a.isStarred !== b.isStarred) return b.isStarred ? 1 : -1;
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            }));
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: string, type: 'board' | 'set') => {
        if (!confirm(t('deleteConfirm'))) return;
        try {
            if (type === 'board') {
                await deleteBoardAction(id);
            } else {
                await deletePieceSetAction(id);
            }
            setItems(prev => prev.filter(item => !(item.id === id && item._type === type)));
        } catch (error) {
            console.error(error);
        }
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStar = showOnlyStarred ? item.isStarred : true;
        return matchesSearch && matchesStar;
    });

    const starredItems = filteredItems.filter(item => item.isStarred);
    const regularItems = filteredItems.filter(item => !item.isStarred);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-stone-900/50 p-4 rounded-2xl border border-stone-200 dark:border-white/10 backdrop-blur-md">
                <div className="relative w-full md:max-w-md">
                    <input
                        type="text"
                        placeholder={t('search')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                    />
                </div>
                <button
                    onClick={() => setShowOnlyStarred(!showOnlyStarred)}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${showOnlyStarred
                        ? 'bg-amber-500 text-bg shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                        : 'bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-white/60 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-white/10 border border-stone-200 dark:border-white/10'
                        }`}
                >
                    <Star size={18} fill={showOnlyStarred ? 'currentColor' : 'none'} />
                    {t('starOnly')}
                </button>
            </div>

            {filteredItems.length === 0 ? (
                <div className="text-center py-20 bg-stone-100 dark:bg-white/5 rounded-3xl border border-dashed border-stone-200 dark:border-white/10">
                    <LayoutGrid size={48} className="mx-auto text-stone-300 dark:text-white/10 mb-4" />
                    <p className="text-stone-500 dark:text-white/40 font-medium">{t('noBoards')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {starredItems.map(item => (
                            <LibraryCard
                                key={`${item._type}-${item.id}`}
                                item={item}
                                onToggleStar={() => handleToggleStar(item.id!, item._type)}
                                onDelete={() => handleDelete(item.id!, item._type)}
                                onPublish={() => handlePublish(item)}
                                t={t as any}
                            />
                        ))}
                        {regularItems.map(item => (
                            <LibraryCard
                                key={`${item._type}-${item.id}`}
                                item={item}
                                onToggleStar={() => handleToggleStar(item.id!, item._type)}
                                onDelete={() => handleDelete(item.id!, item._type)}
                                onPublish={() => handlePublish(item)}
                                t={t as any}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}
            {publishTarget && (
                <PublishModal
                    open={!!publishTarget}
                    onClose={() => setPublishTarget(null)}
                    itemType={publishTarget.type}
                    itemId={publishTarget.id}
                    defaultTitle={publishTarget.name}
                    defaultDescription={publishTarget.description}
                />
            )}
        </div>
    );
}

function LibraryCard({ item, onToggleStar, onDelete, onPublish, t }: { item: LibraryItem, onToggleStar: () => void, onDelete: () => void, onPublish: () => void, t: (key: string) => string }) {
    const router = useRouter();
    const isBoard = item._type === 'board';

    const formatDate = (date: any) => {
        if (!date) return "";
        const d = date instanceof Date ? date : (date as any).toDate?.() || new Date(date);
        return d.toLocaleDateString();
    };

    const handlePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        router.push('/editor');
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        router.push('/editor');
    };

    const handleStarClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleStar();
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete();
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={() => router.push(`/library/${item.id}`)}
            className="group relative bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 rounded-2xl overflow-hidden hover:border-amber-500/50 transition-all duration-500 shadow-xl cursor-pointer"
        >
            {/* Type Badge */}
            <div className={`absolute top-0 left-0 px-3 py-1 rounded-br-xl text-[10px] font-black uppercase tracking-widest z-10 flex items-center gap-1.5 ${isBoard ? 'bg-amber-500 text-bg' : 'bg-green-500 text-white'
                }`}>
                {isBoard ? <Layout size={10} /> : <Box size={10} />}
                {isBoard ? t('itemTypeBoard') : 'Set'}
            </div>


            <div className="p-6 pt-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-stone-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                            {item.name}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-stone-400 dark:text-white/40 text-[10px] font-black uppercase tracking-widest">
                            <span className="flex items-center gap-1">
                                {isBoard ? (
                                    <><LayoutGrid size={10} /> {(item as SavedBoard).gridType === 'hex' ? `Radius ${Math.floor(Math.max(item.rows, item.cols) / 2)}` : `${item.cols}x${item.rows}`}</>
                                ) : (
                                    <><Box size={10} /> Piece Set</>
                                )}
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar size={10} /> {formatDate(item.updatedAt)}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onToggleStar}
                        className={`p-2 rounded-full transition-all ${item.isStarred
                            ? 'text-amber-500 bg-amber-500/10'
                            : 'text-stone-300 dark:text-white/20 hover:text-stone-600 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/10'
                            }`}
                    >
                        <Star size={20} fill={item.isStarred ? 'currentColor' : 'none'} />
                    </button>
                </div>

                <div className="flex gap-2 mt-6">
                    <button
                        onClick={handlePlay}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-bg py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                    >
                        {isBoard ? <Play size={16} fill="currentColor" /> : <Edit2 size={16} />}
                        {isBoard ? 'Play' : 'Edit'}
                    </button>
                    {isBoard && (
                        <button
                            onClick={handleEdit}
                            className="p-2.5 bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 text-stone-600 dark:text-white border border-stone-200 dark:border-white/10 rounded-xl transition-all"
                            title="Edit Board"
                        >
                            <Edit2 size={18} />
                        </button>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); onPublish(); }}
                        className="p-2.5 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white border border-blue-500/20 rounded-xl transition-all"
                        title="Publish to Marketplace"
                    >
                        <Share2 size={18} />
                    </button>
                    <button
                        onClick={handleDeleteClick}
                        className="p-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-xl transition-all"
                        title={isBoard ? "Delete Board" : "Delete Piece"}
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            {/* Hover Glow */}
            <div className="absolute inset-0 bg-linear-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </motion.div>
    );
}
