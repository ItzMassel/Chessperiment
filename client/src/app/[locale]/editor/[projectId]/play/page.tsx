import PageClient from './PageClient';

interface PageProps {
    params: Promise<{
        locale: string;
        projectId: string;
    }>;
}

export default async function Page({ params }: PageProps) {
    const { projectId } = await params;
    // Pass only projectId, fetch data on client
    return <PageClient projectId={projectId} />;
}
