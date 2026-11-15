"use client"
import { useTranslations } from "next-intl";
import { useState } from "react";
import { X, ChevronDown } from 'lucide-react';
import { Link, usePathname } from "@/i18n/navigation";
import { isConfigured } from "@/lib/firebase-client";


type IconProps = { className?: string };

const PIECE_PATH = "M24 8a5 5 0 0 1 2.9 9.1c2.6 1.4 4.1 4.2 4.1 7.4 0 2-.6 3.8-1.6 5.3H33v4H15v-4h3.6A9.5 9.5 0 0 1 17 24.500c0-3.200 1.500-6 4.100-7.400A5 5 0 0 1 24 8Z";

/** Board: 3x3 checker grid */
function BoardIcon({ className }: IconProps) {
    return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden>
            <rect x="6" y="6" width="36" height="36" rx="4" className="fill-amber-200 dark:fill-amber-100/80" />
            {[0, 1, 2].flatMap(r => [0, 1, 2].map(c => (r + c) % 2 === 1 ? <rect key={`${r}${c}`} x={6 + c * 12} y={6 + r * 12} width="12" height="12" className="fill-amber-600" /> : null))}
            <rect x="6" y="6" width="36" height="36" rx="4" fill="none" className="stroke-amber-700" strokeWidth="2" />
        </svg>
    );
}

/** Piece: pawn-like silhouette */
function PieceIcon({ className }: IconProps) {
    return (
        <svg viewBox="10 4 28 34" className={className} aria-hidden>
            <path d={PIECE_PATH} className="fill-stone-800 dark:fill-stone-100 stroke-amber-500" strokeWidth="2" strokeLinejoin="round" />
        </svg>
    );
}

/** Square: a single tile */
function SquareIcon({ className }: IconProps) {
    return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden>
            <rect x="9" y="9" width="30" height="30" rx="5" className="fill-amber-400/30 stroke-amber-500" strokeWidth="3" strokeDasharray="6 4" />
            <rect x="19" y="19" width="10" height="10" rx="2" className="fill-amber-500" />
        </svg>
    );
}

/** Combined icon: board, square and piece overlapping, each rotated differently */
function EditorsIcon({ className }: IconProps) {
    return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden>
            <g transform="rotate(-14 24 40)">
                <rect x="4" y="22" width="36" height="36" rx="4" className="fill-amber-200 dark:fill-amber-100/80" />
                {[0, 1, 2].flatMap(r => [0, 1, 2].map(c => (r + c) % 2 === 1 ? <rect key={`${r}${c}`} x={4 + c * 12} y={22 + r * 12} width="12" height="12" className="fill-amber-600" /> : null))}
                <rect x="4" y="22" width="36" height="36" rx="4" fill="none" className="stroke-amber-700" strokeWidth="2" />
            </g>
            <g transform="rotate(16 46 20)">
                <rect x="33" y="7" width="26" height="26" rx="5" className="fill-bg stroke-amber-500" strokeWidth="3" strokeDasharray="6 4" />
            </g>
            <g transform="translate(13 8) rotate(10 24 24) scale(1)">
                <path d={PIECE_PATH} className="fill-stone-800 dark:fill-stone-100 stroke-amber-500" strokeWidth="2.500" strokeLinejoin="round" />
            </g>
        </svg>
    );
}

export function MobileMenu({ locale, isMenuOpen, setIsMenuOpen, user }: { locale: string, isMenuOpen: boolean, setIsMenuOpen: (val: boolean) => void, user: any }) {
    const t = useTranslations('Header');
    const pathname = usePathname();
    const [editorOpen, setEditorOpen] = useState(false);
    const close = () => { setIsMenuOpen(false); setEditorOpen(false); };

    const linkClass = "group flex items-center justify-between text-3xl font-black text-stone-900 dark:text-white hover:text-accent transition-all border-l-4 border-amber-400/0 hover:border-accent pl-2";
    const dot = <div className="w-2 h-2 rounded-full bg-amber-400/20 group-hover:bg-accent group-hover:scale-150 transition-all opacity-0 group-hover:opacity-100" />;

    const editors = [
        { mode: 'board', label: t('boardEditor'), Icon: BoardIcon },
        { mode: 'piece', label: t('pieceEditor'), Icon: PieceIcon },
        { mode: 'square', label: t('squareEditor'), Icon: SquareIcon },
    ];

    // Same links as the desktop nav in Header.tsx (the editor has its own button above)
    const links = [
        { href: "/marketplace", label: t('marketplace') },
        { href: "/creator", label: t('creator') },
        { href: "/about", label: t('about') },
        { href: "/features", label: t('features') },
        ...(isConfigured && !user ? [{ href: "/login", label: t('login') }] : []),
    ];

    return (
        <>
            {/* Mobile Nav Overlay */}
            {isMenuOpen && (
                <div className="fixed inset-0 bg-bg z-100 flex flex-col items-center justify-start pt-28 pb-12 px-8 overflow-y-auto animate-in slide-in-from-top duration-500">
                    {/* Close button inside overlay */}
                    <button
                        className="absolute top-6 right-6 p-4 text-amber-400 hover:scale-110 transition-transform active:scale-95 bg-amber-400/10 rounded-2xl"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        <X size={32} strokeWidth={3} />
                    </button>

                    <div className="flex flex-col gap-5 w-full max-w-sm">
                        <Link href="/game" className={linkClass} onClick={close}>
                            <span>{t('play')}</span>
                            {dot}
                        </Link>

                        {/* Editor button: expands to the three editors */}
                        <div>
                            <button
                                type="button"
                                className="group flex w-full items-center gap-4 rounded-3xl bg-amber-400/10 border border-amber-400/20 p-3 pr-5 text-left active:scale-[0.98] transition-all"
                                onClick={() => setEditorOpen(o => !o)}
                                aria-expanded={editorOpen}
                            >
                                <EditorsIcon className="w-16 h-16 shrink-0" />
                                <span className="flex-1 text-3xl font-black text-stone-900 dark:text-white">{t('editor')}</span>
                                <ChevronDown className={`text-amber-500 transition-transform duration-300 ${editorOpen ? 'rotate-180' : ''}`} size={28} strokeWidth={3} />
                            </button>
                            {editorOpen && (
                                <div className="grid grid-cols-3 gap-3 mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                    {editors.map(({ mode, label, Icon }) => (
                                        <Link
                                            key={mode}
                                            href={`/editor?mode=${mode}`}
                                            className="flex flex-col items-center gap-2 rounded-2xl bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/20 py-4 px-1 text-center active:scale-95 transition-all"
                                            onClick={close}
                                        >
                                            <Icon className="w-9 h-9" />
                                            <span className="text-sm font-black leading-tight text-stone-900 dark:text-white">{label}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {links.map(({ href, label }) => (
                            <Link key={href} href={href} className={linkClass} onClick={close}>
                                <span>{label}</span>
                                {dot}
                            </Link>
                        ))}
                    </div>

                    <div className="flex gap-6 justify-center mt-8">
                        <a href="https://github.com/ItzMassel/Chessperiment" target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-accent transition-colors" aria-label="GitHub">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                            </svg>
                        </a>
                        <a href="https://discord.gg/2XrGZw9PMP" target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-accent transition-colors" aria-label="Discord">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                            </svg>
                        </a>
                    </div>

                    <div className="flex gap-12 justify-center mt-16 scale-125">
                        <Link
                            href={pathname}
                            locale="en"
                            className={`text-xl font-black tracking-tighter ${locale === 'en' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-stone-400 dark:text-stone-600 hover:text-amber-500'}`}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            {t('english')}
                        </Link>
                        <Link
                            href={pathname}
                            locale="de"
                            className={`text-xl font-black tracking-tighter ${locale === 'de' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-stone-400 dark:text-stone-600 hover:text-amber-500'}`}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            {t('german')}
                        </Link>
                    </div>
                </div>

            )}
        </>
    )
}
