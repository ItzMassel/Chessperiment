import { getMarketplaceItem } from '@/lib/marketplace-data';
import { getTranslations } from 'next-intl/server';
import ClientPage from './ClientPage';
import { notFound } from 'next/navigation';

interface Props {
    params: Promise<{
        id: string;
        locale: string;
    }>;
}

export async function generateMetadata({ params }: Props) {
    const { id, locale } = await params;
    const item = await getMarketplaceItem(id);
    if (!item) return { title: 'Item Not Found' };
    return {
        title: `${item.title} - chessperiment Marketplace`,
        description: item.description
    };
}

export default async function Page({ params }: Props) {
    const { id, locale } = await params;
    const item = await getMarketplaceItem(id);

    if (!item) {
        notFound();
    }

    // Serialize Dates for client component
    const serializedItem = JSON.parse(JSON.stringify(item));

    return <ClientPage item={serializedItem} />;
}
