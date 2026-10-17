// Run with:  npx tsx src/engine/customPiece.test.ts   (from the client folder)
import { BoardClass } from "./board";
import { Piece, CustomPiece } from "./piece";
import { toSquare } from "./utils";
import type { Square } from "./types";

let failed = 0;
function test(label: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`PASS ${label}`);
  } else {
    failed++;
    console.log(`FAIL ${label}\n     expected: ${e}\n     actual:   ${a}`);
  }
}

const sq = (x: number, y: number) => toSquare([x, y], true) as Square;
const allSquares = () => Array.from({ length: 64 }, (_, i) => sq(i % 8, Math.floor(i / 8)));

function boardWith(setup: (board: BoardClass) => void, activeSquares?: Square[]) {
  const board = new BoardClass({}, activeSquares, 8, 8);
  setup(board);
  return board;
}

function put(board: BoardClass, square: Square, color: "white" | "black", rules: any[] = [], type = "dragon") {
  const piece = Piece.create(`${type}-${square}-${color}`, type, color, square, rules, [], type) as CustomPiece;
  board.setPiece(square, piece);
  return piece;
}

const reachable = (piece: CustomPiece, board: BoardClass) =>
  allSquares().filter(s => piece.isValidMove(piece.position, s, board)).sort();

const ROOK = [
  { kind: "run", x: 1, y: 0, count: "n" },
  { kind: "run", x: -1, y: 0, count: "n" },
  { kind: "run", x: 0, y: 1, count: "n" },
  { kind: "run", x: 0, y: -1, count: "n" },
];

// --- new format -------------------------------------------------------------
{
  const board = boardWith(() => {});
  const rook = put(board, sq(4, 3), "white", ROOK);
  test("rook on an empty board reaches 14 squares", reachable(rook, board).length, 14);
}
{
  const board = boardWith(b => {
    put(b, sq(4, 6), "black", [], "pawn");
    put(b, sq(4, 1), "white", [], "pawn");
  });
  const rook = put(board, sq(4, 3), "white", ROOK);
  const squares = reachable(rook, board);
  test("rook captures the enemy at the end of its file", squares.includes(sq(4, 6)), true);
  test("rook does not jump past the enemy", squares.includes(sq(4, 7)), false);
  test("rook cannot capture its own piece", squares.includes(sq(4, 1)), false);
}
{
  const board = boardWith(() => {});
  const knight = put(board, sq(1, 0), "white", [{ kind: "jump", modifier: "sym", x: 2, y: 1 }]);
  test("jump(sym(2,1)) from b1 reaches a3, c3 and d2", reachable(knight, board), [sq(0, 2), sq(2, 2), sq(3, 1)].sort());
}
{
  const board = boardWith(() => {});
  const black = put(board, sq(4, 4), "black", [{ kind: "jump", x: 0, y: 1 }]);
  test("a black piece moves 'forward' towards rank 1", reachable(black, board), [sq(4, 3)]);
}
{
  const board = boardWith(() => {}, allSquares().filter(s => s !== sq(3, 3)));
  const rook = put(board, sq(0, 3), "white", ROOK);
  const squares = reachable(rook, board);
  test("a hole in the board stops the rook", squares.filter(s => s.endsWith("4")), [sq(1, 3), sq(2, 3)].sort());
}

// --- old format -------------------------------------------------------------
const LEGACY_KNIGHT_2_1 = [
  {
    id: "r1",
    result: "allow",
    type: "jump",
    conditions: [
      { id: "c1", variable: "absDiffX", operator: "===", value: 2 },
      { id: "c2", variable: "absDiffY", operator: "===", value: 1 },
    ],
  },
];
{
  const board = boardWith(() => {});
  const piece = put(board, sq(4, 3), "white", LEGACY_KNIGHT_2_1);
  test("an old condition rule still allows its move", piece.isValidMove(sq(4, 3), sq(6, 4), board), true);
  test("an old condition rule still rejects other moves", piece.isValidMove(sq(4, 3), sq(5, 5), board), false);
}
{
  const board = boardWith(() => {});
  const piece = put(board, sq(4, 3), "white", [...LEGACY_KNIGHT_2_1, { kind: "run", x: 0, y: 1, count: "n" }]);
  test("a piece with old and new moves can use the old one", piece.isValidMove(sq(4, 3), sq(6, 4), board), true);
  test("a piece with old and new moves can use the new one", piece.isValidMove(sq(4, 3), sq(4, 7), board), true);
  test("a piece with old and new moves rejects the rest", piece.isValidMove(sq(4, 3), sq(5, 5), board), false);
}

// --- data safety --------------------------------------------------------------
{
  const saved = Object.freeze([
    Object.freeze({ kind: "run", x: 1, y: 1, count: "n" }),
    Object.freeze({ kind: "jump", modifier: "sym", x: 2, y: 1 }),
  ]);
  const before = JSON.stringify(saved);
  const board = boardWith(() => {});
  const piece = put(board, sq(3, 3), "white", saved as unknown as any[]);
  reachable(piece, board);
  piece.clone().isValidMove(sq(3, 3), sq(4, 4), board);
  test("the saved moves survive validation and cloning untouched", JSON.stringify(piece.rules), before);
}

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);