"use client";
import React from 'react';
import { ArrowLeft, Edit2, Calendar, Shield, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CustomPiece } from '@/types/firestore';
import PieceRenderer from '@/components/game/PieceRenderer';

interface PieceDetailClientProps {
    piece: CustomPiece;
    locale: string;
    translations: {
        details: string;
        lastUpdated: string;
        edit: string;
        backToLibrary: string;
    };
}

export default function PieceDetailClient({ piece, locale, translations }: PieceDetailClientProps) {
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
                {/* Left Side: Piece Preview */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="aspect-square bg-[#1c1917] rounded-3xl border border-white/10 overflow-hidden flex flex-col items-center justify-center p-8 shadow-2xl relative group">
                            <div className="absolute top-4 left-4 text-[10px] font-black uppercase tracking-widest text-white/20">White Version</div>
                            <PieceRenderer
                                type={piece.name}
                                color="white"
                                size={180}
                                pixels={piece.pixelsWhite || (piece.color === 'white' ? piece.pixels : undefined)}
                                className="drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                            />
                        </div>
                        <div className="aspect-square bg-[#1c1917] rounded-3xl border border-white/10 overflow-hidden flex flex-col items-center justify-center p-8 shadow-2xl relative group">
                            <div className="absolute top-4 left-4 text-[10px] font-black uppercase tracking-widest text-white/20">Black Version</div>
                            <PieceRenderer
                                type={piece.name}
                                color="black"
                                size={180}
                                pixels={piece.pixelsBlack || (piece.color === 'black' ? piece.pixels : undefined)}
                                className="drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleEdit}
                            className="flex-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-bg py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-[0_0_30px_rgba(245,158,11,0.2)]"
                        >
                            <Edit2 size={24} />
                            {translations.edit}
                        </button>
                    </div>
                </div>

                {/* Right Side: Details */}
                <div className="lg:col-span-5 space-y-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-400/10 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-4 border border-blue-400/20">
                            Custom Piece
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tight leading-tight">
                            {piece.name}
                        </h1>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                            <div className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-2">
                                <Shield size={12} /> Set ID
                            </div>
                            <div className="text-sm font-bold text-white truncate">
                                {piece.setId}
                            </div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                            <div className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-2">
                                <Calendar size={12} /> {translations.lastUpdated}
                            </div>
                            <div className="text-lg font-bold text-white">
                                {formatDate(piece.updatedAt)}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Movement Rules</h3>
                        <div className="space-y-2">
                            {piece.moves && piece.moves.length > 0 ? (
                                piece.moves.map((move: any, idx: number) => (
                                    <div key={idx} className="p-3 bg-white/5 rounded-xl border border-white/5 text-sm text-white/60">
                                        Rule #{idx + 1}: {move.conditions.length} conditions ({move.result})
                                    </div>
                                ))
                            ) : (
                                <p className="text-white/20 italic text-sm">No custom move rules defined.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
