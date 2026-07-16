import { Link } from "@/i18n/navigation";
import PageClient from "./PageClient";
import { getTranslations } from 'next-intl/server';
import { BoardEditorHelp } from "@/components/help/HelpArticles";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'SEO.EditorBoard' });
    return {
        title: t('title'),
        description: t('description'),
        alternates: {
            canonical: `https://chessperiment.app/${locale}/editor/board`,
            languages: {
                'en': 'https://chessperiment.app/en/editor/board',
                'de': 'https://chessperiment.app/de/editor/board'
            }
        },
        openGraph: {
            title: t('title'),
            description: t('description'),
            url: `https://chessperiment.app/${locale}/editor/board`,
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

export default async function Board({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'SEO.EditorBoard' });

    const jsonLd_boardEditor = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "chessperiment Board Editor",
        "url": `https://chessperiment.app/${locale}/editor/board`,
        "description": t('description'),
        "applicationCategory": "DesignApplication",
        "operatingSystem": "Web",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        "provider": { "@type": "Organization", "name": "chessperiment", "url": `https://chessperiment.app/${locale}` },
        "featureList": ["Grid editor", "Tile coloring", "Custom starting positions"]
    };

    return <>
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd_boardEditor).replace(/</g, '\\u003c') }}
        />
        <PageClient>
            <section className="container mx-auto px-4 py-12 mt-32 prose dark:prose-invert max-w-4xl text-center">
                <h1>{t('seoContent.heading')}</h1>
                <p>{t('seoContent.text')}</p>
                <div className="flex flex-wrap justify-center gap-4 mt-8 not-prose">
                    <Link href="/editor/piece" className="text-orange-600 dark:text-orange-400 hover:underline font-medium">
                        → Design Custom Pieces
                    </Link>
                    <Link href="/library" className="text-orange-600 dark:text-orange-400 hover:underline font-medium">
                        → View Your Library
                    </Link>
                    <Link href="/game" className="text-orange-600 dark:text-orange-400 hover:underline font-medium">
                        → Play Online Now
                    </Link>
                </div>
            </section>
            <BoardEditorHelp />
        </PageClient>
    </>
}