import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/i18n/navigation';
import { Project } from '@/types/Project';
import { getProjectAction, saveProjectAction, saveProjectBoardAction } from '@/app/actions/editor';
import { getMarketplaceProjectAction } from '@/app/actions/marketplace';
import { LocalProjectStore } from '@/lib/local-persistence';

export interface UseProjectOptions {
    suppressRedirect?: boolean;
    fromMarketplace?: boolean;
}

export function useProject(projectId: string, options: UseProjectOptions = {}) {
    const { suppressRedirect = false, fromMarketplace = false } = options;
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Use a ref to always have the latest project state for callbacks
    const projectRef = useRef<Project | null>(null);
    useEffect(() => {
        projectRef.current = project;
    }, [project]);

    const isGuest = projectId.startsWith('guest-');

    const loadProject = useCallback(async () => {
        if (authLoading && !fromMarketplace) return; // Marketplace doesn't require auth to read

        setLoading(true);
        setError(null);
        try {
            if (fromMarketplace) {
                const result = await getMarketplaceProjectAction(projectId);
                if (result.success && result.data) {
                    setProject(result.data);
                } else {
                    if (!suppressRedirect) router.push('/marketplace');
                    setError(result.error || 'Project not found');
                }
            } else if (isGuest) {
                const guestProject = LocalProjectStore.getProject(projectId);
                if (guestProject) {
                    setProject(guestProject);
                } else {
                    if (!suppressRedirect) router.push('/editor');
                    setError('Project not found');
                }
            } else if (user) {
                const result = await getProjectAction(projectId);
                if (result.success && result.data) {
                    setProject(result.data);
                } else {
                    if (!suppressRedirect) router.push('/editor');
                    setError(result.error || 'Project not found');
                }
            } else {
                if (!suppressRedirect) router.push('/login');
                setError('Unauthorized');
            }
        } catch (error) {
            console.error('Error loading project:', error);
            if (!suppressRedirect) router.push('/editor');
            setError('Failed to load project');
        } finally {
            setLoading(false);
        }
    }, [user, authLoading, projectId, router, isGuest, suppressRedirect, fromMarketplace]);

    useEffect(() => {
        loadProject();
    }, [loadProject]);

    const serializeForServer = useCallback((p: Project): any => {
        const serialized = { ...p };
        if (serialized.createdAt instanceof Date) serialized.createdAt = serialized.createdAt.toISOString() as any;
        if (serialized.updatedAt instanceof Date) serialized.updatedAt = serialized.updatedAt.toISOString() as any;
        
        if (serialized.customPieces) {
            serialized.customPieces = serialized.customPieces.map(pc => ({
                ...pc,
                createdAt: pc.createdAt instanceof Date ? pc.createdAt.toISOString() : pc.createdAt,
                updatedAt: pc.updatedAt instanceof Date ? pc.updatedAt.toISOString() : pc.updatedAt,
            })) as any;
        }
        
        if (serialized.squareLogic) {
            const newSquareLogic: any = {};
            for (const [key, val] of Object.entries(serialized.squareLogic)) {
                newSquareLogic[key] = {
                    ...val,
                    createdAt: val.createdAt instanceof Date ? val.createdAt.toISOString() : (val.createdAt as any),
                    updatedAt: val.updatedAt instanceof Date ? val.updatedAt.toISOString() : (val.updatedAt as any)
                };
            }
            serialized.squareLogic = newSquareLogic;
        }
        return serialized;
    }, []);

    const saveProject = useCallback(async (updates: Partial<Project>) => {
        if (!projectRef.current || isSaving) return false;

        setIsSaving(true);
        try {
            const updatedProject: Project = {
                ...projectRef.current,
                ...updates,
                updatedAt: new Date()
            };

            if (isGuest) {
                LocalProjectStore.saveProject(updatedProject);
                setProject(updatedProject);
                return true;
            } else if (user) {
                const result = await saveProjectAction(serializeForServer(updatedProject));
                if (result.success) {
                    setProject(updatedProject);
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Error saving project:', error);
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [user, isGuest, isSaving, serializeForServer]);

    const saveBoard = useCallback(async (boardData: any) => {
        if (!projectRef.current) return false;

        try {
            const updatedProject: Project = {
                ...projectRef.current,
                ...boardData,
                updatedAt: new Date()
            };

            // Update local state immediately for responsiveness
            setProject(updatedProject);

            if (isGuest) {
                LocalProjectStore.saveProject(updatedProject);
                return true;
            } else if (user) {
                // For board data, we use a specific optimized action
                const result = await saveProjectBoardAction(projectId, boardData);
                return result.success;
            }
            return false;
        } catch (error) {
            console.error('Error saving board info:', error);
            return false;
        }
    }, [user, isGuest, projectId]);

    return {
        project,
        loading: authLoading || loading,
        isSaving,
        error,
        saveProject,
        saveBoard,
        refresh: loadProject,
        isGuest,
        user
    };
}
