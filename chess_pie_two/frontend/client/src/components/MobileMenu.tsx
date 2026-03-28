"use client"
import { useTranslations } from "next-intl";
import { X } from 'lucide-react';
import { Link, usePathname } from "@/i18n/navigation";

export function MobileMenu({ locale, isMenuOpen, setIsMenuOpen, user }: { locale: string, isMenuOpen: boolean, setIsMenuOpen: (val: boolean) => void, user: any }) {
    const t = useTranslations('Header');
    const pathname = usePathname();

    return (
        <>
            {/* Mobile Nav Overlay */}
            {isMenuOpen && (
                <div className="fixed inset-0 bg-bg z-100 flex flex-col items-center justify-start pt-32 px-8 animate-in slide-in-from-top duration-500">
                    {/* Close button inside overlay */}
                    <button
                        className="absolute top-6 right-6 p-4 text-amber-400 hover:scale-110 transition-transform active:scale-95 bg-amber-400/10 rounded-2xl"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        <X size={32} strokeWidth={3} />
                    </button>

                    <div className="flex flex-col gap-6 w-full max-w-sm">
                        <Link
                            href="/game"
                            className="group flex items-center justify-between text-3xl font-black text-stone-900 dark:text-white hover:text-accent transition-all pl-2"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <span>{t('play')}</span>
                            <div className="w-2 h-2 rounded-full bg-amber-400/20 group-hover:bg-accent group-hover:scale-150 transition-all opacity-0 group-hover:opacity-100" />
                        </Link>
                        <Link
                            href="/editor"
                            className="group flex items-center justify-between text-3xl font-black text-stone-900 dark:text-white hover:text-accent transition-all border-l-4 border-amber-400/0 hover:border-accent pl-2"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <span>{t('boardEditor')}</span>
                            <div className="w-2 h-2 rounded-full bg-amber-400/20 group-hover:bg-accent group-hover:scale-150 transition-all opacity-0 group-hover:opacity-100" />
                        </Link>
                        <Link
                            href="/editor"
                            className="group flex items-center justify-between text-3xl font-black text-stone-900 dark:text-white hover:text-accent transition-all border-l-4 border-amber-400/0 hover:border-accent pl-2"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <span>{t('pieceEditor')}</span>
                            <div className="w-2 h-2 rounded-full bg-amber-400/20 group-hover:bg-accent group-hover:scale-150 transition-all opacity-0 group-hover:opacity-100" />
                        </Link>
                        <Link
                            href="/announcements"
                            className="group flex items-center justify-between text-3xl font-black text-stone-900 dark:text-white hover:text-accent transition-all border-l-4 border-amber-400/0 hover:border-accent pl-2"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <span>{t('news')}</span>
                            <div className="w-2 h-2 rounded-full bg-amber-400/20 group-hover:bg-accent group-hover:scale-150 transition-all opacity-0 group-hover:opacity-100" />
                        </Link>
                        <Link
                            href="/marketplace"
                            className="group flex items-center justify-between text-3xl font-black text-stone-900 dark:text-white hover:text-accent transition-all border-l-4 border-amber-400/0 hover:border-accent pl-2"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <span>{t('marketplace')}</span>
                            <div className="w-2 h-2 rounded-full bg-amber-400/20 group-hover:bg-accent group-hover:scale-150 transition-all opacity-0 group-hover:opacity-100" />
                        </Link>

                        {!user && <Link
                            href="/login"
                            className="group flex items-center justify-between text-3xl font-black text-stone-900 dark:text-white hover:text-accent transition-all border-l-4 border-amber-400/0 hover:border-accent pl-2"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <span>{t('login')}</span>
                            <div className="w-2 h-2 rounded-full bg-amber-400/20 group-hover:bg-accent group-hover:scale-150 transition-all opacity-0 group-hover:opacity-100" />
                        </Link>}
                        <Link
                            href="/about"
                            className="group flex items-center justify-between text-3xl font-black text-stone-900 dark:text-white hover:text-accent transition-all border-l-4 border-amber-400/0 hover:border-accent pl-2"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <span>{t('about')}</span>
                            <div className="w-2 h-2 rounded-full bg-amber-400/20 group-hover:bg-accent group-hover:scale-150 transition-all opacity-0 group-hover:opacity-100" />
                        </Link>
                        <Link
                            href="/features"
                            className="group flex items-center justify-between text-3xl font-black text-stone-900 dark:text-white hover:text-accent transition-all border-l-4 border-amber-400/0 hover:border-accent pl-2"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <span>{t('features')}</span>
                            <div className="w-2 h-2 rounded-full bg-amber-400/20 group-hover:bg-accent group-hover:scale-150 transition-all opacity-0 group-hover:opacity-100" />
                        </Link>
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
