'use client';

import { Bot, Zap } from 'lucide-react';

interface EngineToggleCardProps {
    enabled: boolean;
    color: 'white' | 'black';
    onToggle: () => void;
    onColorChange: (color: 'white' | 'black') => void;
}

export default function EngineToggleCard({ enabled, color, onToggle, onColorChange }: EngineToggleCardProps) {
    return (
        <div className={`
            relative rounded-2xl p-6 
            transition-all duration-300 ease-out
            ${enabled
                ? 'bg-linear-to-br from-purple-500/20 via-pink-500/20 to-orange-500/20 border-2 border-purple-400/50 shadow-2xl shadow-purple-500/30'
                : 'bg-stone-100/80 dark:bg-stone-800/80 border-2 border-stone-200 dark:border-stone-700'
            }
            backdrop-blur-md
        `}>
            {/* Background glow effect when enabled */}
            {enabled && (
                <div className="absolute inset-0 bg-linear-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 animate-pulse rounded-2xl" />
            )}

            <div className="relative z-10">
                {/* Header with toggle */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`
                            p-3 rounded-xl transition-all duration-300
                            ${enabled
                                ? 'bg-linear-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50'
                                : 'bg-stone-200 dark:bg-stone-700 text-stone-500'
                            }
                        `}>
                            <Bot size={24} className={enabled ? 'animate-pulse' : ''} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-stone-900 dark:text-white">
                                {enabled ? 'Random Opponent Active' : 'Random Opponent'}
                            </h3>
                            <p className="text-sm text-stone-500 dark:text-stone-400">
                                {enabled ? 'Opponent will play random legal moves' : 'Play against a random-move opponent'}
                            </p>
                        </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                        onClick={onToggle}
                        className={`
                            relative w-16 h-8 rounded-full transition-all duration-300 ease-out
                            ${enabled
                                ? 'bg-linear-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50'
                                : 'bg-stone-300 dark:bg-stone-600'
                            }
                            focus:outline-none focus:ring-4 focus:ring-purple-500/30
                        `}
                    >
                        <div className={`
                            absolute top-1 left-1 w-6 h-6 bg-white rounded-full 
                            transition-transform duration-300 ease-out
                            ${enabled ? 'translate-x-6 shadow-lg' : 'translate-x-0'}
                            flex items-center justify-center
                        `}>
                            {enabled && <Zap size={14} className="text-purple-500" />}
                        </div>
                    </button>
                </div>

                {/* Color Selection - only visible when enabled */}
                <div className={`
                    transition-all duration-300 ease-out
                    ${enabled ? 'max-h-96 opacity-100 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}
                `}>
                    <div className="pt-4 border-t border-stone-300/50 dark:border-stone-600/50">
                        <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-3">
                            Engine plays as:
                        </label>
                        <div className="flex gap-3 pb-10 px-2">
                            {/* White Option */}
                            <button
                                onClick={() => onColorChange('white')}
                                disabled={!enabled}
                                className={`
                                    flex-1 flex items-center justify-center gap-3 px-4 py-4 rounded-xl
                                    font-bold transition-all duration-300
                                    ${color === 'white' && enabled
                                        ? 'bg-white text-stone-900 shadow-xl shadow-stone-300 ring-2 ring-purple-500 scale-105'
                                        : 'bg-stone-200/50 dark:bg-stone-700/50 text-stone-600 dark:text-stone-400'
                                    }
                                    ${enabled ? 'hover:scale-105 cursor-pointer' : 'opacity-50 cursor-not-allowed'}
                                `}
                            >
                                <div className="w-8 h-8 rounded-full bg-white border-2 border-stone-300 shadow-md" />
                                <span>White</span>
                            </button>

                            {/* Black Option */}
                            <button
                                onClick={() => onColorChange('black')}
                                disabled={!enabled}
                                className={`
                                    flex-1 flex items-center justify-center gap-3 px-4 py-4 rounded-xl
                                    font-bold transition-all duration-300
                                    ${color === 'black' && enabled
                                        ? 'bg-stone-900 text-white shadow-xl shadow-stone-700 ring-2 ring-purple-500 scale-105'
                                        : 'bg-stone-200/50 dark:bg-stone-700/50 text-stone-600 dark:text-stone-400'
                                    }
                                    ${enabled ? 'hover:scale-105 cursor-pointer' : 'opacity-50 cursor-not-allowed'}
                                `}
                            >
                                <div className="w-8 h-8 rounded-full bg-stone-900 border-2 border-stone-600 shadow-md" />
                                <span>Black</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
