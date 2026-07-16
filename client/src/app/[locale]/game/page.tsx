import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import LobbyPage from "./LobbyPage"
import { GameHelp } from '@/components/help/HelpArticles';

// app/game/page.tsx


export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'SEO.Game' });
    return {
        title: t('title'),
        description: t('description'),
        openGraph: {
            title: t('title'),
            description: t('description'),
            url: `https://chessperiment.app/${locale}/game`,
            siteName: 'chessperiment',
            images: [{ url: '/images/seo/og-game.png', width: 1200, height: 630 }],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: t('title'),
            description: t('description'),
            images: ['/images/seo/twitter-image.png'],
        },
        alternates: {
            canonical: `https://chessperiment.app/${locale}/game`,
            languages: {
                'en': 'https://chessperiment.app/en/game',
                'de': 'https://chessperiment.app/de/game'
            }
        },
    };
}

export default async function Game({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'SEO.Game' });

    const jsonLd_gameIndex = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "chessperiment Games",
        "url": `https://chessperiment.app/${locale}/game`,
        "applicationCategory": "GameApplication",
        "operatingSystem": "Web",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        },
        "description": "Play custom chess variants online with friends."
    };

    return <>
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd_gameIndex).replace(/</g, '\\u003c') }}
        />
        <h1 className="sr-only">{t('h1')}</h1>
        <LobbyPage />
        <section className="container mx-auto px-4 py-12 prose dark:prose-invert max-w-4xl text-center">
            <h2>{t('seoContent.heading')}</h2>
            <p>{t('seoContent.text')}</p>
            <div className="flex flex-wrap justify-center gap-4 mt-8 not-prose">
                <Link href="/editor" className="text-orange-600 dark:text-orange-400 hover:underline font-medium">
                    → Create a New Board
                </Link>
                <Link href="/marketplace" className="text-orange-600 dark:text-orange-400 hover:underline font-medium">
                    → Browse Community Sets
                </Link>
                <Link href="/library" className="text-orange-600 dark:text-orange-400 hover:underline font-medium">
                    → Your Saved Games
                </Link>
            </div>
        </section>
        <GameHelp />
    </>
}