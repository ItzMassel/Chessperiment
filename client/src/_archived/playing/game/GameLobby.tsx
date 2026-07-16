"use client";
import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Users, Search, Plus, LogIn, Monitor, X, Copy, Check, Sparkles } from 'lucide-react';

interface GameLobbyProps {
    onQuickSearch: () => void;
    onCreateRoom: () => void;
    onJoinRoom: (roomId: string) => void;
    onVsComputer: (elo: number) => void;
    isSearching: boolean;
    onCancelSearch: () => void;
}

export default function GameLobby({
    onQuickSearch,
    onCreateRoom,
    onJoinRoom,
    onVsComputer,
    isSearching,
    onCancelSearch
}: GameLobbyProps) {
    const t = useTranslations('Multiplayer');
    const [roomInput, setRoomInput] = useState("");

    if (isSearching) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white/80 dark:bg-stone-900/80 backdrop-blur-2xl rounded-[3rem] border border-gray-200 dark:border-white/10 shadow-2xl animate-in zoom-in duration-500 max-w-lg w-full select-none caret-transparent">
                <div className="relative mb-10">
                    <div className="w-32 h-32 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin-slow" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Search className="text-amber-500 animate-pulse" size={40} />
                    </div>
                    <div className="absolute -top-2 -right-2">
                        <div className="flex gap-1">
                            <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" />
                        </div>
                    </div>
                </div>
                <h2 className="text-4xl font-black text-stone-900 dark:text-white mb-3 uppercase tracking-tight">{t('searchingForGame') || 'Finding Game...'}</h2>
                <p className="text-stone-500 dark:text-gray-400 mb-10 font-medium text-lg">{t('matchingOpponent')}</p>
                <button
                    onClick={onCancelSearch}
                    className="group relative px-10 py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl font-bold transition-all border border-red-500/30 overflow-hidden"
                >
                    <span className="relative z-10 flex items-center gap-2">
                        <X size={20} /> {t('cancel')}
                    </span>
                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            {/* Quick Play & Create */}
            <div className="flex flex-col gap-8">
                <button
                    onClick={onQuickSearch}
                    className="group relative overflow-hidden bg-linear-to-br from-amber-400 via-amber-500 to-orange-600 p-10 rounded-[2.5rem] shadow-2xl hover:shadow-amber-500/40 transition-all hover:-translate-y-2 active:scale-[0.98]"
                >
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-125 group-hover:rotate-12 transition-all duration-700">
                        <Search size={140} />
                    </div>
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />

                    <div className="relative z-10 text-left">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 text-white shadow-inner">
                            <Sparkles size={32} />
                        </div>
                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">{t('quicksearch')}</h3>
                        <p className="text-white/90 text-lg font-medium">{t('jumpIntoMatch')}</p>
                    </div>
                </button>

                <button
                    onClick={onCreateRoom}
                    className="group relative overflow-hidden bg-white dark:bg-stone-900 border border-gray-200 dark:border-white/5 p-10 rounded-[2.5rem] shadow-2xl hover:border-amber-500/50 transition-all hover:-translate-y-2 active:scale-[0.98]"
                >
                    <div className="absolute inset-0 bg-linear-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10 text-left flex items-center justify-between">
                        <div>
                            <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 text-amber-500 border border-amber-500/20 shadow-lg">
                                <Plus size={32} />
                            </div>
                            <h3 className="text-2xl font-black text-stone-900 dark:text-white uppercase tracking-tight mb-2">{t('createPrivate')}</h3>
                            <p className="text-stone-500 dark:text-stone-400 text-lg">{t('generateCode')}</p>
                        </div>
                        <Plus className="text-stone-300 dark:text-stone-700 group-hover:text-amber-500 group-hover:rotate-90 transition-all duration-500" size={56} strokeWidth={3} />
                    </div>
                </button>
            </div>

            {/* Join & Computer */}
            <div className="flex flex-col gap-8">
                <div className="bg-white dark:bg-stone-900 border border-gray-200 dark:border-white/5 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] dark:opacity-5 group-hover:opacity-10 transition-opacity text-stone-900 dark:text-white">
                        <LogIn size={100} />
                    </div>
                    <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 text-blue-500 border border-blue-500/20 shadow-lg">
                        <Users size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-stone-900 dark:text-white uppercase tracking-tight mb-6">{t('joinRoom')}</h3>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={roomInput}
                            onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                            placeholder={t('enterCode')}
                            maxLength={8}
                            className="flex-1 bg-stone-50 dark:bg-stone-950/50 border border-stone-200 dark:border-white/10 rounded-2xl px-6 py-4 text-stone-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all uppercase font-mono text-xl tracking-[0.3em] placeholder:tracking-normal placeholder:font-sans placeholder:text-stone-400 dark:placeholder:text-stone-600"
                        />
                        <button
                            onClick={() => onJoinRoom(roomInput)}
                            className="px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all shadow-xl shadow-blue-600/30 active:scale-95 flex items-center justify-center"
                        >
                            <LogIn size={28} />
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-stone-900 border border-gray-200 dark:border-white/5 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] dark:opacity-5 group-hover:opacity-10 transition-opacity text-stone-900 dark:text-white">
                        <Monitor size={100} />
                    </div>
                    <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mb-6 text-green-500 border border-green-500/20 shadow-lg">
                        <Monitor size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-stone-900 dark:text-white uppercase tracking-tight mb-6">{t('playAgainstComputer')}</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                            { elo: 400, key: 'beginner', color: 'bg-emerald-500', icon: '🌱' },
                            { elo: 800, key: 'casual', color: 'bg-green-500', icon: '🎮' },
                            { elo: 1400, key: 'intermediate', color: 'bg-blue-500', icon: '⚔️' },
                            { elo: 2000, key: 'expert', color: 'bg-purple-500', icon: '🧠' },
                            { elo: 2600, key: 'master', color: 'bg-red-500', icon: '👑' },
                            { elo: 3000, key: 'grandmaster', color: 'bg-stone-950', icon: '🌌' }
                        ].map((level) => (
                            <button
                                key={level.elo}
                                onClick={() => onVsComputer(level.elo)}
                                className="group/level relative p-4 bg-stone-50 dark:bg-stone-950/50 hover:bg-white dark:hover:bg-white/5 border border-stone-200 dark:border-white/10 rounded-2xl transition-all hover:border-amber-500/50 hover:shadow-xl active:scale-95 text-left overflow-hidden"
                            >
                                <div className={`absolute top-0 right-0 w-16 h-16 ${level.color} opacity-5 blur-2xl group-hover/level:opacity-20 transition-opacity`} />
                                <div className="text-2xl mb-2">{level.icon}</div>
                                <p className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-1">{level.elo} ELO</p>
                                <h4 className="text-sm font-bold text-stone-900 dark:text-white group-hover/level:text-amber-500 transition-colors uppercase">
                                    {t(level.key)}
                                </h4>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
