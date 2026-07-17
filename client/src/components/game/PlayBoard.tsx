"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Game } from '@/engine/game';
import { BoardClass } from '@/engine/board';
import { Piece } from '@/engine/piece';
import { Square } from '@/engine/types';
import PieceRenderer from '@/components/game/PieceRenderer';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, useSensor, useSensors, PointerSensor, TouchSensor, KeyboardSensor, MeasuringStrategy } from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Undo2, AlertCircle, Info, Settings2, ArrowLeft, ZoomIn, ZoomOut, Play, Minus, Plus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Globe, Copy, Share2, Eye } from 'lucide-react';
import KillEffect from '@/components/game/KillEffect';
import SpeechBubble from '@/components/game/SpeechBubble';
import HexPlayBoardRenderer from '@/components/game/HexPlayBoardRenderer';
import { Project } from '@/types/Project';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSocket, useSocketConnection } from '@/context/SocketContext';
import { useServerWakeup } from '@/context/ServerWakeupContext';
import { useSession } from 'next-auth/react';
import EngineToggleCard from '@/components/editor/EngineToggleCard';

// Draggable Piece Component
const DraggablePiece = React.memo(({ piece, size, amIAtTurn }: { piece: Piece; size: number; amIAtTurn: boolean }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: piece.position,
        data: piece,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 100,
    } : undefined;

    try {
        return (
            <div
                ref={setNodeRef}
                style={style}
                {...(amIAtTurn ? { ...attributes, ...listeners } : {})}
                className={`cursor-${amIAtTurn ? 'grab' : 'default'} ${isDragging ? 'opacity-0' : 'opacity-100'} relative z-20 w-full h-full flex items-center justify-center`}
            >
                <PieceRenderer
                    type={piece.type}
                    color={piece.color}
                    size={size}
                    hasLogic={(piece as any).isCustom}
                    variables={(piece as any).variables}
                    pixels={(piece as any).isCustom ? (piece.color === 'white' ? (piece as any).pixelsWhite : (piece as any).pixelsBlack) : undefined}
                    image={(piece as any).image}
                />
            </div>
        );
    } catch (e) {
        console.error("Piece render error:", e);
        return null;
    }
}, (prev, next) => prev.piece.id === next.piece.id && prev.piece.position === next.piece.position && prev.amIAtTurn === next.amIAtTurn);

// Helper to render a human-readable summary of move rules
const VAR_LABELS: Record<string, string> = {
    absDiffX: '|ΔX|', absDiffY: '|ΔY|', diffX: 'ΔX', diffY: 'ΔY',
    dist: 'dist', cooldown: 'cooldown', charge: 'charge', mode: 'mode'
};

function PieceTooltip({ piece, boardRef }: { piece: Piece; boardRef: React.RefObject<HTMLDivElement | null> }) {
    const customPiece = piece as any;
    const isCustom = customPiece.isCustom;
    const rules = customPiece.rules || [];
    const logic = customPiece.logic || [];
    const variables = customPiece.variables || {};

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="absolute left-full top-0 ml-3 z-200 w-64 bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-700 p-4 pointer-events-none"
        >
            <div className="flex items-center gap-3 mb-3 pb-3 border-b border-stone-100 dark:border-stone-800">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${piece.color === 'white' ? 'bg-stone-100 text-stone-800' : 'bg-stone-800 text-white'}`}>
                    {piece.type === 'king' ? '♚' : piece.type === 'queen' ? '♛' : piece.type === 'rook' ? '♜' : piece.type === 'bishop' ? '♝' : piece.type === 'knight' ? '♞' : piece.type === 'pawn' ? '♟' : '⚙'}
                </div>
                <div>
                    <h4 className="font-black text-sm text-stone-900 dark:text-white uppercase tracking-tight">{piece.name || piece.type}</h4>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{piece.color} • {piece.position}</p>
                </div>
            </div>

            {/* Move Rules */}
            {isCustom && rules.length > 0 && (
                <div className="mb-3">
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1.5">Move Rules</p>
                    <div className="space-y-1 max-h-28 overflow-y-auto">
                        {rules.map((rule: any, i: number) => (
                            <div key={i} className={`text-[10px] font-bold px-2 py-1 rounded-lg ${rule.result === 'allow' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}>
                                {rule.conditions?.map((c: any, j: number) => (
                                    <span key={j}>
                                        {j > 0 && <span className="text-amber-500 mx-1">{rule.conditions[j-1]?.logic || 'AND'}</span>}
                                        {VAR_LABELS[c.variable] || c.variable} {c.operator === '===' ? '=' : c.operator} {c.value}
                                    </span>
                                ))}
                                <span className="ml-1 opacity-60">→ {rule.result} ({rule.type || 'jump'})</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Logic Triggers */}
            {isCustom && logic.length > 0 && (
                <div className="mb-3">
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1.5">Logic Triggers</p>
                    <div className="flex flex-wrap gap-1">
                        {logic.map((block: any, i: number) => (
                            <span key={i} className="text-[9px] font-bold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md">
                                {block.trigger || block.type || 'trigger'}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Variables */}
            {isCustom && Object.keys(variables).length > 0 && (
                <div>
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1.5">Variables</p>
                    <div className="grid grid-cols-2 gap-1">
                        {Object.entries(variables).map(([key, val]) => (
                            <div key={key} className="text-[10px] font-bold bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-lg">
                                {key}: {String(val)}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Standard piece hint */}
            {!isCustom && (
                <p className="text-[10px] text-stone-400 italic">Standard {piece.type} — uses default chess movement</p>
            )}
        </motion.div>
    );
}

// Low-dependency Square Component
function BoardSquare({ pos, isWhite, piece, size, onSelect, onContextMenu, isSelected, amIAtTurn, effects, onEffectComplete, hideCoordinates, isHighlighted, isCapture, onHover, onHoverLeave }: any) {
    const { setNodeRef, isOver } = useDroppable({ id: pos });

    return (
        <div
            ref={setNodeRef}
            onClick={() => onSelect(pos)}
            onContextMenu={(e) => {
                e.preventDefault();
                onContextMenu(pos);
            }}
            onMouseEnter={() => onHover?.(pos)}
            onMouseLeave={() => onHoverLeave?.()}
            className={`aspect-square relative flex items-center justify-center box-border ${isOver ? 'ring-4 ring-inset ring-amber-400' : ''} ${isSelected ? 'after:content-[""] after:absolute after:inset-0 after:bg-amber-400/30 after:ring-4 after:ring-inset after:ring-amber-400' : ''}`}
            style={{
                backgroundColor: isWhite ? '#ebecd0' : '#779556',
                zIndex: isSelected ? 2 : 1,
                overflow: 'visible'
            }}
        >
            {piece && (
                <DraggablePiece piece={piece} size={size * 0.9} amIAtTurn={amIAtTurn} />
            )}

            {/* Legal-move highlight dot */}
            {isHighlighted && !isCapture && (
                <div
                    className="absolute rounded-full pointer-events-none z-10"
                    style={{
                        width: `${size * 0.33}px`,
                        height: `${size * 0.33}px`,
                        backgroundColor: 'rgba(0, 0, 0, 0.25)',
                    }}
                />
            )}
            {/* Legal-move capture ring */}
            {isHighlighted && isCapture && (
                <div
                    className="absolute rounded-full pointer-events-none z-10"
                    style={{
                        width: `${size * 0.95}px`,
                        height: `${size * 0.95}px`,
                        border: '5px solid rgba(0, 0, 0, 0.25)',
                    }}
                />
            )}

            <AnimatePresence>
                {effects.map((effect: any) => effect.type === 'tell-user' ? (
                    <SpeechBubble
                        key={effect.id}
                        message={effect.params?.message || ''}
                    />
                ) : (
                    <KillEffect
                        key={effect.id}
                        size={size}
                        onComplete={() => onEffectComplete(effect.id)}
                    />
                ))}
            </AnimatePresence>

            {/* Coordinate Labels */}
            {!hideCoordinates && pos[1] === '1' && (
                <span className={`absolute bottom-0.5 right-0.5 text-[9px] font-black select-none pointer-events-none ${isWhite ? 'text-[#779556]' : 'text-[#ebecd0]'}`}>
                    {pos[0]}
                </span>
            )}
            {!hideCoordinates && pos[0] === 'a' && (
                <span className={`absolute top-0.5 left-0.5 text-[9px] font-black select-none pointer-events-none ${isWhite ? 'text-[#779556]' : 'text-[#ebecd0]'}`}>
                    {pos[1]}
                </span>
            )}
        </div>
    );
}

// Wrapper interface to adapt to project structure
interface PlayBoardProps {
    project: Project | null;
    projectId?: string;
    roomId?: string;
    mode?: 'online' | 'local';
    isMarketplace?: boolean;
    initialBoardState?: any;
}

// Helper to create piece instance
function createPieceFromData(id: string, type: string, color: string, position: string, customPieces: any[]): Piece {
    // Look up by both name AND id (since placedPieces stores either)
    const customProto = customPieces.find(cp => cp.name === type || cp.id === type);
    let newPiece: Piece;

    if (customProto) {
        // Handle both 'rules' (Piece.ts) and 'moves' (Firestore) naming conventions
        const rules = customProto.rules || customProto.moves || [];
        const logic = customProto.logic || [];

        newPiece = Piece.create(
            id,
            type,
            color as any,
            position as any,
            rules,
            logic
        );
        if ((customProto as any).variables) (newPiece as any).variables = JSON.parse(JSON.stringify((customProto as any).variables));
        (newPiece as any).isCustom = true;
        (newPiece as any).pixelsWhite = customProto.pixelsWhite;
        (newPiece as any).pixelsBlack = customProto.pixelsBlack;
        (newPiece as any).image = color === 'white' ? customProto.imageWhite : customProto.imageBlack;
    } else {
        newPiece = Piece.create(id, type, color as any, position as any);
    }
    return newPiece;
}

export default function PlayBoard({ project, projectId, roomId, mode, isMarketplace, initialBoardState }: PlayBoardProps) {
    const router = useRouter();
    const socket = useSocket();
    const isConnected = useSocketConnection();
    const { requireServer } = useServerWakeup();
    const { data: session } = useSession();

    // Use local state for project to allow hydration from socket
    const [activeProject, setActiveProject] = useState<Project | null>(project);

    // -- Initialize Game from Project Data first, then use local state --
    const [game, setGame] = useState<Game | null>(null);
    const [board, setBoard] = useState<BoardClass | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
    const [activePiece, setActivePiece] = useState<Piece | null>(null);
    const [logs, setLogs] = useState<{ msg: string, type: 'info' | 'move' | 'effect' }[]>([]);
    const [activeEffects, setActiveEffects] = useState<{ id: number, type: string, position: Square, params?: Record<string, any> }[]>([]);

    // -- New State for Replicated Features --
    const [zoom, setZoom] = useState(1);
    const [validationEnabled, setValidationEnabled] = useState(true);

    // P1a: Piece hover tooltip
    const [hoveredSquare, setHoveredSquare] = useState<Square | null>(null);
    const [showPieceInfo, setShowPieceInfo] = useState(true);
    const boardContainerRef = useRef<HTMLDivElement | null>(null);

    // Online State
    const [myColor, setMyColor] = useState<"white" | "black" | null>(null);
    const [isOnline, setIsOnline] = useState(mode !== 'local'); // Default to online unless explicitly local
    const [waitingForOpponent, setWaitingForOpponent] = useState(isOnline);
    const [pendingHistory, setPendingHistory] = useState<string[] | null>(null);

    // History State
    const [moveHistory, setMoveHistory] = useState<string[]>([]);
    const [historySnapshots, setHistorySnapshots] = useState<Record<string, Piece | null>[]>([]);
    const [viewIndex, setViewIndex] = useState(0);
    const [copySuccess, setCopySuccess] = useState(false);

    // Engine toggle state (local play only)
    const [engineEnabled, setEngineEnabled] = useState(false);
    const [engineColor, setEngineColor] = useState<'white' | 'black'>('black');

    // Game-over state
    const [gameOver, setGameOver] = useState(false);
    const [gameResultMessage, setGameResultMessage] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
        useSensor(KeyboardSensor)
    );
    const initializedProjectIdRef = useRef<string | null>(null);
    const lastLocalMoveRef = useRef<{ from: string, to: string } | null>(null);
    const myColorRef = useRef<"white" | "black" | null>(null);
    const gameRef = useRef<Game | null>(null);
    const boardRef = useRef<BoardClass | null>(null);

    useEffect(() => {
        if (project) {
            console.log("[PlayBoard] Project prop changed/received:", project.id);
            setActiveProject(project);
        }
    }, [project]);

    // -- Helpers --
    const isHex = activeProject?.gridType === 'hex';

    const toAlgebraic = (coord: string, bH: number): string => {
        if (!coord.includes(',')) return coord;
        // For hex boards, keep the axial coordinate string as-is
        // (hex coords can be negative, which breaks algebraic notation)
        if (isHex) return coord;
        const [x, y] = coord.split(',').map(Number);
        const file = String.fromCharCode(97 + x);
        const rank = bH - y;
        return `${file}${rank}`;
    };

    const getNormalizedSquareLogic = (project: Project) => {
        const normalizedSquareLogic: Record<string, any> = {};
        const actualHeight = project.rows || 8;
        if (project.squareLogic) {
            Object.entries(project.squareLogic).forEach(([sqId, def]) => {
                const algSq = toAlgebraic(sqId, actualHeight);
                const varRecord: Record<string, any> = {};
                if (def.variables && Array.isArray(def.variables)) {
                    def.variables.forEach((v: any) => {
                        varRecord[v.name || v.id] = v.value;
                    });
                }
                normalizedSquareLogic[algSq] = {
                    logic: def.logic || [],
                    variables: varRecord,
                    squareId: algSq
                };
            });
        }
        return normalizedSquareLogic;
    };

    // Initial Setup Effect
    useEffect(() => {
        setIsMounted(true);
        if (!activeProject) {
            console.log("[PlayBoard] No active project for initialization");
            return;
        }
        try {
            console.log("[PlayBoard] Initializing board with project:", activeProject.id);
            // Reconstruct the board from project data
            const {
                rows = 8,
                cols = 8,
                placedPieces = {},
                activeSquares = [],
                customPieces = []
            } = activeProject;

            // Create squares map for board constructor
            const initialSquares: Record<string, Piece | null> = {};
            const actualHeight = activeProject.rows || 8;

            // If we have an initial board state from the server, use it. Otherwise use project defaults.
            if (initialBoardState && initialBoardState.squares) {
                console.log("[PlayBoard] Initializing from server boardState");
                Object.entries(initialBoardState.squares).forEach(([sq, pData]: [string, any]) => {
                    if (!pData) return;
                    // For custom pieces, we still need the original definitions for assets/logic
                    const newPiece = createPieceFromData(pData.id, pData.type, pData.color, sq, customPieces);
                    if (newPiece) {
                        if (pData.variables) (newPiece as any).variables = { ...pData.variables };
                        newPiece.hasMoved = pData.hasMoved || false;
                        initialSquares[sq] = newPiece;
                    }
                });
            } else {
                console.log("[PlayBoard] Initializing from project placedPieces");
                Object.entries(placedPieces).forEach(([sq, pData]: [string, any]) => {
                    const normalizedSq = toAlgebraic(sq, actualHeight);

                    if (activeSquares.length > 0) {
                        const normalizedActive = activeSquares.map((a: string) => toAlgebraic(a, actualHeight));
                        if (!normalizedActive.includes(normalizedSq)) return;
                    }

                    const pieceId = `${normalizedSq}_${pData.color}_${pData.type}_${Date.now()}`;
                    const newPiece = createPieceFromData(pieceId, pData.type, pData.color, normalizedSq, customPieces);

                    if (newPiece) {
                        initialSquares[normalizedSq] = newPiece;
                    }
                });
            }

            const normalizedSquareLogic = getNormalizedSquareLogic(activeProject);

            const newBoard = new BoardClass(
                initialSquares,
                activeSquares.length > 0 ? activeSquares.map((a: string) => toAlgebraic(a, actualHeight)) : undefined,
                cols,
                rows,
                activeProject.gridType || 'square',
                normalizedSquareLogic
            );

            const newGame = new Game(newBoard);
            setGame(newGame);
            gameRef.current = newGame;
            setBoard(newGame.getBoard());
            boardRef.current = newGame.getBoard();

            const initialSnapshot = JSON.parse(JSON.stringify(newGame.getBoard().getSquares()));
            setHistorySnapshots([initialSnapshot]);

            // Only clear local move history if the project ID has changed or we have no moves yet
            if (initializedProjectIdRef.current !== activeProject.id || moveHistory.length === 0) {
                setMoveHistory(activeProject.history || []);
                setViewIndex(activeProject.history ? activeProject.history.length : 0);
                initializedProjectIdRef.current = activeProject.id || null;
            }

            setLogs([{ msg: 'Game Initialized', type: 'info' }]);

        } catch (err) {
            console.error("[PlayBoard] Initialization error:", err);
            toast.error("Failed to load game");
        }
    }, [activeProject]);

    // Socket Connection
    useEffect(() => {
        if (!isOnline || !roomId) return;
        if (!socket || !isConnected) { requireServer(); return; }

        const register = () => {
            let pId = localStorage.getItem("chess_player_id");
            if (!pId && session?.user?.id) {
                pId = session.user.id;
                localStorage.setItem("chess_player_id", pId);
            }
            if (!pId) {
                pId = Math.random().toString(36).substring(2, 15);
                localStorage.setItem("chess_player_id", pId);
            }
            console.log("[Socket] Registering player:", pId, "for room:", roomId);
            socket.emit("register_player", { playerId: pId });
            socket.emit("join_room", { roomId, pId });
        };

        register();
        socket.on("connect", register);

        return () => {
            socket.off("connect", register);
        };
    }, [socket, isOnline, roomId, session]);

    // Pending History Processing
    useEffect(() => {
        if (!pendingHistory || !game) return;

        console.log("Replaying history:", pendingHistory);

        // Replay history
        const newMoves: string[] = [];
        const newSnapshots = [historySnapshots[0] || JSON.parse(JSON.stringify(game.getBoard().getSquares()))];

        for (const moveStr of pendingHistory) {
            const parts = moveStr.split(' -> ');
            if (parts.length === 2) {
                const from = parts[0] as Square;
                const to = parts[1] as Square;
                if (game.makeMove(from, to)) {
                    newMoves.push(moveStr);
                    newSnapshots.push(JSON.parse(JSON.stringify(game.getBoard().getSquares())));
                }
            }
        }

        setHistorySnapshots(newSnapshots);
        setMoveHistory(newMoves);
        setViewIndex(newSnapshots.length - 1);

        const newBoard = game.getBoard().clone();
        setBoard(newBoard);
        boardRef.current = newBoard;
        setPendingHistory(null);

    }, [pendingHistory, game]); // historySnapshots[0] assumed stable or handled

    // Socket Event Handlers
    useEffect(() => {
        if (!socket || !isOnline) return;

        const onRoomCreated = (data: any) => {
            console.log("[Socket] Room created:", data);
            setMyColor(data.color);
            setWaitingForOpponent(true);
        };

        const onJoinedRoom = (data: any) => {
            console.log("[Socket] Joined room:", data);
            setMyColor(data.color);
            myColorRef.current = data.color;
            setWaitingForOpponent(true);
            if (data.customData) {
                console.log("[Socket] Received custom data from joined room");
                setActiveProject(data.customData);
            }
        };

        const onStartGame = (data: any) => {
            console.log("[Socket] Game started!");
            setWaitingForOpponent(false);
            toast.success("Game Started!");
            if (data.customData) {
                setActiveProject(data.customData);
            }
        };

        const onRejoinGame = (data: any) => {
            console.log("[Socket] Rejoining game:", data);
            const colorMap: any = { 'white': 'white', 'black': 'black' };
            const resolvedColor = colorMap[data.color] || null;
            setMyColor(resolvedColor);
            myColorRef.current = resolvedColor;

            if (data.status === 'playing') setWaitingForOpponent(false);
            if (data.customData) {
                console.log("[Socket] Received custom data from rejoin");
                setActiveProject(data.customData);
            }
            if (data.history && data.history.length > 0) {
                setPendingHistory(data.history);
            }
        };

        const onRoomNotFound = (data: any) => {
            console.log("[Socket] Room not found:", data.roomId);
            // If we have active project data, we should CREATE the room instead
            if (activeProject && roomId) {
                console.log("[Socket] Creating room with custom data for:", roomId);
                socket.emit("create_room", {
                    roomId: roomId,
                    customData: activeProject,
                    isCustom: true
                });
            } else {
                console.warn("[Socket] Cannot create room: missing project data");
                toast.error("Room not found and no game data available to create it.");
            }
        };

        const onMove = (data: any) => {
            const currentGame = gameRef.current;
            if (!currentGame) {
                console.warn('[onMove] game not ready yet, ignoring move');
                return;
            }

            // Check if this is our own move that we already applied optimistically
            const lastLocal = lastLocalMoveRef.current;
            const isOwnMove = lastLocal && lastLocal.from === data.from && lastLocal.to === data.to;
            if (isOwnMove) {
                lastLocalMoveRef.current = null;
                const moveDesc = data.san || `${data.from} -> ${data.to}`;
                const snapshot = JSON.parse(JSON.stringify(currentGame.getBoard().getSquares()));
                setHistorySnapshots(prev => [...prev, snapshot]);
                setMoveHistory(prev => [...prev, moveDesc]);
                setViewIndex(prev => prev + 1);
                const newBoard = currentGame.getBoard().clone();
                setBoard(newBoard);
                boardRef.current = newBoard;
                return;
            }

            // Remote move from opponent
            if (data.from && data.to) {
                const success = currentGame.forceMove(data.from, data.to);
                if (success) {
                    const moveDesc = data.san || `${data.from} -> ${data.to}`;
                    addLog(`Opponent: ${moveDesc}`, 'move');
                    new Audio('/sounds/move-self.mp3').play().catch(() => { });

                    const snapshot = JSON.parse(JSON.stringify(currentGame.getBoard().getSquares()));
                    setHistorySnapshots(prev => [...prev, snapshot]);
                    setMoveHistory(prev => [...prev, moveDesc]);
                    setViewIndex(prev => prev + 1);

                    const newBoard = currentGame.getBoard().clone();
                    setBoard(newBoard);
                    boardRef.current = newBoard;

                    // Check for game-over on remote moves
                    if (!isOnline) {
                        const status = currentGame.getGameStatus();
                        if (status === 'checkmate') {
                            const loser = currentGame.getTurn();
                            const winner = loser === 'white' ? 'Black' : 'White';
                            setGameResultMessage(`Checkmate! ${winner} wins!`);
                            setGameOver(true);
                            addLog(`[CHECKMATE] ${winner} wins!`, 'effect');
                        } else if (status === 'stalemate') {
                            setGameResultMessage('Stalemate! Draw!');
                            setGameOver(true);
                            addLog(`[STALEMATE] Draw!`, 'effect');
                        }
                    }
                }
            }
        };

        socket.on("room_created", onRoomCreated);
        socket.on("joined_room", onJoinedRoom);
        socket.on("start_game", onStartGame);
        socket.on("rejoin_game", onRejoinGame);
        socket.on("room_not_found", onRoomNotFound);
        socket.on("move", onMove);
        socket.on("error", (data: any) => {
            console.warn("[Socket] Server error:", data.message, "pending local move:", !!lastLocalMoveRef.current);
            toast.error(data.message || "Invalid move");

            // Revert optimistic move if we have one pending
            if (lastLocalMoveRef.current) {
                lastLocalMoveRef.current = null;
                const currentGame = gameRef.current;
                if (currentGame) {
                    try {
                        currentGame.getBoard().undo();
                        const clonedBoard = currentGame.getBoard().clone();
                        setBoard(clonedBoard);
                        boardRef.current = clonedBoard;

                        setHistorySnapshots(prev => {
                            const next = prev.slice(0, -1);
                            console.log("[Socket] Reverted history snapshots, was", prev.length, "now", next.length);
                            return next;
                        });
                        setMoveHistory(prev => prev.slice(0, -1));
                        setViewIndex(prev => {
                            console.log("[Socket] Reverting viewIndex from", prev, "to", prev - 1);
                            return prev - 1;
                        });
                    } catch (err) {
                        console.error("[Socket] Failed to revert optimistic move:", err);
                    }
                }
            }
        });

        return () => {
            socket.off("room_created", onRoomCreated);
            socket.off("joined_room", onJoinedRoom);
            socket.off("start_game", onStartGame);
            socket.off("rejoin_game", onRejoinGame);
            socket.off("room_not_found", onRoomNotFound);
            socket.off("move", onMove);
            socket.off("error");
        };
    }, [socket, isOnline, game, board, activeProject, roomId]);

    // Engine Move Execution
    useEffect(() => {
        if (!engineEnabled || !game || !board || isOnline || gameOver) return;

        const currentTurn = board.getTurn();
        if (currentTurn !== engineColor) return;

        // Only move if we are at the latest state in history (prevent engine moving during undo/viewing)
        if (viewIndex !== historySnapshots.length - 1) return;

        const timer = setTimeout(() => {
            // Use refs to ensure we always have the latest game state
            const g = gameRef.current;
            if (!g) return;

            const legalMoves = g.getLegalMoves(engineColor);
            if (legalMoves.length > 0) {
                const move = legalMoves[Math.floor(Math.random() * legalMoves.length)];
                executeMove(move.from, move.to);
            }
        }, 800);

        return () => clearTimeout(timer);
    }, [engineEnabled, engineColor, board, game, viewIndex, historySnapshots.length, isOnline, gameOver]);


    // -- Prototype Logic --

    const squares = useMemo(() => board ? board.getSquares() : {}, [board]);
    const currentTurn = board ? board.getTurn() : "white";

    // P0: Compute legal moves for the selected piece
    const highlightedSquares = useMemo(() => {
        if (!selectedSquare || !game || !board) return new Set<string>();
        const piece = board.getSquares()[selectedSquare];
        if (!piece) return new Set<string>();
        // Only highlight if it's the piece's turn (or validation is off)
        if (validationEnabled && piece.color !== currentTurn) return new Set<string>();
        if (isOnline && myColor && piece.color !== myColor) return new Set<string>();
        const legalMoves = game.getLegalMoves(piece.color);
        const movesFromSelected = legalMoves.filter(m => m.from === selectedSquare);
        return new Set(movesFromSelected.map(m => m.to));
    }, [selectedSquare, game, board, currentTurn, validationEnabled, isOnline, myColor]);

    const addLog = useCallback((msg: string, type: 'info' | 'move' | 'effect' = 'info') => {
        setLogs(prev => [{ msg, type }, ...prev].slice(0, 50));
    }, []);

    useEffect(() => {
        if (!board) return;
        const handleEffect = (effect: { type: string, position: Square, params?: Record<string, any> }) => {
            const id = Date.now() + Math.random();
            setActiveEffects(prev => [...prev, { ...effect, id }]);
            addLog(`Effect: ${effect.type} at ${effect.position}`, 'effect');
            if (effect.type === 'tell-user') {
                setTimeout(() => {
                    setActiveEffects(prev => prev.filter(e => e.id !== id));
                }, 4000);
            }
        };

        board.addEffectListener(handleEffect);
        return () => board.removeEffectListener(handleEffect);
    }, [board, addLog]);

    // Listen for 'win' effect from custom piece logic
    useEffect(() => {
        if (!board) return;
        const handleWin = (effect: { type: string, position: Square, params?: Record<string, any> }) => {
            if (effect.type === 'win') {
                const winner = effect.position === 'white_win' ? 'White' : 'Black';
                setGameResultMessage(`${winner} wins! (Custom Rule)`);
                setGameOver(true);
                addLog(`[WIN] ${winner} wins via custom rule!`, 'effect');
            }
        };
        board.addEffectListener(handleWin);
        return () => board.removeEffectListener(handleWin);
    }, [board, addLog]);

    const handleEffectComplete = (id: number) => {
        setActiveEffects(prev => prev.filter(e => e.id !== id));
    };

    // -- History Navigation --
    const jumpToSnapshot = (index: number) => {
        if (!historySnapshots[index] || !activeProject) return;

        const snapshotSquares = historySnapshots[index];
        const hydratedSquares: Record<string, Piece | null> = {};
        const actualHeight = activeProject.rows || 8;

        Object.entries(snapshotSquares).forEach(([sq, pData]: [string, any]) => {
            if (!pData) {
                hydratedSquares[sq] = null;
                return;
            }
            const piece = createPieceFromData(pData.id, pData.type, pData.color, pData.position, activeProject.customPieces || []);
            if (pData.variables) {
                (piece as any).variables = pData.variables;
            }
            hydratedSquares[sq] = piece;
        });

        const restoredBoard = new BoardClass(
            hydratedSquares,
            activeProject.activeSquares?.length
                ? activeProject.activeSquares.map(asq => toAlgebraic(asq, actualHeight))
                : undefined,
            activeProject.cols || 8,
            actualHeight,
            activeProject.gridType || 'square',
            getNormalizedSquareLogic(activeProject)
        );

        const restoredGame = new Game(restoredBoard);
        setGame(restoredGame);
        gameRef.current = restoredGame;
        setBoard(restoredBoard);
        boardRef.current = restoredBoard;
        setViewIndex(index);
    };

    const handleDragStart = (e: DragStartEvent) => {
        if (!squares) return;
        if (gameOver) return;
        if (viewIndex !== historySnapshots.length - 1) return;

        const piece = squares[e.active.id as Square];
        // Check turn and ownership (bypass if validation disabled)
        if (piece && (!validationEnabled || piece.color === currentTurn)) {
            // Online check (still enforce online ownership if enabled)
            if (isOnline && myColor && piece.color !== myColor) return;

            setActivePiece(piece);
            setSelectedSquare(e.active.id as Square);
        }
    };

    const executeMove = (from: Square, to: Square) => {
        if (!game || !board || !squares || gameOver) return false;

        let success = false;
        if (validationEnabled) {
            success = game.makeMove(from, to);
        } else {
            success = game.forceMove(from, to);
        }

        if (success) {
            const moveDesc = `${from} -> ${to}`;
            addLog(`Move: ${moveDesc}`, 'move');
            const sound = new Audio('/sounds/move-self.mp3');
            sound.play().catch(() => { });

            // Update History
            const snapshot = JSON.parse(JSON.stringify(game.getBoard().getSquares()));
            setHistorySnapshots(prev => [...prev, snapshot]);
            setMoveHistory(prev => [...prev, moveDesc]);
            setViewIndex(prev => prev + 1);

            // Check for checkmate/stalemate in local play
            if (!isOnline) {
                const status = game.getGameStatus();
                if (status === 'checkmate') {
                    const loser = game.getTurn();
                    const winner = loser === 'white' ? 'Black' : 'White';
                    setGameResultMessage(`Checkmate! ${winner} wins!`);
                    setGameOver(true);
                    addLog(`[CHECKMATE] ${winner} wins!`, 'effect');
                    new Audio('/sounds/game-end.mp3').play().catch(() => { });
                } else if (status === 'stalemate') {
                    setGameResultMessage('Stalemate! Draw!');
                    setGameOver(true);
                    addLog(`[STALEMATE] Draw!`, 'effect');
                    new Audio('/sounds/game-end.mp3').play().catch(() => { });
                }
            }

            // Emit to server if online
            if (isOnline && socket) {
                lastLocalMoveRef.current = { from, to }; // Track for dedup in onMove
                socket.emit("move", {
                    from,
                    to,
                    san: moveDesc,
                    fen: "CUSTOM_FEN_PLACEHOLDER"
                });
            }
        } else {
            console.warn(`[Engine] Move rejected or prevented: ${from} -> ${to}`);
        }

        const newBoard = game.getBoard().clone();
        setBoard(newBoard);
        boardRef.current = newBoard;
        return success;
    };

    const handleSquareClick = (pos: Square) => {
        if (gameOver) return;
        if (viewIndex !== historySnapshots.length - 1) return;

        if (selectedSquare) {
            if (selectedSquare === pos) {
                setSelectedSquare(null);
            } else {
                const moveSuccess = executeMove(selectedSquare, pos);
                if (moveSuccess) {
                    setSelectedSquare(null);
                } else {
                    // Check if clicked another piece (bypass turn check if validation disabled)
                    const pieceOnTarget = squares[pos];
                    if (pieceOnTarget && (!validationEnabled || pieceOnTarget.color === currentTurn)) {
                        if (isOnline && myColor && pieceOnTarget.color !== myColor) return;
                        setSelectedSquare(pos);
                    } else {
                        setSelectedSquare(null);
                    }
                }
            }
        } else {
            const piece = squares[pos];
            if (piece && (!validationEnabled || piece.color === currentTurn)) {
                if (isOnline && myColor && piece.color !== myColor) return;
                setSelectedSquare(pos);
            }
        }
    };

    const handleRightClick = (pos: Square) => {
        const piece = squares[pos];
        if (!piece || !activeProject) return;

        // Find if it's a custom piece
        const customProto = activeProject.customPieces.find(cp => cp.name === piece.type || cp.id === piece.type);

        if (customProto && !isMarketplace) {
            toast(`Edit ${customProto.name}?`, {
                action: {
                    label: 'Edit',
                    onClick: () => router.push(`/editor/${projectId}/piece-editor?pieceId=${customProto.id}`)
                },
                description: "Jump to Piece Editor to modify logic/pixels."
            });
        }
    };

    const handleDragEnd = (e: DragEndEvent) => {
        if (gameOver) return;
        if (viewIndex !== historySnapshots.length - 1) return;
        setActivePiece(null);

        const { active, over } = e;
        if (over && active.id !== over.id) {
            executeMove(active.id as Square, over.id as Square);
        }
        setSelectedSquare(null);
    };

    const handleUndo = () => {
        if (viewIndex <= 0) return;
        if (isOnline) return; // Undo disabled in online mode for now

        const newIndex = viewIndex - 1;
        const newSnapshots = historySnapshots.slice(0, newIndex + 1);
        const newMoves = moveHistory.slice(0, newIndex);

        setHistorySnapshots(newSnapshots);
        setMoveHistory(newMoves);
        jumpToSnapshot(newIndex);
        addLog('Undo Move', 'info');
    };

    const handleReset = () => {
        if (isOnline) return;
        window.location.reload();
    };

    const handleCopyRoomCode = async () => {
        if (!roomId) return;
        try {
            await navigator.clipboard.writeText(roomId);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
            toast.success('Room code copied!');
        } catch (err) {
            console.error('Failed to copy:', err);
            toast.error('Failed to copy code');
        }
    };

    const handleShareGame = async () => {
        if (!roomId) return;
        const link = `${window.location.origin}/editor/${projectId}/play?roomId=${roomId}&mode=online`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Join my ${activeProject?.name} game!`,
                    text: `Join my custom chess variant: ${activeProject?.name}`,
                    url: link,
                });
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    console.error('Share failed:', err);
                }
            }
        } else {
            try {
                await navigator.clipboard.writeText(link);
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
                toast.success('Link copied!');
            } catch (err) {
                console.error('Failed to copy:', err);
                toast.error('Failed to copy link');
            }
        }
    };


    // -- Rendering --

    if (!isMounted) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
                    <div className="text-stone-400 font-bold uppercase tracking-widest text-xs animate-pulse">
                        Wird geladen...
                    </div>
                </div>
            </div>
        );
    }

    if (!activeProject && isOnline) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
                    <div className="text-stone-400 font-bold uppercase tracking-widest text-xs animate-pulse">
                        Synchronizing Game Data...
                    </div>
                </div>
            </div>
        );
    }

    if (!activeProject || !board || !game) return null;

    const gridType = activeProject.gridType || 'square';
    const bW = board.width || 8;
    const bH = board.height || 8;
    const allFiles = Array.from({ length: bW }, (_, i) => String.fromCharCode(97 + i));
    const allRanks = Array.from({ length: bH }, (_, i) => String(bH - i));

    const isFlipped = myColor === 'black';
    const files = isFlipped ? [...allFiles].reverse() : allFiles;
    const ranks = isFlipped ? [...allRanks].reverse() : allRanks;

    // For hex boards: build a set of active square keys (hex coord strings)
    const hexActiveSquareKeys = gridType === 'hex'
        ? new Set(activeProject.activeSquares || [])
        : new Set<string>();


    return (
        <div className="min-h-screen flex flex-col">
            {/* Simple Header */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-stone-800 z-50">
                <button onClick={() => isMarketplace ? router.push('/marketplace') : router.push(`/editor/${projectId}`)} className="text-stone-400 hover:text-white flex items-center gap-2">
                    <ArrowLeft size={18} /> Back
                </button>
                {isOnline && roomId && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-stone-800 rounded-lg border border-stone-700">
                        <Globe size={14} className="text-amber-500" />
                        <span className="text-xs font-mono text-stone-400">Room: <span className="text-white font-bold">{roomId}</span></span>
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-8 p-4 lg:p-8 max-w-7xl mx-auto w-full justify-center">

                {/* Board Area */}
                <div className="flex-1 flex flex-col items-center justify-center min-h-0 relative">

                    {gameOver && (
                        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm rounded-xl">
                            <div className="bg-stone-900/90 rounded-2xl p-8 max-w-sm text-center border border-amber-500/30 shadow-2xl">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                                    <span className="text-3xl text-amber-500 font-black">!</span>
                                </div>
                                <h3 className="text-2xl font-black text-white mb-2">Game Over</h3>
                                <p className="text-amber-400 font-bold text-lg mb-6">{gameResultMessage}</p>
                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={handleReset}
                                        className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors"
                                    >
                                        New Game
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {waitingForOpponent && (
                        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mb-4"></div>
                            <h3 className="text-xl font-bold text-white mb-2">Waiting for Opponent...</h3>
                            <div className="bg-stone-900/80 rounded-2xl p-6 max-w-sm">
                                <p className="text-stone-400 text-sm mb-3 text-center">Share the room code:</p>
                                <div
                                    onClick={handleCopyRoomCode}
                                    className="bg-stone-800 rounded-xl p-3 mb-4 cursor-pointer hover:bg-stone-700 transition-colors"
                                >
                                    <p className="text-amber-500 font-mono font-bold text-2xl text-center select-all">
                                        {roomId}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCopyRoomCode}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 rounded-xl text-white font-bold transition-colors"
                                    >
                                        <Copy size={16} />
                                        {copySuccess ? 'Copied!' : 'Copy Code'}
                                    </button>
                                    <button
                                        onClick={handleShareGame}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 rounded-xl text-white font-bold transition-colors"
                                    >
                                        <Share2 size={16} />
                                        Share
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <DndContext
                        sensors={sensors}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        measuring={{
                            droppable: {
                                strategy: MeasuringStrategy.WhileDragging,
                            },
                        }}
                    >
                        <div className="relative shadow-2xl rounded-xl border-8 border-stone-800 bg-stone-800 shadow-stone-950/50 overflow-visible transition-all duration-300"
                            style={{ transform: `scale(${zoom})` }}>

                            {/* Hex Board Renderer */}
                            {gridType === 'hex' ? (
                                <HexPlayBoardRenderer
                                    board={board}
                                    squares={squares}
                                    rows={bH}
                                    cols={bW}
                                    activeSquareKeys={hexActiveSquareKeys}
                                    selectedSquare={selectedSquare}
                                    highlightedSquares={highlightedSquares}
                                    activeEffects={activeEffects}
                                    currentTurn={currentTurn}
                                    myColor={myColor}
                                    isOnline={isOnline}
                                    waitingForOpponent={waitingForOpponent}
                                    validationEnabled={validationEnabled}
                                    onSquareClick={handleSquareClick}
                                    onRightClick={handleRightClick}
                                    onHover={(p: Square) => setHoveredSquare(p)}
                                    onHoverLeave={() => setHoveredSquare(null)}
                                    onEffectComplete={handleEffectComplete}
                                />
                            ) : (
                                /* Square Board Renderer */
                                <div
                                    className="grid"
                                    style={{
                                        gridTemplateColumns: `repeat(${bW}, 1fr)`,
                                        gridTemplateRows: `repeat(${bH}, 1fr)`,
                                        zIndex: 20,
                                        position: 'relative',
                                        width: 'min(560px, 85vw)',
                                        aspectRatio: `${bW} / ${bH}`,
                                        backgroundColor: '#292524',
                                    }}
                                >
                                    {ranks.map((rank, rIdx) => (
                                        files.map((file, fIdx) => {
                                            const pos = `${file}${rank}` as Square;
                                            const isWhite = (rIdx + fIdx) % 2 === 0;

                                            if (!board.isActive(pos)) {
                                                return <div key={pos} className="aspect-square bg-transparent" />;
                                            }

                                            // Determine if it's my turn to allow interaction
                                            const piece = squares[pos];
                                            const pieceOwner = piece?.color === currentTurn;
                                            const canInteract = !waitingForOpponent && (!isOnline || (myColor && piece?.color === myColor && currentTurn === (myColor === 'white' ? 'white' : 'black')));

                                            return (
                                                <BoardSquare
                                                    key={pos}
                                                    pos={pos}
                                                    isWhite={isWhite}
                                                    piece={squares[pos]}
                                                    size={70}
                                                    onSelect={handleSquareClick}
                                                    onContextMenu={handleRightClick}
                                                    isSelected={selectedSquare === pos}
                                                    amIAtTurn={canInteract}
                                                    effects={activeEffects.filter(e => e.position === pos)}
                                                    onEffectComplete={handleEffectComplete}
                                                    isHighlighted={highlightedSquares.has(pos)}
                                                    isCapture={highlightedSquares.has(pos) && !!squares[pos]}
                                                    onHover={(p: Square) => setHoveredSquare(p)}
                                                    onHoverLeave={() => setHoveredSquare(null)}
                                                />
                                            );
                                        })
                                    ))}
                                </div>
                            )}

                            {/* P1a: Piece Hover Tooltip */}
                            <AnimatePresence>
                                {showPieceInfo && hoveredSquare && squares[hoveredSquare] && (
                                    <PieceTooltip
                                        key={hoveredSquare}
                                        piece={squares[hoveredSquare]!}
                                        boardRef={boardContainerRef}
                                    />
                                )}
                            </AnimatePresence>
                        </div>

                        <DragOverlay>
                            {activePiece ? (
                                <div className="opacity-80 scale-110 flex items-center justify-center pointer-events-none" style={{ width: 70 * zoom, height: 70 * zoom }}>
                                    <PieceRenderer
                                        type={activePiece.type}
                                        color={activePiece.color}
                                        size={70 * zoom}
                                        pixels={(activePiece as any).isCustom ? (activePiece.color === 'white' ? (activePiece as any).pixelsWhite : (activePiece as any).pixelsBlack) : undefined}
                                        image={(activePiece as any).image}
                                    />
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>

                    <div className="mt-6 flex items-center gap-4">
                        {!isOnline && (
                            <>
                                <button
                                    onClick={handleUndo}
                                    className="flex items-center gap-2 px-4 py-2 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 rounded-xl font-bold transition-colors text-white"
                                >
                                    <Undo2 size={18} /> Undo
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl font-bold transition-all"
                                >
                                    <RefreshCw size={18} /> Reset
                                </button>
                            </>
                        )}
                        {isOnline && (
                            <div className="px-4 py-2 bg-stone-800 rounded-xl text-stone-400 font-bold text-sm">
                                Playing as: <span className={myColor === 'white' ? 'text-white' : 'text-stone-500'}>{myColor}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Area */}
                <div className="w-full lg:w-80 flex flex-col gap-6 h-full justify-center">

                    {/* Engine Toggle Card - Local Play Only */}
                    {!isOnline && (
                        <EngineToggleCard
                            enabled={engineEnabled}
                            color={engineColor}
                            onToggle={() => setEngineEnabled(!engineEnabled)}
                            onColorChange={setEngineColor}
                        />
                    )}

                    {/* Controls Card */}
                    <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-xl border border-stone-200 dark:border-stone-800 space-y-6">
                        <div className="flex items-center gap-3 border-b border-stone-100 dark:border-white/10 pb-4">
                            <div className="p-2 bg-amber-500 rounded-xl text-white">
                                <Play size={20} fill="currentColor" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black uppercase tracking-tight leading-none text-stone-900 dark:text-white">
                                    {isOnline ? 'Online Match' : 'Play'}
                                </h2>
                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">
                                    {isOnline ? 'Multiplayer' : 'Gegen dich selbst spielen'}
                                </p>
                            </div>
                        </div>

                        {/* Validation Toggle */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-stone-600 dark:text-stone-400">Zugvalidierung</span>
                            <button
                                onClick={() => setValidationEnabled(!validationEnabled)}
                                className={`w-12 h-7 rounded-full transition-colors relative ${validationEnabled ? 'bg-green-500' : 'bg-stone-300 dark:bg-stone-700'}`}
                            >
                                <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${validationEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {/* Show Piece Info Toggle */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Eye size={14} className="text-stone-400" />
                                <span className="text-sm font-bold text-stone-600 dark:text-stone-400">Piece Info on Hover</span>
                            </div>
                            <button
                                onClick={() => setShowPieceInfo(!showPieceInfo)}
                                className={`w-12 h-7 rounded-full transition-colors relative ${showPieceInfo ? 'bg-green-500' : 'bg-stone-300 dark:bg-stone-700'}`}
                            >
                                <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${showPieceInfo ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {/* Zoom Controls */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Zoom</span>
                                <span className="text-xs font-black tabular-nums text-stone-900 dark:text-white">{Math.round(zoom * 100)}%</span>
                            </div>
                            <div className="flex items-center gap-2 bg-stone-100 dark:bg-stone-800 rounded-xl p-1">
                                <button onClick={() => setZoom(z => Math.max(0.4, z - 0.1))} className="flex-1 p-2 hover:bg-white dark:hover:bg-white/10 rounded-lg transition-colors text-stone-500 dark:text-stone-400">
                                    <Minus size={16} className="mx-auto" />
                                </button>
                                <div className="w-px h-4 bg-stone-300 dark:bg-stone-700" />
                                <button onClick={() => setZoom(z => Math.min(2.0, z + 0.1))} className="flex-1 p-2 hover:bg-white dark:hover:bg-white/10 rounded-lg transition-colors text-stone-500 dark:text-stone-400">
                                    <Plus size={16} className="mx-auto" />
                                </button>
                            </div>
                        </div>

                        {!isOnline && (
                            <div className="border-t border-stone-200 dark:border-white/10 pt-4 flex gap-2">
                                <button
                                    onClick={handleReset}
                                    className="flex-1 py-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                                >
                                    Reset
                                </button>
                                <button
                                    onClick={handleUndo}
                                    className="flex-1 py-3 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                                >
                                    Undo
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Move History */}
                    <div className="flex-1 bg-white dark:bg-stone-900 rounded-3xl shadow-xl border border-stone-200 dark:border-stone-800 flex flex-col overflow-hidden max-h-[400px]">
                        <div className="p-4 border-b border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-stone-950/30 flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-widest text-stone-500">Züge ({moveHistory.length})</span>
                            <div className="flex gap-1">
                                <button
                                    disabled={viewIndex === 0}
                                    onClick={() => jumpToSnapshot(viewIndex - 1)}
                                    className="p-1.5 hover:bg-stone-200 dark:hover:bg-white/10 rounded-lg disabled:opacity-30 transition-colors"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    disabled={viewIndex === historySnapshots.length - 1}
                                    onClick={() => jumpToSnapshot(viewIndex + 1)}
                                    className="p-1.5 hover:bg-stone-200 dark:hover:bg-white/10 rounded-lg disabled:opacity-30 transition-colors"
                                >
                                    <ChevronRight size={16} />
                                </button>
                                <button
                                    disabled={viewIndex === historySnapshots.length - 1}
                                    onClick={() => jumpToSnapshot(historySnapshots.length - 1)}
                                    className="p-1.5 hover:bg-stone-200 dark:hover:bg-white/10 rounded-lg disabled:opacity-30 transition-colors"
                                >
                                    <ChevronsRight size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                            <div className="grid grid-cols-2 gap-2">
                                {moveHistory.map((move, i) => (
                                    <button
                                        key={i}
                                        onClick={() => jumpToSnapshot(i + 1)}
                                        className={`px-3 py-2 text-xs font-bold rounded-lg text-left transition-colors ${viewIndex === (i + 1) ? 'bg-amber-500 text-white' : 'bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 text-stone-600 dark:text-stone-400'}`}
                                    >
                                        <span className={`mr-2 ${viewIndex === (i + 1) ? 'text-white/60' : 'text-stone-400 dark:text-stone-600'}`}>{Math.floor(i / 2) + 1}.</span>
                                        {move}
                                    </button>
                                ))}
                                {moveHistory.length === 0 && (
                                    <div className="col-span-2 text-center py-4 text-stone-400 text-xs italic">
                                        Noch keine Züge
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}