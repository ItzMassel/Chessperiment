"use client";
import React, { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { AnimatePresence } from 'framer-motion';
import { Piece } from '@/engine/piece';
import { Square } from '@/engine/types';
import PieceRenderer from '@/components/game/PieceRenderer';
import KillEffect from '@/components/game/KillEffect';
import { HexGrid } from '@/lib/grid/HexGrid';
import { useDraggable } from '@dnd-kit/core';

const HEX_CLIP_PATH = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';

// Draggable piece for hex board
const HexDraggablePiece = React.memo(({ piece, size, amIAtTurn }: { piece: Piece; size: number; amIAtTurn: boolean }) => {
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
}, (prev, next) => prev.piece.id === next.piece.id && prev.piece.position === next.piece.position && prev.amIAtTurn === next.amIAtTurn);

// Individual hex tile in play mode
const HexSquare = React.memo(({ pos, piece, size, isWhite, onSelect, onContextMenu, isSelected, amIAtTurn, effects, onEffectComplete, isHighlighted, isCapture, onHover, onHoverLeave }: {
    pos: Square;
    piece: Piece | null;
    size: number;
    isWhite: boolean;
    onSelect: (pos: Square) => void;
    onContextMenu: (pos: Square) => void;
    isSelected: boolean;
    amIAtTurn: boolean;
    effects: { id: number; type: string; position: Square }[];
    onEffectComplete: (id: number) => void;
    isHighlighted: boolean;
    isCapture: boolean;
    onHover?: (pos: Square) => void;
    onHoverLeave?: () => void;
}) => {
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
            className="relative flex items-center justify-center"
            style={{
                width: size,
                height: size,
                clipPath: HEX_CLIP_PATH,
                backgroundColor: isWhite ? '#ebecd0' : '#779556',
                zIndex: isSelected ? 2 : 1,
                overflow: 'visible',
            }}
        >
            {/* Selection highlight */}
            {isSelected && (
                <div className="absolute inset-0 bg-amber-400/30" style={{ clipPath: HEX_CLIP_PATH }} />
            )}

            {/* Over highlight for drag */}
            {isOver && (
                <div className="absolute inset-0 bg-amber-400/20" style={{ clipPath: HEX_CLIP_PATH }} />
            )}

            {piece && (
                <HexDraggablePiece piece={piece} size={size * 0.75} amIAtTurn={amIAtTurn} />
            )}

            {/* Legal-move highlight dot */}
            {isHighlighted && !isCapture && (
                <div
                    className="absolute rounded-full pointer-events-none z-10"
                    style={{
                        width: `${size * 0.3}px`,
                        height: `${size * 0.3}px`,
                        backgroundColor: 'rgba(0, 0, 0, 0.25)',
                    }}
                />
            )}
            {/* Legal-move capture ring */}
            {isHighlighted && isCapture && (
                <div
                    className="absolute rounded-full pointer-events-none z-10"
                    style={{
                        width: `${size * 0.85}px`,
                        height: `${size * 0.85}px`,
                        border: '4px solid rgba(0, 0, 0, 0.25)',
                    }}
                />
            )}

            <AnimatePresence>
                {effects.map((effect) => (
                    <KillEffect
                        key={effect.id}
                        size={size}
                        onComplete={() => onEffectComplete(effect.id)}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
});

interface HexPlayBoardRendererProps {
    board: any; // BoardClass
    squares: Record<string, Piece | null>;
    rows: number;
    cols: number;
    activeSquareKeys: Set<string>;
    selectedSquare: Square | null;
    highlightedSquares: Set<Square>;
    activeEffects: { id: number; type: string; position: Square }[];
    currentTurn: 'white' | 'black';
    myColor: 'white' | 'black' | null;
    isOnline: boolean;
    waitingForOpponent: boolean;
    validationEnabled: boolean;
    onSquareClick: (pos: Square) => void;
    onRightClick: (pos: Square) => void;
    onHover: (pos: Square) => void;
    onHoverLeave: () => void;
    onEffectComplete: (id: number) => void;
}

export default function HexPlayBoardRenderer({
    board,
    squares,
    rows,
    cols,
    activeSquareKeys,
    selectedSquare,
    highlightedSquares,
    activeEffects,
    currentTurn,
    myColor,
    isOnline,
    waitingForOpponent,
    validationEnabled,
    onSquareClick,
    onRightClick,
    onHover,
    onHoverLeave,
    onEffectComplete,
}: HexPlayBoardRendererProps) {
    const hexGrid = useMemo(() => new HexGrid(), []);

    // Generate all hex coordinates and compute their pixel positions
    const TILE_SIZE = 70;
    const allCoords = useMemo(() => hexGrid.generateInitialGrid(rows, cols), [hexGrid, rows, cols]);

    // Compute bounding box for centering
    const { positions, containerWidth, containerHeight } = useMemo(() => {
        const posMap: { key: string; x: number; y: number; q: number; r: number }[] = [];
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

        for (const coord of allCoords) {
            const key = hexGrid.coordToString(coord);
            const pos = hexGrid.getPixelPosition(coord, TILE_SIZE);
            posMap.push({ key, x: pos.x, y: pos.y, q: coord.q, r: coord.r });
            minX = Math.min(minX, pos.x);
            maxX = Math.max(maxX, pos.x);
            minY = Math.min(minY, pos.y);
            maxY = Math.max(maxY, pos.y);
        }

        // Add padding for tile size
        const pad = TILE_SIZE / 2;
        const w = maxX - minX + TILE_SIZE + pad;
        const h = maxY - minY + TILE_SIZE + pad;

        // Offset all positions so they're relative to 0,0
        const offsetX = -minX + TILE_SIZE / 2 + pad / 4;
        const offsetY = -minY + TILE_SIZE / 2 + pad / 4;

        return {
            positions: posMap.map(p => ({ ...p, x: p.x + offsetX, y: p.y + offsetY })),
            containerWidth: w,
            containerHeight: h,
        };
    }, [allCoords, hexGrid]);

    return (
        <div
            className="relative"
            style={{
                width: containerWidth,
                height: containerHeight,
                maxWidth: '85vw',
            }}
        >
            {positions.map(({ key, x, y, q, r }) => {
                // Only render active squares
                if (!activeSquareKeys.has(key)) return null;

                const piece = squares[key] || null;
                const isWhite = (q + r) % 2 === 0;
                const canInteract = !waitingForOpponent && (!isOnline || (myColor && piece?.color === myColor && currentTurn === myColor));

                return (
                    <div
                        key={key}
                        className="absolute"
                        style={{
                            left: x,
                            top: y,
                            transform: 'translate(-50%, -50%)',
                        }}
                    >
                        <HexSquare
                            pos={key as Square}
                            piece={piece}
                            size={TILE_SIZE}
                            isWhite={isWhite}
                            onSelect={onSquareClick}
                            onContextMenu={onRightClick}
                            isSelected={selectedSquare === key}
                            amIAtTurn={!!canInteract}
                            effects={activeEffects.filter(e => e.position === key)}
                            onEffectComplete={onEffectComplete}
                            isHighlighted={highlightedSquares.has(key as Square)}
                            isCapture={highlightedSquares.has(key as Square) && !!piece}
                            onHover={onHover}
                            onHoverLeave={onHoverLeave}
                        />
                    </div>
                );
            })}
        </div>
    );
}
