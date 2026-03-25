import { getTranslations } from 'next-intl/server';
import PageClient from './PageClient';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'SEO.Editor' });
    return {
        title: t('title'),
        description: t('description'),
        alternates: {
            canonical: `https://chessperiment.app/${locale}/editor`,
            languages: {
                'en': 'https://chessperiment.app/en/editor',
                'de': 'https://chessperiment.app/de/editor',
                'x-default': 'https://chessperiment.app/en/editor',
            }
        },
        openGraph: {
            title: t('title'),
            description: t('description'),
            url: `https://chessperiment.app/${locale}/editor`,
            type: "website",
            images: [{ url: "/images/seo/og-editor.png", width: 1200, height: 630 }],
        },
        twitter: {
            card: "summary_large_image",
            title: t('title'),
            description: t('description'),
            images: ["/images/seo/twitter-image.png"],
        },
    };
}

export default async function EditorPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'SEO.Editor' });

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Chessperiment Project Editor",
        "url": `https://chessperiment.app/${locale}/editor`,
        "description": t('description'),
        "applicationCategory": "GameApplication",
        "operatingSystem": "Web",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        "author": { "@type": "Organization", "name": "Chessperiment", "url": "https://chessperiment.app" },
        "featureList": ["Project management", "Board editor", "Piece editor", "Custom game rules"]
    };

    return <>
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
        <h1 className="sr-only">{t('h1')}</h1>
        <PageClient />
    </>;
}
