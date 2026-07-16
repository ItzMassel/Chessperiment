import React from 'react';
import { Project } from '@/types/Project';
import { SavedBoard } from '@/types/firestore';
import PieceRenderer from '@/components/game/PieceRenderer';

import { SquareGrid } from '@/lib/grid/SquareGrid';
import { HexGrid } from '@/lib/grid/HexGrid';

const gridMap = {
    square: new SquareGrid(),
    hex: new HexGrid()
};

export default function BoardPreviewWrapper({ board }: { board: Project | SavedBoard }) {
    const gridType = board.gridType || 'square';
    const grid = gridMap[gridType as keyof typeof gridMap] || gridMap.square;
    const initialTiles = grid.generateInitialGrid(board.rows, board.cols);
    const activeSet = new Set(board.activeSquares);

    // Increase base size for better visibility
    const SQUARE_SIZE = 60;

    const clipPath = gridType === 'hex'
        ? 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
        : 'none';

    return (
        <div className="relative w-full h-full flex items-center justify-center p-4">
            <div
                className="relative"
                style={{
                    width: gridType === 'square' ? board.cols * SQUARE_SIZE : (Math.max(board.rows, board.cols) * 1.5 * SQUARE_SIZE),
                    height: gridType === 'square' ? board.rows * SQUARE_SIZE : (Math.max(board.rows, board.cols) * 1.5 * SQUARE_SIZE),
                    // Removed fixed scaling to allow parent to control or be full size
                }}
            >
                {initialTiles.map((coord) => {
                    const key = grid.coordToString(coord);
                    const pos = grid.getPixelPosition(coord, SQUARE_SIZE);
                    const isActive = activeSet.has(key);
                    const piece = board.placedPieces[key];

                    const isDark = gridType === 'square'
                        ? ((coord.x || 0) + (coord.y || 0)) % 2 === 1
                        : ((coord.q || 0) + (coord.r || 0)) % 2 === 0;

                    // Match game board colors: #769656 (Green) and #ffffff (White)
                    const bgClass = isDark ? 'bg-[#769656]' : 'bg-white';

                    // Find custom piece definition if applicable
                    let pixels;
                    let image;
                    const customPieces = (board as any).customPieces;
                    if (piece && customPieces) {
                        // First try finding by ID or name
                        const customPiece = customPieces.find((p: any) => p.id === piece.type || p.name === piece.type);
                        if (customPiece) {
                            if (piece.color === 'white') {
                                pixels = customPiece.pixelsWhite;
                                image = customPiece.imageWhite;
                            } else {
                                pixels = customPiece.pixelsBlack;
                                image = customPiece.imageBlack;
                            }
                        }
                    }

                    return (
                        <div
                            key={key}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                            style={{
                                left: pos.x + (gridType === 'hex' ? (Math.max(board.rows, board.cols) * 0.75 * SQUARE_SIZE) : 0),
                                top: pos.y + (gridType === 'hex' ? (Math.max(board.rows, board.cols) * 0.75 * SQUARE_SIZE) : 0),
                                width: SQUARE_SIZE,
                                height: SQUARE_SIZE,
                                clipPath: clipPath
                            }}
                        >
                            <div className={`absolute inset-0 transition-colors ${isActive
                                ? bgClass
                                : 'bg-black/5 dark:bg-white/5'
                                } ${!isDark && isActive ? 'border border-black/5' : ''}`} />

                            {piece && isActive && (
                                <div className="relative w-full h-full flex items-center justify-center pointer-events-none z-10">
                                    <PieceRenderer
                                        type={piece.type}
                                        color={piece.color}
                                        size={SQUARE_SIZE * 0.85}
                                        boardStyle="classic"
                                        className="drop-shadow-md"
                                        pixels={pixels}
                                        image={image}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
