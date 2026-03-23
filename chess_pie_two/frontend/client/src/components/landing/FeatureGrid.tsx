"use client"

import React from 'react';

import { Shapes, Sparkles, Cpu, Users } from 'lucide-react';

const FeatureGrid: React.FC = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
            <div className="bg-white dark:bg-stone-900/50 rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-stone-800 group hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                    <Shapes size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-stone-100 mb-3">Visual Logic Editor</h3>
                <p className="text-base text-gray-500 dark:text-stone-400 leading-relaxed">
                    Connect blocks to define piece movement, capture rules, and conditional triggers — no coding. Think Scratch, but for chess rules. Supports leapers, riders, and complex fairy piece behaviour. Not presets — actual customizability.
                </p>
            </div>
            <div className="bg-white dark:bg-stone-900/50 rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-stone-800 group hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                    <Sparkles size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-stone-100 mb-3">Custom Pieces & Boards</h3>
                <p className="text-base text-gray-500 dark:text-stone-400 leading-relaxed">
                    Design pieces with unique sprites, define any movement pattern, and build boards of any shape — rectangular, hexagonal, or custom-cut topologies. Every rule is yours to define.
                </p>
            </div>
            <div className="bg-white dark:bg-stone-900/50 rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-stone-800 group hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-14 h-14 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 mb-6 group-hover:scale-110 transition-transform">
                    <Cpu size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-stone-100 mb-3">Stockfish Analysis</h3>
                <p className="text-base text-gray-500 dark:text-stone-400 leading-relaxed">
                    Your custom game is evaluated by the Stockfish engine — even when the rules are completely non-standard.
                </p>
            </div>
            <div className="bg-white dark:bg-stone-900/50 rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-stone-800 group hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                    <Users size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-stone-100 mb-3">Instant Multiplayer</h3>
                <p className="text-base text-gray-500 dark:text-stone-400 leading-relaxed">
                    Generate a room link and share it. Your opponent joins in their browser, no install needed. Playtest a new variant in minutes.
                </p>
            </div>
        </div>
    );
};

export default FeatureGrid;
