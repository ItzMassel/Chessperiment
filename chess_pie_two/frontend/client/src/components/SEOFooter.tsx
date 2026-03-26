"use client";

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Send } from 'lucide-react';

export function SEOFooter() {
    const t = useTranslations('SEO.Footer');

    const faqs = [
        { q: 'whatIsChessperiment', a: 'whatIsChessperimentAnswer' },
        { q: 'isItFree', a: 'isItFreeAnswer' },
        { q: 'canIPlayFriends', a: 'canIPlayFriendsAnswer' },
        { q: 'whatIsLeaper', a: 'whatIsLeaperAnswer' },
        { q: 'whatIsRider', a: 'whatIsRiderAnswer' },
        { q: 'whatIsFairyPiece', a: 'whatIsFairyPieceAnswer' },
        { q: 'canCreateHexBoards', a: 'canCreateHexBoardsAnswer' },
        { q: 'diffFromChessRemix', a: 'diffFromChessRemixAnswer' },
        { q: 'diffFromChessCraft', a: 'diffFromChessCraftAnswer' },
        { q: 'hasStockfish', a: 'hasStockfishAnswer' },
        { q: 'canDesignNonChess', a: 'canDesignNonChessAnswer' },
        { q: 'whatIsMarketplace', a: 'whatIsMarketplaceAnswer' },
    ];

    return (
        <footer className="w-full max-w-7xl mx-auto px-4 py-16 mt-20 border-t border-stone-200 dark:border-stone-800">
            <div className="grid md:grid-cols-2 gap-12">
                <div>
                    <h2 className="text-2xl font-bold mb-6 text-stone-900 dark:text-stone-100">{t('title')}</h2>
                    <div className="space-y-4">
                        {faqs.map((faq) => (
                            <details key={faq.q} className="group bg-white/50 dark:bg-stone-900/50 border border-stone-200 dark:border-white/10 rounded-lg p-4 cursor-pointer">
                                <summary className="font-semibold text-stone-900 dark:text-stone-200 list-none flex justify-between items-center transition-colors">
                                    {t(faq.q)}
                                    <span className="transition group-open:rotate-180">
                                        <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                                    </span>
                                </summary>
                                <p className="text-stone-600 dark:text-stone-400 mt-4 leading-relaxed animate-in slide-in-from-top-2 duration-200">
                                    {t(faq.a)}
                                </p>
                            </details>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col justify-between">
                    <div className='flex flex-col gap-8'>
                        <div>
                            <h3 className='font-bold text-stone-900 dark:text-white uppercase tracking-widest text-sm mb-4'>{t('legal')}</h3>
                            <ul className='space-y-2'>
                                <li>
                                    <Link href="/about" className="text-stone-500 hover:text-accent transition-colors text-sm">
                                        {t('about')}
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/privacy-policy" className="text-stone-500 hover:text-accent transition-colors text-sm">
                                        {t('privacyPolicy')}
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/legal-notice" className="text-stone-500 hover:text-accent transition-colors text-sm">
                                        {t('legalNotice')}
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/feedback" className="text-stone-500 hover:text-accent transition-colors text-sm">
                                        {t('feedback')}
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 className='font-bold text-stone-900 dark:text-white uppercase tracking-widest text-sm mb-4'>Stay Updated</h3>
                            <div className="relative max-w-xs">
                                <input
                                    type="email"
                                    placeholder="your@email.com"
                                    className="w-full bg-white dark:bg-black/20 border border-stone-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 transition-all pr-12"
                                />
                                <button className="absolute right-2 top-2 p-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-400 transition-all">
                                    <Send size={14} />
                                </button>
                            </div>
                        </div>
                        <div className='flex flex-col gap-2'>
                            <h3 className='font-bold text-stone-900 dark:text-white uppercase tracking-widest text-sm'>Chessperiment</h3>
                            <p className='text-stone-500 text-sm'>
                                {t('builtBy')} <br />
                                &copy; {new Date().getFullYear()} Chessperiment.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
