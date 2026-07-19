import { Project } from '@/types/Project';
import { getPieceImage } from '@/lib/gameData';
import { SquareGrid } from '@/lib/grid/SquareGrid';
import { HexGrid } from '@/lib/grid/HexGrid';

const BOARD_SQUARE_SIZE = 80;
const PADDING = 40;

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

function getGridForType(gridType: string) {
    switch (gridType) {
        case 'hex': return new HexGrid();
        default: return new SquareGrid();
    }
}

function drawHexPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const x = cx + size * Math.cos(angle);
        const y = cy + size * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
}

async function drawPieceOnCanvas(
    ctx: CanvasRenderingContext2D,
    piece: { type: string; color: string },
    cx: number, cy: number, squareSize: number,
    customPieces: any[],
) {
    const padding = squareSize * 0.075;
    const pieceSize = squareSize - padding * 2;
    const customPiece = customPieces.find((p: any) => p.id === piece.type || p.name === piece.type);

    if (customPiece) {
        const pixels = piece.color === 'white' ? customPiece.pixelsWhite : customPiece.pixelsBlack;
        if (pixels?.length > 0 && pixels[0]?.length > 0) {
            const pRows = pixels.length;
            const pCols = pixels[0].length;
            const pixelSize = Math.min(pieceSize / pCols, pieceSize / pRows);
            const offX = cx - (pCols * pixelSize) / 2;
            const offY = cy - (pRows * pixelSize) / 2;

            for (let r = 0; r < pRows; r++) {
                for (let c = 0; c < pCols; c++) {
                    const color = pixels[r][c];
                    if (color && color !== 'transparent') {
                        ctx.fillStyle = color;
                        ctx.fillRect(offX + c * pixelSize, offY + r * pixelSize, Math.ceil(pixelSize), Math.ceil(pixelSize));
                    }
                }
            }
            return;
        }
    }

    const lowerType = piece.type.toLowerCase();
    const standardPieces = ['pawn', 'rook', 'knight', 'bishop', 'queen', 'king'];

    if (standardPieces.includes(lowerType)) {
        try {
            const img = await loadImage(getPieceImage('v3', piece.color, piece.type));
            const scale = Math.min(pieceSize / img.width, pieceSize / img.height);
            const dw = img.width * scale;
            const dh = img.height * scale;
            ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
            return;
        } catch { }
    }

    const radius = squareSize * 0.28;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = piece.color === 'white' ? '#ffffff' : '#333333';
    ctx.fill();
    ctx.strokeStyle = piece.color === 'white' ? '#333333' : '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = piece.color === 'white' ? '#333333' : '#ffffff';
    ctx.font = `bold ${radius}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(piece.type[0].toUpperCase(), cx, cy);
}

export async function renderBoardToCanvas(project: Project): Promise<HTMLCanvasElement> {
    const { rows, cols, gridType = 'square', activeSquares = [], placedPieces = {}, customPieces = [] } = project;
    const activeSet = new Set(activeSquares);
    const grid = getGridForType(gridType);
    const tiles = grid.generateInitialGrid(rows, cols);

    const isHex = gridType === 'hex';
    const hexOffset = isHex ? Math.max(rows, cols) * 0.75 * BOARD_SQUARE_SIZE : 0;
    const canvasW = isHex ? cols * BOARD_SQUARE_SIZE + BOARD_SQUARE_SIZE : cols * BOARD_SQUARE_SIZE;
    const canvasH = isHex ? rows * BOARD_SQUARE_SIZE + BOARD_SQUARE_SIZE : rows * BOARD_SQUARE_SIZE;

    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(canvasW);
    canvas.height = Math.ceil(canvasH);
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const coord of tiles) {
        const key = grid.coordToString(coord);
        const pos = grid.getPixelPosition(coord, BOARD_SQUARE_SIZE);
        const isActive = activeSet.has(key);
        const piece = placedPieces[key];

        const isDark = gridType === 'square'
            ? ((coord.x || 0) + (coord.y || 0)) % 2 === 1
            : ((coord.q || 0) + (coord.r || 0)) % 2 === 0;

        const cx = pos.x + hexOffset + BOARD_SQUARE_SIZE / 2;
        const cy = pos.y + hexOffset + BOARD_SQUARE_SIZE / 2;

        ctx.save();
        if (isHex) {
            drawHexPath(ctx, cx, cy, BOARD_SQUARE_SIZE / 2);
            ctx.clip();
        }

        ctx.fillStyle = isActive
            ? (isDark ? '#769656' : '#ffffff')
            : 'rgba(0,0,0,0.05)';
        ctx.fillRect(cx - BOARD_SQUARE_SIZE / 2, cy - BOARD_SQUARE_SIZE / 2, BOARD_SQUARE_SIZE, BOARD_SQUARE_SIZE);

        if (isActive && !isDark) {
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.lineWidth = 1;
            ctx.strokeRect(cx - BOARD_SQUARE_SIZE / 2, cy - BOARD_SQUARE_SIZE / 2, BOARD_SQUARE_SIZE, BOARD_SQUARE_SIZE);
        }
        ctx.restore();

        if (piece && isActive) {
            await drawPieceOnCanvas(ctx, piece, cx, cy, BOARD_SQUARE_SIZE, customPieces);
        }
    }

    return canvas;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    if (!text) return [];
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
        const test = current ? current + ' ' + word : word;
        if (ctx.measureText(test).width > maxWidth && current) {
            lines.push(current);
            current = word;
        } else {
            current = test;
        }
    }
    if (current) lines.push(current);
    return lines;
}

export async function renderBoardWithInfoToCanvas(project: Project): Promise<HTMLCanvasElement> {
    const boardCanvas = await renderBoardToCanvas(project);
    const { customPieces = [], name } = project;

    const hasCustomPieces = customPieces.length > 0;
    const titleText = name || 'Chess Variant';

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(boardCanvas.width, 600);
    canvas.height = boardCanvas.height + (hasCustomPieces ? 120 + customPieces.length * 80 : 80) + PADDING;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(boardCanvas, (canvas.width - boardCanvas.width) / 2, PADDING / 2);

    const infoY = boardCanvas.height + PADDING / 2 + 10;

    ctx.fillStyle = '#1c1c1c';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(titleText, PADDING, infoY);

    if (hasCustomPieces) {
        ctx.font = 'bold 14px sans-serif';
        ctx.fillStyle = '#555';
        ctx.fillText('Custom Pieces', PADDING, infoY + 28);

        let descY = infoY + 52;
        ctx.font = '13px sans-serif';

        for (const cp of customPieces) {
            ctx.fillStyle = '#333';
            ctx.font = 'bold 13px sans-serif';
            ctx.fillText(`${cp.name}`, PADDING, descY);
            descY += 18;

            if (cp.description) {
                ctx.fillStyle = '#666';
                ctx.font = '12px sans-serif';
                const lines = wrapText(ctx, cp.description, canvas.width - PADDING * 2);
                for (const line of lines) {
                    ctx.fillText(line, PADDING, descY);
                    descY += 16;
                }
            }

            if (cp.moves?.length > 0) {
                ctx.fillStyle = '#888';
                ctx.font = '11px sans-serif';
                const moveDesc = cp.moves
                    .map((m: any) => m.mode === 'run' ? 'slides' : m.mode === 'jump' ? 'jumps' : m.mode || 'moves')
                    .join(', ');
                ctx.fillText(`Moves: ${moveDesc || 'custom rules'}`, PADDING, descY);
                descY += 16;
            }

            descY += 8;
        }

        canvas.height = Math.ceil(descY + PADDING / 2);
    }

    return canvas;
}

export async function exportAsImageBlob(project: Project): Promise<Blob> {
    const canvas = await renderBoardToCanvas(project);
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to generate image'));
        }, 'image/png');
    });
}

export async function exportAsImageWithInfoBlob(project: Project): Promise<Blob> {
    const canvas = await renderBoardWithInfoToCanvas(project);
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to generate image'));
        }, 'image/png');
    });
}

export function exportAsJsonString(project: Project): string {
    const serialized = {
        ...project,
        createdAt: project.createdAt instanceof Date ? project.createdAt.toISOString() : project.createdAt,
        updatedAt: project.updatedAt instanceof Date ? project.updatedAt.toISOString() : project.updatedAt,
        customPieces: project.customPieces?.map(pc => ({
            ...pc,
            createdAt: pc.createdAt instanceof Date ? pc.createdAt.toISOString() : pc.createdAt,
            updatedAt: pc.updatedAt instanceof Date ? pc.updatedAt.toISOString() : pc.updatedAt,
        })),
    };
    return JSON.stringify(serialized, null, 2);
}

export function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function downloadString(content: string, filename: string, mimeType: string = 'application/json') {
    const blob = new Blob([content], { type: mimeType });
    downloadBlob(blob, filename);
}
