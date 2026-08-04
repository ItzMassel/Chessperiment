import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import FeedbackClient from './FeedbackClient';

const siteUrl = 'https://chessperiment.app';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'SEO.Feedback' });

    return {
        title: t('title'),
        description: t('description'),
        robots: 'index, follow',
        alternates: {
            canonical: `${siteUrl}/${locale}/feedback`,
            languages: {
                'en': `${siteUrl}/en/feedback`,
                'de': `${siteUrl}/de/feedback`,
                'x-default': `${siteUrl}/en/feedback`,
            },
        },
        openGraph: {
            title: t('title'),
            description: t('description'),
            url: `${siteUrl}/${locale}/feedback`,
            type: 'website',
        },
    };
}

export default function FeedbackPage() {
    return <FeedbackClient />;
}
