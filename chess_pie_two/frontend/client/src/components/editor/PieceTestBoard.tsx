'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Game } from '@/engine/game';
import { BoardClass } from '@/engine/board';
import { CustomPiece as EngineCustomPiece, Piece } from '@/engine/piece';
import { Square } from '@/engine/types';
import PieceRenderer from '@/components/game/PieceRenderer';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, useSensor, useSensors, PointerSensor, TouchSensor, MeasuringStrategy } from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Play, Info } from 'lucide-react';
import { CustomPiece } from '@/types/firestore';

interface PieceTestBoardProps {
    currentPiece: CustomPiece;
    pieceColor: 'white' | 'black';
}

function BoardSquare({ pos, isWhite, piece, size, onSelect, isSelected, isHighlighted }: any) {
    const { setNodeRef, isOver } = useDroppable({ id: pos });

    return (
        <div
            ref={setNodeRef}
            onClick={() => onSelect(pos)}
            className={`aspect-square relative flex items-center justify-center box-border cursor-pointer ${isOver ? 'ring-4 ring-inset ring-amber-400' : ''} ${isSelected ? 'after:content-[""] after:absolute after:inset-0 after:bg-amber-400/30 after:ring-4 after:ring-inset after:ring-amber-400' : ''}`}
            style={{
                backgroundColor: isWhite ? '#ebecd0' : '#779556',
                zIndex: isSelected ? 2 : 1,
            }}
        >
            {piece && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     {piece}
                </div>
            )}

            {isHighlighted && (
                <div
                    className="absolute rounded-full pointer-events-none z-10"
                    style={{
                        width: `${size * 0.33}px`,
                        height: `${size * 0.33}px`,
                        backgroundColor: 'rgba(0, 0, 0, 0.25)',
                    }}
                />
            )}
        </div>
    );
}

const DraggableWrapper = ({ id, children }: { id: string, children: React.ReactNode }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 100,
    } : undefined;

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={isDragging ? 'opacity-0' : ''}>
            {children}
        </div>
    );
};

export default function PieceTestBoard({ currentPiece, pieceColor }: PieceTestBoardProps) {
    const [game, setGame] = useState<Game | null>(null);
    const [piecePos, setPiecePos] = useState<Square>('d4');
    const [activePiece, setActivePiece] = useState<Piece | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
    );

    useEffect(() => {
        const enginePiece = new EngineCustomPiece(
            currentPiece.id || 'test-id',
            'custom',
            pieceColor,
            piecePos,
            currentPiece.moves || [],
            []
        );
        
        (enginePiece as any).isCustom = true;
        (enginePiece as any).pixelsWhite = currentPiece.pixelsWhite;
        (enginePiece as any).pixelsBlack = currentPiece.pixelsBlack;
        (enginePiece as any).image = pieceColor === 'white' ? currentPiece.imageWhite : currentPiece.imageBlack;

        const board = new BoardClass({ [piecePos]: enginePiece }, Array.from({length: 64}, (_, i) => {
            const f = String.fromCharCode(97 + (i % 8));
            const r = 1 + Math.floor(i / 8);
            return `${f}${r}` as Square;
        }));
        
        setGame(new Game(board));
    }, [currentPiece, pieceColor, piecePos]);

    const squares = useMemo(() => game?.getBoard().getSquares() || {}, [game]);
    
    const highlightedSquares = useMemo(() => {
        if (!game) return new Set<string>();
        const moves = game.getLegalMoves(pieceColor);
        return new Set(moves.filter(m => m.from === piecePos).map(m => m.to));
    }, [game, pieceColor, piecePos]);

    const handleSquareClick = (pos: Square) => {
        setPiecePos(pos);
    };

    const handleDragStart = (event: DragStartEvent) => {
        const piece = squares[event.active.id as Square];
        if (piece) setActivePiece(piece);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActivePiece(null);
        if (event.over) {
            const to = event.over.id as Square;
            if (highlightedSquares.has(to)) {
                setPiecePos(to);
            }
        }
    };

    const allFiles = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const allRanks = ['8', '7', '6', '5', '4', '3', '2', '1'];

    return (
        <div className="flex flex-col items-center gap-6 p-6 bg-stone-900/50 rounded-3xl border border-stone-800 backdrop-blur-sm">
            <div className="flex items-center gap-3 w-full border-b border-stone-800 pb-4">
                <div className="p-2 bg-amber-500 rounded-xl text-white">
                    <Play size={20} fill="currentColor" />
                </div>
                <div>
                    <h2 className="text-lg font-black uppercase tracking-tight text-white">Test Board</h2>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Move your piece to test rules</p>
                </div>
            </div>

            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                measuring={{ droppable: { strategy: MeasuringStrategy.WhileDragging } }}
            >
                <div className="relative shadow-2xl rounded-xl border-4 border-stone-800 bg-stone-800 overflow-hidden">
                    <div
                        className="grid grid-cols-8 grid-rows-8"
                        style={{
                            width: 'min(400px, 70vw)',
                            aspectRatio: '1 / 1',
                            backgroundColor: '#292524',
                        }}
                    >
                        {allRanks.map((rank, rIdx) => (
                            allFiles.map((file, fIdx) => {
                                const pos = `${file}${rank}` as Square;
                                const isWhite = (rIdx + fIdx) % 2 === 0;
                                const piece = squares[pos];

                                return (
                                    <BoardSquare
                                        key={pos}
                                        pos={pos}
                                        isWhite={isWhite}
                                        piece={piece ? (
                                            <DraggableWrapper id={pos}>
                                                 <PieceRenderer
                                                    type={piece.type}
                                                    color={piece.color}
                                                    size={40}
                                                    pixels={piece.color === 'white' ? (piece as any).pixelsWhite : (piece as any).pixelsBlack}
                                                    image={(piece as any).image}
                                                />
                                            </DraggableWrapper>
                                        ) : null}
                                        size={50}
                                        onSelect={handleSquareClick}
                                        isSelected={piecePos === pos}
                                        isHighlighted={highlightedSquares.has(pos)}
                                    />
                                );
                            })
                        ))}
                    </div>
                </div>

                <DragOverlay>
                    {activePiece ? (
                        <div className="opacity-80 scale-110 flex items-center justify-center pointer-events-none">
                            <PieceRenderer
                                type={activePiece.type}
                                color={activePiece.color}
                                size={50}
                                pixels={activePiece.color === 'white' ? (activePiece as any).pixelsWhite : (activePiece as any).pixelsBlack}
                                image={(activePiece as any).image}
                            />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            <button
                onClick={() => setPiecePos('d4')}
                className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-xl font-bold transition-all text-sm uppercase tracking-wider"
            >
                <RefreshCw size={16} /> Reset Position
            </button>
            
            <div className="flex items-start gap-3 p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 max-w-sm">
                <Info size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200/80 leading-relaxed font-medium">
                    Drag the piece or click any square to teleport it. Highlighted squares indicate legal moves based on your current rules.
                </p>
            </div>
        </div>
    );
}
