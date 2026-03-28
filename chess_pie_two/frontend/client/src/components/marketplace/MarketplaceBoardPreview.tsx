'use client';

import React from 'react';
import Image from 'next/image';
import { getPieceImage } from '@/lib/gameData';
import { SquareGrid } from '@/lib/grid/SquareGrid';
import { HexGrid } from '@/lib/grid/HexGrid';

type PreviewConfig = NonNullable<import('@/lib/marketplace-types').MarketplaceItem['preview_config']>;

const CELL = 18; // px per square in mini board

function MiniPiece({ type, color, size, imageWhite, imageBlack }: {
    type: string;
    color: string;
    size: number;
    imageWhite?: string;
    imageBlack?: string;
}) {
    const customImage = color === 'white' ? imageWhite : imageBlack;
    if (customImage) {
        return (
            <img
                src={customImage}
                alt=""
                style={{ width: size, height: size, objectFit: 'contain' }}
            />
        );
    }
    const standard = ['pawn', 'rook', 'knight', 'bishop', 'queen', 'king'];
    if (standard.includes(type.toLowerCase())) {
        return (
            <div style={{ width: size, height: size, position: 'relative' }}>
                <Image
                    src={getPieceImage('classic', color, type)}
                    alt=""
                    fill
                    unoptimized
                    style={{ objectFit: 'contain' }}
                />
            </div>
        );
    }
    // Unknown custom piece — show initial letter
    return (
        <div style={{
            width: size,
            height: size,
            borderRadius: '50%',
            backgroundColor: color === 'white' ? '#fff' : '#333',
            color: color === 'white' ? '#333' : '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size * 0.5,
            fontWeight: 'bold',
        }}>
            {type[0]?.toUpperCase()}
        </div>
    );
}

function BoardPreview({ config }: { config: PreviewConfig }) {
    const gridType = config.gridType || 'square';
    const grid = gridType === 'hex' ? new HexGrid() : new SquareGrid();
    const tiles = grid.generateInitialGrid(config.rows, config.cols);
    const activeSet = new Set(config.activeSquares);
    const hexOffset = gridType === 'hex' ? Math.max(config.rows, config.cols) * 0.75 * CELL : 0;
    const boardW = gridType === 'square' ? config.cols * CELL : Math.max(config.rows, config.cols) * 1.5 * CELL;
    const boardH = gridType === 'square' ? config.rows * CELL : Math.max(config.rows, config.cols) * 1.5 * CELL;
    const clipPath = gridType === 'hex'
        ? 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
        : 'none';

    return (
        <div style={{ position: 'relative', width: boardW, height: boardH, flexShrink: 0 }}>
            {tiles.map((coord) => {
                const key = grid.coordToString(coord);
                const pos = grid.getPixelPosition(coord, CELL);
                const isActive = activeSet.has(key);
                const piece = config.placedPieces[key];
                const isDark = gridType === 'square'
                    ? ((coord.x || 0) + (coord.y || 0)) % 2 === 1
                    : ((coord.q || 0) + (coord.r || 0)) % 2 === 0;

                const bg = !isActive
                    ? 'rgba(0,0,0,0.08)'
                    : isDark ? '#769656' : '#eeeed2';

                let customImageWhite: string | undefined;
                let customImageBlack: string | undefined;
                if (piece && config.customPieces?.length) {
                    const cp = config.customPieces.find(p => p.id === piece.type || p.name === piece.type);
                    if (cp) {
                        customImageWhite = cp.imageWhite;
                        customImageBlack = cp.imageBlack;
                    }
                }

                return (
                    <div
                        key={key}
                        style={{
                            position: 'absolute',
                            left: pos.x + hexOffset,
                            top: pos.y + hexOffset,
                            width: CELL,
                            height: CELL,
                            transform: 'translate(-50%, -50%)',
                            clipPath,
                            backgroundColor: bg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {piece && isActive && (
                            <MiniPiece
                                type={piece.type}
                                color={piece.color}
                                size={CELL * 0.85}
                                imageWhite={customImageWhite}
                                imageBlack={customImageBlack}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function PiecesShowcase({ config }: { config: PreviewConfig }) {
    const pieces = config.pieceShowcase ?? [];
    if (pieces.length === 0) {
        return (
            <div style={{ color: '#aaa', fontSize: 12 }}>No pieces</div>
        );
    }
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(pieces.length, 4)}, 1fr)`,
            gap: 4,
            padding: 8,
        }}>
            {pieces.slice(0, 8).map((p, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <MiniPiece type={p.name} color="white" size={32} imageWhite={p.imageWhite} />
                    <MiniPiece type={p.name} color="black" size={32} imageBlack={p.imageBlack} />
                </div>
            ))}
        </div>
    );
}

export function MarketplaceBoardPreview({ config }: { config: PreviewConfig }) {
    const isPieces = config.rows === 0 && config.pieceShowcase !== undefined;

    return (
        <div className="absolute inset-0 flex items-center justify-center bg-[#312e2b] overflow-hidden">
            {isPieces ? (
                <PiecesShowcase config={config} />
            ) : (
                <BoardPreview config={config} />
            )}
        </div>
    );
}
