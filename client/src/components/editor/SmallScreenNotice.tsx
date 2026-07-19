'use client';

import { Monitor } from 'lucide-react';

export default function SmallScreenNotice({ children }: { children: React.ReactNode }) {
    return (
        <>
            <div className="hidden xl:flex w-full h-full">
                {children}
            </div>
            <div className="flex xl:hidden fixed inset-0 z-50 items-center justify-center bg-[#0f1115] text-white p-8">
                <div className="text-center max-w-md">
                    <Monitor className="w-16 h-16 mx-auto mb-6 text-stone-500" />
                    <h2 className="text-2xl font-black mb-4">Large Screen Required</h2>
                    <p className="text-stone-400 leading-relaxed mb-6">
                        This editor requires a larger screen. Please open it on a desktop or tablet device.
                    </p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-stone-800 rounded-xl text-stone-500 text-sm">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        Minimum width: 1280px
                    </div>
                </div>
            </div>
        </>
    );
}
