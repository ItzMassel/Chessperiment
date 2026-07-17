'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Project } from '@/types/Project';
import { useProject } from '@/hooks/useProject';
import { CustomPiece } from '@/types/firestore';
import { Loader2, Palette, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import PieceEditorSidebar from '@/components/editor/PieceEditorSidebar';
import PixelCanvas from '@/components/editor/PixelCanvas';
import VisualMoveEditor from '@/components/editor/VisualMoveEditor';
import PieceTestBoard from '@/components/editor/PieceTestBoard';
import { invertLightness } from '@/lib/colors';
import { useAIToolRegistration } from '@/hooks/useAIToolRegistration';
import { getPresetRules } from '@/lib/standardPiecePresets';
import { v4 as uuidv4 } from 'uuid';
import { trackEvent } from '@/lib/track';

export type EditMode = 'design' | 'moves';

interface PageClientProps {
    projectId: string;
}

export default function PageClient({ projectId }: PageClientProps) {
    const t = useTranslations('Editor.Piece');
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const locale = useLocale();

    const {
        project,
        loading,
        saveProject,
        isSaving,
        isGuest
    } = useProject(projectId);

    const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
    const [mode, setMode] = useState<'design' | 'moves'>('design');
    const [showTestBoard, setShowTestBoard] = useState(false);

    // Track open on mount
    useEffect(() => { trackEvent('open_piece_editor'); }, []);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // Editor state for the CURRENTLY selected piece
    const [currentName, setCurrentName] = useState('New Piece');
    const [editingColor, setEditingColor] = useState<'white' | 'black'>('white');
    const [currentPixelsWhite, setCurrentPixelsWhite] = useState<string[][]>(
        Array(64).fill(null).map(() => Array(64).fill('transparent'))
    );
    const [currentPixelsBlack, setCurrentPixelsBlack] = useState<string[][]>(
        Array(64).fill(null).map(() => Array(64).fill('transparent'))
    );
    const [currentImageWhite, setCurrentImageWhite] = useState<string | undefined>(undefined);
    const [currentImageBlack, setCurrentImageBlack] = useState<string | undefined>(undefined);
    const [currentMoves, setCurrentMoves] = useState<any[]>([]);
    const [currentVariables, setCurrentVariables] = useState<{ id: string, name: string }[]>([]);

    // History for undo/redo
    const [history, setHistory] = useState<any[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const gridSize = 64;
    const SAVE_DEBOUNCE_MS = 1500;
    const lastSavedDataRef = useRef(JSON.stringify({ name: currentName, variables: currentVariables }));

    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const initialPieceId = searchParams?.get('pieceId');

    const selectPiece = useCallback((pieceId: string, optionalPieces?: CustomPiece[]) => {
        const targetPieces = optionalPieces || project?.customPieces || [];
        const piece = targetPieces.find(p => p.id === pieceId || p.name === pieceId);
        if (piece) {
            setSelectedPieceId(piece.id || piece.name);
            setCurrentName(piece.name);
            setCurrentPixelsWhite(piece.pixelsWhite);
            setCurrentPixelsBlack(piece.pixelsBlack);
            setCurrentImageWhite(piece.imageWhite);
            setCurrentImageBlack(piece.imageBlack);
            setCurrentMoves(piece.moves || []);
            setCurrentVariables(piece.variables || []);
            lastSavedDataRef.current = JSON.stringify({ name: piece.name, variables: piece.variables || [] });
            setHistory([JSON.parse(JSON.stringify(editingColor === 'white' ? piece.pixelsWhite : piece.pixelsBlack))]);
            setHistoryIndex(0);
        }
    }, [project, editingColor]);

    // Initial piece selection
    // Note: We use a separate state to track if we've done the initial selection to avoid re-selecting when project updates
    const [hasSelectedInitial, setHasSelectedInitial] = useState(false);

    useEffect(() => {
        if (!loading && project && !hasSelectedInitial) {
            const pieces = project.customPieces || [];
            if (pieces.length > 0) {
                const targetPiece = initialPieceId
                    ? (pieces.find(p => p.id === initialPieceId || p.name === initialPieceId) || pieces[0])
                    : pieces[0];
                selectPiece(targetPiece.id || targetPiece.name, pieces);
                setHasSelectedInitial(true);
            } else if (!isSaving) {
                // If no pieces, create a starter piece
                createNewPiece();
                setHasSelectedInitial(true);
            }
        }
    }, [loading, project, initialPieceId, selectPiece, hasSelectedInitial]);

    useEffect(() => {
        if (!selectedPieceId || !project) return;
        const piece = project.customPieces.find(p => p.id === selectedPieceId);
        if (piece) {
            const pixels = editingColor === 'white' ? currentPixelsWhite : currentPixelsBlack;
            setHistory([JSON.parse(JSON.stringify(pixels))]);
            setHistoryIndex(0);
        }
    }, [editingColor, selectedPieceId]);

    const createNewPiece = async () => {
        if (!project) return;

        const newPiece: CustomPiece = {
            id: crypto.randomUUID(),
            projectId: projectId,
            userId: user?.uid || 'guest',
            name: 'New Piece',
            pixelsWhite: Array(64).fill(null).map(() => Array(64).fill('transparent')),
            pixelsBlack: Array(64).fill(null).map(() => Array(64).fill('transparent')),
            moves: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            setId: '' // Legacy
        };

        const success = await saveProject({
            customPieces: [...project.customPieces, newPiece]
        });

        if (success) {
            selectPiece(newPiece.id!, [...project.customPieces, newPiece]);
        }
    };

    const handleSavePiece = async (overrides?: Partial<CustomPiece>, silent: boolean = false) => {
        if (!project || !selectedPieceId) return;

        // 1. Calculate the updated piece
        const pieceToUpdate = project.customPieces.find(p => p.id === selectedPieceId || p.name === selectedPieceId);
        if (!pieceToUpdate) return;

        const updatedPiece: CustomPiece = {
            ...pieceToUpdate,
            name: overrides?.name ?? currentName,
            pixelsWhite: overrides?.pixelsWhite ?? (pieceToUpdate.id === selectedPieceId || pieceToUpdate.name === selectedPieceId ? currentPixelsWhite : pieceToUpdate.pixelsWhite),
            pixelsBlack: overrides?.pixelsBlack ?? (pieceToUpdate.id === selectedPieceId || pieceToUpdate.name === selectedPieceId ? currentPixelsBlack : pieceToUpdate.pixelsBlack),
            imageWhite: overrides?.imageWhite ?? currentImageWhite,
            imageBlack: overrides?.imageBlack ?? currentImageBlack,
            moves: overrides?.moves ?? currentMoves,
            variables: overrides?.variables ?? currentVariables,
            updatedAt: new Date()
        };

        // 2. Create the full project update
        const success = await saveProject({
            customPieces: project.customPieces.map(p =>
                (p.id === selectedPieceId || p.name === selectedPieceId) ? updatedPiece : p
            )
        });

        if (success && !silent) {
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } else if (!success && !silent) {
            setSaveStatus('error');
        }
    };

    const handleSavePieceRef = useRef(handleSavePiece);
    handleSavePieceRef.current = handleSavePiece;

    useEffect(() => {
        if (!project || !selectedPieceId) return;

        const currentData = JSON.stringify({ name: currentName, variables: currentVariables });
        if (currentData === lastSavedDataRef.current) return;

        const timer = setTimeout(async () => {
            lastSavedDataRef.current = currentData;
            await handleSavePieceRef.current({}, true);
        }, SAVE_DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [currentName, currentVariables, project, selectedPieceId]);

    const handleDeletePiece = async (pieceId: string) => {
        if (!project || !confirm(t('deleteConfirm'))) return;

        const updatedPieces = project.customPieces.filter((p: CustomPiece) => p.id !== pieceId && p.name !== pieceId);

        const success = await saveProject({
            customPieces: updatedPieces
        });

        if (success) {
            if (selectedPieceId === pieceId) {
                if (updatedPieces.length > 0) {
                    selectPiece(updatedPieces[0].id || updatedPieces[0].name, updatedPieces);
                } else {
                    setSelectedPieceId(null);
                }
            }
        }
    };

    const addToHistory = useCallback((newPixels: string[][]) => {
        setHistory((prev: any[]) => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(JSON.parse(JSON.stringify(newPixels)));
            if (newHistory.length > 50) newHistory.shift();
            return newHistory;
        });
        setHistoryIndex(prev => prev + 1);
    }, [historyIndex]);

    const undo = useCallback(() => {
        if (historyIndex > 0) {
            const prevState = history[historyIndex - 1];
            if (editingColor === 'white') setCurrentPixelsWhite(prevState);
            else setCurrentPixelsBlack(prevState);
            setHistoryIndex((prev: number) => prev - 1);
        }
    }, [historyIndex, history, editingColor]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const nextState = history[historyIndex + 1];
            if (editingColor === 'white') setCurrentPixelsWhite(nextState);
            else setCurrentPixelsBlack(nextState);
            setHistoryIndex((prev: number) => prev + 1);
        }
    }, [historyIndex, history, editingColor]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                undo();
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                redo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const dataUrl = event.target?.result as string;
            if (!dataUrl) return;

            if (editingColor === 'white') {
                setCurrentImageWhite(dataUrl);
                handleSavePiece({ imageWhite: dataUrl });
            } else {
                setCurrentImageBlack(dataUrl);
                handleSavePiece({ imageBlack: dataUrl });
            }
        };
        reader.readAsDataURL(file);
    };

    // ─── AI Tool Registration ───
    const pieceToolHandlers = useMemo(() => {
        // Helper: draw shapes on pixel grid
        const getPixels = (pieceId: string, variant: 'white' | 'black'): string[][] | null => {
            if (selectedPieceId === pieceId) {
                return variant === 'white' ? [...currentPixelsWhite.map(r => [...r])] : [...currentPixelsBlack.map(r => [...r])];
            }
            const piece = project?.customPieces?.find(p => p.id === pieceId);
            if (!piece) return null;
            const src = variant === 'white' ? piece.pixelsWhite : piece.pixelsBlack;
            return src.map(r => [...r]);
        };

        const applyPixels = (pieceId: string, variant: 'white' | 'black', pixels: string[][]) => {
            if (selectedPieceId === pieceId) {
                if (variant === 'white') { setCurrentPixelsWhite(pixels); }
                else { setCurrentPixelsBlack(pixels); }
                addToHistory(pixels);
                handleSavePiece(variant === 'white' ? { pixelsWhite: pixels } : { pixelsBlack: pixels }, true);
            }
        };

        return {
            create_piece: async (args: Record<string, any>) => {
                if (!project || !user) return JSON.stringify({ error: 'Not authenticated' });
                const newPiece: any = {
                    id: crypto.randomUUID(),
                    projectId, userId: user.uid, name: args.name,
                    pixelsWhite: Array(64).fill(null).map(() => Array(64).fill('transparent')),
                    pixelsBlack: Array(64).fill(null).map(() => Array(64).fill('transparent')),
                    moves: [], createdAt: new Date(), updatedAt: new Date(), setId: ''
                };
                await saveProject({ customPieces: [...(project.customPieces || []), newPiece] });
                selectPiece(newPiece.id, [...(project.customPieces || []), newPiece]);
                return JSON.stringify({ success: true, pieceId: newPiece.id });
            },
            delete_piece: async (args: Record<string, any>) => {
                if (!project) return JSON.stringify({ error: 'No project' });
                const updated = project.customPieces.filter(p => p.id !== args.pieceId);
                await saveProject({ customPieces: updated });
                if (selectedPieceId === args.pieceId && updated.length > 0) {
                    selectPiece(updated[0].id || updated[0].name, updated);
                }
                return JSON.stringify({ success: true });
            },
            rename_piece: async (args: Record<string, any>) => {
                if (!project) return JSON.stringify({ error: 'No project' });
                if (selectedPieceId === args.pieceId) setCurrentName(args.name);
                const updated = project.customPieces.map(p =>
                    p.id === args.pieceId ? { ...p, name: args.name, updatedAt: new Date() } : p
                );
                await saveProject({ customPieces: updated });
                return JSON.stringify({ success: true });
            },
            set_pixels: async (args: Record<string, any>) => {
                const pixels = getPixels(args.pieceId, args.variant);
                if (!pixels) return JSON.stringify({ error: 'Piece not found' });
                for (const p of args.pixels) {
                    if (p.x >= 0 && p.x < 64 && p.y >= 0 && p.y < 64) {
                        pixels[p.y][p.x] = p.color;
                    }
                }
                applyPixels(args.pieceId, args.variant, pixels);
                return JSON.stringify({ success: true, pixelsSet: args.pixels.length });
            },
            draw_rectangle: async (args: Record<string, any>) => {
                const pixels = getPixels(args.pieceId, args.variant);
                if (!pixels) return JSON.stringify({ error: 'Piece not found' });
                const { x1, y1, x2, y2, color, filled } = args;
                for (let y = Math.max(0, y1); y <= Math.min(63, y2); y++) {
                    for (let x = Math.max(0, x1); x <= Math.min(63, x2); x++) {
                        if (filled || x === x1 || x === x2 || y === y1 || y === y2) {
                            pixels[y][x] = color;
                        }
                    }
                }
                applyPixels(args.pieceId, args.variant, pixels);
                return JSON.stringify({ success: true });
            },
            draw_circle: async (args: Record<string, any>) => {
                const pixels = getPixels(args.pieceId, args.variant);
                if (!pixels) return JSON.stringify({ error: 'Piece not found' });
                const { centerX, centerY, radius, color, filled } = args;
                for (let y = 0; y < 64; y++) {
                    for (let x = 0; x < 64; x++) {
                        const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                        if (filled ? dist <= radius : Math.abs(dist - radius) < 0.8) {
                            pixels[y][x] = color;
                        }
                    }
                }
                applyPixels(args.pieceId, args.variant, pixels);
                return JSON.stringify({ success: true });
            },
            draw_line: async (args: Record<string, any>) => {
                const pixels = getPixels(args.pieceId, args.variant);
                if (!pixels) return JSON.stringify({ error: 'Piece not found' });
                const { x1, y1, x2, y2, color, thickness } = args;
                const dx = x2 - x1, dy = y2 - y1;
                const steps = Math.max(Math.abs(dx), Math.abs(dy));
                for (let i = 0; i <= steps; i++) {
                    const t = steps === 0 ? 0 : i / steps;
                    const cx = Math.round(x1 + dx * t);
                    const cy = Math.round(y1 + dy * t);
                    const half = Math.floor((thickness || 1) / 2);
                    for (let oy = -half; oy <= half; oy++) {
                        for (let ox = -half; ox <= half; ox++) {
                            const px = cx + ox, py = cy + oy;
                            if (px >= 0 && px < 64 && py >= 0 && py < 64) pixels[py][px] = color;
                        }
                    }
                }
                applyPixels(args.pieceId, args.variant, pixels);
                return JSON.stringify({ success: true });
            },
            fill_region: async (args: Record<string, any>) => {
                const pixels = getPixels(args.pieceId, args.variant);
                if (!pixels) return JSON.stringify({ error: 'Piece not found' });
                const { x, y, color } = args;
                if (x < 0 || x >= 64 || y < 0 || y >= 64) return JSON.stringify({ error: 'Out of bounds' });
                const target = pixels[y][x];
                if (target === color) return JSON.stringify({ success: true, note: 'Already that color' });
                const stack: [number, number][] = [[x, y]];
                const visited = new Set<string>();
                while (stack.length > 0) {
                    const [cx, cy] = stack.pop()!;
                    const key = `${cx},${cy}`;
                    if (visited.has(key)) continue;
                    if (cx < 0 || cx >= 64 || cy < 0 || cy >= 64) continue;
                    if (pixels[cy][cx] !== target) continue;
                    visited.add(key);
                    pixels[cy][cx] = color;
                    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
                }
                applyPixels(args.pieceId, args.variant, pixels);
                return JSON.stringify({ success: true, filled: visited.size });
            },
            clear_canvas: async (args: Record<string, any>) => {
                const pixels = Array(64).fill(null).map(() => Array(64).fill('transparent'));
                applyPixels(args.pieceId, args.variant, pixels);
                return JSON.stringify({ success: true });
            },
            invert_piece_colors: async (args: Record<string, any>) => {
                const src = args.source === 'white' ? currentPixelsWhite : currentPixelsBlack;
                const inverted = src.map(row => row.map(pixel => invertLightness(pixel)));
                if (args.source === 'white') {
                    setCurrentPixelsBlack(inverted);
                    handleSavePiece({ pixelsBlack: inverted }, true);
                } else {
                    setCurrentPixelsWhite(inverted);
                    handleSavePiece({ pixelsWhite: inverted }, true);
                }
                return JSON.stringify({ success: true });
            },
            load_movement_preset: async (args: Record<string, any>) => {
                const rules = getPresetRules(args.preset);
                if (rules.length === 0) return JSON.stringify({ error: `Unknown preset: ${args.preset}` });
                setCurrentMoves(rules);
                handleSavePiece({ moves: rules }, true);
                return JSON.stringify({ success: true, rulesCount: rules.length });
            },
            add_movement_rule: async (args: Record<string, any>) => {
                const ruleId = uuidv4();
                const newRule = {
                    id: ruleId,
                    conditions: (args.conditions || []).map((c: any) => ({ ...c, id: uuidv4() })),
                    result: args.result || 'allow',
                    type: args.type || 'jump'
                };
                const updated = [...currentMoves, newRule];
                setCurrentMoves(updated);
                handleSavePiece({ moves: updated }, true);
                return JSON.stringify({ success: true, ruleId });
            },
            remove_movement_rule: async (args: Record<string, any>) => {
                const updated = currentMoves.filter((r: any) => r.id !== args.ruleId);
                setCurrentMoves(updated);
                handleSavePiece({ moves: updated }, true);
                return JSON.stringify({ success: true });
            },
            update_movement_rule: async (args: Record<string, any>) => {
                const updated = currentMoves.map((r: any) => {
                    if (r.id !== args.ruleId) return r;
                    return {
                        ...r,
                        ...(args.conditions ? { conditions: args.conditions.map((c: any) => ({ ...c, id: c.id || uuidv4() })) } : {}),
                        ...(args.result ? { result: args.result } : {}),
                        ...(args.type ? { type: args.type } : {})
                    };
                });
                setCurrentMoves(updated);
                handleSavePiece({ moves: updated }, true);
                return JSON.stringify({ success: true });
            },
            clear_movement_rules: async () => {
                setCurrentMoves([]);
                handleSavePiece({ moves: [] }, true);
                return JSON.stringify({ success: true });
            },
        };
    }, [project, user, selectedPieceId, currentPixelsWhite, currentPixelsBlack, currentMoves, editingColor, saveProject, selectPiece, addToHistory, handleSavePiece, projectId]);

    useAIToolRegistration(pieceToolHandlers);

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
            <div className="pt-24 pb-32 px-4 flex flex-col items-center w-full relative">
                <Link
                    href={`/editor/${projectId}`}
                    className="absolute top-8 left-8 p-2 text-stone-400 hover:text-stone-900 dark:text-stone-500 dark:hover:text-white transition-colors rounded-lg hover:bg-black/5 dark:hover:bg-white/5 z-50 hidden md:flex"
                    title={t('backToProject')}
                >
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div className="mb-12 text-center max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 text-amber-500 text-xs font-semibold uppercase tracking-widest mb-4 border border-amber-400/20">
                        <Palette size={14} /> {t('badge')}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-stone-900 dark:text-white mb-4 tracking-tight">
                        {t.rich("title", {
                            accent: chunks => <span className="text-accent underline decoration-wavy decoration-2 underline-offset-4">{chunks}</span>
                        })}
                    </h1>
                    <p className="text-stone-500 dark:text-white/60 text-lg leading-relaxed max-w-lg mx-auto">
                        {project.name} - {t('description')}
                    </p>
                </div>

                {mode === 'design' ? (
                    <PixelCanvas
                        gridSize={gridSize}
                        pixels={editingColor === 'white' ? currentPixelsWhite : currentPixelsBlack}
                        image={editingColor === 'white' ? currentImageWhite : currentImageBlack}
                        setPixels={(pixels) => editingColor === 'white' ? setCurrentPixelsWhite(pixels) : setCurrentPixelsBlack(pixels)}
                        commitPixels={(pixels) => {
                            addToHistory(pixels);
                            if (editingColor === 'white') setCurrentPixelsWhite(pixels);
                            else setCurrentPixelsBlack(pixels);
                            handleSavePiece(editingColor === 'white' ? { pixelsWhite: pixels } : { pixelsBlack: pixels }, true);
                        }}
                        selectedPieceId={selectedPieceId || 'new'}
                    />
                ) : (
                    <div className="flex flex-col lg:flex-row gap-8 items-start justify-center max-w-6xl w-full">
                        <div className="flex-1 w-full">
                            <VisualMoveEditor
                                moves={currentMoves}
                                onUpdate={(moves) => {
                                    setCurrentMoves(moves);
                                    handleSavePiece({ moves }, true);
                                }}
                                pieceId={selectedPieceId || undefined}
                                projectId={projectId}
                                variables={currentVariables}
                            />
                        </div>
                        {showTestBoard && selectedPieceId && (
                            <div className="mt-8 lg:mt-32 sticky top-32 animate-in fade-in slide-in-from-right-8 duration-500">
                                <PieceTestBoard 
                                    currentPiece={{
                                        id: selectedPieceId,
                                        name: currentName,
                                        pixelsWhite: currentPixelsWhite,
                                        pixelsBlack: currentPixelsBlack,
                                        imageWhite: currentImageWhite,
                                        imageBlack: currentImageBlack,
                                        moves: currentMoves,
                                    } as any}
                                    pieceColor={editingColor}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            <PieceEditorSidebar
                pieces={project.customPieces as any}
                selectedPieceId={selectedPieceId}
                setSelectedPieceId={(id: string) => selectPiece(id)}
                onCreateNewPiece={() => createNewPiece()}
                onSavePiece={() => handleSavePiece()}
                isSaving={isSaving}
                saveStatus={saveStatus}
                currentName={currentName}
                setCurrentName={setCurrentName}
                currentColor={editingColor}
                setCurrentColor={setEditingColor}
                mode={mode}
                setMode={(m: any) => { if (m === 'moves') trackEvent('open_rules_editor'); setMode(m); }}
                undo={undo}
                redo={redo}
                canUndo={historyIndex > 0}
                canRedo={historyIndex < history.length - 1}
                onDeletePiece={handleDeletePiece}
                onGenerateInvertedPiece={() => {
                    if (!confirm(t('confirmInvert'))) return;
                    if (editingColor === 'white') {
                        const inverted = currentPixelsWhite.map(row =>
                            row.map(pixel => invertLightness(pixel))
                        );
                        setCurrentPixelsBlack(inverted);
                        handleSavePiece({ pixelsBlack: inverted });
                    } else {
                        const inverted = currentPixelsBlack.map(row =>
                            row.map(pixel => invertLightness(pixel))
                        );
                        setCurrentPixelsWhite(inverted);
                        handleSavePiece({ pixelsWhite: inverted });
                    }
                }}
                onImageUpload={handleImageUpload}
                projectId={projectId}
                onLoadPreset={(moves) => {
                    setCurrentMoves(moves);
                    handleSavePiece({ moves }, false);
                }}
                showTestBoard={showTestBoard}
                onToggleTestBoard={() => setShowTestBoard(!showTestBoard)}
            />
        </div>
    );
}
