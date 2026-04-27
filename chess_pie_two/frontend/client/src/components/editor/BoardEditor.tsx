'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GripVertical, GripHorizontal, Plus, X, Minus, ZoomIn, ZoomOut, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { getPieceImage } from '@/lib/gameData';
import { EditMode } from '@/types/editor';
import PieceRenderer from '@/components/game/PieceRenderer';
import { SquareGrid } from '@/lib/grid/SquareGrid';
import { HexGrid } from '@/lib/grid/HexGrid';
import { GridType, Coordinate } from '@/lib/grid/GridType';

const gridMap: Record<string, GridType> = {
    square: new SquareGrid(),
    hex: new HexGrid()
};

const getPieceScale = (type: string) => {
    switch (type.toLowerCase()) {
        case 'king': return 0.98;
        case 'queen': return 0.96;
        case 'bishop': return 0.92;
        case 'knight': return 0.92;
        case 'rook': return 0.88;
        case 'pawn': return 0.85;
        default: return 0.95;
    }
};

interface BoardEditorProps {
    editMode: EditMode;
    selectedPiece: { type: string, color: string, movement?: 'run' | 'jump' };
    boardStyle: string;
    generateBoardData: (rows: number, cols: number, activeSquares: Set<string>, placedPieces: Record<string, { type: string; color: string; movement?: 'run' | 'jump' }>, gridType: 'square' | 'hex') => void;
    customCollection: Record<string, any>;
    initialData?: {
        rows: number;
        cols: number;
        gridType?: 'square' | 'hex';
        activeSquares: string[];
        placedPieces: Record<string, { type: string; color: string; movement?: 'run' | 'jump' }>;
    };
    onDeselect?: () => void;
}

// --- Memoized Square Component ---
const EditorSquare = React.memo(({
    squareSize,
    gridType,
    isActive,
    isBlackSquare,
    piece,
    editMode,
    selectedPiece,
    boardStyle,
    onMouseDown,
    onMouseEnter,
    onContextMenu,
    onDrop,
    customCollection,
    coord
}: {
    squareSize: number,
    gridType: 'square' | 'hex',
    isActive: boolean,
    isBlackSquare: boolean,
    piece?: { type: string, color: string },
    editMode: string,
    selectedPiece: { type: string, color: string },
    boardStyle: string,
    onMouseDown: (coord: Coordinate, e: React.MouseEvent | React.TouchEvent) => void,
    onMouseEnter: (coord: Coordinate) => void,
    onContextMenu: (coord: Coordinate, e: React.MouseEvent) => void,
    onDrop: (coord: Coordinate, e: React.DragEvent) => void,
    customCollection?: Record<string, any>,
    coord: Coordinate
}) => {
    const grid = gridMap[gridType];
    const lookupKey = piece ? `${piece.type}_${piece.color}` : '';
    const customPiece = piece ? (
        customCollection?.[lookupKey] ||
        customCollection?.[piece.type] ||
        Object.values(customCollection || {}).find((p: any) => p.name === piece.type && p.color === piece.color)
    ) : undefined;
    const pixels = customPiece?.pixels;
    const image = customPiece?.image;

    const clipPath = gridType === 'hex'
        ? 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
        : 'none';

    return (
        <div
            style={{
                width: squareSize,
                height: squareSize,
                clipPath: clipPath
            }}
            className={`
                relative flex items-center justify-center group transition-colors duration-150
                ${isActive
                    ? (isBlackSquare ? 'bg-[#779954]' : 'bg-[#e9edcc]')
                    : 'bg-gray-300/10 border border-gray-400/20 border-dashed hover:border-accent hover:bg-accent/10 cursor-pointer'}
                ${editMode === 'pieces' && isActive ? 'cursor-cell' : ''}
            `}
            onContextMenu={(e) => onContextMenu(coord, e)}
            onMouseDown={(e) => onMouseDown(coord, e)}
            onTouchStart={(e) => onMouseDown(coord, e)}
            onMouseEnter={() => onMouseEnter(coord)}
            onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e) => onDrop(coord, e)}
        >
            {/* Piece rendering */}
            {isActive && piece && (
                <div className="relative z-10 w-full h-full flex items-center justify-center pointer-events-none transform transition-transform group-hover:scale-105">
                    <PieceRenderer
                        type={customPiece ? customPiece.name : piece.type}
                        color={piece.color}
                        size={squareSize * getPieceScale(piece.type)}
                        boardStyle={boardStyle}
                        className="drop-shadow-lg"
                        pixels={pixels}
                        image={image}
                    />
                </div>
            )}

            {/* Edit Mode HUD overlay */}
            {editMode === 'shape' && (
                <>
                    {!isActive && (
                        <Plus className="text-accent opacity-0 group-hover:opacity-100 transition-all transform scale-50 group-hover:scale-100" size={24} />
                    )}
                    {isActive && !piece && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-red-500/10 transition-all rounded-sm">
                            <X className="text-red-500 drop-shadow-md" size={32} strokeWidth={3} />
                        </div>
                    )}
                </>
            )}

            {editMode === 'pieces' && isActive && !piece && (
                <div className="opacity-0 group-hover:opacity-60 transition-opacity pointer-events-none">
                    <PieceRenderer
                        type={selectedPiece.type}
                        color={selectedPiece.color}
                        size={squareSize * getPieceScale(selectedPiece.type)}
                        boardStyle={boardStyle}
                    />
                </div>
            )}
        </div>
    );
});

export default function BoardEditor({ editMode, selectedPiece, boardStyle, generateBoardData, customCollection, initialData, onDeselect }: BoardEditorProps) {
    const t = useTranslations('Editor.Board');
    const [rows, setRows] = useState<number>(() => initialData?.rows || Number(localStorage.getItem('rows') || 8));
    const [cols, setCols] = useState<number>(() => initialData?.cols || Number(localStorage.getItem('cols') || 8));
    const [gridType, setGridType] = useState<'square' | 'hex'>(() => initialData?.gridType || (localStorage.getItem('gridType') as 'square' | 'hex') || 'square');
    const grid = gridMap[gridType];

    const [placedPieces, setPlacedPieces] = useState<Record<string, { type: string; color: string, size: number, movement?: 'run' | 'jump' }>>(() => {
        if (initialData?.placedPieces) return initialData.placedPieces as any;
        try {
            return JSON.parse(localStorage.getItem('placedPieces') || '{}');
        } catch {
            return {};
        }
    });

    const [activeSquares, setActiveSquares] = useState<Set<string>>(() => {
        if (initialData?.activeSquares) return new Set(initialData.activeSquares);
        try {
            const stored = localStorage.getItem('activeSquares');
            if (stored) return new Set(stored.startsWith('[') ? JSON.parse(stored) : []);
        } catch { }
        return new Set();
    });

    // --- History for Undo/Redo ---
    const [history, setHistory] = useState<{
        placedPieces: Record<string, { type: string; color: string, size: number, movement?: 'run' | 'jump' }>;
        activeSquares: Set<string>;
        rows: number;
        cols: number;
        gridType: 'square' | 'hex';
    }[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [symmetry, setSymmetry] = useState<'none' | 'horizontal' | 'vertical' | 'rotational'>('none');

    const saveToHistory = (
        pPieces: Record<string, { type: string; color: string, size: number, movement?: 'run' | 'jump' }>,
        aSquares: Set<string>,
        r: number,
        c: number,
        gt: 'square' | 'hex'
    ) => {
        const newState = {
            placedPieces: JSON.parse(JSON.stringify(pPieces)),
            activeSquares: new Set(aSquares),
            rows: r,
            cols: c,
            gridType: gt
        };

        setHistory(prev => {
            const next = prev.slice(0, historyIndex + 1);
            next.push(newState);
            if (next.length > 50) next.shift(); // Max 50 undos
            return next;
        });
        setHistoryIndex(prev => {
            const next = prev + 1;
            return next > 49 ? 49 : next;
        });
    };

    const undo = () => {
        if (historyIndex <= 0) return;
        const prevState = history[historyIndex - 1];
        setPlacedPieces(prevState.placedPieces);
        setActiveSquares(new Set(prevState.activeSquares));
        setRows(prevState.rows);
        setCols(prevState.cols);
        setGridType(prevState.gridType);
        setHistoryIndex(prev => prev - 1);
    };

    const redo = () => {
        if (historyIndex >= history.length - 1) return;
        const nextState = history[historyIndex + 1];
        setPlacedPieces(nextState.placedPieces);
        setActiveSquares(new Set(nextState.activeSquares));
        setRows(nextState.rows);
        setCols(nextState.cols);
        setGridType(nextState.gridType);
        setHistoryIndex(prev => prev + 1);
    };

    // Initial history
    useEffect(() => {
        if (history.length === 0) {
            saveToHistory(placedPieces, activeSquares, rows, cols, gridType);
        }
    }, []);

    const [zoom, setZoom] = useState(1);
    const [isPainting, setIsPainting] = useState(false);
    const [isRightClickPainting, setIsRightClickPainting] = useState(false);
    const [paintValue, setPaintValue] = useState<boolean | null>(null); // For shape mode: true=activate, false=deactivate
    const paintValueRef = useRef<boolean | null>(null);
    const isPaintingRef = useRef(false);
    const isRightClickPaintingRef = useRef(false);

    useEffect(() => { paintValueRef.current = paintValue; }, [paintValue]);
    useEffect(() => { isPaintingRef.current = isPainting; }, [isPainting]);
    useEffect(() => { isRightClickPaintingRef.current = isRightClickPainting; }, [isRightClickPainting]);

    const containerRef = useRef<HTMLDivElement>(null);
    const hasInitializedRef = useRef(false);


    // Refs for stable state access in event listeners
    const rowsRef = useRef(rows);
    const colsRef = useRef(cols);
    const gridTypeRef = useRef(gridType);
    const activeSquaresRef = useRef(activeSquares);
    const squareSizeRef = useRef(70);
    const placedPiecesRef = useRef(placedPieces);

    useEffect(() => { rowsRef.current = rows; }, [rows]);
    useEffect(() => { colsRef.current = cols; }, [cols]);
    useEffect(() => { gridTypeRef.current = gridType; }, [gridType]);
    useEffect(() => { activeSquaresRef.current = activeSquares; }, [activeSquares]);
    // squareSizeRef updated via currentSquareSize effect below
    useEffect(() => { placedPiecesRef.current = placedPieces; }, [placedPieces]);

    // Direct grid size editing state
    const [colsInput, setColsInput] = useState(String(cols));
    const [rowsInput, setRowsInput] = useState(String(rows));
    const [hexRadiusInput, setHexRadiusInput] = useState(String(Math.floor(rows / 2)));
    useEffect(() => { setColsInput(String(cols)); }, [cols]);
    useEffect(() => { setRowsInput(String(rows)); }, [rows]);
    useEffect(() => { setHexRadiusInput(String(Math.floor(rows / 2))); }, [rows]);

    const applySquareResize = (newCols: number, newRows: number) => {
        newCols = Math.max(1, Math.min(20, newCols));
        newRows = Math.max(1, Math.min(20, newRows));
        const newActive = new Set<string>();
        activeSquaresRef.current.forEach(key => {
            const coord = grid.stringToCoord(key);
            if ((coord.x ?? 0) < newCols && (coord.y ?? 0) < newRows) newActive.add(key);
        });
        for (let x = 0; x < newCols; x++) {
            for (let y = 0; y < newRows; y++) {
                if (x >= colsRef.current || y >= rowsRef.current) {
                    newActive.add(grid.coordToString({ x, y }));
                }
            }
        }
        const newPieces: Record<string, any> = {};
        Object.entries(placedPiecesRef.current).forEach(([key, val]) => {
            const coord = grid.stringToCoord(key);
            if ((coord.x ?? 0) < newCols && (coord.y ?? 0) < newRows) newPieces[key] = val;
        });
        setActiveSquares(newActive);
        setPlacedPieces(newPieces);
        setCols(newCols);
        setRows(newRows);
        saveToHistory(newPieces, newActive, newRows, newCols, gridType);
    };

    useEffect(() => {
        if (activeSquares.size === 0) {
            const initialTiles = grid.generateInitialGrid(rows, cols);
            const newSet = new Set<string>(initialTiles.map(t => grid.coordToString(t)));
            setActiveSquares(newSet);
        }
    }, [rows, cols, activeSquares.size, grid]);

    useEffect(() => {
        if (!hasInitializedRef.current) {
            hasInitializedRef.current = true;
            return;
        }

        const timer = setTimeout(() => {
            localStorage.setItem('rows', rows.toString());
            localStorage.setItem('cols', cols.toString());
            localStorage.setItem('gridType', gridType);
            localStorage.setItem('placedPieces', JSON.stringify(placedPieces));
            localStorage.setItem('activeSquares', JSON.stringify(Array.from(activeSquares)));

            generateBoardData(rows, cols, activeSquares, placedPieces, gridType);
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [rows, cols, gridType, placedPieces, activeSquares, generateBoardData]);

    const [windowSize, setWindowSize] = useState({ w: 1000, h: 800 });
    useEffect(() => {
        if (typeof window === 'undefined') return;
        setWindowSize({ w: window.innerWidth, h: window.innerHeight });
        const handleResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const calculateSquareSize = useCallback((r: number, c: number, z: number, winW: number, winH: number) => {
        const isLarge = winW >= 1024;
        const availableWidth = isLarge ? winW - 420 : winW - 48;
        const availableHeight = isLarge ? winH - 180 : winH * 0.45;
        const widthBasedSize = Math.floor(availableWidth / (c + 1));
        const heightBasedSize = Math.floor(availableHeight / (r + 1));
        return Math.max(28, Math.min(widthBasedSize, heightBasedSize, 70)) * z;
    }, []);

    const currentSquareSize = calculateSquareSize(rows, cols, zoom, windowSize.w, windowSize.h);
    const SQUARE_SIZE = currentSquareSize;

    useEffect(() => {
        squareSizeRef.current = currentSquareSize;
    }, [currentSquareSize]);

    // Keybinds for Zoom & Undo/Redo
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                undo();
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                redo();
            } else if (e.key === '+' || e.key === '=') {
                setZoom(prev => Math.min(2.5, prev + 0.1));
            } else if (e.key === '-' || e.key === '_') {
                setZoom(prev => Math.max(0.3, prev - 0.1));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [history, historyIndex]); // Depend on history for undo/redo functions to be fresh



    // Resizing logic
    const resizingRef = useRef<'top' | 'bottom' | 'left' | 'right' | null>(null);
    const startPosRef = useRef<{ x: number, y: number } | null>(null);
    const startDimRef = useRef<{ rows: number, cols: number } | null>(null);

    // Unified pointer handling for both mouse and touch
    const getPointerPosition = (e: MouseEvent | TouchEvent) => {
        if ('touches' in e && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
    };

    const handlePointerDown = (type: 'top' | 'bottom' | 'left' | 'right', e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        resizingRef.current = type;
        const pos = getPointerPosition(e.nativeEvent as any);
        startPosRef.current = pos;
        startDimRef.current = { rows, cols };

        document.addEventListener('mousemove', handlePointerMove);
        document.addEventListener('mouseup', handlePointerUp);
        document.addEventListener('touchmove', handlePointerMove);
        document.addEventListener('touchend', handlePointerUp);
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
        if (!resizingRef.current || !startPosRef.current || !startDimRef.current) return;

        const pos = getPointerPosition(e);
        const dx = pos.x - startPosRef.current.x;
        const dy = pos.y - startPosRef.current.y;

        // Hex resize: side handles change width (cols), top/bottom change height (rows)
        if (gridTypeRef.current === 'hex') {
            const isHorizontal = resizingRef.current === 'right' || resizingRef.current === 'left';
            const dragDelta = isHorizontal
                ? (resizingRef.current === 'right' ? dx : -dx)
                : (resizingRef.current === 'bottom' ? dy : -dy);

            const startDim = isHorizontal ? startDimRef.current.cols : startDimRef.current.rows;
            const currentDim = isHorizontal ? colsRef.current : rowsRef.current;
            const dimDelta = Math.floor(dragDelta / squareSizeRef.current) * 2; // *2 because radius -> diameter
            const newDim = Math.max(2, Math.min(20, startDim + dimDelta));

            if (newDim !== currentDim) {
                const newRows = isHorizontal ? rowsRef.current : newDim;
                const newCols = isHorizontal ? newDim : colsRef.current;

                // Regenerate hex grid with new dimensions
                const hexGrid = gridMap['hex'];
                const newTiles = hexGrid.generateInitialGrid(newRows, newCols);
                const newActive = new Set(newTiles.map(t => hexGrid.coordToString(t)));

                // Preserve pieces that still fit in the new grid
                setPlacedPieces(prev => {
                    const next: any = {};
                    Object.entries(prev).forEach(([key, val]) => {
                        if (newActive.has(key)) next[key] = val;
                    });
                    return next;
                });

                setActiveSquares(newActive);
                if (isHorizontal) {
                    setCols(newCols);
                } else {
                    setRows(newRows);
                }
            }
            return;
        }

        // Square grid resize logic
        if (resizingRef.current === 'right') {
            const addedCols = Math.floor(dx / squareSizeRef.current);
            const newCols = Math.max(1, Math.min(20, startDimRef.current.cols + addedCols));
            if (newCols !== colsRef.current) {
                if (newCols > colsRef.current) {
                    setActiveSquares(prev => {
                        const next = new Set(prev);
                        for (let x = colsRef.current; x < newCols; x++) {
                            for (let y = 0; y < rowsRef.current; y++) next.add(grid.coordToString({ x, y }));
                        }
                        return next;
                    });
                }
                setCols(newCols);
            }
        } else if (resizingRef.current === 'bottom') {
            const addedRows = Math.floor(dy / squareSizeRef.current);
            const newRows = Math.max(1, Math.min(20, startDimRef.current.rows + addedRows));
            if (newRows !== rowsRef.current) {
                if (newRows > rowsRef.current) {
                    setActiveSquares(prev => {
                        const next = new Set(prev);
                        for (let y = rowsRef.current; y < newRows; y++) {
                            for (let x = 0; x < colsRef.current; x++) next.add(grid.coordToString({ x, y }));
                        }
                        return next;
                    });
                }
                setRows(newRows);
            }
        } else if (resizingRef.current === 'left') {
            // Updated: 2x multiplier for centered layout
            const addedCols = Math.floor(-dx * 2 / squareSizeRef.current);
            const newCols = Math.max(1, Math.min(20, startDimRef.current.cols + addedCols));

            if (newCols !== colsRef.current) {
                const diff = newCols - colsRef.current;
                if (diff === 0) return;

                // Shift pieces
                setPlacedPieces(prev => {
                    const next: any = {};
                    Object.entries(prev).forEach(([key, val]) => {
                        const coord = grid.stringToCoord(key);
                        const newX = (coord.x || 0) + diff;
                        if (newX >= 0 && newX < newCols) next[grid.coordToString({ x: newX, y: coord.y || 0 })] = val;
                    });
                    return next;
                });

                // Shift active squares
                setActiveSquares(prev => {
                    const next = new Set<string>();
                    prev.forEach(key => {
                        const coord = grid.stringToCoord(key);
                        const newX = (coord.x || 0) + diff;
                        if (newX >= 0 && newX < newCols) next.add(grid.coordToString({ x: newX, y: coord.y || 0 }));
                    });
                    // Fill new column if expanding
                    if (diff > 0) {
                        for (let x = 0; x < diff; x++) {
                            for (let y = 0; y < rowsRef.current; y++) next.add(grid.coordToString({ x, y }));
                        }
                    }
                    return next;
                });
                setCols(newCols);
            }
        } else if (resizingRef.current === 'top') {
            // Updated: 2x multiplier for centered layout
            const addedRows = Math.floor(-dy * 2 / squareSizeRef.current);
            const newRows = Math.max(1, Math.min(20, startDimRef.current.rows + addedRows));

            if (newRows !== rowsRef.current) {
                const diff = newRows - rowsRef.current;
                if (diff === 0) return;

                setPlacedPieces(prev => {
                    const next: any = {};
                    Object.entries(prev).forEach(([key, val]) => {
                        const coord = grid.stringToCoord(key);
                        const newY = (coord.y || 0) + diff;
                        if (newY >= 0 && newY < newRows) next[grid.coordToString({ x: coord.x || 0, y: newY })] = val;
                    });
                    return next;
                });

                setActiveSquares(prev => {
                    const next = new Set<string>();
                    prev.forEach(key => {
                        const coord = grid.stringToCoord(key);
                        const newY = (coord.y || 0) + diff;
                        if (newY >= 0 && newY < newRows) next.add(grid.coordToString({ x: coord.x || 0, y: newY }));
                    });
                    if (diff > 0) {
                        for (let y = 0; y < diff; y++) {
                            for (let x = 0; x < colsRef.current; x++) next.add(grid.coordToString({ x, y }));
                        }
                    }
                    return next;
                });
                setRows(newRows);
            }
        }
    };

    const handlePointerUp = () => {
        if (resizingRef.current) {
            saveToHistory(placedPiecesRef.current, activeSquaresRef.current, rowsRef.current, colsRef.current, gridType);
        }
        resizingRef.current = null;
        startPosRef.current = null;
        startDimRef.current = null;
        document.removeEventListener('mousemove', handlePointerMove);
        document.removeEventListener('mouseup', handlePointerUp);
        document.removeEventListener('touchmove', handlePointerMove);
        document.removeEventListener('touchend', handlePointerUp);
    };

    const getSymmetricSquares = useCallback((coord: Coordinate) => {
        return symmetry !== 'none'
            ? grid.getSymmetryPoints(coord, symmetry, { rows, cols })
            : [];
    }, [grid, symmetry, rows, cols]);

    const handleSquareAction = useCallback((coord: Coordinate, isInitial: boolean) => {
        const key = grid.coordToString(coord);
        const symSquares = getSymmetricSquares(coord);

        if (editMode === 'shape') {
            if (isInitial) {
                const newValue = !activeSquaresRef.current.has(key);
                setPaintValue(newValue);
                setActiveSquares(prev => {
                    const next = new Set(prev);
                    if (newValue) {
                        next.add(key);
                        symSquares.forEach(s => next.add(grid.coordToString(s)));
                    } else {
                        next.delete(key);
                        symSquares.forEach(s => next.delete(grid.coordToString(s)));
                    }
                    return next;
                });
                if (!newValue) {
                    setPlacedPieces(prev => {
                        const next = { ...prev };
                        delete next[key];
                        symSquares.forEach(s => delete next[grid.coordToString(s)]);
                        return next;
                    });
                }
            } else if (paintValueRef.current !== null) {
                const pv = paintValueRef.current;
                setActiveSquares(prev => {
                    const next = new Set(prev);
                    if (pv) {
                        next.add(key);
                        symSquares.forEach(s => next.add(grid.coordToString(s)));
                    } else {
                        next.delete(key);
                        symSquares.forEach(s => next.delete(grid.coordToString(s)));
                    }
                    return next;
                });
                if (!pv) {
                    setPlacedPieces(prev => {
                        const next = { ...prev };
                        delete next[key];
                        symSquares.forEach(s => delete next[grid.coordToString(s)]);
                        return next;
                    });
                }
            }
        } else if (editMode === 'pieces') {
            if (activeSquaresRef.current.has(key)) {
                const pieceToPlace = {
                    type: String(selectedPiece.type),
                    color: String(selectedPiece.color),
                    size: squareSizeRef.current * 0.8, // use ref
                    movement: selectedPiece.movement
                };

                setPlacedPieces((prev: any) => {
                    const next = { ...prev, [key]: pieceToPlace };
                    symSquares.forEach(s => {
                        const symKey = grid.coordToString(s);
                        if (activeSquaresRef.current.has(symKey)) {
                            next[symKey] = { ...pieceToPlace };
                        }
                    });
                    return next;
                });
            }
        }
    }, [editMode, selectedPiece.type, selectedPiece.color, symmetry, grid, getSymmetricSquares]);

    const handleMouseDown = useCallback((coord: Coordinate, e: React.MouseEvent | React.TouchEvent) => {
        // Allow left click (button 0) or undefined button (touch)
        if ('button' in e && e.button !== 0) return;

        // Prevent scrolling on touch
        if (e.cancelable && e.type === 'touchstart') e.preventDefault();

        setIsPainting(true);
        handleSquareAction(coord, true);
    }, [handleSquareAction]);

    const handleMouseEnter = useCallback((coord: Coordinate) => {
        // Mouse enter painting
        if (isPaintingRef.current) {
            handleSquareAction(coord, false);
        }
        if (isRightClickPaintingRef.current && editMode === 'pieces') {
            const key = grid.coordToString(coord);
            setPlacedPieces(prev => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    }, [handleSquareAction, editMode, grid]);

    // Touch Move Handling for "Painting" while dragging finger
    useEffect(() => {
        const handleTouchMove = (e: TouchEvent) => {
            if (!isPaintingRef.current) return;
            e.preventDefault();

            const touch = e.touches[0];
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            if (!element) return;

            // Walk up to find data-coord on the square wrapper
            let el: Element | null = element;
            while (el) {
                const coord = el.getAttribute('data-coord');
                if (coord) {
                    const coordObj = grid.stringToCoord(coord);
                    if (coordObj) handleSquareAction(coordObj, false);
                    break;
                }
                el = el.parentElement;
            }
        };
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        return () => document.removeEventListener('touchmove', handleTouchMove);
    }, [grid, handleSquareAction]);

    // Handle pieces dropped via touch drag from the BottomPiecePanel
    useEffect(() => {
        const handleTouchPieceDrop = (e: Event) => {
            const { coord, piece } = (e as CustomEvent<{
                coord: string;
                piece: { type: string; color: string; movement?: 'run' | 'jump' };
            }>).detail;
            if (!piece?.type || !piece?.color) return;

            const coordObj = grid.stringToCoord(coord);
            if (!coordObj) return;

            const key = grid.coordToString(coordObj);
            if (!activeSquaresRef.current.has(key)) return;

            const pieceToPlace = {
                type: piece.type,
                color: piece.color,
                size: squareSizeRef.current * 0.8,
                movement: piece.movement,
            };

            setPlacedPieces(prev => {
                const next = { ...prev, [key]: pieceToPlace };
                const symSquares = getSymmetricSquares(coordObj);
                symSquares.forEach((s: Coordinate) => {
                    const symKey = grid.coordToString(s);
                    if (activeSquaresRef.current.has(symKey)) {
                        next[symKey] = { ...pieceToPlace };
                    }
                });
                return next;
            });
        };

        document.addEventListener('touch-piece-drop', handleTouchPieceDrop);
        return () => document.removeEventListener('touch-piece-drop', handleTouchPieceDrop);
    }, [grid, getSymmetricSquares]);

    const handleDrop = useCallback((coord: Coordinate, e: React.DragEvent) => {
        e.preventDefault();
        try {
            const data = JSON.parse(e.dataTransfer.getData('piece'));
            if (data && data.type && data.color) {
                const key = grid.coordToString(coord);
                if (activeSquaresRef.current.has(key)) {
                    const pieceToPlace = {
                        type: data.type,
                        color: data.color,
                        size: squareSizeRef.current * 0.8,
                        movement: data.movement
                    };

                    setPlacedPieces(prev => {
                        const next = { ...prev, [key]: pieceToPlace };
                        const symSquares = getSymmetricSquares(coord);

                        symSquares.forEach((s: Coordinate) => {
                            const symKey = grid.coordToString(s);
                            if (activeSquaresRef.current.has(symKey)) {
                                next[symKey] = { ...pieceToPlace };
                            }
                        });
                        return next;
                    });
                }
            }
        } catch (err) {
            console.error('Drop error:', err);
        }
    }, [grid, symmetry, getSymmetricSquares]);

    useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (isPainting || isRightClickPainting) {
                saveToHistory(placedPiecesRef.current, activeSquaresRef.current, rowsRef.current, colsRef.current, gridType);
            }
            setIsPainting(false);
            setIsRightClickPainting(false);
            setPaintValue(null);
        };
        window.addEventListener('mouseup', handleGlobalMouseUp);
        window.addEventListener('touchend', handleGlobalMouseUp);
        return () => {
            window.removeEventListener('mouseup', handleGlobalMouseUp);
            window.removeEventListener('touchend', handleGlobalMouseUp);
        };
    }, [isPainting, isRightClickPainting]);

    const handleSquareClick = (coord: Coordinate, e: React.MouseEvent) => {
        // We now handle this via mousedown/mouseenter for drag support
    };

    const removePiece = useCallback((coord: Coordinate, e: React.MouseEvent) => {
        e.preventDefault();
        const key = grid.coordToString(coord);
        const symSquares = getSymmetricSquares(coord);

        // Start right-click painting mode for pieces
        if (editMode === 'pieces') {
            setIsRightClickPainting(true);
            setPlacedPieces(prev => {
                const next = { ...prev };
                delete next[key];
                symSquares.forEach(s => delete next[grid.coordToString(s)]);
                return next;
            });
        } else if (editMode === 'shape' && activeSquaresRef.current.has(key)) {
            setActiveSquares(prev => {
                const next = new Set(prev);
                next.delete(key);
                symSquares.forEach(s => next.delete(grid.coordToString(s)));
                return next;
            });
            setPlacedPieces(prev => {
                const next = { ...prev };
                delete next[key];
                symSquares.forEach(s => delete next[grid.coordToString(s)]);
                return next;
            });
        }
    }, [editMode, symmetry, grid, getSymmetricSquares]);

    const clearBoard = () => {
        setPlacedPieces({});
        saveToHistory({}, activeSquares, rows, cols, gridType);
    };

    const [showHexGuide, setShowHexGuide] = useState(false);

    const HexGuide = () => (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed right-6 top-1/2 -translate-y-1/2 w-80 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl p-6 rounded-3xl border border-stone-200 dark:border-white/10 shadow-2xl z-100 max-h-[80vh] overflow-y-auto"
        >
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-stone-900 dark:text-white uppercase tracking-tight">{t('HexGuide.title')}</h3>
                <button onClick={() => setShowHexGuide(false)} className="p-2 hover:bg-stone-100 dark:hover:bg-white/10 rounded-full transition-colors">
                    <X size={18} />
                </button>
            </div>

            <div className="space-y-6">
                <section>
                    <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest mb-3">{t('HexGuide.generalTitle')}</h4>
                    <p className="text-sm text-stone-600 dark:text-white/60 leading-relaxed">
                        {t('HexGuide.generalDesc')}
                    </p>
                </section>

                <div className="space-y-4">
                    {[
                        { piece: t('HexGuide.pawn'), desc: t('HexGuide.pawnDesc') },
                        { piece: t('HexGuide.rook'), desc: t('HexGuide.rookDesc') },
                        { piece: t('HexGuide.bishop'), desc: t('HexGuide.bishopDesc') },
                        { piece: t('HexGuide.knight'), desc: t('HexGuide.knightDesc') },
                        { piece: t('HexGuide.king'), desc: t('HexGuide.kingDesc') },
                        { piece: t('HexGuide.queen'), desc: t('HexGuide.queenDesc') }
                    ].map((item: any) => (
                        <div key={item.piece} className="bg-stone-100 dark:bg-white/5 p-3 rounded-xl border border-stone-200 dark:border-white/5">
                            <div className="text-sm font-bold text-stone-900 dark:text-white mb-1">{item.piece}</div>
                            <div className="text-xs text-stone-500 dark:text-white/40 leading-relaxed">{item.desc}</div>
                        </div>
                    ))}
                </div>

                <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium leading-relaxed uppercase tracking-wider">
                        {t('HexGuide.note')}
                    </p>
                </div>
            </div>
        </motion.div>
    );

    return (
        <div ref={containerRef} className="flex flex-col items-center animate-in fade-in zoom-in duration-500 w-full">
            {/* Controls Overlay — two rows */}
            <div className="relative z-50 flex flex-col items-center gap-2 mb-8 px-4 py-3 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md rounded-2xl border border-stone-200 dark:border-white/10 shadow-xl max-w-[95vw]">

                {/* ── Row 1: Board shape ── */}
                <div className="flex items-center gap-2">
                    {/* Grid Type */}
                    <div className="flex bg-stone-100 dark:bg-white/5 rounded-xl p-1 border border-stone-200 dark:border-white/5">
                        {[
                            { id: 'square', label: t('gridSquare') },
                            { id: 'hex', label: t('gridHex') }
                        ].map(g => (
                            <button
                                key={g.id}
                                onClick={() => {
                                    if (confirm(t('confirmGridSwitch'))) {
                                        setGridType(g.id as any);
                                        const newGrid = gridMap[g.id];
                                        const initialTiles = newGrid.generateInitialGrid(rows, cols);
                                        const newActive = new Set(initialTiles.map(t => newGrid.coordToString(t)));
                                        setActiveSquares(newActive);
                                        setPlacedPieces({});
                                        saveToHistory({}, newActive, rows, cols, g.id as any);
                                    }
                                }}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${gridType === g.id ? 'bg-white dark:bg-stone-800 text-accent shadow-sm' : 'text-stone-500 dark:text-white/40 hover:text-stone-900 dark:hover:text-white'}`}
                            >
                                {g.label}
                            </button>
                        ))}
                    </div>

                    <div className="w-px h-6 bg-stone-900/10 dark:bg-white/10" />

                    {/* Grid Size — click the number to edit, Enter/blur to confirm */}
                    <div className="flex items-center gap-1" title={t('gridSize')}>
                        {gridType === 'square' ? (
                            <>
                                <input
                                    type="number"
                                    value={colsInput}
                                    onChange={e => setColsInput(e.target.value)}
                                    onBlur={() => {
                                        const v = Math.max(1, Math.min(20, parseInt(colsInput) || cols));
                                        setColsInput(String(v));
                                        if (v !== cols) applySquareResize(v, rows);
                                    }}
                                    onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                                    className="w-9 text-center text-sm font-bold bg-transparent border-b-2 border-stone-300 dark:border-white/20 hover:border-accent focus:border-accent py-0.5 text-stone-900 dark:text-white outline-none cursor-text transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    min={1} max={20}
                                />
                                <span className="text-stone-400 dark:text-white/30 text-sm font-bold select-none">×</span>
                                <input
                                    type="number"
                                    value={rowsInput}
                                    onChange={e => setRowsInput(e.target.value)}
                                    onBlur={() => {
                                        const v = Math.max(1, Math.min(20, parseInt(rowsInput) || rows));
                                        setRowsInput(String(v));
                                        if (v !== rows) applySquareResize(cols, v);
                                    }}
                                    onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                                    className="w-9 text-center text-sm font-bold bg-transparent border-b-2 border-stone-300 dark:border-white/20 hover:border-accent focus:border-accent py-0.5 text-stone-900 dark:text-white outline-none cursor-text transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    min={1} max={20}
                                />
                            </>
                        ) : (
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-stone-500 dark:text-white/40 uppercase font-bold">{t('radius')}</span>
                                <input
                                    type="number"
                                    value={hexRadiusInput}
                                    onChange={e => setHexRadiusInput(e.target.value)}
                                    onBlur={() => {
                                        const v = Math.max(1, Math.min(10, parseInt(hexRadiusInput) || Math.floor(rows / 2)));
                                        setHexRadiusInput(String(v));
                                        const newDim = v * 2 + 1;
                                        if (newDim !== rows || newDim !== cols) {
                                            const hexGrid = gridMap['hex'];
                                            const newTiles = hexGrid.generateInitialGrid(newDim, newDim);
                                            const newActive = new Set(newTiles.map(t => hexGrid.coordToString(t)));
                                            setPlacedPieces(prev => {
                                                const next: Record<string, any> = {};
                                                Object.entries(prev).forEach(([key, val]) => {
                                                    if (newActive.has(key)) next[key] = val;
                                                });
                                                return next;
                                            });
                                            setActiveSquares(newActive);
                                            setCols(newDim);
                                            setRows(newDim);
                                            saveToHistory({}, newActive, newDim, newDim, 'hex');
                                        }
                                    }}
                                    onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                                    className="w-9 text-center text-sm font-bold bg-transparent border-b-2 border-stone-300 dark:border-white/20 hover:border-accent focus:border-accent py-0.5 text-stone-900 dark:text-white outline-none cursor-text transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    min={1} max={10}
                                />
                            </div>
                        )}
                    </div>

                    <div className="w-px h-6 bg-stone-900/10 dark:bg-white/10" />

                    {/* Symmetry */}
                    <div className="flex bg-stone-100 dark:bg-white/5 rounded-xl p-1 border border-stone-200 dark:border-white/5">
                        {[
                            { id: 'none', label: t('symNone') },
                            { id: 'horizontal', label: t('symH') },
                            { id: 'vertical', label: t('symV') },
                            { id: 'rotational', label: t('symR') }
                        ].map(s => (
                            <button
                                key={s.id}
                                onClick={() => setSymmetry(s.id as any)}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${symmetry === s.id ? 'bg-white dark:bg-stone-800 text-accent shadow-sm' : 'text-stone-500 dark:text-white/40 hover:text-stone-900 dark:hover:text-white'}`}
                                title={`${s.label} Symmetry`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Row 2: View controls ── */}
                <div className="flex items-center gap-2">
                    {/* Zoom */}
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
                            className="p-1.5 rounded-lg bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 text-stone-600 dark:text-white/60 hover:text-stone-900 dark:hover:text-white transition-all border border-stone-200 dark:border-white/5 active:scale-95"
                            title="Zoom Out"
                        >
                            <Minus size={13} />
                        </button>
                        <span className="text-xs font-bold text-stone-900 dark:text-white tabular-nums min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span>
                        <button
                            onClick={() => setZoom(prev => Math.min(2, prev + 0.1))}
                            className="p-1.5 rounded-lg bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 text-stone-600 dark:text-white/60 hover:text-stone-900 dark:hover:text-white transition-all border border-stone-200 dark:border-white/5 active:scale-95"
                            title="Zoom In"
                        >
                            <Plus size={13} />
                        </button>
                    </div>

                    <div className="w-px h-4 bg-stone-900/10 dark:bg-white/10" />

                    {/* Clear + Hex Guide */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={clearBoard}
                            className="px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold hover:bg-red-500 hover:text-white transition-all active:scale-95"
                        >
                            {t('clear')}
                        </button>
                        {gridType === 'hex' && (
                            <button
                                onClick={() => setShowHexGuide(!showHexGuide)}
                                className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all font-bold text-[10px] ${showHexGuide
                                    ? 'bg-amber-500 text-bg border-amber-500 shadow-lg shadow-amber-500/20'
                                    : 'bg-white/50 dark:bg-white/5 border-stone-200 dark:border-white/10 text-stone-600 dark:text-white/60 hover:text-amber-500'
                                    }`}
                            >
                                <Info size={13} />
                                {t('guide')}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Canvas Wrapper */}
            <div
                className="relative bg-transparent shadow-2xl rounded-sm transition-all duration-200 ease-out select-none"
                style={{
                    width: gridType === 'square' ? cols * SQUARE_SIZE : (Math.max(rows, cols) * 1.5 * SQUARE_SIZE),
                    height: gridType === 'square' ? rows * SQUARE_SIZE : (Math.max(rows, cols) * 1.5 * SQUARE_SIZE),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                onContextMenu={(e) => e.preventDefault()}
            >
                {/* deselect area */}
                <div
                    className="absolute inset-[-2000px] z-0"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            onDeselect?.();
                        }
                    }}
                />

                <div className="relative w-full h-full z-10">
                    {grid.generateInitialGrid(rows, cols).map((coord) => {
                        const key = grid.coordToString(coord);
                        const pos = grid.getPixelPosition(coord, SQUARE_SIZE);
                        const isBlackSquare = gridType === 'square'
                            ? ((coord.x || 0) + (coord.y || 0)) % 2 === 1
                            : ((coord.q || 0) + (coord.r || 0)) % 2 === 0; // Checkerboard doesn't exist for hex, but we can fake highlight or use axial parity

                        return (
                            <div
                                key={key}
                                data-coord={key}
                                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                                style={{
                                    left: pos.x + (gridType === 'hex' ? (Math.max(rows, cols) * 0.75 * SQUARE_SIZE) : 0),
                                    top: pos.y + (gridType === 'hex' ? (Math.max(rows, cols) * 0.75 * SQUARE_SIZE) : 0),
                                }}
                            >
                                <EditorSquare
                                    coord={coord}
                                    gridType={gridType}
                                    squareSize={SQUARE_SIZE}
                                    isActive={activeSquares.has(key)}
                                    isBlackSquare={isBlackSquare}
                                    piece={placedPieces[key]}
                                    editMode={editMode}
                                    selectedPiece={selectedPiece}
                                    boardStyle={boardStyle}
                                    onMouseDown={handleMouseDown}
                                    onMouseEnter={handleMouseEnter}
                                    onContextMenu={removePiece}
                                    onDrop={handleDrop}
                                    customCollection={customCollection}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* --- Resize Handles --- */}
                {/* RIGHT handle */}
                <div
                    className="absolute top-0 -right-10 w-10 h-full cursor-e-resize flex items-center justify-center group z-50"
                    onMouseDown={(e) => handlePointerDown('right', e)}
                    onTouchStart={(e) => handlePointerDown('right', e)}
                    style={{ touchAction: 'none' }}
                >
                    <div className="w-8 h-16 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 group-hover:text-blue-500 group-hover:scale-110 transition-all">
                        <GripVertical size={20} />
                    </div>
                </div>

                {/* LEFT handle */}
                <div
                    className="absolute top-0 -left-10 w-10 h-full cursor-w-resize flex items-center justify-center group z-50"
                    onMouseDown={(e) => handlePointerDown('left', e)}
                    onTouchStart={(e) => handlePointerDown('left', e)}
                    style={{ touchAction: 'none' }}
                >
                    <div className="w-8 h-16 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 group-hover:text-blue-500 group-hover:scale-110 transition-all">
                        <GripVertical size={20} />
                    </div>
                </div>

                {/* BOTTOM handle */}
                <div
                    className="absolute -bottom-10 left-0 w-full h-10 cursor-s-resize flex items-center justify-center group z-50"
                    onMouseDown={(e) => handlePointerDown('bottom', e)}
                    onTouchStart={(e) => handlePointerDown('bottom', e)}
                    style={{ touchAction: 'none' }}
                >
                    <div className="h-8 w-16 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 group-hover:text-blue-500 group-hover:scale-110 transition-all">
                        <GripHorizontal size={20} />
                    </div>
                </div>

                {/* TOP handle */}
                <div
                    className="absolute -top-10 left-0 w-full h-10 cursor-n-resize flex items-center justify-center group z-50"
                    onMouseDown={(e) => handlePointerDown('top', e)}
                    onTouchStart={(e) => handlePointerDown('top', e)}
                    style={{ touchAction: 'none' }}
                >
                    <div className="h-8 w-16 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 group-hover:text-blue-500 group-hover:scale-110 transition-all">
                        <GripHorizontal size={20} />
                    </div>
                </div>

                <AnimatePresence>
                    {showHexGuide && <HexGuide />}
                </AnimatePresence>
            </div>
        </div>
    );
}
