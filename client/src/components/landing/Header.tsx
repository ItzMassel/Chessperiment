"use client"

import React from 'react';
import { Link } from '@/i18n/navigation';
import { useLocale } from 'next-intl';

const Header: React.FC = () => {
    const locale = useLocale();

    return (
        <header className="sticky top-0 z-50 w-full bg-white/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-gray-200 dark:border-stone-800">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-amber-400 rounded-md text-white">
                    </div>
                    <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-stone-100">
                        Chess<span className="font-light text-gray-500 dark:text-stone-400">[periment]</span>
                    </span>
                </div>
                <nav className="hidden md:flex items-center gap-8">
                    {[
                        { name: 'Play', href: '/game' },
                        { name: 'Editor', href: '/editor' },
                        { name: 'News', href: '/announcements' },
                        { name: 'Marketplace', href: '/marketplace' },
                        { name: 'About', href: '/about' },
                        { name: 'Feedback', href: '/feedback' }
                    ].map((item) => (
                        <Link
                            key={item.name}
                            className="text-sm font-medium text-gray-500 dark:text-stone-400 hover:text-amber-500 transition-colors"
                            href={item.href}
                        >
                            {item.name}
                        </Link>
                    ))}
                </nav>
                <div className="flex items-center gap-4">
                    <Link
                        className="text-sm font-medium text-gray-500 dark:text-stone-400 hover:text-amber-500 transition-colors hidden sm:block"
                        href="/login"
                    >
                        Login
                    </Link>
                    <Link
                        className="text-sm font-bold bg-amber-400 hover:bg-amber-500 text-gray-900 px-4 py-2 rounded-lg transition-colors hidden sm:block shadow-sm"
                        href="/login"
                    >
                        Sign Up
                    </Link>
                    <div className="flex items-center bg-gray-100 dark:bg-stone-800 rounded-full p-1 ml-2">
                        <Link
                            href="/"
                            locale="en"
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${locale === 'en' ? 'bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 shadow-sm' : 'text-gray-500 dark:text-stone-400 hover:text-gray-900'}`}
                        >
                            EN
                        </Link>
                        <Link
                            href="/"
                            locale="de"
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${locale === 'de' ? 'bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 shadow-sm' : 'text-gray-500 dark:text-stone-400 hover:text-gray-900'}`}
                        >
                            DE
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
