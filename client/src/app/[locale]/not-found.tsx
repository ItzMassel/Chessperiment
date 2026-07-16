import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function NotFound() {
    const t = useTranslations('NotFound');

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
            <div className="relative mb-8">
                {/* Visual element: A "ghost" or "lost" piece effect */}
                <div className="text-9xl font-black text-stone-200 dark:text-stone-800 absolute -top-12 left-1/2 -translate-x-1/2 select-none z-0">
                    404
                </div>
                <div className="relative z-10 animate-bounce duration-2000">
                    <svg
                        width="120"
                        height="120"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-amber-500 opacity-80"
                    >
                        <path d="M12 2a3 3 0 0 0-3 3v2h6V5a3 3 0 0 0-3-3z" />
                        <path d="M9 7v10a3 3 0 0 0 6 0V7" />
                        <path d="M6 22h12" />
                        <path d="M8 22v-2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <circle cx="12" cy="12" r="2" className="animate-pulse" />
                    </svg>
                </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-black mb-4 bg-clip-text text-transparent bg-linear-to-r from-amber-500 to-orange-600">
                {t('title')}
            </h1>

            <p className="text-lg text-stone-600 dark:text-stone-400 max-w-md mx-auto mb-10 leading-relaxed">
                {t('description')}
            </p>

            <Link
                href="/"
                className="group relative inline-flex items-center gap-2 px-8 py-4 bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 font-bold rounded-2xl transition-all hover:scale-105 hover:shadow-xl hover:shadow-amber-500/20 active:scale-95"
            >
                {t('backHome')}
                <svg
                    className="w-5 h-5 transition-transform group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
            </Link>

            {/* Decorative background grid */}
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-20 dark:opacity-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-[radial-gradient(circle_at_center,var(--color-amber-500)_0,transparent_70%)] blur-3xl" />
            </div>
        </div>
    );
}
