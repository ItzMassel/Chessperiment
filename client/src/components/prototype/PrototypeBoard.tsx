"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Game } from '@/engine/game';
import { BoardClass } from '@/engine/board';
import { Piece } from '@/engine/piece';
import { Square } from '@/engine/types';
import PieceRenderer from '@/components/game/PieceRenderer';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Undo2, Play, AlertCircle, Info, Settings2, Trash2 } from 'lucide-react';

// Draggable Piece Component
function DraggablePiece({ piece, size, amIAtTurn }: { piece: Piece; size: number; amIAtTurn: boolean }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: piece.position,
        data: piece,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 100,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...(amIAtTurn ? { ...attributes, ...listeners } : {})}
            className={`cursor-${amIAtTurn ? 'grab' : 'default'} ${isDragging ? 'opacity-0' : 'opacity-100'} w-full h-full flex items-center justify-center`}
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
}

import KillEffect from '@/components/game/KillEffect';

// droppable Square Component
function BoardSquare({ pos, isWhite, piece, size, onSelect, isSelected, amIAtTurn, effects, onEffectComplete }: any) {
    const { setNodeRef, isOver } = useDroppable({ id: pos });

    return (
        <div
            ref={setNodeRef}
            onClick={() => onSelect(pos)}
            className={`relative flex items-center justify-center transition-colors duration-200
                ${isWhite ? 'bg-[#ebecd0]' : 'bg-[#779556]'}
                ${isOver ? 'ring-4 ring-amber-400 ring-inset z-10' : ''}
                ${isSelected ? 'bg-amber-200/50' : ''}
            `}
            style={{ width: size, height: size }}
        >
            {piece && (
                <DraggablePiece piece={piece} size={size * 0.85} amIAtTurn={amIAtTurn} />
            )}

            <AnimatePresence>
                {effects.map((effect: any) => (
                    <KillEffect
                        key={effect.id}
                        size={size}
                        onComplete={() => onEffectComplete(effect.id)}
                    />
                ))}
            </AnimatePresence>

            {/* Coordinate Labels */}
            {pos[1] === '1' && (
                <span className={`absolute bottom-0.5 right-0.5 text-[10px] font-bold ${isWhite ? 'text-[#779556]' : 'text-[#ebecd0]'}`}>
                    {pos[0]}
                </span>
            )}
            {pos[0] === 'a' && (
                <span className={`absolute top-0.5 left-0.5 text-[10px] font-bold ${isWhite ? 'text-[#779556]' : 'text-[#ebecd0]'}`}>
                    {pos[1]}
                </span>
            )}
        </div>
    );
}

export default function PrototypeBoard() {
    const [game, setGame] = useState<Game>(() => new Game());
    const [board, setBoard] = useState<BoardClass>(() => game.getBoard());
    const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
    const [activePiece, setActivePiece] = useState<Piece | null>(null);
    const [logs, setLogs] = useState<{ msg: string, type: 'info' | 'move' | 'effect' }[]>([]);
    const [activeEffects, setActiveEffects] = useState<{ id: number, type: string, position: Square }[]>([]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
    );

    const squares = useMemo(() => board.getSquares(), [board]);
    const currentTurn = board.getTurn();

    const addLog = useCallback((msg: string, type: 'info' | 'move' | 'effect' = 'info') => {
        setLogs(prev => [{ msg, type }, ...prev].slice(0, 50));
    }, []);

    useEffect(() => {
        const handleEffect = (effect: { type: string, position: Square }) => {
            const id = Date.now() + Math.random();
            setActiveEffects(prev => [...prev, { ...effect, id }]);
            addLog(`Effect: ${effect.type} at ${effect.position}`, 'effect');
        };

        board.addEffectListener(handleEffect);
        return () => board.removeEffectListener(handleEffect);
    }, [board, addLog]);

    const handleEffectComplete = (id: number) => {
        setActiveEffects(prev => prev.filter(e => e.id !== id));
    };

    const handleDragStart = (e: DragStartEvent) => {
        const piece = squares[e.active.id as Square];
        if (piece) setActivePiece(piece);
    };

    const handleSquareClick = (pos: Square) => {
        if (selectedSquare === pos) {
            setSelectedSquare(null);
        } else if (selectedSquare) {
            const success = game.makeMove(selectedSquare, pos);
            if (!success) {
                console.warn(`[Prototype] Move from ${selectedSquare} to ${pos} was rejected or prevented.`);
            }

            // Always sync state
            const newBoard = game.getBoard().clone();
            setBoard(newBoard);

            if (success) {
                addLog(`Move: ${selectedSquare} to ${pos}`, 'move');
                setSelectedSquare(null);
            } else {
                addLog(`Move rejected/prevented: ${selectedSquare} to ${pos}`, 'info');
                // If it's another piece of the same color, select that instead
                const piece = squares[pos];
                if (piece && piece.color === currentTurn) {
                    setSelectedSquare(pos);
                } else {
                    setSelectedSquare(null);
                }
            }
        } else {
            const piece = squares[pos];
            if (piece && piece.color === currentTurn) {
                setSelectedSquare(pos);
            }
        }
    };

    const handleDragEnd = (e: DragEndEvent) => {
        setActivePiece(null);
        const { active, over } = e;
        if (over && active.id !== over.id) {
            const from = active.id as Square;
            const to = over.id as Square;

            const success = game.makeMove(from, to);
            if (!success) {
                console.warn(`[Prototype] Move from ${from} to ${to} was rejected or prevented.`);
            }
            // Always sync state, as logic might have changed pieces even if move was 'rejected' (e.g. kill effect)
            const newBoard = game.getBoard().clone();
            setBoard(newBoard);

            if (success) {
                addLog(`Move: ${from} to ${to}`, 'move');
            } else {
                addLog(`Move rejected/prevented: ${from} to ${to}`, 'info');
            }
        }
    };

    const handleUndo = () => {
        board.undo();
        setBoard(board.clone());
        addLog('Undo Move', 'info');
    };

    const handleReset = () => {
        const newGame = new Game();
        setGame(newGame);
        setBoard(newGame.getBoard());
        setLogs([{ msg: 'Game Reset', type: 'info' }]);
    };

    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

    return (
        <div className="flex flex-col lg:flex-row gap-8 p-4 lg:p-8 max-w-7xl mx-auto h-full overflow-hidden">
            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="relative shadow-2xl rounded-xl overflow-hidden border-8 border-stone-800 bg-stone-800">
                    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                        <div className="grid grid-cols-8">
                            {ranks.map((rank, rIdx) => (
                                files.map((file, fIdx) => {
                                    const pos = `${file}${rank}` as Square;
                                    const isWhite = (rIdx + fIdx) % 2 === 0;
                                    return (
                                        <BoardSquare
                                            key={pos}
                                            pos={pos}
                                            isWhite={isWhite}
                                            piece={squares[pos]}
                                            size={70}
                                            onSelect={handleSquareClick}
                                            isSelected={selectedSquare === pos}
                                            amIAtTurn={squares[pos]?.color === currentTurn}
                                            effects={activeEffects.filter(e => e.position === pos)}
                                            onEffectComplete={handleEffectComplete}
                                        />
                                    );
                                })
                            ))}
                        </div>

                        <DragOverlay>
                            {activePiece ? (
                                <div className="opacity-80 scale-110">
                                    <PieceRenderer
                                        type={activePiece.type}
                                        color={activePiece.color}
                                        size={60}
                                    />
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                </div>

                <div className="mt-6 flex items-center gap-4">
                    <button
                        onClick={handleUndo}
                        className="flex items-center gap-2 px-4 py-2 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 rounded-xl font-bold transition-colors"
                    >
                        <Undo2 size={18} /> Undo
                    </button>
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl font-bold transition-all"
                    >
                        <RefreshCw size={18} /> Reset
                    </button>
                </div>
            </div>

            <div className="w-full lg:w-96 flex flex-col gap-6">
                {/* Status Card */}
                <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-xl border border-stone-200 dark:border-stone-800">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                            <Settings2 className="text-amber-500" /> Game State
                        </h2>
                        <div className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest ${currentTurn === 'white' ? 'bg-stone-100 text-stone-900' : 'bg-stone-950 text-white'}`}>
                            {currentTurn}'s Turn
                        </div>
                    </div>

                    {selectedSquare ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-4 p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl">
                                <PieceRenderer
                                    type={squares[selectedSquare]?.type || 'Empty'}
                                    color={squares[selectedSquare]?.color || 'white'}
                                    size={48}
                                />
                                <div>
                                    <h3 className="font-black uppercase text-sm tracking-tight">{squares[selectedSquare]?.type || 'Empty Square'}</h3>
                                    <p className="text-xs text-stone-500 font-bold uppercase">{selectedSquare}</p>
                                </div>
                            </div>

                            {squares[selectedSquare] && (squares[selectedSquare] as any).isCustom && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Piece Variables</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries((squares[selectedSquare] as any).variables || {}).map(([key, val]) => (
                                            <div key={key} className="p-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-900/30 rounded-lg">
                                                <p className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase">{key}</p>
                                                <p className="text-sm font-black text-amber-900 dark:text-amber-200">{val as any}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-stone-400">
                            <Info size={32} className="mb-2 opacity-20" />
                            <p className="text-xs font-bold uppercase tracking-widest">Select a square to view info</p>
                        </div>
                    )}
                </div>

                {/* Logs Card */}
                <div className="flex-1 bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-xl border border-stone-200 dark:border-stone-800 flex flex-col overflow-hidden">
                    <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2 mb-4">
                        <AlertCircle className="text-blue-500" /> Event Log
                    </h2>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                        <AnimatePresence initial={false}>
                            {logs.map((log, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`p-3 rounded-xl text-xs font-medium border ${log.type === 'move' ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30 text-blue-700 dark:text-blue-400' :
                                        log.type === 'effect' ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                                            'bg-stone-50 dark:bg-stone-800 border-stone-100 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                                        }`}
                                >
                                    <span className="font-bold mr-2">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                                    {log.msg}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
