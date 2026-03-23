"use client";
import React from 'react';
import { ArrowLeft, Play, Edit2, Share2, Calendar, LayoutGrid, Globe } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BoardPreviewWrapper from "./BoardPreviewWrapper";
import { SavedBoard } from '@/types/firestore';

interface BoardDetailClientProps {
    board: SavedBoard;
    locale: string;
    translations: {
        play: string;
        publish: string;
        details: string;
        size: string;
        lastUpdated: string;
        edit: string;
        backToLibrary: string;
    };
    userName: string;
}

export default function BoardDetailClient({ board, locale, translations, userName }: BoardDetailClientProps) {
    const router = useRouter();

    const formatDate = (date: any) => {
        if (!date) return "";
        const d = typeof date === 'string' || date instanceof Date
            ? new Date(date)
            : (date as any).seconds ? new Date((date as any).seconds * 1000) : new Date(date);

        return d.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handlePlay = () => {
        router.push('/editor');
    };

    const handleEdit = () => {
        router.push('/editor');
    };

    return (
        <>
            <Link
                href="/library"
                className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-8 group"
            >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                {translations.backToLibrary}
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Left Side: Preview */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="aspect-square bg-white/5 rounded-3xl border border-white/10 overflow-hidden flex items-center justify-center p-4 shadow-2xl relative group">
                        <BoardPreviewWrapper board={board} />
                        <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-3xl" />
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handlePlay}
                            className="flex-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-bg py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-[0_0_30px_rgba(245,158,11,0.2)]"
                        >
                            <Play size={24} fill="currentColor" />
                            {translations.play}
                        </button>
                        <button className="px-8 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-bold flex items-center gap-3 transition-all">
                            <Globe size={20} />
                            {translations.publish}
                        </button>
                    </div>
                </div>

                {/* Right Side: Details */}
                <div className="lg:col-span-5 space-y-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 text-amber-500 text-[10px] font-black uppercase tracking-widest mb-4 border border-amber-400/20">
                            {translations.details}
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tight leading-tight">
                            {board.name}
                        </h1>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                            <div className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-2">
                                <LayoutGrid size={12} /> {translations.size}
                            </div>
                            <div className="text-2xl font-bold text-white">
                                {board.gridType === 'hex' ? `Radius ${Math.floor(Math.max(board.rows, board.cols) / 2)}` : `${board.cols} × ${board.rows}`}
                            </div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                            <div className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-2">
                                <Calendar size={12} /> {translations.lastUpdated}
                            </div>
                            <div className="text-lg font-bold text-white">
                                {formatDate(board.updatedAt)}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleEdit}
                                className="flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-white font-bold transition-all"
                            >
                                <Edit2 size={16} /> {translations.edit}
                            </button>
                            <button className="flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-white font-bold transition-all">
                                <Share2 size={16} /> Share
                            </button>
                        </div>
                    </div>

                    <div className="p-6 bg-linear-to-br from-amber-500/10 to-transparent rounded-3xl border border-amber-500/10">
                        <p className="text-amber-200/60 text-sm leading-relaxed italic">
                            "This battlefield was forged by {userName}. It features a custom {board.gridType === 'hex' ? 'hexagonal' : `${board.cols}x${board.rows}`} layout with {Object.keys(board.placedPieces).length} strategically placed pieces."
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
