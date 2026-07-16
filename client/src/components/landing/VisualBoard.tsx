"use client"

import { Sword, Wand2 } from 'lucide-react';

const VisualBoard: React.FC = () => {
    return (
        <div className="relative w-full aspect-video bg-white dark:bg-stone-900/40 rounded-3xl border border-gray-100 dark:border-stone-800 shadow-xl overflow-hidden flex items-center justify-center max-w-5xl mx-auto transform hover:scale-[1.01] transition-transform duration-500">
            <div className="absolute inset-0 bg-linear-to-br from-amber-500/5 to-purple-500/5 opacity-50"></div>
            <div className="relative z-10 w-full h-full flex items-center justify-center perspective-distant scale-90 sm:scale-100">

                {/* The 3D Grid Board */}
                <div className="absolute top-[60%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-white dark:bg-stone-800 border border-gray-200 dark:border-stone-700 rounded-xl transform rotate-x-60 rotate-z-[-10deg] shadow-2xl flex flex-wrap p-3 gap-1 z-10">
                    <div className="w-full h-full grid grid-cols-4 grid-rows-4 gap-1">
                        {/* Generating grid cells manually to match design pattern */}
                        <div className="bg-gray-100 dark:bg-stone-700 rounded-sm"></div>
                        <div className="bg-amber-100/50 dark:bg-amber-900/40 rounded-sm"></div>
                        <div className="bg-gray-100 dark:bg-stone-700 rounded-sm"></div>
                        <div className="bg-amber-100/50 dark:bg-amber-900/40 rounded-sm"></div>
                        <div className="bg-amber-100/50 dark:bg-amber-900/40 rounded-sm"></div>
                        <div className="bg-gray-100 dark:bg-stone-700 rounded-sm"></div>
                        <div className="bg-amber-100/50 dark:bg-amber-900/40 rounded-sm"></div>
                        <div className="bg-gray-100 dark:bg-stone-700 rounded-sm"></div>
                        <div className="bg-gray-100 dark:bg-stone-700 rounded-sm"></div>
                        <div className="bg-amber-100/50 dark:bg-amber-900/40 rounded-sm"></div>
                        <div className="bg-gray-100 dark:bg-stone-700 rounded-sm"></div>
                        <div className="bg-amber-100/50 dark:bg-amber-900/40 rounded-sm"></div>
                        <div className="bg-amber-100/50 dark:bg-amber-900/40 rounded-sm"></div>
                        <div className="bg-gray-100 dark:bg-stone-700 rounded-sm"></div>
                        <div className="bg-amber-100/50 dark:bg-amber-900/40 rounded-sm"></div>
                        <div className="bg-gray-100 dark:bg-stone-700 rounded-sm"></div>
                    </div>
                </div>

                {/* Floating Icons Card */}
                <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[260px] h-[200px] bg-white/20 dark:bg-stone-800/20 border border-white/30 dark:border-stone-700/30 rounded-2xl backdrop-blur-md transform rotate-x-60 rotate-z-[-10deg] z-20 flex items-center justify-center shadow-xl">
                    <div className="flex gap-6 transform -rotate-x-60">
                        <div className="bg-white dark:bg-stone-800 p-4 rounded-xl shadow-lg border border-amber-200 dark:border-stone-700 group-hover:scale-110 transition-transform">
                            <Sword className="text-amber-500" size={24} />
                        </div>
                        <div className="bg-white dark:bg-stone-800 p-4 rounded-xl shadow-lg border border-purple-200 dark:border-stone-700 group-hover:scale-110 transition-transform delay-75">
                            <Wand2 className="text-purple-500" size={24} />
                        </div>
                    </div>
                </div>

                {/* Bouncing Knight */}
                <div className="absolute top-[20%] left-[50%] -translate-x-1/2 -translate-y-1/2 transform z-30 animate-[bounce_3s_infinite]">
                    <svg className="w-32 h-32 text-gray-900 dark:text-stone-100 drop-shadow-2xl" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19,22H5V20H19V22M17,10C15.58,10 14.26,10.77 13.55,12C13.24,11.5 13,11 13,10.5C13,8.57 16.5,8.42 16.5,3C13.5,3 11.5,4.92 11.5,6C11.5,7.08 11.5,7.08 9,8.08V5H7V8.82C5.85,9.5 5,10.88 5,12.5C5,15 7,17 9.5,17C11.38,17 13.09,15.82 13.79,14.14C14.39,15.26 15.59,16 17,16A4,4 0 0,0 21,12A4,4 0 0,0 17,10Z"></path>
                    </svg>
                </div>

                {/* Rule Tooltip */}
                <div className="absolute top-[25%] left-[25%] bg-gray-900 dark:bg-stone-800 text-white p-4 rounded-xl shadow-2xl z-40 transform -rotate-2 border border-gray-700 dark:border-stone-600">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                        <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">Rule #1</span>
                    </div>
                    <div className="text-sm font-bold text-stone-100">L-Jump + Explosion</div>
                </div>
            </div>
        </div>
    );
};

export default VisualBoard;
