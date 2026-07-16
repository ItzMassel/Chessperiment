import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import FeaturesClient from './FeaturesClient';

const siteUrl = 'https://chessperiment.app';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'SEO.Features' });

    return {
        title: t('title'),
        description: t('description'),
        robots: 'index, follow',
        alternates: {
            canonical: `${siteUrl}/${locale}/features`,
            languages: {
                'en': `${siteUrl}/en/features`,
                'de': `${siteUrl}/de/features`,
                'x-default': `${siteUrl}/en/features`,
            },
        },
        openGraph: {
            title: t('title'),
            description: t('description'),
            url: `${siteUrl}/${locale}/features`,
            type: 'website',
        },
    };
}

export default function FeaturesPage() {
    return <FeaturesClient />;
}
