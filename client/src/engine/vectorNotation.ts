/*
# How to use the engine
1. define movement pattern. Example:

const ROOK = [
  { kind: "run", x: 1, y: 0, count: Infinity },
  { kind: "run", x: -1, y: 0, count: Infinity },
  { kind: "run", x: 0, y: 1, count: Infinity },
  { kind: "run", x: 0, y: -1, count: Infinity },
];

input board, from coordinates, color and move scheme
*/
type Coord = { x: number; y: number };
type Cell = string | null;
type Board = Cell[][];
type Move = { kind: string; x: number; y: number; count: number | "n" };
type Piece = Coord & { color: string };
// TODO: Add sym

function isOccupied(
  coord: Coord,
  board: Board,
  color: string,
): false | "off" | string {
  // coord = {x,y}
  const maxX = board[0].length - 1;
  const maxY = board.length - 1;
  if (coord.x > maxX || coord.y > maxY || coord.x < 0 || coord.y < 0)
    return "off";
  const cell = board[coord.y][coord.x];
  return cell === null ? false : cell;
}
function getLegalMoves(
  board: Board,
  from: Coord,
  color: string,
  moves: Move[],
): Coord[] {
  let possibleSquares: Coord[] = [];
  // run
  for (let move of moves) {
    let currentPosition = {
      x: from.x,
      y: from.y,
    };
    if (move.count === "n") {
      move.count = Infinity;
    }
    // one direction
    for (let turn = 1; turn <= move.count; turn++) {
      currentPosition.x += move.x;
      currentPosition.y += move.y;
      let occupied = isOccupied(currentPosition, board, color);
      if (!occupied)
        possibleSquares.push({ x: currentPosition.x, y: currentPosition.y });
      else if (occupied === "off") break;
      else if (occupied !== color) {
        possibleSquares.push({ x: currentPosition.x, y: currentPosition.y });
        break;
      } else {
        break;
      }
    }
  }
  // Objects are compared by reference, so key each square by "x,y" in a Map
  // to drop duplicates.
  const unique = new Map<string, Coord>();
  for (const square of possibleSquares) {
    unique.set(`${square.x},${square.y}`, square);
  }
  return [...unique.values()];
}

// ---- test helpers and tests, don't edit below this line ----

function makeBoard(width: number, height: number, pieces: Piece[] = []): Board {
  const board: Board = Array.from({ length: height }, () =>
    Array(width).fill(null),
  );
  for (const p of pieces) board[p.y][p.x] = p.color;
  return board;
}

function sameSquares(actual: Coord[], expected: Coord[]) {
  const key = (s: Coord) => `${s.x},${s.y}`;
  const a = actual.map(key).sort().join(" | ");
  const e = expected.map(key).sort().join(" | ");
  return { ok: a === e, a, e };
}

function check(label: string, actual: Coord[], expected: Coord[]) {
  const r = sameSquares(actual, expected);
  if (r.ok) {
    console.log(`✅ pass: ${label}`);
  } else {
    console.log(`❌ FAIL: ${label}`);
    console.log(`   expected: ${r.e}`);
    console.log(`   actual:   ${r.a}`);
  }
}

function run(label: string, fn: () => Coord[], expected: Coord[]) {
  try {
    check(label, fn(), expected);
  } catch (e) {
    console.log(
      `❌ FAIL: ${label} (threw: ${e instanceof Error ? e.message : e})`,
    );
  }
}

const ROOK = [
  { kind: "run", x: 1, y: 0, count: Infinity },
  { kind: "run", x: -1, y: 0, count: Infinity },
  { kind: "run", x: 0, y: 1, count: Infinity },
  { kind: "run", x: 0, y: -1, count: Infinity },
];

const KNIGHT = [
  [2, 1],
  [1, 2],
  [-1, 2],
  [-2, 1],
  [-2, -1],
  [-1, -2],
  [1, -2],
  [2, -1],
].map(([x, y]) => ({ kind: "jump", x, y, count: 1 }));

// 1. rook on an empty 3x3, from the middle
run(
  "rook, empty 3x3 board, from centre",
  () => getLegalMoves(makeBoard(3, 3), { x: 1, y: 1 }, "white", ROOK),
  [
    { x: 0, y: 1 },
    { x: 2, y: 1 },
    { x: 1, y: 0 },
    { x: 1, y: 2 },
  ],
);

// 2. rook on empty 8x8 has 14 moves from anywhere
run(
  "rook, empty 8x8, count of moves",
  () => {
    const m = getLegalMoves(makeBoard(8, 8), { x: 3, y: 3 }, "white", ROOK);
    return Array.from({ length: m.length }, (_, i) => ({ x: i, y: 0 }));
  },
  Array.from({ length: 14 }, (_, i) => ({ x: i, y: 0 })),
);

// 3. friendly piece blocks, and its own square is excluded
run(
  "rook stops before a friendly piece",
  () =>
    getLegalMoves(
      makeBoard(5, 1, [{ x: 3, y: 0, color: "white" }]),
      { x: 0, y: 0 },
      "white",
      ROOK,
    ),
  [
    { x: 1, y: 0 },
    { x: 2, y: 0 },
  ],
);

// 4. enemy piece can be captured but nothing beyond it
run(
  "rook captures an enemy and stops",
  () =>
    getLegalMoves(
      makeBoard(5, 1, [{ x: 3, y: 0, color: "black" }]),
      { x: 0, y: 0 },
      "white",
      ROOK,
    ),
  [
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 3, y: 0 },
  ],
);

// 5. limited range
run(
  "run(1,0)2 only goes two squares",
  () =>
    getLegalMoves(makeBoard(8, 1), { x: 0, y: 0 }, "white", [
      { kind: "run", x: 1, y: 0, count: 2 },
    ]),
  [
    { x: 1, y: 0 },
    { x: 2, y: 0 },
  ],
);

// 6. knight in a corner, off-board jumps dropped
run(
  "knight in the corner has 2 moves",
  () => getLegalMoves(makeBoard(8, 8), { x: 0, y: 0 }, "white", KNIGHT),
  [
    { x: 2, y: 1 },
    { x: 1, y: 2 },
  ],
);

// 7. knight jumps over pieces but can't land on a friendly one
run(
  "knight jumps over pieces, not onto friendly",
  () =>
    getLegalMoves(
      makeBoard(8, 8, [
        { x: 1, y: 0, color: "white" },
        { x: 0, y: 1, color: "white" },
        { x: 1, y: 1, color: "black" },
        { x: 2, y: 1, color: "white" },
      ]),
      { x: 0, y: 0 },
      "white",
      KNIGHT,
    ),
  [{ x: 1, y: 2 }],
);

// 8. diagonal run isn't blocked by orthogonal neighbours
run(
  "diagonal run passes between blocked neighbours",
  () =>
    getLegalMoves(
      makeBoard(4, 4, [
        { x: 1, y: 0, color: "white" },
        { x: 0, y: 1, color: "white" },
      ]),
      { x: 0, y: 0 },
      "white",
      [{ kind: "run", x: 1, y: 1, count: Infinity }],
    ),
  [
    { x: 1, y: 1 },
    { x: 2, y: 2 },
    { x: 3, y: 3 },
  ],
);

// 9. duplicates removed
run(
  "two moves reaching the same square give it once",
  () =>
    getLegalMoves(makeBoard(3, 1), { x: 0, y: 0 }, "white", [
      { kind: "jump", x: 1, y: 0, count: 1 },
      { kind: "run", x: 1, y: 0, count: 1 },
    ]),
  [{ x: 1, y: 0 }],
);
