import { getTranslations } from 'next-intl/server';
import PageClient from './PageClient';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; projectId: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'SEO.ProjectView' });
    return {
        title: t('title'),
        description: t('description'),
        alternates: {
            canonical: `https://chessperiment.app/${locale}/editor`,
            languages: {
                'en': 'https://chessperiment.app/en/editor',
                'de': 'https://chessperiment.app/de/editor'
            }
        },
    };
}

export default async function ProjectViewPage({ params }: { params: Promise<{ locale: string; projectId: string }> }) {
    const { projectId } = await params;
    return <PageClient projectId={projectId} />;
}
