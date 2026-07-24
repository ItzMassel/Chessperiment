'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { ChevronLeft, Save, Loader2 } from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import { CustomPiece } from '@/types/firestore';
import { BlocklyWorkspace } from 'react-blockly';
import * as Blockly from 'blockly';
import './blocklyDefinitions';
import { useAIToolRegistration } from '@/hooks/useAIToolRegistration';
import SmallScreenNotice from '@/components/editor/SmallScreenNotice';

const SAVE_DEBOUNCE_MS = 2000;

type BlockCategory = 'trigger' | 'effects' | 'variables';

interface BlockTemplate {
    id: string;
    type: 'trigger' | 'effect' | 'terminal' | 'variable';
    label: string;
    category: BlockCategory;
    color: string;
    description: string;
    width: number;
}

const BLOCK_TEMPLATES: BlockTemplate[] = [
    // Triggers
    { id: 'on-is-captured', type: 'trigger', label: 'onIsCaptured', category: 'trigger', color: '#FFD700', description: 'Fires when this piece is captured by another piece.', width: 280 },
    { id: 'on-captured', type: 'trigger', label: 'onCaptured', category: 'trigger', color: '#FFD700', description: 'Fires when this piece captures another piece.', width: 280 },
    { id: 'on-threat', type: 'trigger', label: 'onThreat', category: 'trigger', color: '#FFD700', description: 'Fires when this piece is threatened by another piece.', width: 260 },
    { id: 'on-move', type: 'trigger', label: 'onMove', category: 'trigger', color: '#FFD700', description: 'Fires when this piece moves.', width: 180 },
    { id: 'on-environment', type: 'trigger', label: 'onEnvironment', category: 'trigger', color: '#FFD700', description: 'Fires when the piece is on a specific board condition.', width: 320 },
    { id: 'on-var', type: 'trigger', label: 'onVar', category: 'trigger', color: '#FFD700', description: 'Fires when a variable condition is met.', width: 380 },
    // Effects
    { id: 'cooldown', type: 'effect', label: 'cooldown', category: 'effects', color: '#4169E1', description: 'Prevents this trigger from firing again for a duration.', width: 400 },
    { id: 'transformation', type: 'effect', label: 'transformation', category: 'effects', color: '#4169E1', description: 'Transform this piece into another type.', width: 300 },
    { id: 'modify-var', type: 'effect', label: 'modVar', category: 'effects', color: '#4169E1', description: 'Modify a custom variable\'s value.', width: 380 },
    { id: 'prevent', type: 'effect', label: 'prevent', category: 'effects', color: '#FF4500', description: 'Prevent the triggering action.', width: 280 },
    { id: 'explode', type: 'effect', label: 'explode', category: 'effects', color: '#FF4500', description: 'Explode, affecting pieces in radius.', width: 260 },
    { id: 'tell-user', type: 'effect', label: 'tellUser', category: 'effects', color: '#20B2AA', description: 'Display a message to the user.', width: 340 },
    { id: 'win', type: 'effect', label: 'win', category: 'effects', color: '#FFD700', description: 'Declare a win for this piece\'s side.', width: 160 },
    // Terminal
    { id: 'kill', type: 'terminal', label: 'kill', category: 'effects', color: '#9370DB', description: 'Remove the target piece from the board.', width: 280 },
    // Variables (shown in variables tab)
    { id: 'var-x', type: 'variable', label: 'x', category: 'variables', color: '#32CD32', description: 'The x-coordinate (column) of this piece\'s position.', width: 80 },
    { id: 'var-y', type: 'variable', label: 'y', category: 'variables', color: '#32CD32', description: 'The y-coordinate (row) of this piece\'s position.', width: 80 },
];

interface VariableDef {
    id: string;
    name: string;
}

export default function LogicPageClient({ id, projectId }: { id: string, projectId?: string }) {
    const t = useTranslations('Editor.Piece.Logic');
    const router = useRouter();
    const [activeCategory, setActiveCategory] = useState<BlockCategory>('trigger');
    const [isSaving, setIsSaving] = useState(false);
    const isSavingRef = useRef(false);
    const lastSavedDataRef = useRef<string>('');
    const [initialXml, setInitialXml] = useState<string>('');
    const [mounted, setMounted] = useState(false);
    const [isCreatingVar, setIsCreatingVar] = useState(false);
    const [newVarName, setNewVarName] = useState('');
    const workspaceRef = useRef<Blockly.Workspace | null>(null);
    const [variables, setVariables] = useState<VariableDef[]>([]);
    const variablesRef = useRef<VariableDef[]>([]);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const pieceRef = useRef<CustomPiece | null>(null);

    useEffect(() => {
        variablesRef.current = variables;
    }, [variables]);

    const {
        project,
        loading: projectLoading,
        saveProject,
        isSaving: projectIsSaving,
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

        pieceRef.current = piece;

        let xml = '';
        let vars: VariableDef[] = [];
        const logic = piece.logic;

        if (logic && typeof logic === 'object' && !Array.isArray(logic)) {
            const logicObj = logic as any;
            xml = logicObj.blocklyXml || '';
            vars = logicObj.variables || [];
        } else if (piece.variables) {
            vars = piece.variables;
        }

        setInitialXml(xml);
        setVariables(vars);
        variablesRef.current = vars;
        lastSavedDataRef.current = JSON.stringify({ xml, variables: vars });
    }, [piece, projectLoading]);

    const generateLogicJson = (workspace: Blockly.Workspace) => {
        const logic: any[] = [];
        const processBlock = (block: Blockly.Block): any => {
            const blockDef = {
                id: block.type,
                type: block.type === 'on-is-captured' || block.type === 'on-captured' || block.type === 'on-threat' || block.type === 'on-move' || block.type === 'on-environment' || block.type === 'on-var' ? 'trigger' : 'effect',
                instanceId: block.id,
                socketValues: {} as any,
                childId: null as string | null
            };

            block.inputList.forEach(input => {
                input.fieldRow.forEach(field => {
                    const name = field.name;
                    if (name) {
                        const value = field.getValue();
                        if (field instanceof Blockly.FieldVariable) {
                            blockDef.socketValues[name] = { type: 'variable', id: value, name: value };
                        } else {
                            blockDef.socketValues[name] = value;
                        }
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

    const handleSave = useCallback(async (xml: string, currentVars: VariableDef[] = variablesRef.current) => {
        if (!project || !piece || isSavingRef.current) return;

        const workspace = workspaceRef.current;
        const logicJson = workspace ? generateLogicJson(workspace) : [];

        const currentData = { xml, variables: currentVars, logic: logicJson };
        if (JSON.stringify(currentData) === lastSavedDataRef.current) return;

        isSavingRef.current = true;
        setIsSaving(true);
        try {
            const updatedPieces = project.customPieces.map((p: CustomPiece) =>
                (p.id === id || p.name === id)
                    ? { ...p, logic: { blocklyXml: xml, logic: logicJson, variables: currentVars }, variables: currentVars }
                    : p
            );

            await saveProject({ customPieces: updatedPieces });
            lastSavedDataRef.current = JSON.stringify(currentData);
        } catch (error) {
            console.error("Save failed:", error);
        } finally {
            setIsSaving(false);
            isSavingRef.current = false;
        }
    }, [project, piece, id, saveProject]);

    const onWorkspaceChange = useCallback((workspace: Blockly.Workspace) => {
        workspaceRef.current = workspace;
        const xml = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace));
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            handleSave(xml, variablesRef.current);
        }, SAVE_DEBOUNCE_MS);
    }, [handleSave]);

    const createVariable = () => {
        if (!newVarName || !workspaceRef.current) return;
        const ws = workspaceRef.current;
        try {
            ws.createVariable(newVarName);
        } catch {
            return;
        }
        const id = `var-${Date.now()}`;
        const updated = [...variables, { id, name: newVarName }];
        setVariables(updated);
        variablesRef.current = updated;
        setNewVarName('');
        setIsCreatingVar(false);
        handleSave(initialXml, updated);
    };

    const deleteVariable = (id: string) => {
        if (!workspaceRef.current) return;
        const v = variables.find(v => v.id === id);
        if (!v) return;
        try {
            workspaceRef.current.deleteVariableById(v.name);
        } catch {
        }
        const updated = variables.filter(v => v.id !== id);
        setVariables(updated);
        variablesRef.current = updated;
        handleSave(initialXml, updated);
    };

    // ─── AI Tool Registration ───
    const logicToolHandlers = useMemo(() => ({
        get_block_templates: async () => {
            return JSON.stringify(BLOCK_TEMPLATES.map(t => ({ id: t.id, type: t.type, label: t.label, color: t.color, description: t.description, width: t.width })));
        },
        add_logic_block: async (args: Record<string, any>) => {
            const template = BLOCK_TEMPLATES.find(t => t.id === args.templateId);
            if (!template) return JSON.stringify({ error: `Unknown template: ${args.templateId}` });
            const ws = workspaceRef.current as Blockly.WorkspaceSvg | null;
            if (!ws) return JSON.stringify({ error: 'Workspace not ready' });
            const block = ws.newBlock(args.templateId) as Blockly.BlockSvg;
            block.initSvg();
            block.render();
            const pos = args.position || { x: 100, y: 100 };
            const workspacePoint = new Blockly.utils.Coordinate(pos.x, pos.y);
            block.moveTo(workspacePoint);
            if (args.socketValues) {
                for (const [key, value] of Object.entries(args.socketValues)) {
                    const field = block.getField(key);
                    if (field) {
                        if (field instanceof Blockly.FieldVariable) {
                            field.setValue(value as string);
                        } else {
                            field.setValue(value as string);
                        }
                    }
                }
            }
            return JSON.stringify({ success: true, instanceId: block.id });
        },
        remove_logic_block: async (args: Record<string, any>) => {
            if (!workspaceRef.current) return JSON.stringify({ error: 'Workspace not ready' });
            const block = workspaceRef.current.getBlockById(args.instanceId);
            if (block) {
                block.dispose(true);
                return JSON.stringify({ success: true });
            }
            return JSON.stringify({ error: 'Block not found' });
        },
        connect_blocks: async (args: Record<string, any>) => {
            if (!workspaceRef.current) return JSON.stringify({ error: 'Workspace not ready' });
            const parent = workspaceRef.current.getBlockById(args.parentInstanceId);
            const child = workspaceRef.current.getBlockById(args.childInstanceId);
            if (!parent || !child) return JSON.stringify({ error: 'Block not found' });
            const nextConn = parent.nextConnection;
            const prevConn = child.previousConnection;
            if (nextConn && prevConn) {
                nextConn.connect(prevConn);
                return JSON.stringify({ success: true });
            }
            return JSON.stringify({ error: 'Blocks cannot be connected' });
        },
        move_block: async (args: Record<string, any>) => {
            if (!workspaceRef.current) return JSON.stringify({ error: 'Workspace not ready' });
            const block = workspaceRef.current.getBlockById(args.instanceId) as Blockly.BlockSvg | null;
            if (!block) return JSON.stringify({ error: 'Block not found' });
            const coord = new Blockly.utils.Coordinate(args.position.x, args.position.y);
            block.moveTo(coord);
            return JSON.stringify({ success: true });
        },
        disconnect_block: async (args: Record<string, any>) => {
            if (!workspaceRef.current) return JSON.stringify({ error: 'Workspace not ready' });
            const block = workspaceRef.current.getBlockById(args.instanceId);
            if (!block) return JSON.stringify({ error: 'Block not found' });
            const prev = block.getPreviousBlock();
            if (prev && prev.nextConnection) {
                prev.nextConnection.disconnect();
            }
            return JSON.stringify({ success: true });
        },
        update_block_sockets: async (args: Record<string, any>) => {
            if (!workspaceRef.current) return JSON.stringify({ error: 'Workspace not ready' });
            const block = workspaceRef.current.getBlockById(args.instanceId);
            if (!block) return JSON.stringify({ error: 'Block not found' });
            for (const [key, value] of Object.entries(args.socketValues)) {
                const field = block.getField(key);
                if (field) {
                    if (field instanceof Blockly.FieldVariable) {
                        field.setValue(value as string);
                    } else {
                        field.setValue(value as string);
                    }
                }
            }
            return JSON.stringify({ success: true });
        },
        create_piece_variable: async (args: Record<string, any>) => {
            if (!workspaceRef.current) return JSON.stringify({ error: 'Workspace not ready' });
            try {
                workspaceRef.current.createVariable(args.name);
            } catch {
                return JSON.stringify({ error: 'Variable already exists' });
            }
            const varId = `var-${Date.now()}`;
            const updated = [...variablesRef.current, { id: varId, name: args.name }];
            setVariables(updated);
            variablesRef.current = updated;
            handleSave(initialXml, updated);
            return JSON.stringify({ success: true, variableId: varId });
        },
        delete_piece_variable: async (args: Record<string, any>) => {
            const v = variablesRef.current.find(v => v.id === args.variableId);
            if (!v) return JSON.stringify({ error: 'Variable not found' });
            if (workspaceRef.current) {
                try {
                    workspaceRef.current.deleteVariableById(v.name);
                } catch { }
            }
            const updated = variablesRef.current.filter(v => v.id !== args.variableId);
            setVariables(updated);
            variablesRef.current = updated;
            handleSave(initialXml, updated);
            return JSON.stringify({ success: true });
        },
    }), [initialXml, handleSave]);

    useAIToolRegistration(logicToolHandlers);

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

    if (projectLoading || !mounted) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-[#0f1115] text-white">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
                <p className="font-bold uppercase tracking-widest text-xs animate-pulse">Loading Logic Editor</p>
            </div>
        );
    }

    if (!project || !piece) return null;

    return (
        <SmallScreenNotice>
            <div className="flex h-screen w-full bg-[#0f1115] text-white overflow-hidden font-sans">
                {/* 1. CATEGORY SIDEBAR */}
                <div className="w-[60px] border-r border-white/5 bg-[#161920] flex flex-col items-center py-6 gap-8 z-30">
                    <button
                        onClick={() => projectId ? router.push(`/editor/${projectId}/piece-editor?pieceId=${id}`) : router.back()}
                        className="p-2 bg-white/5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all active:scale-95 duration-200"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    {(['trigger', 'effects', 'variables'] as BlockCategory[]).map(cat => (
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
                        <button
                            onClick={() => {
                                if (workspaceRef.current) {
                                    const xml = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspaceRef.current));
                                    handleSave(xml, variablesRef.current);
                                } else {
                                    handleSave(initialXml, variablesRef.current);
                                }
                            }}
                            disabled={isSaving || projectIsSaving}
                            className={`p-3 rounded-xl transition-all duration-300 active:scale-90 ${isSaving || projectIsSaving ? 'text-amber-500 bg-amber-500/10' : 'text-stone-500 hover:text-white hover:bg-white/5'}`}
                        >
                            <Save size={20} className={isSaving || projectIsSaving ? 'animate-pulse' : ''} />
                        </button>
                    </div>
                </div>

                {/* 2. BLOCK PALETTE SIDEBAR */}
                <div className="w-[340px] border-r border-white/5 bg-[#12141a] flex flex-col z-20 shadow-xl overflow-y-auto custom-scrollbar">
                    <div className="p-6 border-b border-white/5">
                        <h2 className="text-xl font-black text-white/90">{activeCategory.toUpperCase()}</h2>
                        <p className="text-xs text-stone-500 mt-1 uppercase tracking-widest font-bold">Block Palette</p>
                    </div>
                    <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                        {activeCategory === 'variables' ? (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Position Presets</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {BLOCK_TEMPLATES.filter(t => t.id === 'var-x' || t.id === 'var-y').map(template => (
                                            <button
                                                key={template.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, template)}
                                                onClick={() => spawnBlock(template.id)}
                                                className="group relative cursor-grab active:cursor-grabbing"
                                            >
                                                <div
                                                    className="h-12 rounded-xl px-4 flex items-center shadow-lg transition-all duration-300 group-hover:scale-[1.03] border-b-4 border-black/20 group-active:scale-95"
                                                    style={{ backgroundColor: template.color, width: template.width }}
                                                >
                                                    <span className="font-black text-[11px] text-black/70 uppercase tracking-tight">{template.label}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Custom Variables</h3>
                                    {variables.map(v => (
                                        <div key={v.id} className="group relative bg-white/5 p-4 rounded-xl border border-white/10 mb-2">
                                            <span className="text-orange-400 font-bold">{v.name}</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteVariable(v.id); }}
                                                className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                            >
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                            </button>
                                        </div>
                                    ))}
                                    {isCreatingVar ? (
                                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col gap-3">
                                            <input
                                                autoFocus
                                                value={newVarName}
                                                onChange={e => setNewVarName(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && createVariable()}
                                                placeholder="Variable name..."
                                                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none"
                                            />
                                            <button onClick={createVariable} className="py-2 bg-orange-500 rounded-lg text-xs font-bold">Create</button>
                                            <button onClick={() => setIsCreatingVar(false)} className="py-2 border border-white/10 rounded-lg text-xs font-bold">Cancel</button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setIsCreatingVar(true)}
                                            className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-stone-500 font-bold hover:border-orange-500/50 hover:text-orange-500 transition-all"
                                        >
                                            + New Variable
                                        </button>
                                    )}
                                </div>
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
                                            style={{ backgroundColor: template.color, width: template.width }}
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

                {/* 3. MAIN CANVAS */}
                <div className="flex-1 relative bg-[#0c0e12]">
                    <div className="absolute top-4 left-4 z-10 flex gap-2">
                        <div className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-[10px] font-black border border-blue-500/30 uppercase tracking-widest leading-none flex items-center">
                            Piece: <span className="ml-2 bg-blue-500 text-white px-1.5 rounded">{piece.name}</span>
                        </div>
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
                </div>
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
        </SmallScreenNotice>
    );
}