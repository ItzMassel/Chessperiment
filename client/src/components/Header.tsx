"use client"
import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { outfit, mono } from '@/lib/fonts';
import { Menu, X } from 'lucide-react';
import { isConfigured } from '@/lib/firebase-client';

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
