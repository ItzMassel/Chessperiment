"use client";
import React from 'react';
import { ChevronLeft, Edit2, Box, Calendar, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { CustomPiece, PieceSet } from '@/types/firestore';
import PieceRenderer from '@/components/game/PieceRenderer';
import { useRouter } from 'next/navigation';

interface SetDetailClientProps {
    set: PieceSet & { id: string };
    pieces: (CustomPiece & { id: string })[];
    locale: string;
    translations: {
        details: string;
        lastUpdated: string;
        edit: string;
        backToLibrary: string;
    };
}

export default function SetDetailClient({ set, pieces, locale, translations }: SetDetailClientProps) {
    const router = useRouter();

    const formatDate = (date: any) => {
        if (!date) return "";
        const d = date instanceof Date ? date : (date as any).toDate?.() || new Date(date);
        return d.toLocaleDateString();
    };

    const handleEditPiece = (pieceId: string) => {
        router.push('/editor');
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="mb-12">
                <Link
                    href="/library"
                    className="inline-flex items-center gap-2 text-stone-500 hover:text-amber-500 transition-colors mb-6 group"
                >
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    {translations.backToLibrary}
                </Link>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest mb-4 border border-green-500/20">
                            <Box size={12} /> Piece Set
                        </div>
                        <h1 className="text-5xl font-black text-stone-900 dark:text-white tracking-tight">
                            {set.name}
                        </h1>
                        <p className="text-stone-500 dark:text-white/40 text-lg mt-2 max-w-2xl">
                            {set.description || "A collection of custom battle pieces."}
                        </p>
                    </div>

                    <div className="flex items-center gap-4 text-stone-400 dark:text-white/20 text-sm font-bold uppercase tracking-widest bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-white/10">
                        <div className="flex flex-col">
                            <span className="text-[10px] opacity-50 mb-1">{translations.lastUpdated}</span>
                            <span className="flex items-center gap-2 text-stone-900 dark:text-white">
                                <Calendar size={14} /> {formatDate(set.updatedAt)}
                            </span>
                        </div>
                        <div className="w-px h-8 bg-stone-200 dark:bg-white/10 mx-2" />
                        <div className="flex flex-col">
                            <span className="text-[10px] opacity-50 mb-1">Pieces</span>
                            <span className="text-stone-900 dark:text-white">{pieces.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pieces Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {pieces.map((piece) => (
                    <div
                        key={piece.id}
                        className="group relative bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 rounded-3xl overflow-hidden hover:border-amber-500/50 transition-all duration-500 shadow-xl"
                    >
                        <div className={`aspect-square flex items-center justify-center p-8 transition-colors duration-500 bg-stone-50 dark:bg-stone-800/50`}>
                            <div className="transform group-hover:scale-110 transition-transform duration-700">
                                <PieceRenderer
                                    type={piece.name}
                                    color={piece.color || "white"}
                                    size={120}
                                    pixels={piece.pixelsWhite || piece.pixels}
                                    className="drop-shadow-2xl"
                                />
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-black text-stone-900 dark:text-white group-hover:text-amber-500 transition-colors uppercase tracking-tight">
                                        {piece.name}
                                    </h3>
                                    <p className="text-[10px] font-black text-stone-400 dark:text-white/30 uppercase tracking-widest mt-1">
                                        Custom Piece
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => handleEditPiece(piece.id!)}
                                className="w-full bg-stone-100 dark:bg-white/5 hover:bg-amber-500 text-stone-900 dark:text-white hover:text-bg py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                <Edit2 size={14} /> {translations.edit}
                            </button>
                        </div>

                        {/* Hover Glow */}
                        <div className="absolute inset-0 bg-linear-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                ))}

                {pieces.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-stone-100 dark:bg-white/5 rounded-3xl border border-dashed border-stone-200 dark:border-white/10">
                        <Box size={48} className="mx-auto text-stone-300 dark:text-white/10 mb-4" />
                        <p className="text-stone-500 dark:text-white/40 font-bold uppercase tracking-widest">
                            No pieces in this set yet.
                        </p>
                        <button
                            onClick={() => router.push('/editor')}
                            className="mt-6 text-amber-500 font-bold hover:underline"
                        >
                            Create a piece
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
