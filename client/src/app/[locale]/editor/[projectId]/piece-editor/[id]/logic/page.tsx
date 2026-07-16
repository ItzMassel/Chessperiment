import PageClient from './PageClient';

export default async function LogicEditorPage({ params }: { params: Promise<{ id: string, projectId: string }> }) {
    const { id, projectId } = await params;
    return <PageClient id={id} projectId={projectId} />;
}
