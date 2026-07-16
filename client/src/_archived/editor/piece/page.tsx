import { Link } from "@/i18n/navigation";
import PageClient from "./PageClient";
import { getTranslations } from 'next-intl/server';
import { PieceEditorHelp } from "@/components/help/HelpArticles";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'SEO.EditorPiece' });
    return {
        title: t('title'),
        description: t('description'),
        alternates: {
            canonical: `https://chessperiment.app/${locale}/editor/piece`,
            languages: {
                'en': 'https://chessperiment.app/en/editor/piece',
                'de': 'https://chessperiment.app/de/editor/piece'
            }
        },
        openGraph: {
            title: t('title'),
            description: t('description'),
            url: `https://chessperiment.app/${locale}/editor/piece`,
            siteName: "chessperiment",
            images: [{ url: "/images/seo/og-editor.png", width: 1200, height: 630 }],
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: t('title'),
            description: t('description'),
            images: ["/images/seo/twitter-image.png"],
        },
    };
}

export default async function PiecePage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'SEO.EditorPiece' });

    const jsonLd_pieceEditor = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "chessperiment Piece Editor",
        "url": `https://chessperiment.app/${locale}/editor/piece`,
        "description": t('description'),
        "applicationCategory": "DesignApplication",
        "operatingSystem": "Web",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        "provider": { "@type": "Organization", "name": "chessperiment", "url": `https://chessperiment.app/${locale}` }
    };

    return <>
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd_pieceEditor).replace(/</g, '\\u003c') }}
        />
        <h1 className="sr-only">{t('h1')}</h1>
        <PageClient>
            <section className="container mx-auto px-4 py-12 prose dark:prose-invert max-w-4xl text-center">
                <h2>{t('seoContent.heading')}</h2>
                <p>{t('seoContent.text')}</p>
                <div className="flex flex-wrap justify-center gap-4 mt-8 not-prose">
                    <Link href="/editor/board" className="text-orange-600 dark:text-orange-400 hover:underline font-medium">
                        → Design Custom Boards
                    </Link>
                    <Link href="/library" className="text-orange-600 dark:text-orange-400 hover:underline font-medium">
                        → View Your Library
                    </Link>
                    <Link href="/editor/piece/faq" className="text-orange-600 dark:text-orange-400 hover:underline font-medium">
                        → Technical FAQ & Help
                    </Link>
                </div>
            </section>
            <PieceEditorHelp />
        </PageClient>
    </>
}