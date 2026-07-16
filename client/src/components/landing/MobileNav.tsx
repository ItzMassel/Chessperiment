"use client"

import React from 'react';
import { Link } from '@/i18n/navigation';

const MobileNav: React.FC = () => {
    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-stone-950/90 backdrop-blur-md border-t border-gray-200 dark:border-stone-800 p-4 flex justify-around z-50">
            <Link className="flex flex-col items-center text-amber-500" href="/">
                <span className="text-[10px] font-bold mt-1">Home</span>
            </Link>
            <Link className="flex flex-col items-center text-gray-400 hover:text-gray-600 dark:hover:text-stone-300" href="/editor">
                <span className="text-[10px] font-bold mt-1">Editor</span>
            </Link>
            <Link className="flex flex-col items-center text-gray-400 hover:text-gray-600 dark:hover:text-stone-300" href="/login">
                <span className="text-[10px] font-bold mt-1">Login</span>
            </Link>
            <Link className="flex flex-col items-center text-gray-400 hover:text-gray-600 dark:hover:text-stone-300" href="/login">
                <span className="text-[10px] font-bold mt-1">Sign Up</span>
            </Link>
        </div>
    );
};

export default MobileNav;
