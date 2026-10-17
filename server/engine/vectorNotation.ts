/*
# Vector move engine

A piece's moves are plain objects, exactly as they are saved in its moves[]:

  { kind: "run" | "jump", x, y, count?: number | "n", modifier?: "sym" }

  run   walks (x, y) per step, up to `count` steps ("n" = unlimited, missing = 1),
        and stops in front of the first piece in the way (enemies can be captured)
  jump  lands exactly on (x, y) and ignores whatever is in between
  sym   expands the move into all its mirrored / swapped variants (knight = jump(sym(2,1)))

Black moves mirrored along y, so "forward" is always towards the enemy.
Nothing here modifies the moves it is given.

Usage:
  const squares = getLegalMoves(board, { x: 3, y: 3 }, "white", expandMoves(piece.rules));

Keep this file identical to client/src/engine/vectorNotation.ts.
*/
export type Coord = { x: number; y: number };
/** null = empty, a color name = a piece of that color, BLOCKED = not a playable square. */
export type Cell = string | null;
export type Board = Cell[][];
export type Move = {
  kind: string;
  x: number;
  y: number;
  count?: number | "n";
  modifier?: "sym";
};

export const BLOCKED = "#blocked";

/** True for moves in this notation. Old condition-based rules have no `kind`. */
export function isNotationMove(m: unknown): m is Move {
  const move = m as Move | null;
  return (
    !!move &&
    typeof move.kind === "string" &&
    typeof move.x === "number" &&
    typeof move.y === "number"
  );
}

/** All distinct mirrored / swapped variants of (x, y): 8 for a knight, 4 for (1,1) or (0,1). */
export function symExpand(x: number, y: number): [number, number][] {
  const variants = new Map<string, [number, number]>();
  for (const [a, b] of [[x, y], [y, x]]) {
    for (const signX of [1, -1]) {
      for (const signY of [1, -1]) {
        // "+ 0" turns -0 into 0
        const variant: [number, number] = [a * signX + 0, b * signY + 0];
        variants.set(variant.join(","), variant);
      }
    }
  }
  return [...variants.values()];
}

/** Keeps only notation moves and resolves `sym`. Returns new objects, the input is untouched. */
export function expandMoves(moves: unknown[]): Move[] {
  const expanded: Move[] = [];
  for (const move of moves) {
    if (!isNotationMove(move)) continue;
    if (move.modifier === "sym") {
      const { modifier, ...rest } = move;
      for (const [x, y] of symExpand(move.x, move.y)) {
        expanded.push({ ...rest, x, y });
      }
    } else {
      expanded.push({ ...move });
    }
  }
  return expanded;
}

export function getLegalMoves(
  board: Board,
  from: Coord,
  color: string,
  moves: Move[],
): Coord[] {
  const found = new Map<string, Coord>();
  const forward = color === "black" ? -1 : 1;

  for (const move of moves) {
    const stepX = move.x;
    const stepY = move.y * forward;
    // A step of (0,0) never leaves the square; skip it so "n" cannot loop forever.
    if (stepX === 0 && stepY === 0) continue;

    const limit =
      move.kind === "jump" ? 1 : move.count === "n" ? Infinity : (move.count ?? 1);

    let x = from.x;
    let y = from.y;
    for (let step = 1; step <= limit; step++) {
      x += stepX;
      y += stepY;

      const row = board[y];
      if (!row || x < 0 || x >= row.length) break; // off the board
      const cell = row[x];
      if (cell === BLOCKED) break; // hole in the board
      if (cell === color) break; // own piece

      found.set(`${x},${y}`, { x, y });
      if (cell !== null) break; // enemy piece: capture, then stop
    }
  }

  return [...found.values()];
}
