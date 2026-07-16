"use client";
import React, { useState, useEffect, useRef, memo, useCallback } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Minus, Plus, Shield, ShieldOff, AlertCircle, History, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
    DndContext,
    DragEndEvent,
    DragStartEvent,
    useDraggable,
    useDroppable,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    TouchSensor,
} from "@dnd-kit/core";
import { getPieceImage, PieceType } from "@/lib/gameData";
import PieceRenderer from "@/components/game/PieceRenderer";
// import "../../../game/Board.css";
import { type Square } from '@/engine/types'
import { Game } from '@/engine/game'
import { BoardClass } from "@/engine/board";
import { Piece, CustomPiece } from "@/engine/piece";
import { SquareGrid } from '@/lib/grid/SquareGrid';
import { HexGrid } from '@/lib/grid/HexGrid';
import { Coordinate } from '@/lib/grid/GridType';

const gridMap = {
    square: new SquareGrid(),
    hex: new HexGrid()
};

export interface Coord {
    col: number;
    row: number;
}

export interface PlacedPiece {
    type: string;
    color: string;
    size?: number;
    pixels?: string[][];
    variables?: Record<string, number>;
    hasLogic?: boolean;
}

export type PlacedPieces = Record<string, PlacedPiece>;

export interface CustomBoard {
    cols: number;
    rows: number;
    gridType: 'square' | 'hex';
    activeSquares: Coord[];
    placedPieces: PlacedPieces;
}

interface MoveRecord {
    from: string;
    to: string;
    promotion?: string;
    notation: string;
}

// --- DraggablePiece ---
const DraggablePiece = memo(function DraggablePiece({
    piece,
    size,
    isTurn,
    onClick,
    boardStyle = "v3",
    pixels,
}: {
    piece: PlacedPiece & { position: string; pixels?: string[][] };
    size: number;
    isTurn: boolean;
    onClick: () => void;
    boardStyle?: string;
    pixels?: string[][];
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useDraggable({ id: piece.position, data: piece, disabled: !isTurn });

    const style: React.CSSProperties = {
        fontSize: size,
        cursor: isTurn ? "grab" : "default",
        userSelect: "none",
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: isDragging ? 0 : 1,
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : "none",
        zIndex: 20,
    };

    return (
        <div ref={setNodeRef} {...(isTurn ? { ...attributes, ...listeners } : {})} style={style} onClick={onClick}>
            <PieceRenderer
                type={piece.type}
                color={piece.color}
                size={size}
                pixels={pixels}
                boardStyle={boardStyle}
                variables={piece.variables}
                hasLogic={piece.hasLogic}
            />
        </div>
    );
});

import KillEffect from "@/components/game/KillEffect";

// --- BoardTile ---
const BoardTile = memo(function BoardTile({
    pos,
    gridType,
    isWhite,
    piece,
    blockSize,
    selected,
    isMoveFrom,
    isMoveTo,
    onClick,
    onContextMenu,
    boardStyle,
    isTurn,
    redMarked,
    effects,
    onEffectComplete,
}: {
    pos: string;
    gridType: 'square' | 'hex',
    isWhite: boolean;
    piece?: PlacedPiece & { position: string };
    blockSize: number;
    selected: boolean;
    isMoveFrom: boolean;
    isMoveTo: boolean;
    onClick: (p: string) => void;
    onContextMenu: (p: string) => void;
    boardStyle: string;
    isTurn: boolean;
    redMarked: boolean;
    effects: any[];
    onEffectComplete: (id: number) => void;
}) {
    const { setNodeRef } = useDroppable({ id: pos });

    const clipPath = gridType === 'hex'
        ? 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
        : 'none';

    return (
        <div
            ref={setNodeRef}
            className={` transition-colors duration-200 ${isWhite ? "bg-[#e9edcc]" : "bg-[#779954]"} ${isMoveFrom ? "move-from" : ""
                } ${isMoveTo ? "move-to" : ""} m-0 aspect-square relative flex items-center justify-center ${selected ? "ring-4 ring-blue-500" : ""
                }`}
            style={{
                width: blockSize,
                height: blockSize,
                clipPath: clipPath
            }}
            onClick={() => onClick(pos)}
            onContextMenu={(e) => {
                e.preventDefault();
                onContextMenu(pos);
            }}
        >
            {redMarked && (
                <div
                    className="absolute inset-0 z-10 pointer-events-none bg-red-500/40"
                    style={{
                        boxShadow: 'inset 0 0 15px rgba(239, 68, 68, 0.4)',
                        clipPath: clipPath
                    }}
                />
            )}
            {piece && <DraggablePiece piece={piece} size={piece.size ?? blockSize * 0.8} isTurn={isTurn} onClick={() => onClick(pos)} boardStyle={boardStyle} pixels={piece.pixels} />}

            <AnimatePresence>
                {effects.map((effect: any) => (
                    <KillEffect
                        key={effect.id}
                        size={blockSize}
                        onComplete={() => onEffectComplete(effect.id)}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
});

// --- Board Component ---
export default function Board({ board, headerContent }: { board: CustomBoard, headerContent?: React.ReactNode }) {
    const t = useTranslations("Editor.Board.Play");
    const gameRef = useRef<Game | null>(null);
    const [boardPieces, setBoardPieces] = useState<(PlacedPiece & { position: string })[]>([]);
    const [currentTurn, setCurrentTurn] = useState<"w" | "b">("w");
    const [blockSize, setBlockSize] = useState(80);
    const [selectedPos, setSelectedPos] = useState<string | null>(null);
    const [customCollection, setCustomCollection] = useState<Record<string, any>>({});

    // History State
    const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
    const [historyIndex, setHistoryIndex] = useState<number>(-1); // -1 = Start (no moves applied/viewed)

    useEffect(() => {
        const saved = localStorage.getItem('piece_collection');
        if (saved) {
            try {
                setCustomCollection(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load piece collection", e);
            }
        }
    }, []);
    const [activePiece, setActivePiece] = useState<string | null>(null);
    const [lastMoveFrom, setLastMoveFrom] = useState<string | null>(null);
    const [lastMoveTo, setLastMoveTo] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [redMarkedSquares, setRedMarkedSquares] = useState<Set<string>>(new Set());
    const [validationEnabled, setValidationEnabled] = useState(true);
    const [promotionPending, setPromotionPending] = useState<{ from: string; to: string } | null>(null);
    const [showKingWarning, setShowKingWarning] = useState(false);
    const [isShaking, setIsShaking] = useState(false);
    const [activeEffects, setActiveEffects] = useState<{ id: number, type: string, position: string }[]>([]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 0 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 0, tolerance: 0 } })
    );

    const handleEffectComplete = (id: number) => {
        setActiveEffects(prev => prev.filter(e => e.id !== id));
    };

    useEffect(() => {
        if (!gameRef.current) return;
        const boardObj = gameRef.current.getBoard();

        const onEffect = (effect: { type: string, position: Square }) => {
            const editorPos = fromEngineSq(effect.position);
            setActiveEffects(prev => [...prev, {
                id: Date.now() + Math.random(),
                type: effect.type,
                position: editorPos
            }]);
        };

        boardObj.addEffectListener(onEffect);
        return () => boardObj.removeEffectListener(onEffect);
    }, [gameRef.current]);

    const getPieceAt = (pos: string) => boardPieces.find((p) => p.position === pos);

    const toEngineSq = (pos: string): Square => {
        if (board.gridType === 'hex') return pos as Square;
        const [col, row] = pos.split(',').map(Number);
        return `${col},${board.rows - 1 - row}`;
    };

    const fromEngineSq = (sq: Square): string => {
        if (board.gridType === 'hex') return sq;
        const [col, row] = sq.split(',').map(Number);
        return `${col},${board.rows - 1 - row}`;
    };

    const checkMoveLegal = (from: string, to: string) => {
        if (!validationEnabled) return true;
        if (!gameRef.current) return false;
        const fromSq = toEngineSq(from);
        const toSq = toEngineSq(to);

        const boardClone = gameRef.current.getBoard().clone();
        const gameClone = new Game(boardClone);
        return gameClone.makeMove(fromSq, toSq);
    };

    const hasKings = () => {
        const whiteKing = boardPieces.some(p => p.type.toLowerCase() === 'king' && p.color === 'white');
        const blackKing = boardPieces.some(p => p.type.toLowerCase() === 'king' && p.color === 'black');
        return whiteKing && blackKing;
    };

    const isPromotionMove = (from: string, to: string) => {
        if (!gameRef.current) return false;
        const fromSq = toEngineSq(from);
        const toSq = toEngineSq(to);
        return gameRef.current.getBoard().isPromotionMove(fromSq, toSq);
    };

    const toggleValidation = () => {
        if (!validationEnabled && !hasKings()) {
            setIsShaking(true);
            setShowKingWarning(true);
            setTimeout(() => {
                setIsShaking(false);
                setShowKingWarning(false);
            }, 3000);
            return;
        }
        setValidationEnabled(!validationEnabled);
    };

    const buildGameFromProps = useCallback(() => {
        console.log(`[Board Init] customCollection keys:`, Object.keys(customCollection));

        const enginePieces: Record<Square, Piece | null> = {};
        Object.entries(board.placedPieces).forEach(([pos, piece]) => {
            const enginePos = toEngineSq(pos);

            // Search for rules in customCollection with multiple strategies:
            let customPieceData = customCollection[piece.type];

            if (!customPieceData) {
                // Try with color suffix
                const keyWithColor = `${piece.type}_${piece.color}`;
                customPieceData = customCollection[keyWithColor];
            }

            if (!customPieceData) {
                // Try stripping color suffix if it exists in the type
                const typeWithoutColor = piece.type.replace(/_white$|_black$/, '');
                customPieceData = customCollection[typeWithoutColor];
            }

            if (!customPieceData) {
                // Search by name or originalId
                customPieceData = Object.values(customCollection).find((p: any) =>
                    (p.name === piece.type || p.originalId === piece.type) && p.color === piece.color
                );
            }

            if (!customPieceData) {
                // Last resort: search by ID match (ignoring color suffix)
                const typeWithoutColor = piece.type.replace(/_white$|_black$/, '');
                customPieceData = Object.values(customCollection).find((p: any) =>
                    (p.id === typeWithoutColor || p.originalId === typeWithoutColor) && p.color === piece.color
                );
            }

            const rules = customPieceData?.moves || [];
            const logic = customPieceData?.logic || [];

            console.log(`[Board Init] Piece at ${pos}:`, {
                type: piece.type,
                color: piece.color,
                foundData: !!customPieceData,
                rulesCount: rules.length,
                logicCount: logic.length,
                logic: logic // Trace the actual logic data
            });

            const enginePiece = Piece.create(`${pos}_${piece.color}_${piece.type}`, piece.type as any, piece.color as any, enginePos, rules, logic, customPieceData?.name);
            if (enginePiece) {
                enginePieces[enginePos] = enginePiece;
            }
        });

        // Initialize engine with custom board state and active squares
        const activeSquaresArr = board.activeSquares.map(s => toEngineSq(`${s.col},${s.row}`));
        const customBoardObj = new BoardClass(enginePieces, activeSquaresArr, board.cols, board.rows, board.gridType);
        return new Game(customBoardObj);
    }, [board, customCollection]);

    const initGame = useCallback(() => {
        const savedStateRaw = localStorage.getItem('engine_state');
        let savedState = null;
        if (savedStateRaw) {
            try {
                savedState = JSON.parse(savedStateRaw);
            } catch (e) {
                console.error("Failed to parse engine state", e);
            }
        }

        if (savedState && savedState.pieces) {
            // Restore from saved state
            const enginePieces: Record<Square, Piece | null> = {};
            Object.entries(savedState.pieces).forEach(([sq, pData]: [string, any]) => {
                if (!pData) return;
                const customPieceData = customCollection[pData.type] || Object.values(customCollection).find((p: any) => p.name === pData.type);
                const rules = customPieceData?.moves || [];
                const logic = customPieceData?.logic || [];

                const piece = Piece.create(pData.id, pData.type, pData.color, sq as Square, rules, logic);
                if (piece instanceof CustomPiece) {
                    piece.variables = pData.variables || {};
                }
                piece.hasMoved = pData.hasMoved;
                enginePieces[sq as Square] = piece;
            });

            // Initialize engine with restored pieces
            const activeSquaresArr = board.activeSquares.map(s => toEngineSq(`${s.col},${s.row}`));
            const customBoardObj = new BoardClass(enginePieces, activeSquaresArr, board.cols, board.rows, board.gridType);
            gameRef.current = new Game(customBoardObj);

            setMoveHistory(savedState.history || []);
            setHistoryIndex(savedState.historyIndex ?? -1);

            // If we restored state, ensure turn is correct
            if (savedState.turn) {
                (gameRef.current.getBoard() as any).stateManager.turn = savedState.turn;
            }
        } else {
            // Initial setup from Board Editor
            gameRef.current = buildGameFromProps();
            setMoveHistory([]);
            setHistoryIndex(-1);
        }

        syncFromEngine();
    }, [board, customCollection, buildGameFromProps]);

    useEffect(() => {
        initGame();

        // Determine validation
        const piecesArray: (PlacedPiece & { position: string })[] = Object.entries(board.placedPieces).map(
            ([pos, piece]) => ({ ...piece, position: pos })
        );

        const whiteKing = piecesArray.some(p => {
            const customPiece = customCollection[p.type] || Object.values(customCollection).find((cp: any) => cp.name === p.type);
            const actualType = customPiece ? customPiece.name : p.type;
            return actualType.toLowerCase() === 'king' && p.color === 'white';
        });
        const blackKing = piecesArray.some(p => {
            const customPiece = customCollection[p.type] || Object.values(customCollection).find((cp: any) => cp.name === p.type);
            const actualType = customPiece ? customPiece.name : p.type;
            return actualType.toLowerCase() === 'king' && p.color === 'black';
        });
        setValidationEnabled(whiteKing && blackKing);
        setLastMoveFrom(null);
        setLastMoveTo(null);

    }, [board, customCollection, initGame]);

    // Resize
    useEffect(() => {
        const updateSize = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            const availableWidth = w * 0.95;
            const availableHeight = h * 0.85;
            const maxBoardSize = Math.min(availableWidth, availableHeight);
            const newBlockSize = Math.floor(maxBoardSize / board.cols);
            setBlockSize(Math.max(Math.min(newBlockSize, 80), 30) * zoom);
        };
        window.addEventListener("resize", updateSize);
        updateSize();
        return () => window.removeEventListener("resize", updateSize);
    }, [board.cols, zoom]);



    const syncFromEngine = () => {
        if (!gameRef.current) return;
        const squares = gameRef.current.getBoard().getSquares();
        const newPiecesArray: (PlacedPiece & { position: string })[] = [];
        for (const [sq, piece] of Object.entries(squares)) {
            if (piece) {
                const editorPos = fromEngineSq(sq as Square);
                // For custom pieces, we need to preserve the ID for rendering
                // The piece.id contains the original position and type, extract the type part
                const idParts = piece.id.split('_');
                const originalType = idParts.length >= 3 ? idParts.slice(2).join('_') : piece.type;

                // Lookup pixels from customCollection
                const pieceData = customCollection[originalType] ||
                    Object.values(customCollection).find((p: any) => (p.name === originalType || p.originalId === originalType) && p.color === piece.color);

                // Extract variables and logic state from CustomPiece
                const variables = (piece as any).variables || {};
                const hasLogic = !!(pieceData as any)?.logic && (pieceData as any).logic.length > 0;

                newPiecesArray.push({
                    type: originalType, // Use the original ID/type for lookup
                    color: piece.color,
                    position: editorPos,
                    size: blockSize * 0.8,
                    pixels: (pieceData as any)?.pixels,
                    variables,
                    hasLogic
                } as any);
            }
        }
        setBoardPieces(newPiecesArray);
        setCurrentTurn(gameRef.current.getTurn() === "white" ? "w" : "b");
    };

    const saveEngineState = useCallback(() => {
        if (!gameRef.current) return;
        const board = gameRef.current.getBoard();
        const squares = board.getSquares();

        // Serialize pieces with their variables
        const serializedPieces: Record<string, any> = {};
        for (const [sq, piece] of Object.entries(squares)) {
            if (piece) {
                serializedPieces[sq] = {
                    id: piece.id,
                    type: piece.type,
                    color: piece.color,
                    position: piece.position,
                    hasMoved: piece.hasMoved,
                    variables: (piece as any).variables || {}
                };
            } else {
                serializedPieces[sq] = null;
            }
        }

        const state = {
            pieces: serializedPieces,
            turn: board.getTurn(),
            history: moveHistory,
            historyIndex: historyIndex
        };
        localStorage.setItem('engine_state', JSON.stringify(state));
    }, [moveHistory, historyIndex]);

    const getNotation = (from: string, to: string, pieceType: string) => {
        // Simple conversion to e.g. "Pe2-e4" or just "e2-e4"
        const colMap = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p'];
        const [fC, fR] = from.split(',').map(Number);
        const [tC, tR] = to.split(',').map(Number);

        // My engine coords are: (col, rows-1-row). Wait.
        // let's use UI coords for display "Col,Row" -> "Col,Row" is clearest for custom boards.
        // Or "a1" style if Standard 8x8.
        if (board.cols <= 16 && board.rows <= 16) {
            const fromS = String(colMap[fC] || fC) + (board.rows - fR);
            const toS = String(colMap[tC] || tC) + (board.rows - tR);
            return `${pieceType[0].toUpperCase()} ${fromS}→${toS}`;
        }

        return `${from} → ${to}`;
    }

    const navigateToMove = useCallback((index: number) => {
        if (index < -1 || index >= moveHistory.length) return;

        // 1. Re-initialize Game to start state
        // CRITICAL FIX: Always start fresh from props when navigating history, ignoring localStorage state
        gameRef.current = buildGameFromProps();

        // 2. Replay moves up to index
        // index -1 means start state (no moves)
        let lastMove = null;

        for (let i = 0; i <= index; i++) {
            const m = moveHistory[i];
            const eFrom = toEngineSq(m.from);
            const eTo = toEngineSq(m.to);
            if (!gameRef.current) break; // Should not happen

            gameRef.current.getBoard().movePiece(eFrom, eTo, m.promotion);
            lastMove = m;
        }

        // 3. Sync UI
        syncFromEngine();
        setHistoryIndex(index);

        if (lastMove) {
            setLastMoveFrom(lastMove.from);
            setLastMoveTo(lastMove.to);
        } else {
            setLastMoveFrom(null);
            setLastMoveTo(null);
        }

        setSelectedPos(null);
    }, [buildGameFromProps, moveHistory, blockSize]);

    // Keyboard Shortcuts for Zoom & History
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "+" || e.key === "=") {
                setZoom(prev => Math.min(2.5, prev + 0.1));
            } else if (e.key === "-" || e.key === "_") {
                setZoom(prev => Math.max(0.3, prev - 0.1));
            } else if (e.key === "ArrowLeft") {
                navigateToMove(historyIndex - 1);
            } else if (e.key === "ArrowRight") {
                navigateToMove(historyIndex + 1);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [historyIndex, navigateToMove]);

    const executeMove = (from: string, to: string, promotion?: string) => {
        if (!gameRef.current) return;

        // --- BRANCHING LOGIC ---
        // If we are not at the end of history, we must branch (truncate history)
        let currentHist = moveHistory;
        if (historyIndex < moveHistory.length - 1) {
            // Truncate
            currentHist = moveHistory.slice(0, historyIndex + 1);
            setMoveHistory(currentHist);
        }

        const engineFrom = toEngineSq(from);
        const engineTo = toEngineSq(to);

        const isCapture = !!gameRef.current.getBoard().getPiece(engineTo);
        const piece = getPieceAt(from);
        const notation = getNotation(from, to, piece?.type || "");

        // If validation disabled or move valid
        let moveSuccessful = false;

        if (!validationEnabled) {
            moveSuccessful = gameRef.current.getBoard().movePiece(engineFrom, engineTo, promotion);
        } else {
            if (gameRef.current.makeMove(engineFrom, engineTo, promotion)) {
                moveSuccessful = true;
            }
        }

        if (moveSuccessful) {
            syncFromEngine();
            setLastMoveFrom(from);
            setLastMoveTo(to);
            setSelectedPos(null);

            // Record Move
            const newMove: MoveRecord = { from, to, promotion, notation };
            const nextHist = [...currentHist, newMove];
            setMoveHistory(nextHist);
            setHistoryIndex(nextHist.length - 1);

            // SAVE STATE after a slight delay to ensure setMoveHistory has settled for the next sync/save iteration if any
            setTimeout(saveEngineState, 10);

            const sound = isCapture ? "/sounds/capture.mp3" : "/sounds/move-self.mp3";
            const audio = new Audio(sound);
            audio.play().catch(() => { });
        } else {
            // Even if move failed (e.g. Bounce Back), logic might have changed piece state (transformation, variables)
            syncFromEngine();
            setSelectedPos(null);
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActivePiece(event.active.id as string);
        setSelectedPos(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActivePiece(null);
        if (over && active.id !== over.id) {
            const from = active.id as string;
            const to = over.id as string;
            const piece = getPieceAt(from);
            const target = getPieceAt(to);

            if (piece && (!validationEnabled || (piece.color === "white" ? "w" : "b") === currentTurn)) {
                if (target && target.color === piece.color && validationEnabled) return;

                // If viewing history, we check based on CURRENT visual board (which is synced to Game state of that history point)
                if (!checkMoveLegal(from, to)) return;

                if (isPromotionMove(from, to)) {
                    setPromotionPending({ from, to });
                } else {
                    executeMove(from, to);
                }
            }
        }
    };

    const handlePieceSelect = (pos: string) => {
        if (selectedPos === pos) return setSelectedPos(null);
        if (selectedPos) {
            const piece = getPieceAt(selectedPos);
            const target = getPieceAt(pos);
            if (piece && (!validationEnabled || (piece.color === "white" ? "w" : "b") === currentTurn)) {
                if (target && target.color === piece.color && validationEnabled) return setSelectedPos(pos);

                if (!checkMoveLegal(selectedPos, pos)) return;

                if (isPromotionMove(selectedPos, pos)) {
                    setPromotionPending({ from: selectedPos, to: pos });
                } else {
                    executeMove(selectedPos, pos);
                }
            }
        } else {
            const piece = getPieceAt(pos);
            if (piece && (piece.color === "white" ? "w" : "b") === currentTurn) {
                setSelectedPos(pos);
            }
        }
    };

    // Render
    const activeKeys = new Set(board.activeSquares.map(s => `${s.col},${s.row}`));
    const grid = gridMap[board.gridType] || gridMap.square;
    const initialTiles = grid.generateInitialGrid(board.rows, board.cols);

    const boardContent = initialTiles.map((coord) => {
        const pos = grid.coordToString(coord);
        if (!activeKeys.has(pos)) return null;

        const pixelPos = grid.getPixelPosition(coord, blockSize);
        const isWhite = board.gridType === 'square'
            ? ((coord.x || 0) + (coord.y || 0)) % 2 === 0
            : ((coord.q || 0) + (coord.r || 0)) % 2 === 0;

        const displayPiece = getPieceAt(pos);
        if (displayPiece) displayPiece.size = blockSize * 0.8;

        return (
            <div
                key={pos}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{
                    left: pixelPos.x + (board.gridType === 'hex' ? (Math.max(board.rows, board.cols) * 0.75 * blockSize) : 0),
                    top: pixelPos.y + (board.gridType === 'hex' ? (Math.max(board.rows, board.cols) * 0.75 * blockSize) : 0),
                }}
            >
                <BoardTile
                    pos={pos}
                    gridType={board.gridType}
                    isWhite={isWhite}
                    piece={displayPiece}
                    blockSize={blockSize}
                    selected={selectedPos === pos}
                    isMoveFrom={lastMoveFrom === pos}
                    isMoveTo={lastMoveTo === pos}
                    onClick={handlePieceSelect}
                    onContextMenu={(p) => {
                        setRedMarkedSquares(prev => {
                            const next = new Set(prev);
                            if (next.has(p)) next.delete(p);
                            else next.add(p);
                            return next;
                        });
                    }}
                    boardStyle="v3"
                    isTurn={displayPiece ? (displayPiece.color === "white" ? "w" : "b") === currentTurn : false}
                    redMarked={redMarkedSquares.has(pos)}
                    effects={activeEffects.filter(e => e.position === pos)}
                    onEffectComplete={handleEffectComplete}
                />
            </div>
        );
    });


    return (
        <div className="flex flex-col xl:flex-row items-start justify-center gap-8 w-full max-w-[1800px]">
            {/* Board Card - Contains Header & Board */}
            <div className="flex flex-col items-center bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-xl border border-stone-200 dark:border-white/10 w-full max-w-3xl">
                {headerContent}

                <div className="flex items-center gap-4 mb-6 px-6 py-3 bg-stone-100 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-stone-200 dark:border-white/10 shadow-sm">
                    <button
                        onClick={() => setZoom(prev => Math.max(0.3, prev - 0.1))}
                        className="p-2 rounded-xl bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-stone-600 dark:text-white/60 hover:text-stone-900 dark:hover:text-white transition-all border border-stone-200 dark:border-white/5 active:scale-95"
                    >
                        <Minus size={18} />
                    </button>
                    <div className="flex flex-col items-center min-w-[60px]">
                        <span className="text-[9px] text-stone-400 dark:text-white/40 uppercase font-bold mb-0.5 tracking-widest">{t('zoom')}</span>
                        <span className="text-sm font-bold text-stone-900 dark:text-white tabular-nums">{Math.round(zoom * 100)}%</span>
                    </div>
                    <button
                        onClick={() => setZoom(prev => Math.min(2.5, prev + 0.1))}
                        className="p-2 rounded-xl bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-stone-600 dark:text-white/60 hover:text-stone-900 dark:hover:text-white transition-all border border-stone-200 dark:border-white/5 active:scale-95"
                    >
                        <Plus size={18} />
                    </button>
                </div>

                <div className="relative shadow-2xl rounded-lg border-6 border-stone-800 bg-stone-800 flex items-center justify-center">
                    <div
                        className="relative"
                        style={{
                            width: board.gridType === 'square' ? board.cols * blockSize : (Math.max(board.rows, board.cols) * 1.5 * blockSize),
                            height: board.gridType === 'square' ? board.rows * blockSize : (Math.max(board.rows, board.cols) * 1.5 * blockSize),
                        }}
                    >
                        <DndContext sensors={sensors} onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
                            {boardContent}
                            <DragOverlay dropAnimation={null}>
                                {activePiece && (() => {
                                    const p = getPieceAt(activePiece);
                                    if (!p) return null;
                                    return (
                                        <div style={{ width: blockSize, height: blockSize, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <PieceRenderer type={p.type} color={p.color} size={blockSize} pixels={p.pixels} boardStyle="v3" variables={p.variables} hasLogic={p.hasLogic} />
                                        </div>
                                    );
                                })()}
                            </DragOverlay>
                        </DndContext>
                    </div>
                </div>

                {/* Premium Validation Toggle */}
                <div className="mt-8 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-4 px-6 py-3 bg-stone-100 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-stone-200 dark:border-white/10 shadow-lg relative overflow-hidden group">
                        <div className="absolute inset-0 bg-linear-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <span className={`text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${!validationEnabled ? 'text-stone-900 dark:text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'text-stone-400 dark:text-white/20'}`}>
                            {t('noValidation')}
                        </span>

                        <motion.button
                            onClick={toggleValidation}
                            animate={isShaking ? { x: [-4, 4, -4, 4, 0] } : {}}
                            transition={{ duration: 0.4 }}
                            className={`relative w-16 h-8 rounded-full transition-all duration-500 flex items-center p-1.5 shadow-inner ${validationEnabled ? 'bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'bg-white/10'}`}
                        >
                            <motion.div
                                animate={{ x: validationEnabled ? 32 : 0 }}
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                className="w-5 h-5 bg-white dark:bg-white rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.2)] flex items-center justify-center relative z-10"
                            >
                                {validationEnabled ?
                                    <Shield size={10} className="text-blue-600" /> :
                                    <ShieldOff size={10} className="text-stone-400" />
                                }
                            </motion.div>
                            {validationEnabled && (
                                <motion.div
                                    layoutId="glow"
                                    className="absolute inset-0 bg-blue-400/20 blur-md rounded-full"
                                />
                            )}
                        </motion.button>

                        <span className={`text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${validationEnabled ? 'text-blue-500 dark:text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]' : 'text-stone-400 dark:text-white/20'}`}>
                            {t('validation')}
                        </span>
                    </div>

                    <AnimatePresence>
                        {showKingWarning && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="flex items-center gap-2 text-red-400 text-[11px] font-medium bg-red-400/10 px-3 py-1.5 rounded-lg border border-red-400/20"
                            >
                                <AlertCircle size={14} />
                                {t('kingWarning')}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* History Sidebar */}
            <div className="w-full xl:w-[320px] xl:min-w-[320px] shrink-0 h-fit max-h-[600px] flex flex-col bg-white dark:bg-white/5 backdrop-blur-md rounded-2xl border border-stone-200 dark:border-white/10 shadow-xl overflow-hidden self-start xl:mt-0">
                <div className="p-4 border-b border-stone-200 dark:border-white/5 bg-stone-50 dark:bg-black/10 flex items-center gap-2">
                    <History size={16} className="text-amber-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-stone-600 dark:text-white/60">Move History</span>
                </div>

                <ScrollArea className="flex-1 h-[300px] p-4">
                    <div className="space-y-1">
                        {moveHistory.length === 0 && (
                            <div className="text-center py-10 text-stone-400 dark:text-white/20 text-xs font-bold uppercase tracking-widest">
                                Start moving to create history
                            </div>
                        )}
                        {/* Linear List for Custom Board flexibility */}
                        {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, i) => (
                            <div key={i} className="flex items-center group rounded-lg overflow-hidden">
                                <div className="w-8 py-2 text-center text-[10px] font-black text-stone-400 dark:text-white/30 bg-stone-100 dark:bg-white/5 tabular-nums">
                                    {i + 1}.
                                </div>
                                <div className="flex-1 grid grid-cols-2 gap-px bg-stone-100 dark:bg-white/5">
                                    <button
                                        onClick={() => navigateToMove(i * 2)}
                                        className={`px-3 py-2 text-left text-xs font-bold transition-all ${historyIndex === i * 2
                                            ? 'bg-amber-500 text-white shadow-inner'
                                            : 'text-stone-600 dark:text-white/70 hover:bg-stone-200 dark:hover:bg-white/10'
                                            }`}
                                    >
                                        {moveHistory[i * 2].notation}
                                    </button>

                                    {moveHistory[i * 2 + 1] ? (
                                        <button
                                            onClick={() => navigateToMove(i * 2 + 1)}
                                            className={`px-3 py-2 text-left text-xs font-bold transition-all ${historyIndex === i * 2 + 1
                                                ? 'bg-amber-500 text-white shadow-inner'
                                                : 'text-stone-600 dark:text-white/70 hover:bg-stone-200 dark:hover:bg-white/10'
                                                }`}
                                        >
                                            {moveHistory[i * 2 + 1].notation}
                                        </button>
                                    ) : (
                                        <div className="bg-transparent" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <div className="p-4 border-t border-stone-200 dark:border-white/5 bg-stone-50 dark:bg-black/20 grid grid-cols-4 gap-2">
                    <button
                        onClick={() => navigateToMove(-1)}
                        disabled={historyIndex < 0}
                        className="flex items-center justify-center p-2 rounded-lg bg-stone-200 dark:bg-white/5 hover:bg-stone-300 dark:hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-stone-200 dark:disabled:hover:bg-white/5 transition-all text-stone-600 dark:text-white/70 hover:text-stone-900 dark:hover:text-white"
                    >
                        <ChevronsLeft size={16} />
                    </button>
                    <button
                        onClick={() => navigateToMove(historyIndex - 1)}
                        disabled={historyIndex < 0}
                        className="flex items-center justify-center p-2 rounded-lg bg-stone-200 dark:bg-white/5 hover:bg-stone-300 dark:hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-stone-200 dark:disabled:hover:bg-white/5 transition-all text-stone-600 dark:text-white/70 hover:text-stone-900 dark:hover:text-white"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        onClick={() => navigateToMove(historyIndex + 1)}
                        disabled={historyIndex >= moveHistory.length - 1}
                        className="flex items-center justify-center p-2 rounded-lg bg-stone-200 dark:bg-white/5 hover:bg-stone-300 dark:hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-stone-200 dark:disabled:hover:bg-white/5 transition-all text-stone-600 dark:text-white/70 hover:text-stone-900 dark:hover:text-white"
                    >
                        <ChevronRight size={16} />
                    </button>
                    <button
                        onClick={() => navigateToMove(moveHistory.length - 1)}
                        disabled={historyIndex >= moveHistory.length - 1}
                        className="flex items-center justify-center p-2 rounded-lg bg-stone-200 dark:bg-white/5 hover:bg-stone-300 dark:hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-stone-200 dark:disabled:hover:bg-white/5 transition-all text-stone-600 dark:text-white/70 hover:text-stone-900 dark:hover:text-white"
                    >
                        <ChevronsRight size={16} />
                    </button>
                </div>
            </div>

            {/* Promotion Modal */}
            <AnimatePresence>
                {promotionPending && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-[#262421] p-6 rounded-2xl border border-white/10 shadow-2xl flex flex-col items-center gap-6"
                        >
                            <h3 className="text-white font-bold text-lg tracking-tight">{t('choosePromotion')}</h3>
                            <div className="flex gap-4">
                                {['queen', 'rook', 'bishop', 'knight'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => {
                                            executeMove(promotionPending.from, promotionPending.to, type);
                                            setPromotionPending(null);
                                        }}
                                        className="w-16 h-16 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 hover:border-white/20 active:scale-95 flex items-center justify-center p-2"
                                    >
                                        <PieceRenderer
                                            type={type}
                                            color={getPieceAt(promotionPending.from)?.color || "white"}
                                            size={48}
                                            boardStyle="v3"
                                        />
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
