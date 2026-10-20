'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { ChevronLeft, Save, X, Loader2 } from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import { CustomPiece } from '@/types/firestore';
import { useAIToolRegistration } from '@/hooks/useAIToolRegistration';
import SmallScreenNotice from '@/components/editor/SmallScreenNotice';
import { BlocklyWorkspace } from 'react-blockly';
import * as Blockly from 'blockly';
import {
    PIECE_BLOCK_SCHEMA,
    PRESET_VARIABLES,
    setCustomPieceNameOptions,
    readBlockSocketValues,
    getCheckFrequency,
    writeBlockSocketValue,
    initializeDefaultSockets,
    ensurePresetVariables,
    migrateLegacyLogicIntoWorkspace
} from './blocklyDefinitions';

const SAVE_DEBOUNCE_MS = 2000;

type BlockCategory = 'trigger' | 'effects' | 'variables';

interface BlockTemplate {
    id: string;
    type: 'trigger' | 'effect' | 'terminal';
    label: string;
    category: BlockCategory;
    color: string;
    description: string;
    width: number;
}

const BLOCK_TEMPLATES: BlockTemplate[] = [
    { id: 'on-is-captured', type: 'trigger', label: 'onIsCaptured', category: 'trigger', color: '#FFD700', description: 'Fires on this piece when it is captured.', width: 320 },
    { id: 'on-captured', type: 'trigger', label: 'onCaptured', category: 'trigger', color: '#FFD700', description: 'Fires on this piece when it captures another.', width: 320 },
    { id: 'on-threat', type: 'trigger', label: 'onThreat', category: 'trigger', color: '#FFD700', description: 'Fires while this piece is threatened.', width: 320 },
    { id: 'on-move', type: 'trigger', label: 'onMove', category: 'trigger', color: '#FFD700', description: 'Fires whenever this piece moves.', width: 180 },
    { id: 'on-environment', type: 'trigger', label: 'onEnvironment', category: 'trigger', color: '#FFD700', description: 'Fires based on the square this piece is on.', width: 320 },
    { id: 'on-var', type: 'trigger', label: 'onVar', category: 'trigger', color: '#FFD700', description: 'Fires when a variable matches a condition.', width: 320 },
    { id: 'cooldown', type: 'effect', label: 'cooldown', category: 'effects', color: '#4169E1', description: 'Puts this piece on cooldown.', width: 320 },
    { id: 'transformation', type: 'effect', label: 'transformation', category: 'effects', color: '#4169E1', description: 'Transforms this piece into another type.', width: 320 },
    { id: 'modify-var', type: 'effect', label: 'modVar', category: 'effects', color: '#4169E1', description: 'Modifies a variable.', width: 320 },
    { id: 'kill', type: 'terminal', label: 'kill', category: 'effects', color: '#9370DB', description: 'Removes a piece from the board.', width: 280 },
    { id: 'prevent', type: 'effect', label: 'prevent', category: 'effects', color: '#FF4500', description: 'Prevents the move that triggered this.', width: 320 },
    { id: 'win', type: 'terminal', label: 'win', category: 'effects', color: '#FFD700', description: 'Declares a win.', width: 180 },
    { id: 'explode', type: 'effect', label: 'explode', category: 'effects', color: '#FF4500', description: 'Explodes, removing nearby pieces.', width: 280 },
    { id: 'tell-user', type: 'effect', label: 'tellUser', category: 'effects', color: '#20B2AA', description: 'Shows a message to the player.', width: 320 },
    { id: 'ask-user', type: 'effect', label: 'askUser', category: 'effects', color: '#9B59B6', description: 'Asks the player a question and waits for an answer.', width: 320 }
];

export default function LogicPageClient({ id, projectId }: { id: string, projectId?: string }) {
    const t = useTranslations('Editor.Piece.Logic');
    const router = useRouter();

    const [activeCategory, setActiveCategory] = useState<BlockCategory>('trigger');
    const [variables, setVariables] = useState<{ id: string, name: string }[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isCreatingVar, setIsCreatingVar] = useState(false);
    const [newVarName, setNewVarName] = useState('');

    const isSavingRef = useRef(false);
    const lastSavedDataRef = useRef<string>('');
    const hasMigratedRef = useRef(false);
    const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const handleSaveRef = useRef<typeof handleSave | null>(null);
    const pendingSaveDataRef = useRef<{ xml: string, logicJson: any[], variables: { id: string, name: string }[] } | null>(null);

    const {
        project,
        loading: projectLoading,
        saveProject,
        isSaving: projectIsSaving
    } = useProject(projectId || '');

    const piece = useMemo(() => {
        if (!project) return null;
        return project.customPieces.find(p => p.id === id || p.name === id);
    }, [project, id]);

    const customPieceNames = useMemo(
        () => Array.from(new Set((project?.customPieces ?? []).map(p => p.name).filter(Boolean))),
        [project]
    );

    useEffect(() => {
        setCustomPieceNameOptions(customPieceNames);
    }, [customPieceNames]);

    useEffect(() => {
        setMounted(true);
    }, []);

    const initialXml = piece?.logicBlocklyXml || '';

    const generateLogicJson = useCallback((workspace: Blockly.Workspace) => {
        return workspace.getAllBlocks(false)
            .filter(block => !!PIECE_BLOCK_SCHEMA[block.type])
            .map(block => {
                const schema = PIECE_BLOCK_SCHEMA[block.type];
                const entry: any = {
                    id: block.type,
                    type: schema.isTrigger ? 'trigger' : 'effect',
                    instanceId: block.id,
                    socketValues: readBlockSocketValues(block),
                    childId: block.getNextBlock()?.id || null
                };
                if (schema.isTrigger) {
                    entry.checkFrequency = getCheckFrequency(block);
                }
                return entry;
            });
    }, []);

    const getCustomVariableDefs = useCallback((workspace: Blockly.Workspace) => {
        return workspace.getAllVariables()
            .filter(v => !PRESET_VARIABLES.includes(v.getName()))
            .map(v => ({ id: v.getId(), name: v.getName() }));
    }, []);

    const handleSave = useCallback(async (xml: string, logicJson: any[], varDefs: { id: string, name: string }[]) => {
        if (projectLoading || !project || !piece || isSavingRef.current) return;

        const currentData = JSON.stringify({ xml, logicJson, varDefs });
        if (currentData === lastSavedDataRef.current) return;

        isSavingRef.current = true;
        setIsSaving(true);
        try {
            const updatedPieces = project.customPieces.map((p: CustomPiece) =>
                (p.id === id || p.name === id)
                    ? { ...p, logic: logicJson, variables: varDefs, logicBlocklyXml: xml }
                    : p
            );

            await saveProject({ customPieces: updatedPieces });
            lastSavedDataRef.current = currentData;
        } catch (error) {
            console.error('Save failed:', error);
        } finally {
            setIsSaving(false);
            isSavingRef.current = false;
        }
    }, [project, projectLoading, piece, id, saveProject]);

    useEffect(() => {
        handleSaveRef.current = handleSave;
    }, [handleSave]);

    useEffect(() => {
        if (projectLoading || !piece) return;
        lastSavedDataRef.current = JSON.stringify({
            xml: piece.logicBlocklyXml || '',
            logicJson: piece.logic || [],
            varDefs: piece.variables || []
        });
    }, [piece, projectLoading]);

    // Flush any pending debounced save on unmount (navigating away right after an edit).
    useEffect(() => {
        return () => {
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
                if (pendingSaveDataRef.current) {
                    const { xml, logicJson, variables: varDefs } = pendingSaveDataRef.current;
                    handleSaveRef.current?.(xml, logicJson, varDefs);
                }
            }
        };
    }, []);

    const onWorkspaceChange = useCallback((workspace: Blockly.Workspace) => {
        const ws = workspace as Blockly.WorkspaceSvg;
        workspaceRef.current = ws;

        if (!hasMigratedRef.current) {
            hasMigratedRef.current = true;
            ensurePresetVariables(ws);
            if (!piece?.logicBlocklyXml && Array.isArray(piece?.logic) && piece.logic.length > 0) {
                migrateLegacyLogicIntoWorkspace(ws, piece.logic, piece.variables || []);
            }
        }

        const xml = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace));
        const logicJson = generateLogicJson(workspace);
        const varDefs = getCustomVariableDefs(workspace);

        setVariables(varDefs);
        pendingSaveDataRef.current = { xml, logicJson, variables: varDefs };

        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            handleSave(xml, logicJson, varDefs);
        }, SAVE_DEBOUNCE_MS);
    }, [piece, generateLogicJson, getCustomVariableDefs, handleSave]);

    const flushSaveNow = useCallback(async () => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        if (workspaceRef.current) {
            const xml = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspaceRef.current));
            const logicJson = generateLogicJson(workspaceRef.current);
            const varDefs = getCustomVariableDefs(workspaceRef.current);
            await handleSave(xml, logicJson, varDefs);
        }
    }, [generateLogicJson, getCustomVariableDefs, handleSave]);

    const spawnBlock = useCallback((type: string, x?: number, y?: number): Blockly.BlockSvg | null => {
        if (!workspaceRef.current) return null;
        const ws = workspaceRef.current;
        const block = ws.newBlock(type) as Blockly.BlockSvg;
        block.initSvg();
        initializeDefaultSockets(block);
        block.render();
        if (x !== undefined && y !== undefined) {
            const workspacePoint = Blockly.utils.svgMath.screenToWsCoordinates(ws, new Blockly.utils.Coordinate(x, y));
            block.moveTo(workspacePoint);
        } else {
            block.moveBy(100, 100);
        }
        return block;
    }, []);

    const spawnVariableBlock = useCallback((variableName: string, x?: number, y?: number) => {
        if (!workspaceRef.current) return;
        const ws = workspaceRef.current;
        let variable = ws.getVariable(variableName);
        if (!variable) variable = ws.createVariable(variableName);
        const block = ws.newBlock('variables_get') as Blockly.BlockSvg;
        block.initSvg();
        block.setFieldValue(variable!.getId(), 'VAR');
        block.render();
        if (x !== undefined && y !== undefined) {
            const workspacePoint = Blockly.utils.svgMath.screenToWsCoordinates(ws, new Blockly.utils.Coordinate(x, y));
            block.moveTo(workspacePoint);
        } else {
            block.moveBy(100, 100);
        }
    }, []);

    const createVariable = () => {
        if (!newVarName || !workspaceRef.current) return;
        workspaceRef.current.createVariable(newVarName);
        setNewVarName('');
        setIsCreatingVar(false);
    };

    const deleteVariable = (varId: string) => {
        workspaceRef.current?.deleteVariableById(varId);
    };

    // ─── AI Tool Registration ───
    const logicToolHandlers = useMemo(() => ({
        add_logic_block: async (args: Record<string, any>) => {
            if (!PIECE_BLOCK_SCHEMA[args.templateId]) return JSON.stringify({ error: `Unknown template: ${args.templateId}` });
            const block = spawnBlock(args.templateId, args.position?.x, args.position?.y);
            if (!block) return JSON.stringify({ error: 'Workspace not ready' });
            if (args.socketValues) {
                Object.entries(args.socketValues).forEach(([key, value]) => writeBlockSocketValue(block, key, value));
            }
            return JSON.stringify({ success: true, instanceId: block.id });
        },
        remove_logic_block: async (args: Record<string, any>) => {
            const block = workspaceRef.current?.getBlockById(args.instanceId);
            if (!block) return JSON.stringify({ error: 'Block not found' });
            block.dispose(true);
            return JSON.stringify({ success: true });
        },
        connect_blocks: async (args: Record<string, any>) => {
            const ws = workspaceRef.current;
            if (!ws) return JSON.stringify({ error: 'Workspace not ready' });
            const parent = ws.getBlockById(args.parentInstanceId);
            const child = ws.getBlockById(args.childInstanceId);
            if (parent?.nextConnection && child?.previousConnection) {
                parent.nextConnection.connect(child.previousConnection);
                return JSON.stringify({ success: true });
            }
            return JSON.stringify({ error: 'Blocks cannot be connected' });
        },
        disconnect_block: async (args: Record<string, any>) => {
            const block = workspaceRef.current?.getBlockById(args.instanceId);
            if (block?.previousConnection?.isConnected()) {
                block.previousConnection.disconnect();
                return JSON.stringify({ success: true });
            }
            return JSON.stringify({ error: 'Block not found or not connected' });
        },
        update_block_sockets: async (args: Record<string, any>) => {
            const block = workspaceRef.current?.getBlockById(args.instanceId) as Blockly.BlockSvg | undefined;
            if (!block) return JSON.stringify({ error: 'Block not found' });
            Object.entries(args.socketValues || {}).forEach(([key, value]) => writeBlockSocketValue(block, key, value));
            return JSON.stringify({ success: true });
        },
        move_block: async (args: Record<string, any>) => {
            const block = workspaceRef.current?.getBlockById(args.instanceId) as Blockly.BlockSvg | undefined;
            if (!block) return JSON.stringify({ error: 'Block not found' });
            block.moveTo(new Blockly.utils.Coordinate(args.position.x, args.position.y));
            return JSON.stringify({ success: true });
        },
        create_piece_variable: async (args: Record<string, any>) => {
            if (!workspaceRef.current) return JSON.stringify({ error: 'Workspace not ready' });
            const variable = workspaceRef.current.createVariable(args.name);
            return JSON.stringify({ success: true, variableId: variable?.getId() });
        },
        delete_piece_variable: async (args: Record<string, any>) => {
            workspaceRef.current?.deleteVariableById(args.variableId);
            return JSON.stringify({ success: true });
        },
    }), [spawnBlock]);

    useAIToolRegistration(logicToolHandlers);

    const handleDragStart = (e: React.DragEvent, template: BlockTemplate) => {
        e.dataTransfer.setData('blockType', template.id);
        e.dataTransfer.effectAllowed = 'move';
        setDragGhost(e, template.label, template.color, template.width);
    };

    const handleVariableDragStart = (e: React.DragEvent, variableName: string) => {
        e.dataTransfer.setData('variableName', variableName);
        e.dataTransfer.effectAllowed = 'move';
        setDragGhost(e, variableName, '#FF8C00', 160);
    };

    const setDragGhost = (e: React.DragEvent, label: string, color: string, width: number) => {
        const ghost = document.createElement('div');
        ghost.style.position = 'absolute';
        ghost.style.top = '-1000px';
        ghost.style.left = '-1000px';
        ghost.style.width = `${width}px`;
        ghost.style.height = '48px';
        ghost.style.backgroundColor = color;
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
        ghost.innerText = label;

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
        const variableName = e.dataTransfer.getData('variableName');
        if (blockType) {
            spawnBlock(blockType, e.clientX, e.clientY);
        } else if (variableName) {
            spawnVariableBlock(variableName, e.clientX, e.clientY);
        }
    };

    if (projectLoading || !mounted) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-[#0f1115] text-white">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
                <p className="font-bold uppercase tracking-widest text-xs animate-pulse">Loading Logic Editor...</p>
            </div>
        );
    }

    if (!project || !piece) return null;

    return (
        <SmallScreenNotice>
            <div className="flex h-screen bg-[#0f1115] text-white overflow-hidden font-sans selection:bg-blue-500/30">
                {/* 1. CATEGORY SIDEBAR */}
                <div className="w-[60px] border-r border-white/5 bg-[#161920] flex flex-col items-center py-6 gap-8 z-30 shadow-2xl relative">
                    <button
                        onClick={async () => {
                            await flushSaveNow();
                            projectId ? router.push(`/editor/${projectId}/piece-editor?pieceId=${id}`) : router.back();
                        }}
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

                    <div className="mt-auto mb-4">
                        <button
                            onClick={flushSaveNow}
                            disabled={isSaving || projectIsSaving}
                            className={`p-3 rounded-xl transition-all ${isSaving || projectIsSaving ? 'text-amber-500 bg-amber-500/10' : 'text-stone-500 hover:text-white hover:bg-white/5'}`}
                            title="Save Logic"
                        >
                            <Save size={20} className={isSaving || projectIsSaving ? 'animate-pulse' : ''} />
                            <span className="text-[10px] block mt-1 font-bold text-center">SAVE</span>
                        </button>
                    </div>
                </div>

                {/* 2. BLOCK PALETTE SIDEBAR */}
                <div className="w-[340px] border-r border-white/5 bg-[#12141a] flex flex-col z-20 shadow-xl overflow-y-auto custom-scrollbar">
                    <div className="p-6 border-b border-white/5">
                        <h2 className="text-xl font-black text-white/90">{t(`categories.${activeCategory}`)}</h2>
                        <p className="text-xs text-stone-500 mt-1 uppercase tracking-widest font-bold">Block Palette</p>
                    </div>

                    <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                        {activeCategory === 'variables' ? (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Position Presets</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {PRESET_VARIABLES.map(name => (
                                            <button
                                                key={name}
                                                draggable
                                                onDragStart={(e) => handleVariableDragStart(e, name)}
                                                onClick={() => spawnVariableBlock(name)}
                                                className="cursor-grab active:cursor-grabbing px-4 py-2 rounded-xl text-[11px] font-black uppercase bg-orange-500/80 text-black/70 shadow-lg border-b-4 border-black/20 hover:scale-105 transition-all"
                                            >
                                                {name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Custom Variables</h3>
                                    <div className="space-y-3">
                                        {variables.map(v => (
                                            <div key={v.id} className="group relative">
                                                <button
                                                    draggable
                                                    onDragStart={(e) => handleVariableDragStart(e, v.name)}
                                                    onClick={() => spawnVariableBlock(v.name)}
                                                    className="w-full text-left cursor-grab active:cursor-grabbing bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
                                                >
                                                    <span className="text-orange-400 font-bold">{v.name}</span>
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteVariable(v.id); }}
                                                    className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {isCreatingVar ? (
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col gap-3">
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
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsCreatingVar(true)}
                                        className="w-full py-3 px-4 border-2 border-dashed border-white/10 rounded-xl text-stone-500 hover:border-orange-500/50 hover:text-orange-500 transition-all font-bold text-sm bg-white/5"
                                    >
                                        + Create Variable
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {BLOCK_TEMPLATES.filter(tpl => tpl.category === activeCategory).map(template => (
                                    <button
                                        key={template.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, template)}
                                        onClick={() => spawnBlock(template.id)}
                                        className="w-full text-left group relative cursor-grab active:cursor-grabbing transition-all duration-300"
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

                {/* 3. MAIN CANVAS */}
                <div className="flex-1 relative bg-[#0c0e12]">
                    <div
                        className="w-full h-full blockly-parent custom-blockly"
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                    >
                        <BlocklyWorkspace
                            toolboxConfiguration={{ kind: 'categoryToolbox', contents: [] }}
                            workspaceConfiguration={{
                                grid: { spacing: 25, length: 1, colour: '#ffffff05', snap: true },
                                renderer: 'piece_custom_renderer',
                                theme: 'piece_custom_dark',
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
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.1); }
            `}</style>
        </SmallScreenNotice>
    );
}
