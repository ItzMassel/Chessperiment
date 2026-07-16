'use client';

import React from 'react';
import PlayBoard from '@/components/game/PlayBoard';
import { useProject } from '@/hooks/useProject';
import { useRouter } from '@/i18n/navigation';
import { Loader2 } from 'lucide-react';

interface PageClientProps {
    id: string;
    isMarketplace: boolean;
    mode?: 'online';
    roomId?: string;
}

export default function PageClient({ id, isMarketplace, mode, roomId }: PageClientProps) {
    const router = useRouter();

    // If no ID, redirect to lobby
    React.useEffect(() => {
        if (!id) {
            router.push(isMarketplace ? '/marketplace' : '/game');
        }
    }, [id, isMarketplace, router]);

    const {
        project,
        loading,
        error
    } = useProject(id, {
        fromMarketplace: isMarketplace,
        suppressRedirect: true // Handle redirect manually or show error
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-stone-950 text-white">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-stone-950 text-white">
                <div className="text-center">
                    <h2 className="text-xl font-bold mb-2 text-red-400">Error</h2>
                    <p className="text-stone-400">{error || "Project not found"}</p>
                    <button
                        onClick={() => router.push(isMarketplace ? '/marketplace' : '/editor')}
                        className="mt-4 px-4 py-2 bg-stone-800 rounded hover:bg-stone-700 transition"
                    >
                        Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <PlayBoard
            project={project}
            projectId={id}
            mode={mode}
            roomId={roomId}
            isMarketplace={isMarketplace}
        />
    );
}
