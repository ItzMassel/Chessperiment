'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Save, ChevronLeft, X, Loader2 } from 'lucide-react';
import { Project } from '@/types/Project';
import { SquareLogicDefinition } from '@/types/firestore';
import { useProject } from '@/hooks/useProject';
import { BlocklyWorkspace } from 'react-blockly';
import * as Blockly from 'blockly';
import './blocklyDefinitions'; // Registration happens here
import { useAIToolRegistration } from '@/hooks/useAIToolRegistration';
import { trackEvent } from '@/lib/track';
import SmallScreenNotice from '@/components/editor/SmallScreenNotice';

const SAVE_DEBOUNCE_MS = 2000;

interface BlockTemplate {
    id: string;
    type: 'trigger' | 'effect' | 'terminal';
    label: string;
    category: 'trigger' | 'effects';
    color: string;
    description: string;
    width: number;
}

const BLOCK_TEMPLATES: BlockTemplate[] = [
    {
        id: 'on-step',
        type: 'trigger',
        label: 'onStep',
        category: 'trigger',
        color: '#FFD700',
        description: 'Fires when a piece lands on this square.',
        width: 320
    },
    {
        id: 'on-proximity',
        type: 'trigger',
        label: 'onProximity',
        category: 'trigger',
        color: '#FFD700',
        description: 'Fires when a piece is near this square.',
        width: 320
    },
    {
        id: 'teleport',
        type: 'effect',
        label: 'teleport',
        category: 'effects',
        color: '#4169E1',
        description: 'Teleport the piece to another square.',
        width: 320
    },
    {
        id: 'disable-square',
        type: 'effect',
        label: 'disableSquare',
        category: 'effects',
        color: '#FF4500',
        description: 'Make this square inactive.',
        width: 280
    },
    {
        id: 'enable-square',
        type: 'effect',
        label: 'enableSquare',
        category: 'effects',
        color: '#32CD32',
        description: 'Make this square active.',
        width: 280
    },
    {
        id: 'kill',
        type: 'terminal',
        label: 'kill',
        category: 'effects',
        color: '#9370DB',
        description: 'Remove the piece from the board.',
        width: 240
    },
    {
        id: 'win',
        type: 'terminal',
        label: 'win',
        category: 'effects',
        color: '#9370DB',
        description: 'Declare a win for a specific side.',
        width: 320
    }
];

export default function SquareLogicPageClient({ projectId }: { projectId: string }) {
    const router = useRouter();
    const t = useTranslations('Editor.Square'); // Use translations if available

    const {
        project,
        loading,
        saveProject,
        isSaving: hookIsSaving
    } = useProject(projectId);

    // Track open on mount
    useEffect(() => { trackEvent('open_square_editor'); }, []);

    const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>('trigger');
    const [variables, setVariables] = useState<{ id: string, name: string, value: any }[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const isSavingRef = useRef(false);
    const lastSavedDataRef = useRef<string>('');
    const [isSelecting, setIsSelecting] = useState(false);
    const [initialXml, setInitialXml] = useState<string>('');
    const [mounted, setMounted] = useState(false);
    const [isCreatingVar, setIsCreatingVar] = useState(false);
    const [newVarName, setNewVarName] = useState('');
    const workspaceRef = useRef<Blockly.Workspace | null>(null);
    const variablesRef = useRef(variables);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        variablesRef.current = variables;
    }, [variables]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!project || !selectedSquare) {
            setInitialXml('');
            setVariables([]);
            return;
        }
        const logicDef = project.squareLogic?.[selectedSquare];
        if (logicDef) {
            setInitialXml((logicDef as any).blocklyXml || '');
            setVariables((logicDef as any).variables || []);
            lastSavedDataRef.current = JSON.stringify({ xml: (logicDef as any).blocklyXml || '', variables: (logicDef as any).variables || [] });
        } else {
            setInitialXml('');
            setVariables([]);
            lastSavedDataRef.current = JSON.stringify({ xml: '', variables: [] });
        }
    }, [selectedSquare, project]);

    const handleSave = useCallback(async (xml: string, currentVars: any[] = variablesRef.current, logicJson: any[] = []) => {
        if (!project || !selectedSquare || isSavingRef.current) return;

        const currentData = { xml, variables: currentVars, logic: logicJson };
        if (JSON.stringify(currentData) === lastSavedDataRef.current) return;

        isSavingRef.current = true;
        setIsSaving(true);
        try {
            const updatedSquareLogic = {
                ...(project.squareLogic || {}),
                [selectedSquare]: {
                    projectId,
                    squareId: selectedSquare,
                    logic: logicJson,
                    blocklyXml: xml,
                    variables: currentVars,
                    updatedAt: new Date(),
                    userId: project.userId,
                    createdAt: project.squareLogic?.[selectedSquare]?.createdAt || new Date()
                }
            };

            await saveProject({
                squareLogic: updatedSquareLogic as Record<string, SquareLogicDefinition>
            });

            lastSavedDataRef.current = JSON.stringify(currentData);
        } catch (error) {
            console.error("Save failed:", error);
        } finally {
            setIsSaving(false);
            isSavingRef.current = false;
        }
    }, [project, projectId, selectedSquare, variables, saveProject]);

    const generateLogicJson = (workspace: Blockly.Workspace) => {
        const logic: any[] = [];
        const processBlock = (block: Blockly.Block): any => {
            const blockDef = {
                id: block.type,
                type: block.type === 'on-step' || block.type === 'on-proximity' ? 'trigger' : 'effect',
                instanceId: block.id,
                socketValues: {} as any,
                childId: null as string | null
            };

            block.inputList.forEach(input => {
                input.fieldRow.forEach(field => {
                    const name = field.name;
                    if (name) {
                        blockDef.socketValues[name] = field.getValue();
                    }
                });
            });

            const nextBlock = block.getNextBlock();
            if (nextBlock) {
                blockDef.childId = nextBlock.id;
            }

            return blockDef;
        };

        const allBlocks = workspace.getAllBlocks(false);
        allBlocks.forEach(block => {
            logic.push(processBlock(block));
        });

        return logic;
    };

    const onWorkspaceChange = useCallback((workspace: Blockly.Workspace) => {
        workspaceRef.current = workspace;
        const xml = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace));
        const logicJson = generateLogicJson(workspace);
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            handleSave(xml, variablesRef.current, logicJson);
        }, SAVE_DEBOUNCE_MS);
    }, [handleSave]);

    const createVariable = () => {
        if (!newVarName) return;
        const id = `var-${Date.now()}`;
        const updated = [...variables, { id, name: newVarName, value: 0 }];
        setVariables(updated);
        setNewVarName('');
        setIsCreatingVar(false);
        handleSave(initialXml, updated);
    };

    const deleteVariable = (id: string) => {
        const updated = variables.filter(v => v.id !== id);
        setVariables(updated);
        handleSave(initialXml, updated);
    };

    // ─── AI Tool Registration ───
    const squareToolHandlers = useMemo(() => ({
        get_square_logic: async (args: Record<string, any>) => {
            if (!project) return JSON.stringify({ error: 'No project' });
            const logic = project.squareLogic?.[args.squareId];
            if (!logic) return JSON.stringify({ blocks: [], variables: [], note: 'No logic defined for this square' });
            return JSON.stringify({
                squareId: args.squareId,
                logic: (logic as any).logic || [],
                variables: (logic as any).variables || [],
                hasBlocklyXml: !!(logic as any).blocklyXml
            });
        },
        add_square_block: async (args: Record<string, any>) => {
            // Select the square first if not selected
            if (selectedSquare !== args.squareId) {
                setSelectedSquare(args.squareId);
                // Wait for workspace to initialize
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            spawnBlock(args.blockType);
            // Apply socket values if provided
            if (args.socketValues && workspaceRef.current) {
                const ws = workspaceRef.current;
                const allBlocks = ws.getAllBlocks(false);
                const lastBlock = allBlocks[allBlocks.length - 1];
                if (lastBlock) {
                    for (const [key, value] of Object.entries(args.socketValues)) {
                        const field = lastBlock.getField(key);
                        if (field) field.setValue(value as string);
                    }
                    return JSON.stringify({ success: true, blockId: lastBlock.id });
                }
            }
            return JSON.stringify({ success: true });
        },
        remove_square_block: async (args: Record<string, any>) => {
            if (!workspaceRef.current) return JSON.stringify({ error: 'Workspace not ready' });
            const block = workspaceRef.current.getBlockById(args.blockId);
            if (block) {
                block.dispose(true);
                return JSON.stringify({ success: true });
            }
            return JSON.stringify({ error: 'Block not found' });
        },
        update_square_block_sockets: async (args: Record<string, any>) => {
            if (!workspaceRef.current) return JSON.stringify({ error: 'Workspace not ready' });
            const block = workspaceRef.current.getBlockById(args.blockId);
            if (!block) return JSON.stringify({ error: 'Block not found' });
            for (const [key, value] of Object.entries(args.socketValues)) {
                const field = block.getField(key);
                if (field) field.setValue(value as string);
            }
            return JSON.stringify({ success: true });
        },
        connect_square_blocks: async (args: Record<string, any>) => {
            if (!workspaceRef.current) return JSON.stringify({ error: 'Workspace not ready' });
            const parent = workspaceRef.current.getBlockById(args.parentBlockId);
            const child = workspaceRef.current.getBlockById(args.childBlockId);
            if (!parent || !child) return JSON.stringify({ error: 'Block not found' });
            const nextConn = parent.nextConnection;
            const prevConn = child.previousConnection;
            if (nextConn && prevConn) {
                nextConn.connect(prevConn);
                return JSON.stringify({ success: true });
            }
            return JSON.stringify({ error: 'Blocks cannot be connected' });
        },
        create_square_variable: async (args: Record<string, any>) => {
            const id = `var-${Date.now()}`;
            const updated = [...variables, { id, name: args.name, value: 0 }];
            setVariables(updated);
            handleSave(initialXml, updated);
            return JSON.stringify({ success: true, variableId: id });
        },
        delete_square_variable: async (args: Record<string, any>) => {
            const updated = variables.filter(v => v.id !== args.variableId);
            setVariables(updated);
            handleSave(initialXml, updated);
            return JSON.stringify({ success: true });
        },
    }), [project, selectedSquare, variables, initialXml, handleSave]);

    useAIToolRegistration(squareToolHandlers);

    const spawnBlock = (type: string, x?: number, y?: number) => {
        if (!workspaceRef.current) return;
        const ws = workspaceRef.current as Blockly.WorkspaceSvg;
        const block = ws.newBlock(type) as Blockly.BlockSvg;
        block.initSvg();
        block.render();
        if (x !== undefined && y !== undefined) {
            const workspacePoint = Blockly.utils.svgMath.screenToWsCoordinates(
                ws,
                new Blockly.utils.Coordinate(x, y)
            );
            block.moveTo(workspacePoint);
        } else {
            block.moveBy(100, 100);
        }
    };

    const handleDragStart = (e: React.DragEvent, template: BlockTemplate) => {
        e.dataTransfer.setData('blockType', template.id);
        e.dataTransfer.effectAllowed = 'move';

        const ghost = document.createElement('div');
        ghost.style.position = 'absolute';
        ghost.style.top = '-1000px';
        ghost.style.left = '-1000px';
        ghost.style.width = `${template.width}px`;
        ghost.style.height = '48px';
        ghost.style.backgroundColor = template.color;
        ghost.style.color = 'rgba(0,0,0,0.7)';
        ghost.style.borderRadius = '12px';
        ghost.style.display = 'flex';
        ghost.style.alignItems = 'center';
        ghost.style.padding = '0 16px';
        ghost.style.fontFamily = 'sans-serif';
        ghost.style.fontWeight = '900';
        ghost.style.fontSize = '12px';
        ghost.style.textTransform = 'uppercase';
        ghost.style.boxShadow = '0 20px 25px -5px rgb(0 0 0 / 0.5)';
        ghost.style.borderBottom = '4px solid rgba(0,0,0,0.2)';
        ghost.innerText = template.label;

        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, 24, 24);
        setTimeout(() => document.body.removeChild(ghost), 0);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const blockType = e.dataTransfer.getData('blockType');
        if (blockType) {
            spawnBlock(blockType, e.clientX, e.clientY);
        }
    };

    if (loading || !mounted) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-[#0f1115] text-white">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
                <p className="font-bold uppercase tracking-widest text-xs animate-pulse">Loading Workspace</p>
            </div>
        );
    }

    if (!project) return null;

    return (
        <SmallScreenNotice>
        <div className="flex h-screen bg-[#0f1115] text-white overflow-hidden font-sans">
            <div className="w-[60px] border-r border-white/5 bg-[#161920] flex flex-col items-center py-6 gap-8 z-30">
                <button onClick={() => router.push(`/editor/${projectId}`)} className="p-2 bg-white/5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all active:scale-95 duration-200">
                    <ChevronLeft size={20} />
                </button>
                {(['trigger', 'effects', 'variables'] as const).map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`text-[10px] uppercase font-black transition-all duration-300 ${activeCategory === cat ? 'text-blue-400 scale-110' : 'text-stone-500 hover:text-stone-300 hover:scale-105'}`}
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                    >
                        {cat}
                    </button>
                ))}
                <div className="mt-auto mb-4">
                    <button onClick={() => {
                        if (workspaceRef.current) {
                            const xml = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspaceRef.current));
                            const logicJson = generateLogicJson(workspaceRef.current);
                            handleSave(xml, variablesRef.current, logicJson);
                        } else {
                            handleSave(initialXml, variablesRef.current);
                        }
                    }} disabled={isSaving || hookIsSaving} className={`p-3 rounded-xl transition-all duration-300 active:scale-90 ${isSaving || hookIsSaving ? 'text-amber-500 bg-amber-500/10' : 'text-stone-500 hover:text-white hover:bg-white/5'}`}>
                        <Save size={20} className={isSaving || hookIsSaving ? 'animate-pulse' : ''} />
                    </button>
                </div>
            </div>

            <div className="w-[340px] border-r border-white/5 bg-[#12141a] flex flex-col z-20 shadow-xl overflow-y-auto custom-scrollbar">
                <div className="p-6 border-b border-white/5">
                    <h2 className="text-xl font-black text-white/90">{activeCategory.toUpperCase()}</h2>
                    <p className="text-xs text-stone-500 mt-1 uppercase tracking-widest font-bold">Block Palette</p>
                </div>
                <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                    {activeCategory === 'variables' ? (
                        <div className="space-y-6">
                            {variables.map(v => (
                                <div key={v.id} className="group relative bg-white/5 p-4 rounded-xl border border-white/10">
                                    <span className="text-orange-400 font-bold">{v.name}</span>
                                    <button onClick={(e) => { e.stopPropagation(); deleteVariable(v.id); }} className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                            {isCreatingVar ? (
                                <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col gap-3">
                                    <input autoFocus value={newVarName} onChange={e => setNewVarName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createVariable()} placeholder="Variable name..." className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none" />
                                    <button onClick={createVariable} className="py-2 bg-orange-500 rounded-lg text-xs font-bold">Create</button>
                                    <button onClick={() => setIsCreatingVar(false)} className="py-2 border border-white/10 rounded-lg text-xs font-bold">Cancel</button>
                                </div>
                            ) : (
                                <button onClick={() => setIsCreatingVar(true)} className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-stone-500 font-bold hover:border-orange-500/50 hover:text-orange-500 transition-all">+ New Variable</button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {BLOCK_TEMPLATES.filter(t => t.category === activeCategory).map(template => (
                                <button
                                    key={template.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, template)}
                                    onClick={() => spawnBlock(template.id)}
                                    className="w-full text-left group relative cursor-grab active:cursor-grabbing transition-all duration-300 animate-in fade-in slide-in-from-left-4"
                                >
                                    <div
                                        className="h-12 rounded-xl px-4 flex items-center shadow-lg transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-blue-500/20 border-b-4 border-black/20 group-active:scale-95"
                                        style={{ backgroundColor: template.color }}
                                    >
                                        <span className="font-black text-[11px] text-black/70 uppercase tracking-tight">{template.label}</span>
                                    </div>
                                    <div className="mt-1 px-1">
                                        <p className="text-[10px] text-stone-500 leading-tight">{template.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 relative bg-[#0c0e12]">
                <div className="absolute top-4 left-4 z-10 flex gap-2">
                    <div className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-[10px] font-black border border-blue-500/30 uppercase tracking-widest leading-none flex items-center">
                        Square: <span className="ml-2 bg-blue-500 text-white px-1.5 rounded">{selectedSquare || 'None'}</span>
                    </div>
                    <button onClick={() => setIsSelecting(!isSelecting)} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isSelecting ? 'bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-105' : 'bg-white/5 text-stone-500 hover:text-white hover:bg-white/10 border border-white/10'}`}>
                        {isSelecting ? 'Click a square on board...' : 'Select Square'}
                    </button>
                </div>

                <div
                    className="w-full h-full blockly-parent custom-blockly"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    <BlocklyWorkspace
                        toolboxConfiguration={{ kind: 'categoryToolbox', contents: [] }}
                        workspaceConfiguration={{
                            grid: { spacing: 25, length: 1, colour: '#ffffff05', snap: true },
                            renderer: 'custom_renderer',
                            theme: 'custom_dark',
                            zoom: { controls: true, wheel: true, startScale: 1.0, maxScale: 3, minScale: 0.3, scaleSpeed: 1.2 },
                            move: { scrollbars: true, drag: true, wheel: true }
                        }}
                        className="w-full h-full"
                        initialXml={initialXml}
                        onWorkspaceChange={onWorkspaceChange}
                    />
                </div>

                {(!selectedSquare || isSelecting) && (
                    <div className="absolute inset-0 z-50 bg-[#0f1115]/95 backdrop-blur-md flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-500 ease-out">
                        <div className="mb-8 text-center animate-in slide-in-from-top-8 duration-700 delay-100">
                            <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">SELECT SQUARE TO EDIT</h1>
                            <p className="text-stone-500 text-sm font-bold uppercase tracking-widest">{project.name}</p>
                        </div>

                        <div
                            className="bg-[#161920] p-10 rounded-[3rem] shadow-2xl border border-white/5 animate-in slide-in-from-bottom-12 duration-700 delay-200"
                            style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(${project?.cols || 8}, minmax(0, 1fr))`,
                                gap: '12px'
                            }}
                        >
                            {project && Array.from({ length: project.rows * project.cols }).map((_, i) => {
                                const row = project.rows - 1 - Math.floor(i / project.cols);
                                const col = i % project.cols;
                                const id = String.fromCharCode(97 + col) + (row + 1);
                                const coordId = `${col},${row}`;
                                const isCoordActive = project.activeSquares?.includes(coordId);
                                const isAlgebraicActive = project.activeSquares?.includes(id);
                                const isActive = (project.activeSquares && project.activeSquares.length > 0)
                                    ? (isCoordActive || isAlgebraicActive)
                                    : true;
                                const isSelected = selectedSquare === id;

                                return (
                                    <button
                                        key={id}
                                        onClick={() => {
                                            setSelectedSquare(id);
                                            setIsSelecting(false);
                                        }}
                                        className={`
                                                w-14 h-14 rounded-xl transition-all duration-200 flex items-center justify-center relative group
                                                ${isActive ? 'bg-white/5 hover:bg-white/20 hover:scale-105 active:scale-95' : 'bg-black/40 opacity-30 cursor-not-allowed'}
                                                ${isSelected ? 'ring-4 ring-blue-500 bg-blue-500/20' : ''}
                                            `}
                                        disabled={!isActive}
                                    >
                                        <span className={`text-[11px] font-black uppercase tracking-tighter ${isSelected ? 'text-blue-400' : 'text-stone-600 group-hover:text-stone-400'}`}>
                                            {id}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        {selectedSquare && (
                            <button
                                onClick={() => setIsSelecting(false)}
                                className="mt-8 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-stone-400 hover:text-white font-bold transition-all border border-white/10"
                            >
                                Cancel Selection
                            </button>
                        )}
                    </div>
                )}
            </div>
            <style jsx global>{`
                .blocklyToolboxDiv { display: none !important; }
                .blocklyMainBackground { fill: #0c0e12 !important; }
                .blocklyFlyout { display: none !important; }
                .custom-blockly .blocklyWorkspace { background-color: #0c0e12; }
                .blocklyPathLight, .blocklyPathDark { display: none !important; }
                .blocklyPath { stroke-width: 1px !important; stroke: rgba(0,0,0,0.2) !important; }
                .blocklyZoom { left: 24px !important; bottom: 24px !important; right: auto !important; }
                .blocklyTrash { left: 24px !important; bottom: 100px !important; right: auto !important; }
                .blocklyNavigationControlGroup { left: 24px !important; bottom: 180px !important; right: auto !important; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
            `}</style>
        </div>
        </SmallScreenNotice>
    );
}
