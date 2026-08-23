"use client"

import React from 'react';

import { Shapes, Sparkles, Cpu, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

const FeatureGrid: React.FC = () => {
    const t = useTranslations('Landing.features');

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
            <div className="bg-white dark:bg-stone-900/50 rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-stone-800 group hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                    <Shapes size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-stone-100 mb-3">{t('visualLogic.title')}</h3>
                <p className="text-base text-gray-500 dark:text-stone-400 leading-relaxed">
                    {t('visualLogic.description')}
                </p>
            </div>
            <div className="bg-white dark:bg-stone-900/50 rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-stone-800 group hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                    <Sparkles size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-stone-100 mb-3">{t('customPieces.title')}</h3>
                <p className="text-base text-gray-500 dark:text-stone-400 leading-relaxed">
                    {t('customPieces.description')}
                </p>
            </div>
            <div className="bg-white dark:bg-stone-900/50 rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-stone-800 group hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-14 h-14 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 mb-6 group-hover:scale-110 transition-transform">
                    <Cpu size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-stone-100 mb-3">{t('stockfish.title')}</h3>
                <p className="text-base text-gray-500 dark:text-stone-400 leading-relaxed">
                    {t('stockfish.description')}
                </p>
            </div>
            <div className="bg-white dark:bg-stone-900/50 rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-stone-800 group hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                    <Users size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-stone-100 mb-3">{t('multiplayer.title')}</h3>
                <p className="text-base text-gray-500 dark:text-stone-400 leading-relaxed">
                    {t('multiplayer.description')}
                </p>
            </div>
        </div>
    );
};

export default FeatureGrid;
