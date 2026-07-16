import AnalyzePageClient from "./PageClient";
import { getTranslations } from 'next-intl/server';
import { SEOFooter } from "@/components/SEOFooter";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'SEO.Analyze' });
    return {
        title: t('title'),
        description: t('description'),
        alternates: {
            canonical: "https://chessperiment.app/en/features/analyze",
            languages: {
                'en': 'https://chessperiment.app/en/features/analyze',
                'de': 'https://chessperiment.app/de/features/analyze'
            }
        },
        openGraph: {
            title: t('title'),
            description: t('description'),
            url: "https://chessperiment.app/en/features/analyze",
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: t('title'),
            description: t('description'),
        },
    };
}

export default async function AnalyzePage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'SEO.Analyze' });

    return (
        <>
            <AnalyzePageClient />
            {/* SEO Footer handles its own constraints, maybe stick to bottom? 
                Analyze page seems full screen centered. Adding footer might look odd if not styled properly.
                Let's omit Footer for this specific "Coming Soon" style page or put it below. 
                The Client component has min-h-screen. 
            */}
        </>
    );
}
