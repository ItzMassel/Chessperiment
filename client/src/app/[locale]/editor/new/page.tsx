import PageClient from './PageClient';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
    const params = await props.params;
    const { locale } = params;
    const t = await getTranslations({ locale, namespace: 'Editor' });
    return {
        title: `${t('newProject')} | Chess Pie`,
    };
}

export default function NewProjectPage() {
    return <PageClient />;
}
