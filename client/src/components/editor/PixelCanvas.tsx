"use client"
import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Eraser, Trash2, Minus, Plus } from 'lucide-react';

interface PixelCanvasProps {
    gridSize: number;
    pixels: string[][];
    setPixels: (pixels: string[][]) => void;
    commitPixels: (pixels: string[][]) => void;
    selectedPieceId: string | null;
    image?: string;
}

const PixelCanvas = memo(({ gridSize, pixels, setPixels, commitPixels, selectedPieceId, image }: PixelCanvasProps) => {
    const t = useTranslations('Editor.Piece');
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [drawColor, setDrawColor] = useState('#000000');
    const [penSize, setPenSize] = useState(1);
    const [isDrawing, setIsDrawing] = useState(false);

    // Internal pixel data for performance
    const internalPixels = useRef<string[][]>(pixels);
    // Cache the loaded background image to avoid recreating it on every drawCanvas call
    const loadedImageRef = useRef<HTMLImageElement | null>(null);
    // Always-current ref to drawCanvas — updated each render so effects don't need it as a dep
    const drawCanvasRef = useRef<() => void>(() => {});

    const colors = [
        '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff',
        '#808080', '#c0c0c0', '#800000', '#808000', '#008000', '#800080', '#008080', '#000080',
        'transparent'
    ];

    const drawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        const cellSize = canvas.width / gridSize;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw checkerboard background for better visibility (classic transparency pattern)
        const checkerSize = cellSize * 2; // Twice the grid size for visibility
        for (let y = 0; y < canvas.height; y += checkerSize) {
            for (let x = 0; x < canvas.width; x += checkerSize) {
                ctx.fillStyle = (Math.floor(x / checkerSize) + Math.floor(y / checkerSize)) % 2 === 0 ? '#fafafa' : '#e5e5e5';
                ctx.fillRect(x, y, checkerSize, checkerSize);
            }
        }

        // Draw background image if loaded (contain scaling — no stretching)
        if (loadedImageRef.current) {
            const img = loadedImageRef.current;
            const scale = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
            const drawWidth = img.naturalWidth * scale;
            const drawHeight = img.naturalHeight * scale;
            const offsetX = (canvas.width - drawWidth) / 2;
            const offsetY = (canvas.height - drawHeight) / 2;

            // Show dashed "perfect size" outline when image doesn't fill the canvas
            if (drawWidth < canvas.width - 1 || drawHeight < canvas.height - 1) {
                ctx.save();
                ctx.strokeStyle = '#94a3b8';
                ctx.lineWidth = 2;
                ctx.setLineDash([8, 5]);
                ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
                ctx.restore();
            }

            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        }

        // Draw pixels
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const color = internalPixels.current[y][x];
                if (color !== 'transparent') {
                    ctx.fillStyle = color;
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize + 0.5, cellSize + 0.5); // +0.5 to prevent subpixel gaps
                }
            }
        }
    }, [gridSize]);

    // Keep ref current so effects below can call it without listing it as a dep
    drawCanvasRef.current = drawCanvas;

    // Load image when the image prop changes, then redraw
    useEffect(() => {
        if (!image) {
            loadedImageRef.current = null;
            drawCanvasRef.current();
            return;
        }

        let cancelled = false;
        // Clear stale image immediately so we don't keep showing the old background
        loadedImageRef.current = null;
        drawCanvasRef.current();

        const img = new (globalThis.Image || Image)();
        img.onload = () => {
            if (cancelled) return;
            loadedImageRef.current = img;
            drawCanvasRef.current();
        };
        img.onerror = () => {
            if (cancelled) return;
            loadedImageRef.current = null;
            drawCanvasRef.current();
        };
        img.src = image;

        return () => { cancelled = true; };
    }, [image]); // drawCanvas intentionally excluded — accessed via ref

    // Sync internal pixels and redraw when pixels prop changes
    useEffect(() => {
        internalPixels.current = pixels;
        drawCanvas();
    }, [pixels, drawCanvas]);

    const handleAction = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = Math.floor((clientX - rect.left) * scaleX / (canvas.width / gridSize));
        const y = Math.floor((clientY - rect.top) * scaleY / (canvas.height / gridSize));

        if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
            paintPixels(x, y);
        }
    }, [gridSize, drawColor, penSize]);

    const paintPixels = (centerX: number, centerY: number) => {
        const halfSize = Math.floor(penSize / 2);
        const startX = Math.max(0, centerX - halfSize);
        const endX = Math.min(gridSize - 1, centerX + (penSize - halfSize - 1));
        const startY = Math.max(0, centerY - halfSize);
        const endY = Math.min(gridSize - 1, centerY + (penSize - halfSize - 1));

        let changed = false;
        for (let py = startY; py <= endY; py++) {
            for (let px = startX; px <= endX; px++) {
                if (internalPixels.current[py][px] !== drawColor) {
                    internalPixels.current[py][px] = drawColor;
                    changed = true;
                }
            }
        }

        if (changed) {
            drawCanvas();
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        setIsDrawing(true);
        handleAction(e);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDrawing) {
            handleAction(e);
        }
    };

    const handleMouseUp = useCallback(() => {
        if (isDrawing) {
            setIsDrawing(false);
            const copy = internalPixels.current.map(row => [...row]);
            setPixels(copy);
            commitPixels(copy);
        }
    }, [isDrawing, setPixels, commitPixels]);

    useEffect(() => {
        window.addEventListener('mouseup', handleMouseUp);
        return () => window.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseUp]);

    const clearCanvas = () => {
        const cleared = Array(gridSize).fill(null).map(() => Array(gridSize).fill('transparent'));
        internalPixels.current = cleared;
        drawCanvas();
        setPixels(cleared);
        commitPixels(cleared);
    };

    return (
        <div className="flex flex-col items-center gap-6">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-center gap-4 p-4 bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-white/10 shadow-lg">
                <div className="flex flex-wrap gap-1 max-w-[280px]">
                    {colors.map(color => (
                        <button
                            key={color}
                            onClick={() => setDrawColor(color)}
                            className={`w-7 h-7 rounded border ${drawColor === color ? 'ring-2 ring-amber-500 ring-offset-1 border-transparent' : 'border-stone-200 dark:border-white/10'}`}
                            style={{
                                backgroundColor: color === 'transparent' ? 'white' : color,
                                backgroundImage: color === 'transparent' ? 'linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%, #eee), linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%, #eee)' : 'none',
                                backgroundSize: '8px 8px',
                                backgroundPosition: '0 0, 4px 4px'
                            }}
                            title={color === 'transparent' ? t('eraser') : color}
                        >
                            {color === 'transparent' && <Eraser size={12} className="mx-auto text-stone-400" />}
                        </button>
                    ))}
                </div>

                <div className="h-8 w-px bg-stone-200 dark:bg-white/10 mx-2" />

                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Size</span>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setPenSize(Math.max(1, penSize - 1))} className="p-1 border border-stone-200 dark:border-white/10 rounded hover:bg-stone-50"><Minus size={14} /></button>
                        <span className="text-xs font-bold w-4 text-center">{penSize}</span>
                        <button onClick={() => setPenSize(Math.min(10, penSize + 1))} className="p-1 border border-stone-200 dark:border-white/10 rounded hover:bg-stone-50"><Plus size={14} /></button>
                    </div>
                </div>
            </div>

            {/* Canvas Container */}
            <div
                className="bg-stone-400 dark:bg-stone-900 p-1 rounded-sm shadow-xl border border-stone-400/50"
            >
                <canvas
                    data-tutorial-target="pixel-canvas"
                    ref={canvasRef}
                    width={512}
                    height={512}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onTouchStart={(e) => {
                        setIsDrawing(true);
                        handleAction(e);
                    }}
                    onTouchMove={(e) => {
                        if (isDrawing) {
                            handleAction(e);
                        }
                    }}
                    onTouchEnd={() => {
                        handleMouseUp();
                    }}
                    className="cursor-crosshair bg-white touch-none shadow-inner"
                    style={{
                        width: 'min(90vw, 512px)',
                        height: 'min(90vw, 512px)',
                        imageRendering: image ? 'auto' : 'pixelated'
                    }}
                />
            </div>

            <button
                onClick={clearCanvas}
                className="flex items-center gap-2 px-6 py-2 bg-stone-100 hover:bg-red-500 hover:text-white text-stone-600 rounded-lg text-xs font-black uppercase tracking-widest transition-colors border border-stone-200"
            >
                <Trash2 size={14} />
                {t('clearCanvas')}
            </button>
        </div>
    );
});

export default PixelCanvas;
