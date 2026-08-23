"use client"

import React from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

const Footer: React.FC = () => {
    const t = useTranslations('Landing.footer');

    return (
        <footer className="bg-white dark:bg-stone-950 border-t border-gray-200 dark:border-stone-800 mt-12 py-12">
            <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-6 h-6 bg-gray-200 dark:bg-stone-800 rounded text-gray-500 dark:text-stone-400">
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-stone-100">Chessperiment</span>
                </div>
                <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
                    {[
                        { name: t('about'), href: '/about' },
                        { name: t('privacyPolicy'), href: '/privacy-policy' },
                        { name: t('terms'), href: '/legal-notice' },
                        { name: t('contact'), href: '/feedback' }
                    ].map((item) => (
                        <Link key={item.name} className="text-sm text-gray-500 dark:text-stone-400 hover:text-amber-500 transition-colors" href={item.href}>
                            {item.name}
                        </Link>
                    ))}
                </div>
                <span className="text-sm text-gray-400 dark:text-stone-500">{t('copyright')}</span>
            </div>
        </footer>
    );
};

export default Footer;
