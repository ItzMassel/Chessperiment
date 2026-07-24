import { AIAssistantProvider } from '@/context/AIAssistantContext';
import AIAssistantPanel from '@/components/ai/AIAssistantPanel';
import { TutorialProvider } from '@/components/tutorial';
import ProjectEditorSidebar from '@/components/editor/ProjectEditorSidebar';

interface EditorProjectLayoutProps {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}

export default async function EditorProjectLayout({ children, params }: EditorProjectLayoutProps) {
  const { projectId } = await params;

  return (
    <AIAssistantProvider projectId={projectId}>
      <TutorialProvider projectId={projectId}>
        <AIAssistantPanel />
        <ProjectEditorSidebar projectId={projectId} />
        {children}
      </TutorialProvider>
    </AIAssistantProvider>
  );
}
