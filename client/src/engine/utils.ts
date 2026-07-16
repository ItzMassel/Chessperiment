import { Square } from './types';

export function toCoords(square: Square): [number, number] {
    if (square.includes(',')) {
        const [col, row] = square.split(',').map(s => parseInt(s, 10));
        return [col, row];
    }
    const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
    const rank = parseInt(square.slice(1), 10) - 1;
    return [file, rank];
}

export function toSquare(coords: [number, number], useAlgebraic: boolean = true): Square {
    if (!useAlgebraic) {
        return `${coords[0]},${coords[1]}`;
    }
    const file = String.fromCharCode('a'.charCodeAt(0) + coords[0]);
    const rank = coords[1] + 1;
    return `${file}${rank}` as Square;
}
