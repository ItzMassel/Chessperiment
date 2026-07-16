'use client';

import React from 'react';
import PlayBoard from '@/components/game/PlayBoard';
import { useProject } from '@/hooks/useProject';
import { useRouter } from '@/i18n/navigation';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface PageClientProps {
    projectId: string;
}

export default function PageClient({ projectId }: PageClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const roomId = searchParams.get('roomId');
    const mode = searchParams.get('mode');

    // In online mode, we might not be the owner of the project, 
    // so we suppress the redirect and let PlayBoard handle loading from socket if needed.
    const {
        project,
        loading,
        error
    } = useProject(projectId, {
        suppressRedirect: mode === 'online' && !!roomId
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-stone-950 text-white">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    // Only show error if we're not in online mode (where the socket can provide the data)
    if (error && !(mode === 'online' && roomId)) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-stone-950 text-white">
                <div className="text-center">
                    <h2 className="text-xl font-bold mb-2 text-red-400">Error</h2>
                    <p className="text-stone-400">{error}</p>
                    <button
                        onClick={() => router.push('/editor')}
                        className="mt-4 px-4 py-2 bg-stone-800 rounded hover:bg-stone-700 transition"
                    >
                        Back to Editor
                    </button>
                </div>
            </div>
        );
    }

    return <PlayBoard project={project as any} projectId={projectId} roomId={roomId || undefined} mode={mode as 'online' | undefined} />;
}
