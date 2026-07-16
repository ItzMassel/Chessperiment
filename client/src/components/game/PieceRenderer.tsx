"use client";
import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { getPieceImage } from '@/lib/gameData';
import PieceStateIndicators from './PieceStateIndicators';

interface PieceRendererProps {
    type: string;
    color: string;
    size: number;
    pixels?: string[][]; // Optional: direct pixels from Firestore/Library
    image?: string; // NEW: non-pixelated image
    boardStyle?: string;
    className?: string;
    // New props for visual feedback
    variables?: Record<string, number>;
    hasLogic?: boolean;
    isUnderThreat?: boolean;
    recentTrigger?: string | null;
    recentEffect?: string | null;
}

export const PixelPiece = React.memo(({ pixels, image, size, className }: { pixels?: string[][], image?: string, size: number, className?: string }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const render = async () => {
            if (image) {
                const img = new globalThis.Image();
                img.src = image;
                await new Promise((resolve) => {
                    img.onload = resolve;
                });
                const scale = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
                const drawWidth = img.naturalWidth * scale;
                const drawHeight = img.naturalHeight * scale;
                const offsetX = (canvas.width - drawWidth) / 2;
                const offsetY = (canvas.height - drawHeight) / 2;
                ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
            }

            if (pixels) {
                const rows = pixels.length;
                const cols = pixels[0]?.length || 0;
                if (rows === 0 || cols === 0) return;

                const scale = Math.min(canvas.width / cols, canvas.height / rows);
                const offsetX = (canvas.width - cols * scale) / 2;
                const offsetY = (canvas.height - rows * scale) / 2;

                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        const color = pixels[r][c];
                        if (color && color !== 'transparent') {
                            ctx.fillStyle = color;
                            ctx.fillRect(
                                Math.floor(offsetX + c * scale),
                                Math.floor(offsetY + r * scale),
                                Math.ceil(scale),
                                Math.ceil(scale)
                            );
                        }
                    }
                }
            }
        };

        render();
    }, [pixels, image, size]);

    return (
        <canvas
            ref={canvasRef}
            width={size}
            height={size}
            className={className}
            style={{ width: '100%', height: '100%', imageRendering: image ? 'auto' : 'pixelated' }}
        />
    );
}, (prev, next) => prev.size === next.size && prev.image === next.image && JSON.stringify(prev.pixels) === JSON.stringify(next.pixels));

const PieceRenderer = React.memo(function PieceRenderer({
    type,
    color,
    size,
    pixels,
    image,
    boardStyle = "v3",
    className = "",
    variables,
    hasLogic,
    isUnderThreat,
    recentTrigger,
    recentEffect
}: PieceRendererProps) {
    const [isMounted, setIsMounted] = React.useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Render piece content
    let pieceContent: React.ReactNode;
    const isWhite = color === 'white';

    if (!isMounted) {
        // Render simple fallback for SSR to avoid hydration mismatch
        pieceContent = <div style={{ width: size, height: size }} />;
    } else if (pixels || image) {
        // If we have direct pixels (from Library), use them
        pieceContent = <PixelPiece pixels={pixels} image={image} size={size} className={className} />;
    } else {
        // Check if it's a standard piece
        const standardPieces = ['pawn', 'rook', 'knight', 'bishop', 'queen', 'king'];
        const lowerType = type.toLowerCase();

        if (standardPieces.includes(lowerType)) {
            pieceContent = (
                <div className="w-[85%] h-[85%] relative flex items-center justify-center">
                    <Image
                        src={getPieceImage(boardStyle, color, type)}
                        alt={`${color} ${type}`}
                        fill
                        unoptimized
                        className={`bg-transparent object-contain ${className} ${color === 'black' ? 'dark:drop-shadow-[0_0_1.5px_rgba(255,255,255,0.6)]' : ''}`}
                        style={{ pointerEvents: "none" }}
                    />
                </div>
            );
        } else {
            // It might be a custom piece. Try to find it in localStorage if pixels weren't provided
            const collection = JSON.parse(localStorage.getItem('piece_collection') || '{}');
            const customPiece = Object.values(collection).find((p: any) => p.name === type && p.color === color) as any;
            if (customPiece && (customPiece.pixels || customPiece.image)) {
                pieceContent = <PixelPiece pixels={customPiece.pixels} image={customPiece.image} size={size} className={className} />;
            } else {
                // Fallback: Show a generic placeholder or the type name
                pieceContent = (
                    <div
                        className={`flex items-center justify-center rounded-full ${color === 'white' ? 'bg-white text-bg' : 'bg-gray-800 text-white'} ${className}`}
                        style={{ width: size, height: size, fontSize: size * 0.4, fontWeight: 'black' }}
                    >
                        {type.substring(0, 1).toUpperCase()}
                    </div>
                );
            }
        }
    }

    // Wrap in container with state indicators
    return (
        <div className="relative flex items-center justify-center w-full h-full">
            {pieceContent}
            <PieceStateIndicators
                variables={variables}
                hasLogic={hasLogic}
                isUnderThreat={isUnderThreat}
                size={size}
                recentTrigger={recentTrigger}
                recentEffect={recentEffect}
            />
        </div>
    );
}, (prev, next) =>
    prev.type === next.type &&
    prev.color === next.color &&
    prev.size === next.size &&
    prev.image === next.image &&
    prev.boardStyle === next.boardStyle &&
    JSON.stringify(prev.pixels) === JSON.stringify(next.pixels) &&
    JSON.stringify(prev.variables) === JSON.stringify(next.variables)
);

export default PieceRenderer;
