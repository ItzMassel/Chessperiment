import PageClient from './PageClient';

export default async function LogicEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <PageClient id={id} />;
}
