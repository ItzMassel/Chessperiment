import { getTranslations } from 'next-intl/server';
import PageClient from './PageClient';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; projectId: string }> }) {
    const { locale, projectId } = await params;
    const t = await getTranslations({ locale, namespace: 'SEO.PieceEditor' });
    const url = `https://chessperiment.app/${locale}/editor/${projectId}/piece-editor`;
    return {
        title: t('title'),
        description: t('description'),
        openGraph: {
            title: t('title'),
            description: t('description'),
            url,
            siteName: 'Chessperiment',
            images: [{ url: '/images/seo/og-home.png', width: 1200, height: 630 }],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: t('title'),
            description: t('description'),
            images: ['/images/seo/twitter-image.png'],
        },
    };
}

export default async function PieceEditorPage({ params }: { params: Promise<{ locale: string; projectId: string }> }) {
    const { projectId } = await params;
    return <PageClient projectId={projectId} />;
}
