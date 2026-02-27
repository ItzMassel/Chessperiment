import { Link } from "@/i18n/navigation";
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Star, Filter, ShoppingCart, Heart } from 'lucide-react';
import { Header } from "@/components/Header";
import { getTranslations } from 'next-intl/server';
import { SEOFooter } from "@/components/SEOFooter";
import { MarketplaceGrid } from "@/components/marketplace/MarketplaceGrid";



export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'SEO.Marketplace' });
    return {
        title: t('title'),
        description: t('description'),
        alternates: {
            canonical: `https://chessperiment.app/${locale}/marketplace`,
            languages: {
                'en': 'https://chessperiment.app/en/marketplace',
                'de': 'https://chessperiment.app/de/marketplace'
            }
        },
        openGraph: {
            title: t('title'),
            description: t('description'),
            url: `https://chessperiment.app/${locale}/marketplace`,
            type: "website",
        },
    };
}

export default async function MarketplacePage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'SEO.Marketplace' });
    const marketT = await getTranslations({ locale, namespace: 'Marketplace' });

    return (
        <div className="min-h-screen bg-bg text-stone-900 dark:text-stone-100">
            <h1 className="sr-only">{t('h1')}</h1>

            <main className="max-w-7xl mx-auto pt-24 px-4 pb-12">
                <div className="mb-8 text-center">
                    <h2 className="text-4xl md:text-5xl font-black mb-4 bg-clip-text text-transparent bg-linear-to-r from-amber-500 to-orange-600">
                        Chessperiment {marketT('title')}
                    </h2>
                    <p className="text-xl text-stone-500 dark:text-stone-400 max-w-2xl mx-auto">
                        {marketT('subtitle')}
                    </p>
                </div>

                <div className="flex flex-col gap-8 relative">
                    <MarketplaceGrid />
                </div>
            </main>

            <section className="container mx-auto px-4 py-12 prose dark:prose-invert max-w-4xl text-center">
                <h2>{t('seoContent.heading')}</h2>
                <p>{t('seoContent.text')}</p>
                <div className="flex flex-wrap justify-center gap-4 mt-8 not-prose">
                    <Link href="/editor" className="text-orange-600 dark:text-orange-400 hover:underline font-medium">
                        → Design Your Own Board
                    </Link>
                    <Link href="/editor" className="text-orange-600 dark:text-orange-400 hover:underline font-medium">
                        → Manage Your Projects
                    </Link>
                </div>
            </section>
        </div >
    );
}