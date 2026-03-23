import { getMarketplaceItem } from '@/lib/marketplace-data';
import { getReviews } from '@/app/actions/marketplace';
import ClientPage from './ClientPage';
import { notFound } from 'next/navigation';

interface Props {
    params: Promise<{
        id: string;
        locale: string;
    }>;
}

export async function generateMetadata({ params }: Props) {
    const { id } = await params;
    const item = await getMarketplaceItem(id);
    if (!item) return { title: 'Item Not Found' };
    return {
        title: `${item.title} - chessperiment Marketplace`,
        description: item.description
    };
}

export default async function Page({ params }: Props) {
    const { id } = await params;
    const [item, reviews] = await Promise.all([
        getMarketplaceItem(id),
        getReviews(id),
    ]);

    if (!item) {
        notFound();
    }

    const serializedItem = JSON.parse(JSON.stringify(item));
    const serializedReviews = JSON.parse(JSON.stringify(reviews));

    return <ClientPage item={serializedItem} reviews={serializedReviews} />;
}