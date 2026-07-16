import PageClient from './PageClient';

interface PageProps {
    params: Promise<{
        locale: string;
    }>;
    searchParams: Promise<{
        marketplaceId?: string;
        projectId?: string;
        mode?: string;
        roomId?: string;
    }>;
}

export default async function Page({ searchParams }: PageProps) {
    const { marketplaceId, projectId, mode, roomId } = await searchParams;

    // Determine the target ID and context
    const id = marketplaceId || projectId;
    const isMarketplace = !!marketplaceId;

    return <PageClient id={id || ''} isMarketplace={isMarketplace} mode={mode as any} roomId={roomId} />;
}
