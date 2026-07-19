'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DndContext,
    useSensor,
    DragEndEvent,
    DragOverEvent,
    DragStartEvent,
    DragOverlay,
    useSensors,
    PointerSensor
} from '@dnd-kit/core';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { ChevronLeft, Save } from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import { CustomPiece } from '@/types/firestore';
import { Project } from '@/types/Project';
import { useAIToolRegistration } from '@/hooks/useAIToolRegistration';
import SmallScreenNotice from '@/components/editor/SmallScreenNotice';

// Constants
const BLOCK_HEIGHT = 60;
const DEFAULT_WIDTH = 240;
const VARIABLE_WIDTH = 160;
const SAVE_DEBOUNCE_MS = 2000;

// Types
type BlockCategory = 'trigger' | 'effects' | 'variables';

interface BlockTemplate {
    id: string;
    type: 'trigger' | 'effect' | 'terminal' | 'variable';
    label: string;
    category: BlockCategory;
    color: string;
    description: string;
    sockets?: SocketConfig[];
    width?: number; // Optional predefined width
}

interface SocketConfig {
    id: string;
    type: 'number' | 'text' | 'select';
    label?: string;
    options?: string[];
    acceptsVariable?: boolean;
    variableOnly?: boolean;
}

interface BlockInstance extends BlockTemplate {
    instanceId: string;
    position: { x: number; y: number };
    socketValues: Record<string, any>;
    parentId?: string;
    childId?: string;
    checkFrequency?: 'every-move' | 'every-square';
}

interface GhostState {
    x: number;
    y: number;
    parentId: string;
    template: BlockTemplate;
}

// Mock Templates
const BLOCK_TEMPLATES: BlockTemplate[] = [
    {
        id: 'on-is-captured',
        type: 'trigger',
        label: 'onIsCaptured',
        category: 'trigger',
        color: '#FFD700',
        description: 'onIsCaptured',
        sockets: [
            { id: 'by', type: 'select', label: 'by', options: ['Any', 'Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King'] }
        ],
        width: 220
    },
    {
        id: 'on-captured',
        type: 'trigger',
        label: 'onCaptured',
        category: 'trigger',
        color: '#FFD700',
        description: 'onCaptured',
        sockets: [
            { id: 'by', type: 'select', label: 'piece', options: ['Any', 'Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King'] }
        ],
        width: 220
    },
    {
        id: 'on-threat',
        type: 'trigger',
        label: 'onThreat',
        category: 'trigger',
        color: '#FFD700',
        description: 'onThreat',
        sockets: [
            { id: 'by', type: 'select', label: 'by', options: ['Any', 'Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King'] }
        ],
        width: 220
    },
    {
        id: 'on-move',
        type: 'trigger',
        label: 'onMove',
        category: 'trigger',
        color: '#FFD700',
        description: 'onMove',
        sockets: [],
        width: 140
    },
    {
        id: 'on-environment',
        type: 'trigger',
        label: 'onEnvironment',
        category: 'trigger',
        color: '#FFD700',
        description: 'onEnvironment',
        sockets: [
            { id: 'condition', type: 'select', options: ['White Square', 'Black Square', 'Is Attacked'] }
        ],
        width: 320
    },
    {
        id: 'on-var',
        type: 'trigger',
        label: 'onVar',
        category: 'trigger',
        color: '#FFD700',
        description: 'onVar',
        sockets: [
            { id: 'varName', type: 'text', label: 'Var', acceptsVariable: true, variableOnly: true },
            { id: 'op', type: 'select', options: ['==', '!=', '>', '<', '>=', '<='] },
            { id: 'value', type: 'text', acceptsVariable: true }
        ],
        width: 440
    },

    {
        id: 'cooldown',
        type: 'effect',
        label: 'cooldown',
        category: 'effects',
        color: '#4169E1',
        description: 'cooldown',
        sockets: [
            { id: 'duration', type: 'number', label: 'for', acceptsVariable: true },
            { id: 'unit', type: 'select', options: ['seconds', 'half-moves', 'full-moves'] }
        ],
        width: 420
    },
    {
        id: 'transformation',
        type: 'effect',
        label: 'transformation',
        category: 'effects',
        color: '#4169E1',
        description: 'transformation',
        sockets: [
            { id: 'target', type: 'select', options: ['Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King'] }
        ],
        width: 320
    },
    {
        id: 'modify-var',
        type: 'effect',
        label: 'modVar',
        category: 'effects',
        color: '#4169E1',
        description: 'modVar',
        sockets: [
            { id: 'varName', type: 'text', acceptsVariable: true, variableOnly: true },
            { id: 'op', type: 'select', options: ['+=', '-=', '='] },
            { id: 'value', type: 'number', acceptsVariable: true }
        ],
        width: 440
    },
    {
        id: 'kill',
        type: 'terminal',
        label: 'kill',
        category: 'effects',
        color: '#9370DB',
        description: 'kill',
        sockets: [
            { id: 'target', type: 'select', label: 'Target', options: ['Selected Piece', 'Attacker'] }
        ],
        width: 320
    },
    {
        id: 'prevent',
        type: 'effect',
        label: 'prevent',
        category: 'effects',
        color: '#FF4500',
        description: 'prevent',
        sockets: [
            { id: 'action', type: 'select', label: 'by', options: ['Jump Back', 'Nearest Square', 'Share Square'] }
        ],
        width: 320
    },
    {
        id: 'win',
        type: 'effect',
        label: 'win',
        category: 'effects',
        color: '#FFD700',
        description: 'win',
        width: 160
    },
    {
        id: 'explode',
        type: 'effect',
        label: 'explode',
        category: 'effects',
        color: '#FF4500',
        description: 'explode',
        sockets: [
            { id: 'radius', type: 'number', label: 'radius', acceptsVariable: true }
        ],
        width: 240
    },
    {
        id: 'tell-user',
        type: 'effect',
        label: 'tellUser',
        category: 'effects',
        color: '#20B2AA',
        description: 'tellUser',
        sockets: [
            { id: 'message', type: 'text', label: 'message' }
        ],
        width: 360
    },
    {
        id: 'variable-pos-x',
        type: 'variable',
        label: 'x',
        category: 'variables',
        color: '#32CD32',
        description: 'The x-coordinate (column) of this piece\'s position.',
        width: 80
    },
    {
        id: 'variable-pos-y',
        type: 'variable',
        label: 'y',
        category: 'variables',
        color: '#32CD32',
        description: 'The y-coordinate (row) of this piece\'s position.',
        width: 80
    }
];

export default function LogicPageClient({ id, projectId }: { id: string, projectId?: string }) {
    const t = useTranslations('Editor.Piece.Logic');
    const router = useRouter();
    const [activeCategory, setActiveCategory] = useState<BlockCategory>('trigger');
    const [canvasBlocks, setCanvasBlocks] = useState<BlockInstance[]>([]);
    const [variables, setVariables] = useState<{ id: string, name: string }[]>([]);
    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const [activeDragTemplate, setActiveDragTemplate] = useState<BlockTemplate | null>(null);
    const [ghost, setGhost] = useState<GhostState | null>(null);
    const [infoPanelBlock, setInfoPanelBlock] = useState<BlockInstance | null>(null);
    const [isCreatingVar, setIsCreatingVar] = useState(false);
    const [newVarName, setNewVarName] = useState('');
    const activeTemplateRef = useRef<BlockTemplate | null>(null);
    const draggedDescendantsRef = useRef<Set<string>>(new Set());
    const [mounted, setMounted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const isSavingRef = useRef(false);
    const lastSavedDataRef = useRef<string>('');

    // Unified Hook
    const {
        project,
        loading: projectLoading,
        saveProject,
        isSaving: projectIsSaving,
        isGuest,
        user
    } = useProject(projectId || '');

    const piece = useMemo(() => {
        if (!project) return null;
        return project.customPieces.find(p => p.id === id || p.name === id);
    }, [project, id]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (projectLoading || !piece) return;

        // Load blocks and variables from piece data
        if (piece.logic) {
            try {
                const parsedLogic = typeof piece.logic === 'string' ? JSON.parse(piece.logic) : piece.logic;
                setCanvasBlocks(Array.isArray(parsedLogic) ? parsedLogic : []);
            } catch (e) {
                console.error("Failed to parse logic:", e);
                setCanvasBlocks([]);
            }
        } else {
            setCanvasBlocks([]);
        }

        if (piece.variables && Array.isArray(piece.variables)) {
            setVariables(piece.variables);
        } else {
            setVariables([]);
        }

        // Initialize lastSavedDataRef to current state
        const initialLogic = piece.logic ? (typeof piece.logic === 'string' ? JSON.parse(piece.logic) : piece.logic) : [];
        const initialVars = piece.variables || [];
        lastSavedDataRef.current = JSON.stringify({
            canvasBlocks: Array.isArray(initialLogic) ? initialLogic : [],
            variables: Array.isArray(initialVars) ? initialVars : []
        });
    }, [piece, projectLoading]);

    // Auto-save
    const handleManualSave = useCallback(async () => {
        if (projectLoading || !project || !piece || isSavingRef.current) return;

        // Only save if data has actually changed
        const currentDataString = JSON.stringify({ canvasBlocks, variables });
        if (currentDataString === lastSavedDataRef.current) return;

        isSavingRef.current = true;
        setIsSaving(true);
        try {
            const updatedPieces = project.customPieces.map((p: CustomPiece) =>
                (p.id === id || p.name === id) ? { ...p, logic: canvasBlocks, variables: variables } : p
            );

            await saveProject({
                customPieces: updatedPieces
            });

            // Update last saved data
            lastSavedDataRef.current = JSON.stringify({ canvasBlocks, variables });
        } catch (error) {
            console.error("Save failed:", error);
        } finally {
            setIsSaving(false);
            isSavingRef.current = false;
        }
    }, [canvasBlocks, variables, projectLoading, project, piece, id, saveProject]);

    // Auto-save
    useEffect(() => {
        if (projectLoading || !project || !piece) return;
        const timer = setTimeout(handleManualSave, SAVE_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [canvasBlocks, variables, projectLoading, project, piece, handleManualSave]);


    // ─── AI Tool Registration ───
    const logicToolHandlers = useMemo(() => ({
        add_logic_block: async (args: Record<string, any>) => {
            const template = BLOCK_TEMPLATES.find(t => t.id === args.templateId);
            if (!template) return JSON.stringify({ error: `Unknown template: ${args.templateId}` });
            const instanceId = `instance-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            const newBlock: BlockInstance = {
                ...template,
                instanceId,
                position: args.position || { x: 100, y: 100 },
                socketValues: args.socketValues || {},
            };
            setCanvasBlocks(prev => [...prev, newBlock]);
            return JSON.stringify({ success: true, instanceId });
        },
        remove_logic_block: async (args: Record<string, any>) => {
            setCanvasBlocks(prev => {
                const block = prev.find(b => b.instanceId === args.instanceId);
                if (!block) return prev;
                let updated = prev.filter(b => b.instanceId !== args.instanceId);
                // Clear parent's childId reference
                if (block.parentId) {
                    updated = updated.map(b => b.instanceId === block.parentId ? { ...b, childId: undefined } : b);
                }
                // Clear child's parentId reference
                if (block.childId) {
                    updated = updated.map(b => b.instanceId === block.childId ? { ...b, parentId: undefined } : b);
                }
                return updated;
            });
            return JSON.stringify({ success: true });
        },
        connect_blocks: async (args: Record<string, any>) => {
            setCanvasBlocks(prev => prev.map(b => {
                if (b.instanceId === args.parentInstanceId) return { ...b, childId: args.childInstanceId };
                if (b.instanceId === args.childInstanceId) {
                    const parent = prev.find(p => p.instanceId === args.parentInstanceId);
                    return {
                        ...b,
                        parentId: args.parentInstanceId,
                        position: parent ? { x: parent.position.x, y: parent.position.y + BLOCK_HEIGHT } : b.position
                    };
                }
                return b;
            }));
            return JSON.stringify({ success: true });
        },
        disconnect_block: async (args: Record<string, any>) => {
            setCanvasBlocks(prev => {
                const block = prev.find(b => b.instanceId === args.instanceId);
                if (!block) return prev;
                return prev.map(b => {
                    if (b.instanceId === args.instanceId) return { ...b, parentId: undefined };
                    if (b.childId === args.instanceId) return { ...b, childId: undefined };
                    return b;
                });
            });
            return JSON.stringify({ success: true });
        },
        update_block_sockets: async (args: Record<string, any>) => {
            setCanvasBlocks(prev => prev.map(b =>
                b.instanceId === args.instanceId
                    ? { ...b, socketValues: { ...b.socketValues, ...args.socketValues } }
                    : b
            ));
            return JSON.stringify({ success: true });
        },
        move_block: async (args: Record<string, any>) => {
            setCanvasBlocks(prev => prev.map(b =>
                b.instanceId === args.instanceId ? { ...b, position: args.position } : b
            ));
            return JSON.stringify({ success: true });
        },
        create_piece_variable: async (args: Record<string, any>) => {
            const varId = `var-${Date.now()}`;
            setVariables(prev => [...prev, { id: varId, name: args.name }]);
            return JSON.stringify({ success: true, variableId: varId });
        },
        delete_piece_variable: async (args: Record<string, any>) => {
            setVariables(prev => prev.filter(v => v.id !== args.variableId));
            return JSON.stringify({ success: true });
        },
    }), [canvasBlocks]);

    useAIToolRegistration(logicToolHandlers);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 0,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveDragId(active.id as string);
        draggedDescendantsRef.current.clear();

        let template = BLOCK_TEMPLATES.find(t => t.id === active.id);
        if (!template) {
            const variable = variables.find(v => v.id === active.id);
            if (variable) {
                template = {
                    id: variable.id,
                    type: 'variable',
                    label: variable.name,
                    category: 'variables',
                    color: '#FF8C00',
                    description: `Custom variable: ${variable.name}`
                };
            }
        }

        // Check if it's an existing block on canvas
        if (!template) {
            const instance = canvasBlocks.find(b => b.instanceId === active.id);
            if (instance) {
                setActiveDragTemplate(instance);
                activeTemplateRef.current = instance;

                // Calculate descendants to prevent snapping to them
                const findDescendants = (id: string) => {
                    const child = canvasBlocks.find(b => b.parentId === id);
                    if (child) {
                        draggedDescendantsRef.current.add(child.instanceId);
                        findDescendants(child.instanceId);
                    }
                };
                findDescendants(instance.instanceId);
            }
        }

        if (template) {
            setActiveDragTemplate(template);
            activeTemplateRef.current = template;
        }
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over, delta } = event;
        if (!activeDragTemplate || !over || over.id !== 'canvas') {
            setGhost(null);
            return;
        }

        const canvasElement = document.getElementById('canvas');
        if (!canvasElement) return;

        const canvasRect = canvasElement.getBoundingClientRect();

        // Use initial rect + delta for most stable coordinate calculation
        const initialRect = active.rect.current.initial;
        if (!initialRect) return;

        const currentLeft = initialRect.left + delta.x;
        const currentTop = initialRect.top + delta.y;

        // Convert to canvas coordinates (relative to content, accounting for scroll)
        const dragX = currentLeft - canvasRect.left + canvasElement.scrollLeft;
        const dragY = currentTop - canvasRect.top + canvasElement.scrollTop;

        let bestSnap: GhostState | null = null;
        let minDistance = 80;

        canvasBlocks.forEach(block => {
            if (block.instanceId === active.id) return;
            if (draggedDescendantsRef.current.has(block.instanceId)) return;
            if (block.type === 'variable' || block.childId || block.type === 'terminal') return;
            if (activeDragTemplate.type === 'trigger' || activeDragTemplate.type === 'variable') return;

            // Snap Target: Bottom-Left of the parent block
            const targetX = block.position.x;
            const targetY = block.position.y + BLOCK_HEIGHT;

            // Distance from Top-Left of dragged block to Snap Target
            const dist = Math.sqrt(Math.pow(dragX - targetX, 2) + Math.pow(dragY - targetY, 2));

            if (dist < minDistance) {
                minDistance = dist;
                bestSnap = {
                    x: targetX,
                    y: targetY,
                    parentId: block.instanceId,
                    template: activeDragTemplate
                };
            }
        });

        setGhost(bestSnap);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over, delta } = event;

        // Capture current template and ghost before clearing state
        const currentTemplate = activeDragTemplate || activeTemplateRef.current;
        const currentGhost = ghost;

        // Clear all drag states
        setActiveDragId(null);
        setActiveDragTemplate(null);
        activeTemplateRef.current = null;
        setGhost(null);

        if (!currentTemplate) return;

        // Check for drop into socket
        if (over && over.data.current && over.data.current.type === 'socket' && currentTemplate.type === 'variable') {
            const { blockId, socketId } = over.data.current;

            // Find the socket definition to see if it's variableOnly
            const targetBlockOnCanvas = canvasBlocks.find(b => b.instanceId === blockId);
            const socketDef = targetBlockOnCanvas?.sockets?.find(s => s.id === socketId);
            const isVarOnly = socketDef?.variableOnly;

            setCanvasBlocks(prev => prev.map(b => {
                if (b.instanceId === blockId) {
                    return {
                        ...b,
                        socketValues: {
                            ...b.socketValues,
                            [socketId]: {
                                type: 'variable',
                                id: currentTemplate.id,
                                name: currentTemplate.label,
                                variableOnly: isVarOnly
                            }
                        }
                    };
                }
                return b;
            }));

            // If dragging an existing variable block from canvas, remove it (move behavior)
            if (active.data.current?.block) {
                setCanvasBlocks(prev => prev.filter(b => b.instanceId !== active.id));
            }
            return;
        }

        const canvasElement = document.getElementById('canvas');
        if (!canvasElement) return;

        const canvasRect = canvasElement.getBoundingClientRect();

        // Use initial rect + delta for most stable coordinate calculation
        const initialRect = active.rect.current.initial;
        if (!initialRect) return;

        const currentLeft = initialRect.left + delta.x;
        const currentTop = initialRect.top + delta.y;

        const canvasX = currentLeft - canvasRect.left + canvasElement.scrollLeft;
        const canvasY = currentTop - canvasRect.top + canvasElement.scrollTop;

        // Recalculate snap to ensure reliability (don't depend on ghost state)
        let bestSnap: GhostState | null = null;
        let minDistance = 80;

        for (const block of canvasBlocks) {
            if (block.instanceId === active.id) continue;
            if (draggedDescendantsRef.current.has(block.instanceId)) continue;
            if (block.type === 'variable' || block.childId || block.type === 'terminal') continue;
            if (currentTemplate.type === 'trigger' || currentTemplate.type === 'variable') continue;

            const targetX = block.position.x;
            const targetY = block.position.y + BLOCK_HEIGHT;

            const dist = Math.sqrt(Math.pow(canvasX - targetX, 2) + Math.pow(canvasY - targetY, 2));

            if (dist < minDistance) {
                minDistance = dist;
                bestSnap = {
                    x: targetX,
                    y: targetY,
                    parentId: block.instanceId,
                    template: currentTemplate
                };
            }
        }

        const width = currentTemplate.width || (currentTemplate.type === 'variable' ? VARIABLE_WIDTH : DEFAULT_WIDTH);
        const height = BLOCK_HEIGHT;
        const centerX = currentLeft + width / 2;

        // This check was causing the "way below" issue if not using proper viewport coords
        // Now that canvasX/Y are correct relative to content, we use visual bounds check relative to viewport for "drop outside"
        // But simply: if `currentLeft` is outside `canvasRect`, it's "dropped outside".
        // Keep it simple.

        const isExisting = canvasBlocks.some(b => b.instanceId === active.id);

        if (bestSnap) {
            if (isExisting) {
                setCanvasBlocks(prev => {
                    const oldBlock = prev.find(b => b.instanceId === active.id);
                    if (!oldBlock) return prev;
                    const dx = bestSnap!.x - oldBlock.position.x;
                    const dy = bestSnap!.y - oldBlock.position.y;
                    let updated = prev.map(b => b.childId === active.id ? { ...b, childId: undefined } : b);
                    updated = updated.map(b => b.instanceId === bestSnap!.parentId ? { ...b, childId: active.id as string } : b);
                    return updated.map(b => {
                        if (b.instanceId === active.id) {
                            return { ...b, position: { x: bestSnap!.x, y: bestSnap!.y }, parentId: bestSnap!.parentId };
                        }
                        if (draggedDescendantsRef.current.has(b.instanceId)) {
                            return { ...b, position: { x: b.position.x + dx, y: b.position.y + dy } };
                        }
                        return b;
                    });
                });
            } else {
                const newInstanceId = `instance-${Date.now()}`;
                const newBlock: BlockInstance = {
                    ...bestSnap.template,
                    instanceId: newInstanceId,
                    position: { x: bestSnap.x, y: bestSnap.y },
                    socketValues: {},
                    parentId: bestSnap.parentId
                };
                setCanvasBlocks(prev => {
                    const updated = prev.map(b => b.instanceId === bestSnap!.parentId ? { ...b, childId: newInstanceId } : b);
                    return [...updated, newBlock];
                });
            }
        } else {
            // Boundary Check
            if (currentLeft < canvasRect.left || currentLeft > canvasRect.right ||
                currentTop < canvasRect.top || currentTop > canvasRect.bottom) {
                return;
            }

            if (isExisting) {
                setCanvasBlocks(prev => {
                    const oldBlock = prev.find(b => b.instanceId === active.id);
                    if (!oldBlock) return prev;
                    const dx = canvasX - oldBlock.position.x;
                    const dy = canvasY - oldBlock.position.y;
                    let updated = prev.map(b => b.childId === active.id ? { ...b, childId: undefined } : b);
                    return updated.map(b => {
                        if (b.instanceId === active.id) {
                            return { ...b, position: { x: canvasX, y: canvasY }, parentId: undefined };
                        }
                        if (draggedDescendantsRef.current.has(b.instanceId)) {
                            return { ...b, position: { x: b.position.x + dx, y: b.position.y + dy } };
                        }
                        return b;
                    });
                });
            } else {
                const newBlock: BlockInstance = {
                    ...currentTemplate,
                    instanceId: `instance-${Date.now()}`,
                    position: {
                        x: canvasX,
                        y: canvasY
                    },
                    socketValues: {}
                };
                setCanvasBlocks(prev => [...prev, newBlock]);
            }
        }
    };

    const createVariable = () => {
        if (!newVarName) return;
        const id = `var-${Date.now()}`;
        setVariables([...variables, { id, name: newVarName }]);
        setNewVarName('');
        setIsCreatingVar(false);
    };

    if (projectLoading) {
        return <div className="flex h-screen items-center justify-center bg-[#0f1115] text-white">Loading Logic Editor...</div>
    }

    return (
        <SmallScreenNotice>
        <DndContext
            sensors={sensors}
            autoScroll={false}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-screen bg-[#0f1115] text-white overflow-hidden font-sans selection:bg-blue-500/30">
                {/* 1. CATEGORY SIDEBAR */}
                <div className="w-[60px] border-r border-white/5 bg-[#161920] flex flex-col items-center py-6 gap-8 z-30 shadow-2xl relative">
                    <button
                        onClick={() => projectId ? router.push(`/editor/${projectId}/piece-editor?pieceId=${id}`) : router.back()}
                        className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors mb-4 text-white/50 hover:text-white"
                        title="Back to Piece Editor"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    {(['trigger', 'effects', 'variables'] as BlockCategory[]).map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`
                                text-[10px] uppercase tracking-tighter font-black transition-all duration-300
                                ${activeCategory === cat ? 'text-blue-400 scale-110' : 'text-stone-500 hover:text-stone-300'}
                            `}
                            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                        >
                            {t(`categories.${cat}`)}
                        </button>
                    ))}

                    {/* Manual Save Button */}
                    <button
                        onClick={handleManualSave}
                        disabled={isSaving}
                        className={`p-3 rounded-xl transition-all ${isSaving ? 'text-amber-500 bg-amber-500/10' : 'text-stone-500 hover:text-white hover:bg-white/5'}`}
                        title="Save Logic"
                    >
                        <Save size={20} className={isSaving ? 'animate-pulse' : ''} />
                        <span className="text-[10px] block mt-1 font-bold text-center">SAVE</span>
                    </button>
                </div>

                {/* 2. BLOCK PALETTE SIDEBAR */}
                <div className="w-[340px] border-r border-white/5 bg-[#12141a] flex flex-col z-20 shadow-xl overflow-y-auto custom-scrollbar">
                    <div className="p-6 border-b border-white/5">
                        <h2 className="text-xl font-black text-white/90">{t(`categories.${activeCategory}`)}</h2>
                        <p className="text-xs text-stone-500 mt-1 uppercase tracking-widest font-bold">Block Palette</p>
                    </div>

                    <div className="p-6 flex flex-col gap-4">
                        {activeCategory === 'variables' ? (
                            <>
                                {/* Position Preset Variables Section */}
                                <div className="mb-6">
                                    <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Position Presets</h3>
                                    <div className="flex flex-wrap gap-2">
                                        <BlockTemplateItem
                                            template={BLOCK_TEMPLATES.find(t => t.id === 'variable-pos-x')!}
                                        />
                                        <BlockTemplateItem
                                            template={BLOCK_TEMPLATES.find(t => t.id === 'variable-pos-y')!}
                                        />
                                    </div>
                                </div>

                                {/* Custom Variables Section */}
                                <div>
                                    <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Custom Variables</h3>
                                    {variables.map(v => (
                                        <BlockTemplateItem
                                            key={v.id}
                                            template={{
                                                id: v.id,
                                                type: 'variable',
                                                label: v.name,
                                                category: 'variables',
                                                color: '#FF8C00',
                                                description: `Custom variable: ${v.name}`
                                            }}
                                        />
                                    ))}
                                </div>

                                <AnimatePresence>
                                    {isCreatingVar ? (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col gap-3"
                                        >
                                            <input
                                                autoFocus
                                                value={newVarName}
                                                onChange={e => setNewVarName(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && createVariable()}
                                                placeholder="Variable name..."
                                                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                                            />
                                            <div className="flex gap-2">
                                                <button onClick={createVariable} className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-xs font-bold transition-colors">Create</button>
                                                <button onClick={() => setIsCreatingVar(false)} className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-lg text-xs font-bold transition-colors">Cancel</button>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <button
                                            onClick={() => setIsCreatingVar(true)}
                                            className="mt-2 py-3 px-4 border-2 border-dashed border-white/10 rounded-xl text-stone-500 hover:border-orange-500/50 hover:text-orange-500 transition-all font-bold text-sm bg-white/5"
                                        >
                                            + Create Variable
                                        </button>
                                    )}
                                </AnimatePresence>
                            </>
                        ) : (
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar flex flex-col items-start">
                                {BLOCK_TEMPLATES.filter(t => t.category === activeCategory).map(template => (
                                    <div key={template.id} className="relative w-full h-[50px] group">
                                        <div className="absolute inset-x-0 top-0 opacity-20 pointer-events-none transition-opacity group-hover:opacity-40">
                                            <BlockComponent
                                                block={{ ...template, instanceId: 'bg', position: { x: 0, y: 0 }, socketValues: {} }}
                                            />
                                        </div>
                                        <div className="absolute inset-x-0 top-0 z-10">
                                            <BlockTemplateItem template={template} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. MAIN CANVAS */}
                <Canvas
                    canvasBlocks={canvasBlocks}
                    ghost={ghost}
                    infoPanelBlock={infoPanelBlock}
                    setCanvasBlocks={setCanvasBlocks}
                    setInfoPanelBlock={setInfoPanelBlock}
                />

                {mounted && createPortal(
                    <DragOverlay dropAnimation={null} zIndex={100}>
                        {activeDragTemplate ? (
                            <div className="opacity-90 cursor-grabbing scale-105 transition-transform duration-200">
                                <BlockComponent block={{ ...activeDragTemplate, instanceId: 'overlay', position: { x: 0, y: 0 }, socketValues: (activeDragTemplate as any).socketValues || {} }} />
                            </div>
                        ) : null}
                    </DragOverlay>,
                    document.body
                )}
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.1); }
            `}</style>
        </DndContext >
        </SmallScreenNotice>
    );
}

import { useDraggable, useDroppable } from '@dnd-kit/core';

function Canvas({
    canvasBlocks,
    ghost,
    infoPanelBlock,
    setCanvasBlocks,
    setInfoPanelBlock
}: {
    canvasBlocks: BlockInstance[],
    ghost: GhostState | null,
    infoPanelBlock: BlockInstance | null,
    setCanvasBlocks: React.Dispatch<React.SetStateAction<BlockInstance[]>>,
    setInfoPanelBlock: React.Dispatch<React.SetStateAction<BlockInstance | null>>
}) {
    const { setNodeRef } = useDroppable({
        id: 'canvas',
    });

    return (
        <div className="flex-1 relative h-full overflow-hidden">
            <div className="absolute inset-0 pointer-events-none z-40">
                <div className="absolute inset-x-0 inset-y-0 border border-white/5 m-4 rounded-3xl" />
            </div>

            <div
                id="canvas"
                ref={setNodeRef}
                className="w-full h-full overflow-auto bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] bg-size-[32px_32px] bg-[#0c0e12] custom-scrollbar"
            >
                <div className="absolute top-0 left-0 w-[5000px] h-[5000px] pointer-events-none" />

                <div className="relative w-[5000px] h-[5000px]">
                    {canvasBlocks.map(block => (
                        <DraggableCanvasBlock key={block.instanceId} block={block}>
                            <BlockComponent
                                block={block}
                                onDelete={() => {
                                    setCanvasBlocks(prev => {
                                        const toDelete = new Set([block.instanceId]);
                                        const findChildren = (id: string) => {
                                            const child = prev.find(b => b.parentId === id);
                                            if (child) {
                                                toDelete.add(child.instanceId);
                                                findChildren(child.instanceId);
                                            }
                                        };
                                        findChildren(block.instanceId);
                                        return prev.filter(b => !toDelete.has(b.instanceId)).map(b => b.childId === block.instanceId ? { ...b, childId: undefined } : b);
                                    });
                                }}
                                onUpdateSocket={(sid, val) => {
                                    setCanvasBlocks(prev => prev.map(b => b.instanceId === block.instanceId ? { ...b, socketValues: { ...b.socketValues, [sid]: val } } : b));
                                }}
                                onShowInfo={() => setInfoPanelBlock(block)}
                            onSetFrequency={(freq) => {
                                setCanvasBlocks(prev => prev.map(b => b.instanceId === block.instanceId ? { ...b, checkFrequency: freq } : b));
                            }}
                        />
                        </DraggableCanvasBlock>
                    ))}

                    <AnimatePresence>
                        {ghost && (
                            <div
                                className="absolute pointer-events-none"
                                style={{ transform: `translate(${ghost.x}px, ${ghost.y}px)`, zIndex: 5 }}
                            >
                                <BlockComponent block={{ ...ghost.template, instanceId: 'ghost', position: { x: 0, y: 0 }, socketValues: {} }} isGhost />
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <AnimatePresence>
                {infoPanelBlock && (
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="absolute bottom-0 left-0 right-0 h-[260px] bg-[#1a1d26] border-t border-white/10 z-50 p-8 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] flex flex-col"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-2xl font-black text-white flex items-center gap-3">
                                    {infoPanelBlock.label}
                                    <span className="text-[10px] uppercase bg-white/5 px-2 py-1 rounded text-stone-500 tracking-tighter font-bold">Documentation</span>
                                </h3>
                                <p className="text-stone-400 mt-2 max-w-2xl">{infoPanelBlock.description}</p>
                            </div>
                            <button
                                onClick={() => setInfoPanelBlock(null)}
                                className="p-2 hover:bg-white/5 rounded-full transition-colors"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                        <div className="mt-8 grid grid-cols-2 gap-8">
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                <h4 className="text-xs font-bold text-white/40 uppercase mb-2">Usage</h4>
                                <p className="text-sm italic text-stone-500">Wait for trigger event, then execute this effect.</p>
                            </div>
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                <h4 className="text-xs font-bold text-white/40 uppercase mb-2">Example</h4>
                                <p className="text-sm font-mono text-blue-400">{infoPanelBlock.label} {"->"} NextBlock()</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function DraggableCanvasBlock({ block, children }: { block: BlockInstance, children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: block.instanceId,
        data: { block }
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`absolute cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-0 pointer-events-none' : 'pointer-events-auto'}`}
            style={{ left: `${block.position.x}px`, top: `${block.position.y}px`, zIndex: block.parentId ? 10 : 20 }}
        >
            {children}
        </div>
    );
}

function BlockTemplateItem({ template }: { template: BlockTemplate }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: template.id,
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className="cursor-grab active:cursor-grabbing w-full"
        >
            <BlockComponent block={{ ...template, instanceId: 'template', position: { x: 0, y: 0 }, socketValues: {} }} />
        </div>
    );
}

function BlockComponent({
    block,
    isGhost = false,
    onDelete,
    onUpdateSocket,
    onShowInfo,
    onSetFrequency
}: {
    block: BlockInstance | (BlockTemplate & { instanceId: string; position: { x: number; y: number }; socketValues: any }),
    isGhost?: boolean,
    onDelete?: () => void,
    onUpdateSocket?: (socketId: string, value: any) => void,
    onShowInfo?: () => void,
    onSetFrequency?: (freq: 'every-move' | 'every-square') => void
}) {
    const [isHovered, setIsHovered] = useState(false);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [showTooltip, setShowTooltip] = useState(false);
    const [contextMenu, setContextMenu] = useState(false);
    const contextMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!contextMenu) return;
        const handler = (e: MouseEvent) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
                setContextMenu(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [contextMenu]);

    const currentFrequency = (block as BlockInstance).checkFrequency || 'every-move';

    const filledVariablesCount = Object.values(block.socketValues || {}).filter((v: any) => v && v.type === 'variable').length;
    const extraWidth = filledVariablesCount * 100;
    const width = (block.width || (block.type === 'variable' ? VARIABLE_WIDTH : DEFAULT_WIDTH)) + extraWidth;
    const height = BLOCK_HEIGHT;
    const hasNotch = block.type !== 'variable';

    const handleMouseEnter = () => {
        setIsHovered(true);
        hoverTimeoutRef.current = setTimeout(() => setShowTooltip(true), 3000);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        setShowTooltip(false);
    };

    const getPath = () => {
        const w = width;
        const h = height;
        const r = 10;

        if (block.type === 'trigger') {
            return `
                M 0 ${r}
                a ${r} ${r} 0 0 1 ${r} -${r}
                h ${w - 2 * r}
                a ${r} ${r} 0 0 1 ${r} ${r}
                v ${h - 2 * r}
                a ${r} ${r} 0 0 1 -${r} ${r}
                h -15
                l -6 6
                l -6 -6
                h -${w - 32 - 27}
                a ${r} ${r} 0 0 1 -${r} -${r}
                z
            `;
        } // Notch at bottom only

        if (block.type === 'terminal') {
            return `
                M 0 ${r}
                a ${r} ${r} 0 0 1 ${r} -${r}
                h 15
                l 6 6
                l 6 -6
                h ${w - 32 - 27}
                a ${r} ${r} 0 0 1 ${r} ${r}
                v ${h - 2 * r}
                a ${r} ${r} 0 0 1 -${r} ${r}
                h -${w - 2 * r}
                a ${r} ${r} 0 0 1 -${r} -${r}
                z
            `;
        } // Notch at top only

        if (block.type === 'variable') {
            return `
                M ${r} 0
                h ${w - 2 * r}
                a ${r} ${r} 0 0 1 ${r} ${r}
                v ${h - 2 * r}
                a ${r} ${r} 0 0 1 -${r} ${r}
                h -${w - 2 * r}
                a ${r} ${r} 0 0 1 -${r} -${r}
                v -${h - 2 * r}
                a ${r} ${r} 0 0 1 ${r} -${r}
                z
            `;
        }

        // Standard Effect Block (Top and Bottom Notch)
        return `
            M 0 ${r}
            a ${r} ${r} 0 0 1 ${r} -${r}
            h 15
            l 6 6
            l 6 -6
            h ${w - 32 - 27}
            a ${r} ${r} 0 0 1 ${r} ${r}
            v ${h - 2 * r}
            a ${r} ${r} 0 0 1 -${r} ${r}
            h -15
            l -6 6
            l -6 -6
            h -${w - 32 - 27}
            a ${r} ${r} 0 0 1 -${r} -${r}
            z
        `;
    };

    return (
        <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="relative select-none group"
            style={{ width, height: height + 20 }}
            onDoubleClick={onShowInfo}
            onContextMenu={(e) => {
                if (block.type === 'trigger' && onSetFrequency) {
                    e.preventDefault();
                    e.stopPropagation();
                    setContextMenu(true);
                }
            }}
        >
            <svg width={width} height={height + 20} className="drop-shadow-lg">
                <path
                    d={getPath()}
                    fill={block.color}
                    className="transition-colors duration-200"
                />

                {/* 3D Border Effect */}
                <path
                    d={getPath()}
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="1"
                />
            </svg>

            {/* Content */}
            <div className="absolute inset-x-0 top-0 h-[60px] flex items-center px-4 gap-2">
                <span className="font-black text-xs text-[rgba(0,0,0,0.7)] uppercase tracking-wider">{block.label}</span>

                {block.sockets?.map(socket => (
                    <SocketComponent
                        key={socket.id}
                        socket={socket}
                        block={block}
                        onUpdateSocket={onUpdateSocket}
                    />
                ))}
            </div>

            {onDelete && (
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            )}

            {block.type === 'trigger' && currentFrequency === 'every-square' && (
                <div className="absolute -bottom-2 left-2 bg-black/70 text-white text-[8px] font-bold px-1.5 py-0.5 rounded pointer-events-none">
                    every square
                </div>
            )}

            {contextMenu && onSetFrequency && (
                <div
                    ref={contextMenuRef}
                    className="absolute top-full mt-1 left-0 bg-[#1a1d26] border border-white/10 rounded-lg shadow-xl z-[100] overflow-hidden min-w-[140px]"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        className={`w-full text-left px-3 py-2 text-[11px] font-bold flex items-center gap-2 transition-colors ${currentFrequency === 'every-move' ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5'}`}
                        onClick={() => { onSetFrequency('every-move'); setContextMenu(false); }}
                    >
                        {currentFrequency === 'every-move' && <span>✓</span>}
                        {currentFrequency !== 'every-move' && <span className="w-3" />}
                        Every Move
                    </button>
                    <button
                        className={`w-full text-left px-3 py-2 text-[11px] font-bold flex items-center gap-2 transition-colors ${currentFrequency === 'every-square' ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5'}`}
                        onClick={() => { onSetFrequency('every-square'); setContextMenu(false); }}
                    >
                        {currentFrequency === 'every-square' && <span>✓</span>}
                        {currentFrequency !== 'every-square' && <span className="w-3" />}
                        Every Square
                    </button>
                </div>
            )}

            <AnimatePresence>
                {showTooltip && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none"
                    >
                        {block.description}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function SocketComponent({
    socket,
    block,
    onUpdateSocket
}: {
    socket: SocketConfig,
    block: BlockInstance | (BlockTemplate & { instanceId: string; socketValues: any }),
    onUpdateSocket?: (socketId: string, value: any) => void
}) {
    const t = useTranslations('Editor.Piece.Logic');
    const { setNodeRef, isOver } = useDroppable({
        id: `socket-${block.instanceId}-${socket.id}`,
        data: {
            type: 'socket',
            blockId: block.instanceId,
            socketId: socket.id
        },
        disabled: !socket.acceptsVariable
    });

    const currentValue = block.socketValues[socket.id];
    // Check if value is a dropped variable object
    const isVariable = currentValue && typeof currentValue === 'object' && currentValue.type === 'variable';

    return (
        <div
            ref={setNodeRef}
            className={`flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors ${isOver ? 'bg-orange-500/50 ring-2 ring-orange-500' : 'bg-black/10'
                }`}
        >
            {socket.label && <span className="text-[9px] font-bold text-black/50">{socket.label}</span>}

            {isVariable ? (
                <div className="flex items-center gap-1 bg-orange-500 text-white rounded px-2 py-0.5 text-[10px] font-bold shadow-sm">
                    <span>{currentValue.name || 'VAR'}</span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onUpdateSocket?.(socket.id, undefined);
                        }}
                        className="ml-1 hover:text-black/50"
                    >
                        ×
                    </button>
                </div>
            ) : socket.variableOnly ? (
                <div
                    className="text-[9px] italic font-black text-black/40 px-2 py-1 border-2 border-dashed border-black/10 rounded-md min-w-[120px] text-center bg-black/5 select-none"
                    title={t('variableTooltip')}
                >
                    {t('dragVariableHint')}
                </div>
            ) : socket.type === 'select' ? (
                <select
                    value={currentValue || ''}
                    onChange={(e) => onUpdateSocket?.(socket.id, e.target.value)}
                    className="bg-transparent text-[11px] font-bold text-black border-none outline-none min-w-[100px] appearance-none cursor-pointer px-1"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    <option value="">-</option>
                    {socket.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            ) : (
                <input
                    type={socket.type === 'number' ? 'number' : 'text'}
                    value={currentValue || ''}
                    onChange={(e) => {
                        if (socket.type === 'number' && parseFloat(e.target.value) < 0) return;
                        onUpdateSocket?.(socket.id, e.target.value)
                    }}
                    className="bg-transparent text-[11px] font-bold text-black border-none outline-none w-[60px] text-center"
                    placeholder="..."
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                />
            )}
        </div>
    );
}

