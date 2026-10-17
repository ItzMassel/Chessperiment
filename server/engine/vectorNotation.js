export const BLOCKED = "#blocked";
/** True for moves in this notation. Old condition-based rules have no `kind`. */
export function isNotationMove(m) {
    const move = m;
    return (!!move &&
        typeof move.kind === "string" &&
        typeof move.x === "number" &&
        typeof move.y === "number");
}
/** All distinct mirrored / swapped variants of (x, y): 8 for a knight, 4 for (1,1) or (0,1). */
export function symExpand(x, y) {
    const variants = new Map();
    for (const [a, b] of [[x, y], [y, x]]) {
        for (const signX of [1, -1]) {
            for (const signY of [1, -1]) {
                // "+ 0" turns -0 into 0
                const variant = [a * signX + 0, b * signY + 0];
                variants.set(variant.join(","), variant);
            }
        }
    }
    return [...variants.values()];
}
/** Keeps only notation moves and resolves `sym`. Returns new objects, the input is untouched. */
export function expandMoves(moves) {
    const expanded = [];
    for (const move of moves) {
        if (!isNotationMove(move))
            continue;
        if (move.modifier === "sym") {
            const { modifier, ...rest } = move;
            for (const [x, y] of symExpand(move.x, move.y)) {
                expanded.push({ ...rest, x, y });
            }
        }
        else {
            expanded.push({ ...move });
        }
    }
    return expanded;
}
export function getLegalMoves(board, from, color, moves) {
    const found = new Map();
    const forward = color === "black" ? -1 : 1;
    for (const move of moves) {
        const stepX = move.x;
        const stepY = move.y * forward;
        // A step of (0,0) never leaves the square; skip it so "n" cannot loop forever.
        if (stepX === 0 && stepY === 0)
            continue;
        const limit = move.kind === "jump" ? 1 : move.count === "n" ? Infinity : (move.count ?? 1);
        let x = from.x;
        let y = from.y;
        for (let step = 1; step <= limit; step++) {
            x += stepX;
            y += stepY;
            const row = board[y];
            if (!row || x < 0 || x >= row.length)
                break; // off the board
            const cell = row[x];
            if (cell === BLOCKED)
                break; // hole in the board
            if (cell === color)
                break; // own piece
            found.set(`${x},${y}`, { x, y });
            if (cell !== null)
                break; // enemy piece: capture, then stop
        }
    }
    return [...found.values()];
}
