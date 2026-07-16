"use client"
import EditorLayout from '@/components/editor/EditorLayout';
import PieceEditorSidebar from '@/components/editor/PieceEditorSidebar';
import PixelCanvas from '@/components/editor/PixelCanvas';
import VisualMoveEditor from '@/components/editor/VisualMoveEditor';
import SaveToSetModal from '@/components/editor/SaveToSetModal';
import { Palette, Check, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { getUserPieceSetsAction, getCustomPieceAction, savePieceSetAction, saveCustomPieceAction, getSetPiecesAction, deleteCustomPieceAction } from '@/app/actions/library';
import { PieceSet, CustomPiece } from '@/types/firestore';
import { invertLightness } from '@/lib/colors';

export default function PageClient({ children }: { children?: React.ReactNode }) {
    const t = useTranslations('Editor.Piece');
    const locale = useLocale();

    // Set management
    const [sets, setSets] = useState<(PieceSet & { id: string })[]>([]);
    const [currentSetId, setCurrentSetId] = useState<string | null>(null);

    // Piece management
    const [pieces, setPieces] = useState<(CustomPiece & { id: string })[]>([]);
    const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
    const [editingPieceId, setEditingPieceId] = useState<string | null>(null);

    // Editor state
    const [mode, setMode] = useState<'design' | 'moves'>('design');
    const [currentPixelsWhite, setCurrentPixelsWhite] = useState<string[][]>(
        Array(64).fill(null).map(() => Array(64).fill('transparent'))
    );
    const [currentPixelsBlack, setCurrentPixelsBlack] = useState<string[][]>(
        Array(64).fill(null).map(() => Array(64).fill('transparent'))
    );
    const [currentImageWhite, setCurrentImageWhite] = useState<string | undefined>(undefined);
    const [currentImageBlack, setCurrentImageBlack] = useState<string | undefined>(undefined);

    // The color we are currently EDITING
    const [editingColor, setEditingColor] = useState<'white' | 'black'>('white');

    const [currentMoves, setCurrentMoves] = useState<any[]>([]);
    const [currentName, setCurrentName] = useState('New Piece');

    // History for undo/redo
    const [history, setHistory] = useState<any[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [gridSize] = useState(64);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // Load sets and check for edit mode
    useEffect(() => {
        initializeEditor();
    }, []);

    const initializeEditor = async () => {
        try {
            const editId = localStorage.getItem('editPieceId');
            if (editId) {
                await loadPieceForEditing(editId);
                localStorage.removeItem('editPieceId');
                return;
            }

            const loadedSets = await getUserPieceSetsAction();
            setSets(loadedSets as any);

            if (loadedSets.length === 0) {
                setIsSaveModalOpen(true);
                return;
            }

            const sortedSets = [...loadedSets].sort((a, b) =>
                new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
            const mostRecentSet = sortedSets[0];

            setCurrentSetId(mostRecentSet.id!);
            await loadSetPieces(mostRecentSet.id!);
        } catch (error) {
            setIsSaveModalOpen(true);
        }
    };

    const loadSetPieces = async (setId: string) => {
        try {
            const loadedPieces = await getSetPiecesAction(setId);
            setPieces(loadedPieces as any);

            // Sync with localStorage for Board Editor compatibility
            if (typeof window !== 'undefined') {
                const existingCollection = JSON.parse(localStorage.getItem('piece_collection') || '{}');
                loadedPieces.forEach((p: any) => {
                    if (p.id) existingCollection[p.id] = p;
                });
                localStorage.setItem('piece_collection', JSON.stringify(existingCollection));
            }

            if (loadedPieces.length === 0) {
                await createStarterPieces(setId);
            } else {
                selectPiece(loadedPieces[0].id!);
            }
        } catch (error) {
        }
    };

    const createStarterPieces = async (setId: string) => {
        try {
            const newPieceData: Omit<CustomPiece, 'userId' | 'createdAt' | 'updatedAt'> = {
                setId: setId,
                name: 'NewPiece',
                pixelsWhite: Array(64).fill(null).map(() => Array(64).fill('transparent')),
                pixelsBlack: Array(64).fill(null).map(() => Array(64).fill('transparent')),
                moves: []
            };
            const pieceId = await saveCustomPieceAction(newPieceData);

            const loadedPieces = await getSetPiecesAction(setId);
            setPieces(loadedPieces as any);
            selectPiece(pieceId);
        } catch (error) {
        }
    };

    const loadPieceForEditing = async (pieceId: string) => {
        try {
            const piece = await getCustomPieceAction(pieceId);
            if (piece) {
                setEditingPieceId(pieceId);
                setCurrentSetId(piece.setId);
                setCurrentPixelsWhite(piece.pixelsWhite || (piece as any).pixels || Array(64).fill(Array(64).fill('transparent')));
                setCurrentPixelsBlack(piece.pixelsBlack || Array(64).fill(Array(64).fill('transparent')));
                setCurrentImageWhite(piece.imageWhite);
                setCurrentImageBlack(piece.imageBlack);
                setCurrentMoves(piece.moves || []);
                setCurrentName(piece.name);
                setSelectedPieceId(pieceId);

                await loadSetPieces(piece.setId);
            }
        } catch (error) {
        }
    };

    const selectPiece = (pieceId: string, overridePieces?: any[]) => {
        const targetPieces = overridePieces || pieces;
        const piece = targetPieces.find(p => p.id === pieceId);
        if (piece) {
            setSelectedPieceId(pieceId);
            setCurrentPixelsWhite(piece.pixelsWhite);
            setCurrentPixelsBlack(piece.pixelsBlack);
            setCurrentImageWhite(piece.imageWhite);
            setCurrentImageBlack(piece.imageBlack);
            setCurrentMoves(piece.moves || []);
            setCurrentName(piece.name);
            setEditingPieceId(pieceId);
            if (piece.setId) setCurrentSetId(piece.setId);
            setHistory([JSON.parse(JSON.stringify(editingColor === 'white' ? piece.pixelsWhite : piece.pixelsBlack))]);
            setHistoryIndex(0);
        }
    };

    const createNewPiece = async () => {
        if (!currentSetId) {
            setIsSaveModalOpen(true);
            return;
        }

        try {
            const newPieceData: Omit<CustomPiece, 'userId' | 'createdAt' | 'updatedAt'> = {
                setId: currentSetId,
                name: 'New Piece',
                pixelsWhite: Array(64).fill(null).map(() => Array(64).fill('transparent')),
                pixelsBlack: Array(64).fill(null).map(() => Array(64).fill('transparent')),
                moves: []
            };

            const newPieceId = await saveCustomPieceAction(newPieceData);
            const loadedPieces = await getSetPiecesAction(currentSetId);
            setPieces(loadedPieces as any);
            selectPiece(newPieceId);
        } catch (error) {
        }
    };

    const handleSavePiece = async (overrides?: { pixelsWhite?: string[][], pixelsBlack?: string[][], imageWhite?: string, imageBlack?: string, moves?: any[], name?: string }) => {
        if (!currentSetId) {
            setIsSaveModalOpen(true);
            return;
        }

        setIsSaving(true);
        setSaveStatus('idle');
        try {
            const pieceData: Omit<CustomPiece, 'userId' | 'createdAt' | 'updatedAt'> = {
                id: editingPieceId || undefined,
                setId: currentSetId,
                name: overrides?.name ?? currentName,
                pixelsWhite: overrides?.pixelsWhite ?? currentPixelsWhite,
                pixelsBlack: overrides?.pixelsBlack ?? currentPixelsBlack,
                imageWhite: overrides?.imageWhite ?? currentImageWhite,
                imageBlack: overrides?.imageBlack ?? currentImageBlack,
                moves: overrides?.moves ?? currentMoves,
            };

            const savedId = await saveCustomPieceAction(pieceData);
            setEditingPieceId(savedId);
            setSelectedPieceId(savedId);

            const loadedPieces = await getSetPiecesAction(currentSetId);
            setPieces(loadedPieces as any);

            if (typeof window !== 'undefined') {
                const existingCollection = JSON.parse(localStorage.getItem('piece_collection') || '{}');
                loadedPieces.forEach((p: any) => {
                    if (p.id) {
                        // Save raw for safety
                        existingCollection[p.id] = p;

                        // Save compatibility keys used by EditorSidebar placements
                        existingCollection[`${p.id}_white`] = {
                            name: p.name,
                            color: 'white',
                            pixels: p.pixelsWhite,
                            image: p.imageWhite,
                            moves: p.moves || [],
                            logic: p.logic || [],
                            originalId: p.id
                        };
                        existingCollection[`${p.id}_black`] = {
                            name: p.name,
                            color: 'black',
                            pixels: p.pixelsBlack,
                            image: p.imageBlack,
                            moves: p.moves || [],
                            logic: p.logic || [],
                            originalId: p.id
                        };
                    }
                });
                localStorage.setItem('piece_collection', JSON.stringify(existingCollection));
            }

            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (error) {
            setSaveStatus('error');
            if (!overrides) alert(t('errorSaving'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleSelectSetAndSave = async (setId: string) => {
        setIsSaveModalOpen(false);
        setCurrentSetId(setId);

        try {
            const loadedPieces = await getSetPiecesAction(setId);

            if (loadedPieces.length === 0) {
                await createStarterPieces(setId);
            } else {
                setPieces(loadedPieces as any);
                if (typeof window !== 'undefined') {
                    const existingCollection = JSON.parse(localStorage.getItem('piece_collection') || '{}');
                    loadedPieces.forEach((p: any) => {
                        if (p.id) existingCollection[p.id] = p;
                    });
                    localStorage.setItem('piece_collection', JSON.stringify(existingCollection));
                }
                selectPiece(loadedPieces[0].id!);
            }

            const refreshedSets = await getUserPieceSetsAction();
            setSets(refreshedSets as any);
        } catch (error) {
        }
    };

    const handleDeletePiece = async (pieceId: string) => {
        if (!confirm('Are you sure you want to delete this piece?')) return;
        try {
            await deleteCustomPieceAction(pieceId);
            const loadedPieces = await getSetPiecesAction(currentSetId!);
            setPieces(loadedPieces as any);

            // Remove from localStorage to sync with Board Editor
            if (typeof window !== 'undefined') {
                const existingCollection = JSON.parse(localStorage.getItem('piece_collection') || '{}');
                // Remove all variants of this piece
                delete existingCollection[pieceId];
                delete existingCollection[`${pieceId}_white`];
                delete existingCollection[`${pieceId}_black`];
                localStorage.setItem('piece_collection', JSON.stringify(existingCollection));
            }

            if (selectedPieceId === pieceId) {
                if (loadedPieces.length > 0) {
                    selectPiece(loadedPieces[0].id!);
                } else {
                    setSelectedPieceId(null);
                    setEditingPieceId(null);
                    setCurrentPixelsWhite(Array(64).fill(Array(64).fill('transparent')));
                    setCurrentPixelsBlack(Array(64).fill(Array(64).fill('transparent')));
                    setCurrentImageWhite(undefined);
                    setCurrentImageBlack(undefined);
                    setCurrentMoves([]);
                    setCurrentName('New Piece');
                }
            }
        } catch (error) {
        }
    };

    const generateInvertedDesign = () => {
        const sourcePixels = editingColor === 'white' ? currentPixelsWhite : currentPixelsBlack;
        const invertedPixels = sourcePixels.map(row =>
            row.map(color => (color === 'transparent' || !color.startsWith('#')) ? color : invertLightness(color))
        );

        if (editingColor === 'white') {
            setCurrentPixelsBlack(invertedPixels);
            handleSavePiece({ pixelsBlack: invertedPixels });
        } else {
            setCurrentPixelsWhite(invertedPixels);
            handleSavePiece({ pixelsWhite: invertedPixels });
        }
    };

    // Auto-save name
    useEffect(() => {
        const timer = setTimeout(() => {
            if (editingPieceId) {
                const piece = pieces.find(p => p.id === editingPieceId);
                if (piece && piece.name !== currentName) {
                    handleSavePiece({ name: currentName });
                }
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [currentName, editingPieceId]);

    const addToHistory = useCallback((newPixels: string[][]) => {
        setHistory(prev => {
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
            setHistoryIndex(prev => prev - 1);
        }
    }, [historyIndex, history, editingColor]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const nextState = history[historyIndex + 1];
            if (editingColor === 'white') setCurrentPixelsWhite(nextState);
            else setCurrentPixelsBlack(nextState);
            setHistoryIndex(prev => prev + 1);
        }
    }, [historyIndex, history, editingColor]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isMod = e.ctrlKey || e.metaKey;
            const key = e.key.toLowerCase();

            if (isMod && key === 's') {
                e.preventDefault();
                handleSavePiece();
            } else if (isMod && key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            } else if (isMod && key === 'y') {
                e.preventDefault();
                redo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, handleSavePiece]);

    const updateCurrentPixels = (newPixels: string[][]) => {
        if (editingColor === 'white') setCurrentPixelsWhite(newPixels);
        else setCurrentPixelsBlack(newPixels);
    };

    const commitPixels = (finalPixels: string[][]) => {
        addToHistory(finalPixels);
        if (editingColor === 'white') {
            setCurrentPixelsWhite(finalPixels);
            setTimeout(() => handleSavePiece({ pixelsWhite: finalPixels }), 100);
        } else {
            setCurrentPixelsBlack(finalPixels);
            setTimeout(() => handleSavePiece({ pixelsBlack: finalPixels }), 100);
        }
    };

    const updateCurrentMoves = (newMoves: any[]) => {
        setCurrentMoves(newMoves);
        setTimeout(() => handleSavePiece({ moves: newMoves }), 100);
    };

    const pixelateImage = async (dataUrl: string, targetSize: number = 64): Promise<string[][]> => {
        return new Promise((resolve) => {
            const img = new globalThis.Image();
            img.src = dataUrl;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = targetSize;
                canvas.height = targetSize;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (!ctx) return resolve(Array(targetSize).fill(Array(targetSize).fill('transparent')));

                ctx.drawImage(img, 0, 0, targetSize, targetSize);
                const imageData = ctx.getImageData(0, 0, targetSize, targetSize);
                const pixels: string[][] = [];

                for (let y = 0; y < targetSize; y++) {
                    const row: string[] = [];
                    for (let x = 0; x < targetSize; x++) {
                        const i = (y * targetSize + x) * 4;
                        const r = imageData.data[i];
                        const g = imageData.data[i + 1];
                        const b = imageData.data[i + 2];
                        const a = imageData.data[i + 3];

                        if (a < 128) {
                            row.push('transparent');
                        } else {
                            // Convert to hex
                            const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
                            row.push(hex);
                        }
                    }
                    pixels.push(row);
                }
                resolve(pixels);
            };
        });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const dataUrl = event.target?.result as string;
            if (!dataUrl) return;

            const shouldPixelate = confirm(t('confirmPixelate'));
            if (shouldPixelate) {
                const pixelated = await pixelateImage(dataUrl, gridSize);
                commitPixels(pixelated);
                // Clear high-res image if we pixelate
                if (editingColor === 'white') {
                    setCurrentImageWhite(undefined);
                    handleSavePiece({ pixelsWhite: pixelated, imageWhite: undefined });
                } else {
                    setCurrentImageBlack(undefined);
                    handleSavePiece({ pixelsBlack: pixelated, imageBlack: undefined });
                }
            } else {
                if (editingColor === 'white') {
                    setCurrentImageWhite(dataUrl);
                    handleSavePiece({ imageWhite: dataUrl });
                } else {
                    setCurrentImageBlack(dataUrl);
                    handleSavePiece({ imageBlack: dataUrl });
                }
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <EditorLayout sidebar={
            <PieceEditorSidebar
                sets={sets}
                currentSetId={currentSetId}
                setCurrentSetId={(id) => {
                    setCurrentSetId(id);
                    loadSetPieces(id);
                }}
                pieces={pieces}
                selectedPieceId={selectedPieceId}
                setSelectedPieceId={selectPiece}
                onCreateNewPiece={createNewPiece}
                onCreateNewSet={() => setIsSaveModalOpen(true)}
                onSavePiece={handleSavePiece}
                isSaving={isSaving}
                currentName={currentName}
                setCurrentName={setCurrentName}
                currentColor={editingColor}
                setCurrentColor={setEditingColor}
                mode={mode}
                setMode={setMode}
                undo={undo}
                redo={redo}
                canUndo={historyIndex > 0}
                canRedo={historyIndex < history.length - 1}
                onDeletePiece={handleDeletePiece}
                onGenerateInvertedPiece={generateInvertedDesign}
                onImageUpload={handleImageUpload}
            />
        }>
            <div className="flex flex-col items-center w-full relative">
                <div className="mb-12 text-center max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 text-amber-500 text-xs font-semibold uppercase tracking-widest mb-4 border border-amber-400/20">
                        <Palette size={14} /> {t('badge')}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-stone-900 dark:text-white mb-4 tracking-tight">
                        {t.rich("title", {
                            accent: chunks => {
                                return <span className="text-accent underline decoration-wavy decoration-2 underline-offset-4">{chunks}</span>
                            }
                        })}
                    </h1>
                    <p className="text-stone-500 dark:text-white/60 text-lg leading-relaxed max-w-lg mx-auto">
                        {t('description')}
                    </p>

                    <div className="h-10 mt-4 flex items-center justify-center">
                        <AnimatePresence>
                            {saveStatus === 'success' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 text-sm font-bold border border-emerald-500/20"
                                >
                                    <Check size={16} /> {t('saved')}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {editingPieceId && (
                        <div className="mt-6 flex justify-center">
                            <Link href={`/${locale}/editor/piece/${editingPieceId}/logic`}>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 active:scale-95"
                                >
                                    <Zap size={18} />
                                    {t('advancedLogicTitle')}
                                </motion.button>
                            </Link>
                        </div>
                    )}
                </div>

                {mode === 'design' ? (
                    <PixelCanvas
                        gridSize={gridSize}
                        pixels={editingColor === 'white' ? currentPixelsWhite : currentPixelsBlack}
                        image={editingColor === 'white' ? currentImageWhite : currentImageBlack}
                        setPixels={updateCurrentPixels}
                        commitPixels={commitPixels}
                        selectedPieceId={selectedPieceId || 'new'}
                    />
                ) : (
                    <VisualMoveEditor
                        moves={currentMoves}
                        onUpdate={updateCurrentMoves}
                        pieceId={editingPieceId || undefined}
                    />
                )}
                {children}
            </div>

            <SaveToSetModal
                isOpen={isSaveModalOpen}
                onClose={() => setIsSaveModalOpen(false)}
                onSelectSet={handleSelectSetAndSave}
                currentPieceName={currentName}
            />
        </EditorLayout>
    );
}
