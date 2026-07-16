import { AIAssistantProvider } from '@/context/AIAssistantContext';
import AIAssistantPanel from '@/components/ai/AIAssistantPanel';

interface EditorProjectLayoutProps {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}

export default async function EditorProjectLayout({ children, params }: EditorProjectLayoutProps) {
  const { projectId } = await params;

  return (
    <AIAssistantProvider projectId={projectId}>
      <AIAssistantPanel />
      {children}
    </AIAssistantProvider>
  );
}
