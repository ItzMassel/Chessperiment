import { getTranslations } from 'next-intl/server';
import PageClient from './PageClient';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; projectId: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'SEO.PieceEditor' });
    return {
        title: t('title'),
        description: t('description'),
    };
}

export default async function PieceEditorPage({ params }: { params: Promise<{ locale: string; projectId: string }> }) {
    const { projectId } = await params;
    return <PageClient projectId={projectId} />;
}
