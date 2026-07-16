import PageClient from './PageClient';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: { locale: string; projectId: string } }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'SEO.SquareEditor' });

    return {
        title: t('title'),
        description: t('description'),
    };
}

export default async function Page({ params }: { params: { projectId: string; locale: string } }) {
    const { projectId } = await params;
    return <PageClient projectId={projectId} />;
}
