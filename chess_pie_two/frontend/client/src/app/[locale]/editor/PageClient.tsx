"use client";
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { auth } from '@/lib/firebase-client';
import { Project } from '@/types/Project';
import {
    migrateUserAction,
    getUserProjectsAction,
    deleteProjectAction,
    toggleProjectStarAction,
    saveProjectAction
} from '@/app/actions/editor';
import { LocalProjectStore } from '@/lib/local-persistence';
import { Plus, Sparkles, Loader2 } from 'lucide-react';
import ProjectList from '@/components/editor/ProjectList';
import CreatorProfileSection from '@/components/dashboard/CreatorProfileSection';
import PublishModal from '@/components/marketplace/PublishModal';
import { toast } from 'sonner';

export default function PageClient() {
    const t = useTranslations('Editor');
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [migrating, setMigrating] = useState(false);
    const isLoadingRef = useRef(false);
    const [publishModalOpen, setPublishModalOpen] = useState(false);
    const [publishingProjectId, setPublishingProjectId] = useState<string | null>(null);

    useEffect(() => {
        loadProjects();
    }, [user, authLoading]);

    async function loadProjects() {
        if (authLoading || isLoadingRef.current) return;
        isLoadingRef.current = true;

        console.time('editor-load');
        setLoading(true);
        try {
            let allProjects: Project[] = [];

            // 1. Load guest projects from localStorage
            const guestProjects = LocalProjectStore.getProjects();
            allProjects = [...guestProjects];

            // 2. Load user projects if authenticated
            if (user) {
                console.log('Loading user data for:', user.uid);
                const result = await getUserProjectsAction();

                if (result.success && result.data) {
                    // Filter out any duplicates if they somehow exist, or just merge
                    // User projects take precedence if same ID (unlikely due to prefixes)
                    const userProjects = result.data;
                    allProjects = [...userProjects, ...allProjects.filter(gp => !userProjects.find(up => up.id === gp.id))];
                } else if (!result.success && result.error === "Unauthorized") {
                    // Ignore unauthorized if we are just checking
                }
            }

            // Sort all projects by updatedAt
            setProjects(allProjects.sort((a, b) => {
                if (a.isStarred && !b.isStarred) return -1;
                if (!a.isStarred && b.isStarred) return 1;
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            }));

            // Handle migration if needed (only if logged in and no projects)
            if (user && allProjects.filter(p => p.id && !p.id.startsWith('guest-')).length === 0) {
                console.log('No cloud projects found, checking migration...');
                // Trigger migration in background or show UI? For now keep it as is
                // but only if migration hasn't been done
                const idToken = await auth.currentUser?.getIdToken();
                if (idToken) {
                    setMigrating(true);
                    const migrationResult = await migrateUserAction(idToken);
                    if (migrationResult.success) {
                        const refetchResult = await getUserProjectsAction();
                        if (refetchResult.success && refetchResult.data) {
                            const migratedProjects = refetchResult.data;
                            setProjects(prev => {
                                const combined = [...migratedProjects, ...prev.filter(gp => !migratedProjects.find(up => up.id === gp.id))];
                                return combined.sort((a, b) => {
                                    if (a.isStarred && !b.isStarred) return -1;
                                    if (!a.isStarred && b.isStarred) return 1;
                                    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                                });
                            });
                        }
                    }
                    setMigrating(false);
                }
            }
        } catch (error) {
            console.error('Error loading projects:', error);
        } finally {
            setLoading(false);
            isLoadingRef.current = false;
        }
    }

    const [isCreating, setIsCreating] = useState(false);

    const handleCreateNew = () => {
        router.push('/editor/new');
    };

    const handleQuickCreate = async () => {
        if (isCreating) return;
        setIsCreating(true);
        try {
            const newProject: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> = {
                userId: user?.uid || 'guest',
                name: t('unnamedProject'),
                description: '',
                rows: 8,
                cols: 8,
                gridType: 'square',
                activeSquares: Array.from({ length: 64 }, (_, i) => `${i % 8},${Math.floor(i / 8)}`),
                placedPieces: {},
                isStarred: false,
                customPieces: []
            };

            if (user) {
                const result = await saveProjectAction(newProject as Project);
                if (result.success && result.projectId) {
                    router.push(`/editor/${result.projectId}/board-editor`);
                } else {
                    throw new Error(result.error || 'Failed to create project');
                }
            } else {
                const projectId = LocalProjectStore.saveProject(newProject);
                router.push(`/editor/${projectId}/board-editor`);
            }
        } catch (error) {
            console.error('Error in quick create:', error);
            setIsCreating(false);
        }
    };

    const handleToggleStar = async (projectId: string) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        try {
            if (projectId.startsWith('guest-')) {
                const isStarred = LocalProjectStore.toggleStar(projectId);
                setProjects(prev => prev.map(p =>
                    p.id === projectId ? { ...p, isStarred } : p
                ).sort((a, b) => {
                    if (a.isStarred && !b.isStarred) return -1;
                    if (!a.isStarred && b.isStarred) return 1;
                    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                }));
            } else if (user) {
                const result = await toggleProjectStarAction(projectId);
                if (result.success) {
                    // Optimistic update
                    setProjects(prev => prev.map(p =>
                        p.id === projectId ? { ...p, isStarred: result.isStarred ?? !p.isStarred } : p
                    ).sort((a, b) => {
                        if (a.isStarred && !b.isStarred) return -1;
                        if (!a.isStarred && b.isStarred) return 1;
                        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                    }));
                }
            }
        } catch (error) {
            console.error('Error starring project:', error);
        }
    };

    const handleDeleteProject = async (projectId: string) => {
        if (!confirm(t('deleteConfirm'))) return;
        try {
            if (projectId.startsWith('guest-')) {
                LocalProjectStore.deleteProject(projectId);
                setProjects(prev => prev.filter(p => p.id !== projectId));
            } else if (user) {
                const result = await deleteProjectAction(projectId);
                if (result.success) {
                    setProjects(prev => prev.filter(p => p.id !== projectId));
                }
            }
        } catch (error) {
            console.error('Error deleting project:', error);
        }
    };

    const handlePublish = (projectId: string) => {
        if (!user) {
            toast.error("You must be logged in to publish.");
            return;
        }
        const project = projects.find(p => p.id === projectId);
        if (!project) return;
        setPublishingProjectId(projectId);
        setPublishModalOpen(true);
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

    if (migrating) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4">
                <div className="relative">
                    <Loader2 className="w-16 h-16 animate-spin text-accent" />
                    <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-yellow-400 animate-pulse" />
                </div>
                <div className="text-center max-w-md">
                    <h2 className="text-2xl font-bold mb-2">{t('migrating')}</h2>
                    <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                        {t('migratingDescription')}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 md:py-16 max-w-7xl -mt-10 pb relative">
            {/* Background decoration */}
            <div className="absolute top-0 inset-x-0 h-96 bg-linear-to-b from-amber-500/5 to-transparent pointer-events-none -z-10 blur-3xl" />

            {user && <CreatorProfileSection />}

            {/* Publish Modal */}
            {publishingProjectId && (
                <PublishModal
                    open={publishModalOpen}
                    onClose={() => {
                        setPublishModalOpen(false);
                        setPublishingProjectId(null);
                    }}
                    itemType="game"
                    itemId={publishingProjectId}
                    defaultTitle={projects.find(p => p.id === publishingProjectId)?.name || 'Untitled'}
                    defaultDescription={projects.find(p => p.id === publishingProjectId)?.description}
                />
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                        {t('myProjects')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                        {projects.length} {t('projectsActive')}
                    </p>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={handleQuickCreate}
                        disabled={isCreating}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-2xl font-bold transition-all border border-gray-200 dark:border-gray-700 shadow-sm active:scale-95 whitespace-nowrap disabled:opacity-50"
                    >
                        {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-amber-500" />}
                        {t('quickCreate')}
                    </button>

                    <button
                        onClick={handleCreateNew}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-2xl font-bold transition-all shadow-lg shadow-accent/25 hover:shadow-accent/40 active:scale-95 whitespace-nowrap"
                    >
                        <Plus className="w-5 h-5" />
                        {t('newProject')}
                    </button>
                </div>
            </div>

            <ProjectList
                projects={projects}
                onToggleStar={handleToggleStar}
                onDelete={handleDeleteProject}
                onCreateNew={handleCreateNew}
                onPublish={handlePublish}
            />

            <PublishModal
                open={publishModalOpen}
                onClose={() => setPublishModalOpen(false)}
                itemType="game"
                itemId={publishingProjectId || ''}
                defaultTitle={projects.find(p => p.id === publishingProjectId)?.name || 'Untitled'}
                defaultDescription={projects.find(p => p.id === publishingProjectId)?.description}
            />
        </div>
    );
}
