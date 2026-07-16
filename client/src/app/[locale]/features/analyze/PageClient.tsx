'use client';

import { useState, useEffect } from 'react';
import { zillaSlab, lexend } from '@/lib/fonts';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

const calculateTargetDate = () => {
    const target = new Date();
    target.setDate(target.getDate() + 7);
    return target;
};

export default function AnalyzePageClient() {
    const t = useTranslations('Analyze');
    const [targetDate] = useState(calculateTargetDate());
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    });

    useEffect(() => {
        const timer = setInterval(() => {
            const difference = targetDate.getTime() - new Date().getTime();

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                });
            } else {
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    return (
        <main className="flex flex-col items-center justify-center leading-xl min-h-screen bg-stone-900 text-white p-6 text-center">
            <div className="max-w-3xl">
                <h1 className={`${zillaSlab.className} text-5xl md:text-7xl font-bold text-[#F2FF00] text-shadow-yellow mb-4`}>
                    {t('title')}
                </h1>
                <p className={`${lexend.className} text-lg md:text-xl text-gray-300 mb-8`}>
                    {t('description')}
                </p>

                <Link
                    href="/"
                    className={`${lexend.className} inline-block bg-yellow-400 text-black font-semibold px-8 py-3 rounded-lg hover:bg-yellow-300 transition-colors duration-300`}
                >
                    {t('goBackHome')}
                </Link>
            </div>
        </main>
    );
}
