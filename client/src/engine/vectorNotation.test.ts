// Run with:  npx tsx src/engine/vectorNotation.test.ts   (from the client folder)
import {
  BLOCKED,
  expandMoves,
  getLegalMoves,
  isNotationMove,
  symExpand,
  type Board,
  type Coord,
  type Move,
} from "./vectorNotation";

type Placed = Coord & { color: string };

function makeBoard(width: number, height: number, pieces: Placed[] = []): Board {
  const board: Board = Array.from({ length: height }, () => Array(width).fill(null));
  for (const p of pieces) board[p.y][p.x] = p.color;
  return board;
}

const keyOf = (s: Coord) => `${s.x},${s.y}`;
const sorted = (squares: Coord[]) => squares.map(keyOf).sort().join(" | ");

let failed = 0;
function test(label: string, actual: string, expected: string) {
  if (actual === expected) {
    console.log(`PASS ${label}`);
  } else {
    failed++;
    console.log(`FAIL ${label}\n     expected: ${expected}\n     actual:   ${actual}`);
  }
}
function squaresTest(label: string, actual: Coord[], expected: Coord[]) {
  test(label, sorted(actual), sorted(expected));
}

const ROOK: Move[] = [
  { kind: "run", x: 1, y: 0, count: "n" },
  { kind: "run", x: -1, y: 0, count: "n" },
  { kind: "run", x: 0, y: 1, count: "n" },
  { kind: "run", x: 0, y: -1, count: "n" },
];
const KNIGHT: Move[] = [{ kind: "jump", modifier: "sym", x: 2, y: 1 }];

// --- running ---------------------------------------------------------------
squaresTest(
  "rook on an empty 3x3 board, from the centre",
  getLegalMoves(makeBoard(3, 3), { x: 1, y: 1 }, "white", ROOK),
  [{ x: 0, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 0 }, { x: 1, y: 2 }],
);
test(
  "rook on an empty 8x8 board has 14 moves",
  String(getLegalMoves(makeBoard(8, 8), { x: 3, y: 3 }, "white", ROOK).length),
  "14",
);
squaresTest(
  "rook stops in front of a friendly piece",
  getLegalMoves(makeBoard(5, 1, [{ x: 3, y: 0, color: "white" }]), { x: 0, y: 0 }, "white", ROOK),
  [{ x: 1, y: 0 }, { x: 2, y: 0 }],
);
squaresTest(
  "rook captures an enemy and stops",
  getLegalMoves(makeBoard(5, 1, [{ x: 3, y: 0, color: "black" }]), { x: 0, y: 0 }, "white", ROOK),
  [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }],
);
squaresTest(
  "run(1,0)2 goes two squares",
  getLegalMoves(makeBoard(8, 1), { x: 0, y: 0 }, "white", [{ kind: "run", x: 1, y: 0, count: 2 }]),
  [{ x: 1, y: 0 }, { x: 2, y: 0 }],
);
squaresTest(
  "a missing count means one step",
  getLegalMoves(makeBoard(8, 1), { x: 0, y: 0 }, "white", [{ kind: "run", x: 1, y: 0 }]),
  [{ x: 1, y: 0 }],
);
squaresTest(
  "a diagonal run is not blocked by pieces on the orthogonal neighbours",
  getLegalMoves(
    makeBoard(4, 4, [{ x: 1, y: 0, color: "white" }, { x: 0, y: 1, color: "white" }]),
    { x: 0, y: 0 },
    "white",
    [{ kind: "run", x: 1, y: 1, count: "n" }],
  ),
  [{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }],
);

// --- jumping and sym ---------------------------------------------------------
test("sym of (2,1) gives 8 variants", String(symExpand(2, 1).length), "8");
test("sym of (1,1) gives 4 variants", String(symExpand(1, 1).length), "4");
test("sym of (0,1) gives 4 variants", String(symExpand(0, 1).length), "4");
squaresTest(
  "knight in the corner has 2 moves",
  getLegalMoves(makeBoard(8, 8), { x: 0, y: 0 }, "white", expandMoves(KNIGHT)),
  [{ x: 2, y: 1 }, { x: 1, y: 2 }],
);
squaresTest(
  "knight jumps over pieces but not onto a friendly one",
  getLegalMoves(
    makeBoard(8, 8, [
      { x: 1, y: 0, color: "white" },
      { x: 0, y: 1, color: "white" },
      { x: 1, y: 1, color: "black" },
      { x: 2, y: 1, color: "white" },
    ]),
    { x: 0, y: 0 },
    "white",
    expandMoves(KNIGHT),
  ),
  [{ x: 1, y: 2 }],
);
squaresTest(
  "a jump ignores its count and lands only once",
  getLegalMoves(makeBoard(8, 1), { x: 0, y: 0 }, "white", [{ kind: "jump", x: 2, y: 0, count: 3 }]),
  [{ x: 2, y: 0 }],
);
squaresTest(
  "two moves reaching the same square list it once",
  getLegalMoves(makeBoard(3, 1), { x: 0, y: 0 }, "white", [
    { kind: "jump", x: 1, y: 0, count: 1 },
    { kind: "run", x: 1, y: 0, count: 1 },
  ]),
  [{ x: 1, y: 0 }],
);

// --- colors, holes, safety ---------------------------------------------------
squaresTest(
  "black moves mirrored along y",
  getLegalMoves(makeBoard(3, 3), { x: 1, y: 2 }, "black", [{ kind: "run", x: 0, y: 1, count: "n" }]),
  [{ x: 1, y: 1 }, { x: 1, y: 0 }],
);
squaresTest(
  "a hole in the board stops a run",
  (() => {
    const board = makeBoard(5, 1);
    board[0][2] = BLOCKED;
    return getLegalMoves(board, { x: 0, y: 0 }, "white", ROOK);
  })(),
  [{ x: 1, y: 0 }],
);
squaresTest(
  "a jump cannot land in a hole",
  (() => {
    const board = makeBoard(3, 1);
    board[0][2] = BLOCKED;
    return getLegalMoves(board, { x: 0, y: 0 }, "white", [{ kind: "jump", x: 2, y: 0 }]);
  })(),
  [],
);
squaresTest(
  "a step of (0,0) is ignored and does not hang",
  getLegalMoves(makeBoard(3, 3), { x: 1, y: 1 }, "white", [{ kind: "run", x: 0, y: 0, count: "n" }]),
  [],
);

// --- input handling ----------------------------------------------------------
test(
  "old condition-based rules are not notation moves",
  String(isNotationMove({ id: "r1", conditions: [], result: "allow", type: "jump" })),
  "false",
);
test(
  "expandMoves skips old rules and keeps new ones",
  String(
    expandMoves([
      { id: "r1", conditions: [], result: "allow", type: "jump" },
      { kind: "run", x: 1, y: 0, count: "n" },
    ]).length,
  ),
  "1",
);
{
  const saved = Object.freeze([
    Object.freeze({ kind: "run", x: 1, y: 1, count: "n" }),
    Object.freeze({ kind: "jump", modifier: "sym", x: 2, y: 1 }),
  ]);
  const before = JSON.stringify(saved);
  getLegalMoves(makeBoard(8, 8), { x: 3, y: 3 }, "white", expandMoves(saved as unknown as Move[]));
  test("the saved moves are never modified", JSON.stringify(saved), before);
}

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
