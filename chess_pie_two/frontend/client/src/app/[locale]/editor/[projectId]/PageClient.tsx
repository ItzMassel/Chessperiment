'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Project } from '@/types/Project';
import { useProject } from '@/hooks/useProject';
import { Loader2, Pencil, Check, X, Gamepad2, Globe, Copy, Share2, ExternalLink } from 'lucide-react';
import ProjectEditorSidebar from '@/components/editor/ProjectEditorSidebar';
import BoardPreviewWrapper from '@/components/editor/BoardPreviewWrapper';
import { useSocket } from '@/context/SocketContext';

interface PageClientProps {
    projectId: string;
}

export default function PageClient({ projectId }: PageClientProps) {
    const t = useTranslations('ProjectView');
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const socket = useSocket();

    const {
        project,
        loading,
        saveProject,
        isSaving,
        isGuest
    } = useProject(projectId);

    // Edit states
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [editedDescription, setEditedDescription] = useState('');

    // Room code modal state
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [roomCode, setRoomCode] = useState('');
    const [copySuccess, setCopySuccess] = useState(false);

    // Sync edited fields when project loads
    useEffect(() => {
        if (project) {
            setEditedName(project.name);
            setEditedDescription(project.description || '');
        }
    }, [project]);

    // Socket listener for room creation - auto-join the game
    useEffect(() => {
        if (!socket) {
            console.log('⚠️ Socket not available for listeners');
            return;
        }

        console.log('✅ Setting up room_created listener');

        const onRoomCreated = (data: { roomId: string, isCustom: boolean }) => {
            console.log('📥 room_created event received:', data);
            if (data.isCustom && project) {
                console.log('✅ Navigating to custom game with room:', data.roomId);
                // Redirect to the editor's play page which handles custom data correctly
                router.push(`/editor/${projectId}/play?roomId=${data.roomId}&mode=online`);
            } else {
                console.warn('⚠️ Not navigating - isCustom:', data.isCustom, 'project:', !!project);
            }
        };

        socket.on("room_created", onRoomCreated);
        return () => {
            console.log('🧹 Cleaning up room_created listener');
            socket.off("room_created", onRoomCreated);
        };
    }, [socket, router, projectId, project]);

    const handleSaveInfo = async () => {
        if (!project) return;
        const success = await saveProject({
            name: editedName.trim() || project.name,
            description: editedDescription.trim(),
        });

        if (success) {
            setIsEditingName(false);
            setIsEditingDescription(false);
        }
    };

    const handlePlayOnline = () => {
        console.log('🎮 Play Online clicked');
        if (!socket || !socket.connected) {
            console.error('❌ Socket not connected');
            alert('Connection error. Please refresh the page and try again.');
            return;
        }

        if (!project) {
            console.error('❌ No project loaded');
            alert('Project not loaded. Please try again.');
            return;
        }

        // Serialize project
        const serializedProject = {
            ...project,
            createdAt: project.createdAt instanceof Date ? project.createdAt.toISOString() : project.createdAt,
            updatedAt: project.updatedAt instanceof Date ? project.updatedAt.toISOString() : project.updatedAt,
            customPieces: project.customPieces.map(pc => ({
                ...pc,
                createdAt: pc.createdAt instanceof Date ? pc.createdAt.toISOString() : pc.createdAt,
                updatedAt: pc.updatedAt instanceof Date ? pc.updatedAt.toISOString() : pc.updatedAt,
            }))
        };

        console.log('📤 Emitting create_room event');
        socket.emit("create_room", { customData: serializedProject });
    };

    const handleCopyRoomCode = async () => {
        try {
            await navigator.clipboard.writeText(roomCode);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleCopyLink = async () => {
        const link = `${window.location.origin}/editor/${projectId}/play?roomId=${roomCode}&mode=online`;
        try {
            await navigator.clipboard.writeText(link);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleShare = async () => {
        const link = `${window.location.origin}/editor/${projectId}/play?roomId=${roomCode}&mode=online`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Join my ${project?.name} game!`,
                    text: `Join my custom chess variant: ${project?.name}`,
                    url: link,
                });
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    console.error('Share failed:', err);
                }
            }
        } else {
            handleCopyLink();
        }
    };

    const handleJoinGame = () => {
        setShowRoomModal(false);
        router.push(`/editor/${projectId}/play?roomId=${roomCode}&mode=online`);
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

    if (!project) {
        return null;
    }

    return (
        <div className="relative min-h-screen">
            {/* Board display area */}
            <div className="pt-24 pb-32 px-4">
                <div className="container mx-auto max-w-4xl">
                    <div className="mb-12">
                        {/* Name Section */}
                        <div className="group relative flex items-center gap-4 mb-2">
                            {isEditingName ? (
                                <div className="flex items-center gap-2 w-full max-w-2xl">
                                    <input
                                        type="text"
                                        className="text-4xl font-black bg-stone-100 dark:bg-stone-800 px-4 py-2 rounded-2xl outline-none ring-2 ring-accent focus:ring-4 transition-all w-full"
                                        value={editedName}
                                        onChange={(e) => setEditedName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveInfo()}
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleSaveInfo}
                                        disabled={isSaving}
                                        className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors shadow-lg shadow-green-500/20"
                                    >
                                        {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check className="w-6 h-6" />}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditingName(false);
                                            setEditedName(project.name);
                                        }}
                                        className="p-3 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-600 dark:text-stone-300 rounded-xl transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-5xl font-black text-stone-900 dark:text-white tracking-tight">
                                        {project.name}
                                    </h1>
                                    <button
                                        onClick={() => setIsEditingName(true)}
                                        className="opacity-0 group-hover:opacity-100 p-2 text-stone-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-all"
                                        title={t('editName')}
                                    >
                                        <Pencil size={20} />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Description Section */}
                        <div className="group relative flex items-start gap-4">
                            {isEditingDescription ? (
                                <div className="flex items-start gap-2 w-full max-w-2xl mt-4">
                                    <textarea
                                        className="text-lg text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-4 py-3 rounded-2xl outline-none ring-2 ring-accent focus:ring-4 transition-all w-full min-h-[100px] resize-none"
                                        value={editedDescription}
                                        onChange={(e) => setEditedDescription(e.target.value)}
                                        placeholder={t('placeholderDescription')}
                                        autoFocus
                                    />
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={handleSaveInfo}
                                            disabled={isSaving}
                                            className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors shadow-lg shadow-green-500/20"
                                        >
                                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsEditingDescription(false);
                                                setEditedDescription(project.description || '');
                                            }}
                                            className="p-3 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-600 dark:text-stone-300 rounded-xl transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <p className="text-xl text-stone-600 dark:text-white/60 font-medium max-w-2xl leading-relaxed">
                                        {project.description || <span className="italic opacity-50">{t('placeholderDescription')}</span>}
                                    </p>
                                    <button
                                        onClick={() => setIsEditingDescription(true)}
                                        className="opacity-0 group-hover:opacity-100 p-2 mt-1 text-stone-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-all shrink-0"
                                        title={t('editDescription')}
                                    >
                                        <Pencil size={18} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Board Preview */}
                    <div className="mt-12 flex flex-col items-center gap-6">
                        {/* Action Buttons */}
                        <div className="flex gap-4 w-full max-w-2xl">
                            {/* Play Online - Primary */}
                            <button
                                onClick={handlePlayOnline}
                                disabled={!socket || !project}
                                className="flex-1 group relative inline-flex items-center justify-center gap-3 px-8 py-5 bg-linear-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-lg hover:from-amber-600 hover:to-orange-600 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                <Globe size={24} />
                                <span>Play with Friends</span>
                            </button>

                            {/* Play Local - Secondary */}
                            <button
                                onClick={() => router.push(`/editor/${projectId}/play?mode=local`)}
                                className="flex-1 inline-flex items-center justify-center gap-3 px-8 py-5 bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-white rounded-xl font-bold text-lg hover:bg-stone-300 dark:hover:bg-stone-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                <Gamepad2 size={24} />
                                <span>Play Local</span>
                            </button>
                        </div>

                        <div className="w-full h-[600px] relative z-10">
                            <BoardPreviewWrapper board={project as any} />
                        </div>
                    </div>
                </div>
            </div>


            {/* Editor Sidebar */}
            <ProjectEditorSidebar projectId={projectId} />

            {/* Room Code Modal */}
            {showRoomModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-8 max-w-md w-full">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-amber-500 rounded-xl text-white">
                                <Globe size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-stone-900 dark:text-white">Room Created!</h2>
                                <p className="text-sm text-stone-500 dark:text-stone-400">Share this code with your friend</p>
                            </div>
                        </div>

                        {/* Room Code Display */}
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">
                                Room Code
                            </label>
                            <div
                                onClick={handleCopyRoomCode}
                                className="relative bg-stone-100 dark:bg-stone-800 rounded-2xl p-4 cursor-pointer hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                            >
                                <div className="text-center font-mono text-3xl font-black text-amber-500 select-all">
                                    {roomCode}
                                </div>
                                <div className="absolute top-2 right-2">
                                    <Copy size={16} className="text-stone-400" />
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <button
                                onClick={handleCopyRoomCode}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 rounded-xl font-bold text-stone-900 dark:text-white transition-colors"
                            >
                                <Copy size={18} />
                                {copySuccess ? 'Copied!' : 'Copy Room Code'}
                            </button>

                            <button
                                onClick={handleShare}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-xl font-bold text-white shadow-lg shadow-orange-500/20 transition-all"
                            >
                                <Share2 size={18} />
                                Share Link
                            </button>

                            <button
                                onClick={handleJoinGame}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-xl font-bold text-white shadow-lg shadow-indigo-500/20 transition-all"
                            >
                                <ExternalLink size={18} />
                                Join Game
                            </button>
                        </div>

                        {/* Full Link (for reference) */}
                        <div className="mt-6 pt-6 border-t border-stone-200 dark:border-stone-800">
                            <button
                                onClick={handleCopyLink}
                                className="w-full text-left p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                            >
                                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                                    Full Link
                                </p>
                                <p className="text-xs font-mono text-stone-600 dark:text-stone-400 break-all">
                                    {`${typeof window !== 'undefined' ? window.location.origin : ''}/editor/${projectId}/play?roomId=${roomCode}&mode=online`}
                                </p>
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
