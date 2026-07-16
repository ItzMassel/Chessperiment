"use client"

import React from 'react';
import { Link } from '@/i18n/navigation';

const Footer: React.FC = () => {
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
                        { name: 'About', href: '/about' },
                        { name: 'Privacy Policy', href: '/privacy-policy' },
                        { name: 'Terms', href: '/legal-notice' },
                        { name: 'Contact', href: '/feedback' }
                    ].map((item) => (
                        <Link key={item.name} className="text-sm text-gray-500 dark:text-stone-400 hover:text-amber-500 transition-colors" href={item.href}>
                            {item.name}
                        </Link>
                    ))}
                </div>
                <span className="text-sm text-gray-400 dark:text-stone-500">© 2026 Chessperiment</span>
            </div>
        </footer>
    );
};

export default Footer;
