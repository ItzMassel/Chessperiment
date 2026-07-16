import { Project } from "@/types/Project";
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'chesspie_guest_projects';

export class LocalProjectStore {
    static getProjects(): Project[] {
        if (typeof window === 'undefined') return [];
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return [];
        try {
            const projects = JSON.parse(data);
            return projects.map((p: any) => ({
                ...p,
                createdAt: new Date(p.createdAt),
                updatedAt: new Date(p.updatedAt)
            }));
        } catch (e) {
            console.error('Failed to parse guest projects:', e);
            return [];
        }
    }

    static getProject(id: string): Project | null {
        const projects = this.getProjects();
        return projects.find(p => p.id === id) || null;
    }

    static saveProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): string {
        const projects = this.getProjects();
        const now = new Date();
        
        let projectId = project.id;
        let existingIndex = -1;
        
        if (projectId) {
            existingIndex = projects.findIndex(p => p.id === projectId);
        }

        if (existingIndex >= 0) {
            // Update
            const updatedProject: Project = {
                ...projects[existingIndex],
                ...project,
                updatedAt: now,
                id: projectId!
            };
            projects[existingIndex] = updatedProject;
        } else {
            // Create
            projectId = `guest-${uuidv4()}`;
            const newProject: Project = {
                ...project as any,
                id: projectId,
                userId: 'guest',
                createdAt: now,
                updatedAt: now,
                customPieces: project.customPieces || [],
            };
            projects.push(newProject);
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
        return projectId!;
    }

    static deleteProject(id: string): void {
        const projects = this.getProjects();
        const filtered = projects.filter(p => p.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }

    static toggleStar(id: string): boolean {
        const projects = this.getProjects();
        const index = projects.findIndex(p => p.id === id);
        if (index === -1) return false;
        
        projects[index].isStarred = !projects[index].isStarred;
        projects[index].updatedAt = new Date();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
        return projects[index].isStarred;
    }
}
