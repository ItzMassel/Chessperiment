"use client";
import EditorLayout from '@/components/editor/EditorLayout';
import EditorSidebar from '@/components/editor/EditorSidebar';
import BoardEditor from '@/components/editor/BoardEditor';
import { Grid3x3 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useCallback, useEffect } from 'react';
export type EditMode = 'shape' | 'pieces';




export default function PageClient({ children }: { children?: React.ReactNode }) {
    const t = useTranslations('Editor.Board');
    const [editMode, setEditMode] = useState<EditMode>('shape');
    const [selectedPiece, setSelectedPiece] = useState({ type: 'Pawn', color: 'white' });
    const [boardStyle, setBoardStyle] = useState('v3');
    const [boardKey, setBoardKey] = useState(0);
    const [board, setBoard] = useState({
        rows: 8,
        cols: 8,
        placedPieces: {},
        activeSquares: new Set<string>(),
    });

    const [customCollection, setCustomCollection] = useState<Record<string, any>>({});

    // Load custom collection from localStorage
    const loadCustomCollection = useCallback(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('piece_collection');
            if (saved) {
                try {
                    setCustomCollection(JSON.parse(saved));
                } catch (e) {
                    console.error("Failed to parse custom collection", e);
                }
            }
        }
    }, []);

    useEffect(() => {
        loadCustomCollection();

        // Refresh when window regains focus (e.g., user returns from Piece Editor)
        const handleFocus = () => {
            loadCustomCollection();
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [loadCustomCollection]);

    const generateBoardData = useCallback((rows: number, cols: number, activeSquares: Set<string>, placedPieces: Record<string, { type: string; color: string }>) => {
        const boardData = {
            rows,
            cols,
            placedPieces,
            activeSquares: Array.from(activeSquares),
        };
        return JSON.stringify(boardData, null, 2);
    }, []);

    const setBoardCallback = useCallback((rows: number, cols: number, activeSquares: Set<string>, placedPieces: Record<string, { type: string; color: string }>) => {
        setBoard({ rows, cols, activeSquares, placedPieces });
    }, []);

    const handlePresetChange = (newData: any) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('rows', newData.rows);
            localStorage.setItem('cols', newData.cols);
            localStorage.setItem('activeSquares', JSON.stringify(newData.activeSquares));
            localStorage.setItem('placedPieces', JSON.stringify(newData.placedPieces));
        }

        setBoard({
            rows: newData.rows,
            cols: newData.cols,
            activeSquares: new Set(newData.activeSquares),
            placedPieces: newData.placedPieces
        });
        setBoardKey(prev => prev + 1);
    };

    return (
        <>

            <EditorLayout sidebar={
                <EditorSidebar
                    editMode={editMode}
                    setEditMode={setEditMode}
                    selectedPiece={selectedPiece}
                    setSelectedPiece={setSelectedPiece}
                    boardStyle={boardStyle}
                    setBoardStyle={setBoardStyle}
                    generateBoardData={() => generateBoardData(board.rows, board.cols, board.activeSquares, board.placedPieces)}
                    setBoard={setBoard} // keeping for compatibility if needed
                    onPresetChange={handlePresetChange}
                    customCollection={customCollection}
                    setCustomCollection={setCustomCollection}
                />
            }>

                <div className="flex flex-col items-center w-full">
                    <div className="mb-12 text-center max-w-2xl animate-in slide-in-from-top-4 fade-in duration-700">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-accent-hover text-xs font-semibold uppercase tracking-widest mb-4 border border-accent/20">
                            <Grid3x3 size={14} /> {t('badge')}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-text mb-4 tracking-tight">
                            {t.rich('title', {
                                accent: (chunks) => <span className="text-accent underline decoration-wavy decoration-2 underline-offset-4">{chunks}</span>
                            })}
                        </h1>
                        <p className="text-text/60 text-lg leading-relaxed max-w-lg mx-auto">
                            {t('description')}
                        </p>
                    </div>
                    <BoardEditor
                        key={boardKey}
                        editMode={editMode}
                        selectedPiece={selectedPiece}
                        boardStyle={boardStyle}
                        generateBoardData={setBoardCallback}
                        customCollection={customCollection}
                    />
                    {children}
                </div>
            </EditorLayout>
        </>
    );
}