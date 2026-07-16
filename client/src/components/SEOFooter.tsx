"use client";

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { DonationCard } from '@/components/DonationCard';

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
                            <h3 className='font-bold text-stone-900 dark:text-white uppercase tracking-widest text-sm mb-4'>Social</h3>
                            <div className="flex gap-3">
                                <a href="https://github.com/ItzMassel/Chessperiment" target="_blank" rel="noopener noreferrer" className="text-stone-500 hover:text-accent transition-colors" aria-label="GitHub">
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                                    </svg>
                                </a>
                                <a href="https://discord.gg/2XrGZw9PMP" target="_blank" rel="noopener noreferrer" className="text-stone-500 hover:text-accent transition-colors" aria-label="Discord">
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                        <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                                    </svg>
                                </a>
                            </div>
                        </div>
                        <DonationCard compact />
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
