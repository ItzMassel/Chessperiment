"use client"
import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { outfit, mono } from '@/lib/fonts';
import { Menu, X } from 'lucide-react';
import { isConfigured } from '@/lib/firebase-client';
import { NotificationBell } from './NotificationBell';

export function Header({ pathname, locale, isMenuOpen, setIsMenuOpen, user }: { pathname: string, locale: string, isMenuOpen: boolean, setIsMenuOpen: (val: boolean) => void, user: any }) {
    const t = useTranslations('Header');

    const small = pathname?.includes("/game")

    return (
        <header className={`flex justify-between items-center px-4 lg:px-5 pt-2 ${small ? "group" : "pb-6 lg:pb-10"} bg-bg relative z-50`}>
            <div className="flex items-center gap-2">
                <button
                    className="lg:hidden p-2 text-amber-400 outline-none hover:bg-amber-400/10 rounded-xl transition-colors"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label={t('menu')}
                    title={t('menu')}
                >
                    {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
                <Link href="/" className="flex items-center gap-3 group/logo transition-all duration-500 hover:scale-[1.01] active:scale-[0.98]">
                    <div className="relative">
                        <img
                            src="/logo.png"
                            alt="Chessperiment Logo"
                            className={`transition-all duration-500 ${small ? "h-8 w-8" : "h-12 w-12"} object-contain group-hover/logo:rotate-12 group-hover/logo:scale-110`}
                        />
                        <div className="absolute inset-0 bg-amber-400 blur-xl opacity-0 group-hover/logo:opacity-20 transition-opacity duration-700 rounded-full" />
                    </div>
                    <div className="flex items-center">
                        <span className={`${outfit.className} tracking-tight leading-none ${small ? "text-2xl md:text-3xl" : "text-4xl md:text-5xl lg:text-6xl"} select-none pr-1`}>
                            <span className="font-black bg-clip-text text-transparent bg-linear-to-br from-amber-300 via-amber-500 to-orange-600 drop-shadow-sm">
                                Chess
                            </span>
                        </span>
                        <div className="flex items-center relative group/periment">
                            {/* Decorative background for "periment" */}
                            <div className="absolute -inset-x-1 -inset-y-0.5 bg-amber-400/5 dark:bg-amber-400/10 rounded-md opacity-0 group-hover/logo:opacity-100 transition-opacity duration-500" />

                            <span className={`${mono.className} ${small ? "text-base md:text-lg" : "text-lg md:text-xl lg:text-2xl"} text-stone-500/80 dark:text-stone-400/80 tracking-tighter flex items-center relative z-10`}>
                                <span className="text-amber-500/30 group-hover/logo:text-amber-400/60 transition-colors duration-500 mr-0.5 font-bold">[</span>
                                <span className="group-hover/logo:text-stone-700 dark:group-hover/logo:text-stone-200 transition-colors duration-300">periment</span>
                                <span className="text-amber-500/30 group-hover/logo:text-amber-400/60 transition-colors duration-500 ml-0.5 font-bold">]</span>
                                <span className="w-1 h-4 lg:h-5 bg-amber-500 ml-1.5 animate-[pulse_1s_infinite] opacity-0 group-hover/logo:opacity-100 transition-opacity" />
                            </span>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Desktop Nav */}
            <div className={`hidden lg:flex gap-4 items-center`}>
                <div className="flex gap-2">
                    <Link id="tour-play" href="/game" className={`link-underline-regular cursor-pointer block ${small ? "text-amber-600/50 dark:text-amber-400/50 group-hover:text-accent" : "text-accent dark:before:accent hover:text-accent-hover"}`}>{t('play')}</Link>
                    <Link id="tour-editor" href="/editor" className={`link-underline-regular cursor-pointer block ${small ? "text-amber-600/50 dark:text-amber-400/50 group-hover:text-accent" : "text-accent dark:before:accent hover:text-accent-hover"}`}>{t('editor')}</Link>
                    <Link href="/announcements" className={`link-underline-regular cursor-pointer block ${small ? "text-amber-600/50 dark:text-amber-400/50 group-hover:text-accent" : "text-accent dark:before:accent hover:text-accent-hover"}`}>{t('news')}</Link>
                    <Link href="/marketplace" className={`link-underline-regular cursor-pointer block ${small ? "text-amber-600/50 dark:text-amber-400/50 group-hover:text-accent" : "text-accent dark:before:accent hover:text-accent-hover"}`}>{t('marketplace')}</Link>
                    <Link href="/creator" className={`link-underline-regular cursor-pointer block ${small ? "text-amber-600/50 dark:text-amber-400/50 group-hover:text-accent" : "text-accent dark:before:accent hover:text-accent-hover"}`}>{t('creator')}</Link>
                    <Link href="/about" className={`link-underline-regular cursor-pointer block ${small ? "text-amber-600/50 dark:text-amber-400/50 group-hover:text-accent" : "text-accent dark:before:accent hover:text-accent-hover"}`}>{t('about')}</Link>
                    <Link href="/features" className={`link-underline-regular cursor-pointer block ${small ? "text-amber-600/50 dark:text-amber-400/50 group-hover:text-accent" : "text-accent dark:before:accent hover:text-accent-hover"}`}>{t('features')}</Link>
                    {isConfigured && !user && <Link href="/login" className={`link-underline-regular cursor-pointer block ${small ? "text-amber-600/50 dark:text-amber-400/50 group-hover:text-accent" : "text-accent dark:before:accent hover:text-accent-hover"}`}>{t('login')}</Link>}
                </div>
                <div className="flex items-center gap-2 ml-4">
                    {user && <NotificationBell />}
                    <a href="https://github.com/ItzMassel/Chessperiment" target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-accent transition-colors" aria-label="GitHub">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                        </svg>
                    </a>
                    <a href="https://discord.gg/2XrGZw9PMP" target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-accent transition-colors" aria-label="Discord">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                        </svg>
                    </a>
                </div>
                <div className="flex relative items-center bg-amber-400/10 rounded-full p-1 border border-amber-400/20 ml-4 focus-within:ring-2 focus-within:ring-amber-400/40 outline-none">
                    <div
                        className={`absolute h-6 w-8 bg-linear-to-br from-amber-300 to-amber-500 rounded-full transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) shadow-[0_0_8px_rgba(245,158,11,0.5)]`}
                        style={{
                            left: locale === 'en' ? '4px' : '36px',
                        }}
                    />
                    <Link
                        href={pathname}
                        locale="en"
                        className={`relative z-10 w-8 h-6 flex items-center justify-center text-xs font-bold transition-colors duration-300 ${locale === 'en' ? 'text-bg' : 'text-amber-400/60 hover:text-amber-400'}`}
                    >
                        EN
                    </Link>
                    <Link
                        href={pathname}
                        locale="de"
                        className={`relative z-10 w-8 h-6 flex items-center justify-center text-xs font-bold transition-colors duration-300 ${locale === 'de' ? 'text-bg' : 'text-amber-400/60 hover:text-amber-400'}`}
                    >
                        DE
                    </Link>
                </div>
            </div>

        </header>
    )
}
