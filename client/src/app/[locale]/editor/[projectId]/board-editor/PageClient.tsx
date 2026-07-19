'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Project } from '@/types/Project';
import { useProject } from '@/hooks/useProject';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import BoardEditor from '@/components/editor/BoardEditor';
import ProjectEditorSidebar from '@/components/editor/ProjectEditorSidebar';
import BottomPiecePanel from '@/components/editor/BottomPiecePanel';
import { useAIToolRegistration } from '@/hooks/useAIToolRegistration';

import { EditMode } from '@/types/editor';

interface PageClientProps {
    projectId: string;
}

export default function PageClient({ projectId }: PageClientProps) {
    const t = useTranslations('Editor.Board');
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [editMode, setEditMode] = useState<EditMode>('shape');
    const [selectedPiece, setSelectedPiece] = useState<{ type: string, color: string, movement?: 'run' | 'jump' }>({ type: 'Pawn', color: 'white' });
    const [boardStyle, setBoardStyle] = useState('v3');
    const [boardKey, setBoardKey] = useState(0);

    const { project, loading, saveBoard, saveProject } = useProject(projectId);

    // Transform project.customPieces into the format expected by BoardEditor
    const customCollection = useMemo(() => {
        if (!project?.customPieces) return {};
        const collection: Record<string, any> = {};
        project.customPieces.forEach((p) => {
            collection[`${p.id}_white`] = {
                name: p.name,
                color: 'white',
                pixels: p.pixelsWhite,
                image: p.imageWhite, // Add image for white
                moves: p.moves || [],
                logic: p.logic || [],
                originalId: p.id
            };
            collection[`${p.id}_black`] = {
                name: p.name,
                color: 'black',
                pixels: p.pixelsBlack,
                image: p.imageBlack, // Add image for black
                moves: p.moves || [],
                logic: p.logic || [],
                originalId: p.id
            };
        });
        return collection;
    }, [project?.customPieces]);

    const handleGenerateBoardData = useCallback(async (rows: number, cols: number, activeSquares: Set<string>, placedPieces: Record<string, { type: string; color: string }>, gridType: 'square' | 'hex') => {
        saveBoard({
            rows,
            cols,
            gridType,
            activeSquares: Array.from(activeSquares),
            placedPieces: placedPieces as any
        });
    }, [saveBoard]);

    // ─── AI Tool Registration ───
    const boardToolHandlers = useMemo(() => ({
        resize_board: async (args: Record<string, any>) => {
            const rows = Math.max(1, Math.min(20, args.rows));
            const cols = Math.max(1, Math.min(20, args.cols));
            // Generate all squares for the new dimensions
            const squares: string[] = [];
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    squares.push(`${x},${y}`);
                }
            }
            await saveBoard({ rows, cols, activeSquares: squares });
            setBoardKey(k => k + 1);
            return JSON.stringify({ success: true, rows, cols });
        },
        set_grid_type: async (args: Record<string, any>) => {
            await saveBoard({ gridType: args.gridType });
            setBoardKey(k => k + 1);
            return JSON.stringify({ success: true, gridType: args.gridType });
        },
        enable_squares: async (args: Record<string, any>) => {
            if (!project) return JSON.stringify({ error: 'No project' });
            const current = new Set(project.activeSquares);
            (args.squares as string[]).forEach(s => current.add(s));
            await saveBoard({ activeSquares: Array.from(current) });
            setBoardKey(k => k + 1);
            return JSON.stringify({ success: true, count: current.size });
        },
        disable_squares: async (args: Record<string, any>) => {
            if (!project) return JSON.stringify({ error: 'No project' });
            const current = new Set(project.activeSquares);
            (args.squares as string[]).forEach(s => current.delete(s));
            await saveBoard({ activeSquares: Array.from(current) });
            setBoardKey(k => k + 1);
            return JSON.stringify({ success: true, count: current.size });
        },
        set_all_active_squares: async (args: Record<string, any>) => {
            await saveBoard({ activeSquares: args.squares });
            setBoardKey(k => k + 1);
            return JSON.stringify({ success: true, count: args.squares.length });
        },
        place_piece: async (args: Record<string, any>) => {
            if (!project) return JSON.stringify({ error: 'No project' });
            const pieces = { ...project.placedPieces };
            pieces[args.square] = { type: args.pieceType, color: args.color, ...(args.movement ? { movement: args.movement } : {}) };
            await saveBoard({ placedPieces: pieces });
            setBoardKey(k => k + 1);
            return JSON.stringify({ success: true, square: args.square, piece: args.pieceType });
        },
        remove_piece: async (args: Record<string, any>) => {
            if (!project) return JSON.stringify({ error: 'No project' });
            const pieces = { ...project.placedPieces };
            delete pieces[args.square];
            await saveBoard({ placedPieces: pieces });
            setBoardKey(k => k + 1);
            return JSON.stringify({ success: true });
        },
        clear_all_pieces: async () => {
            await saveBoard({ placedPieces: {} });
            setBoardKey(k => k + 1);
            return JSON.stringify({ success: true });
        },
        apply_board_preset: async (args: Record<string, any>) => {
            const preset = args.preset;
            let rows = 8, cols = 8;
            const squares: string[] = [];
            let pieces: Record<string, { type: string; color: string }> = {};

            if (preset === 'small-5x5') { rows = 5; cols = 5; }
            else if (preset === 'large-10x10') { rows = 10; cols = 10; }

            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    squares.push(`${x},${y}`);
                }
            }

            if (preset === 'standard-chess') {
                const backRow = ['Rook', 'Knight', 'Bishop', 'Queen', 'King', 'Bishop', 'Knight', 'Rook'];
                backRow.forEach((type, x) => {
                    pieces[`${x},0`] = { type, color: 'black' };
                    pieces[`${x},7`] = { type, color: 'white' };
                });
                for (let x = 0; x < 8; x++) {
                    pieces[`${x},1`] = { type: 'Pawn', color: 'black' };
                    pieces[`${x},6`] = { type: 'Pawn', color: 'white' };
                }
            }

            await saveBoard({ rows, cols, activeSquares: squares, placedPieces: pieces, gridType: 'square' });
            setBoardKey(k => k + 1);
            return JSON.stringify({ success: true, preset, rows, cols });
        },
        set_symmetry_mode: async (args: Record<string, any>) => {
            // Symmetry is UI-only state, not persisted
            return JSON.stringify({ success: true, mode: args.mode, note: 'Symmetry mode is a UI editing aid' });
        },
    }), [project, saveBoard]);

    useAIToolRegistration(boardToolHandlers);

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

    if (!project) return null;

    return (
        <div className="flex min-h-screen bg-bg">
            <div className="hidden lg:block">
                <ProjectEditorSidebar projectId={projectId} />
            </div>

            <main className="flex-1 overflow-hidden flex flex-col pt-20 relative">
                <Link
                    href={`/editor/${projectId}`}
                    className="absolute top-6 left-8 p-2 text-stone-400 hover:text-stone-900 dark:text-stone-500 dark:hover:text-white transition-colors rounded-lg hover:bg-black/5 dark:hover:bg-white/5 z-50"
                    title={t('backToProject')}
                >
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <BoardEditor
                    key={boardKey}
                    editMode={editMode}
                    selectedPiece={selectedPiece}
                    boardStyle={boardStyle}
                    generateBoardData={handleGenerateBoardData}
                    customCollection={customCollection}
                    onDeselect={() => {
                        setEditMode('shape');
                        setSelectedPiece({ type: 'Pawn', color: 'white' });
                    }}
                    initialData={{
                        rows: project.rows,
                        cols: project.cols,
                        gridType: project.gridType || 'square',
                        activeSquares: project.activeSquares,
                        placedPieces: project.placedPieces
                    }}
                />
            </main>

            <BottomPiecePanel
                project={project}
                onSelectPiece={(piece) => {
                    if (piece.type === '') {
                        setEditMode('shape');
                        setSelectedPiece({ type: 'Pawn', color: 'white' });
                    } else {
                        setEditMode('pieces');
                        setSelectedPiece(piece);
                    }
                }}
                selectedPiece={editMode === 'pieces' ? selectedPiece : null}
            />
        </div>
    );
}
