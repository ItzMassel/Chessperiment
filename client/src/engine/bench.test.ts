// Run with:  npx tsx src/engine/bench.test.ts   (from the client folder)
import { BoardClass } from "./board";
import { Game } from "./game";
import { Piece } from "./piece";
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

type Color = "white" | "black";

/** An empty 8x8 board; `setup` places pieces and fills the bench. */
function gameWith(setup: (b: BoardClass) => void, activeSquares?: Square[]) {
  const board = new BoardClass({}, activeSquares, 8, 8);
  setup(board);
  return new Game(board);
}

const place = (b: BoardClass, sq: Square, type: string, color: Color) =>
  b.setPiece(sq, Piece.create(`${type}-${sq}-${color}`, type, color, sq));

const bench = (b: BoardClass, id: string, type: string, color: Color) =>
  b.addToBench(Piece.create(id, type, color, "bench"));

// --- the bench is off the board ---------------------------------------------
{
  const game = gameWith(b => {
    place(b, "e1", "king", "white");
    bench(b, "w-queen", "queen", "white");
    bench(b, "w-pawn", "pawn", "white");
    bench(b, "b-rook", "rook", "black");
  });
  const board = game.getBoard();
  test("bench pieces are not on any square", Object.values(board.getSquares()).filter(Boolean).length, 1);
  test("the bench keeps its order", board.getBench().map(p => p.id), ["w-queen", "w-pawn", "b-rook"]);
  test("the bench can be filtered by color", board.getBench("white").map(p => p.id), ["w-queen", "w-pawn"]);
}

// --- dropping ----------------------------------------------------------------
{
  const game = gameWith(b => {
    place(b, "e1", "king", "white");
    bench(b, "w-queen", "queen", "white");
  });
  const board = game.getBoard();
  test("dropping on an empty square works", game.dropPiece("w-queen", "d4"), true);
  test("the dropped piece is on the board", board.getPiece("d4")?.type, "queen");
  test("the dropped piece knows where it is", board.getPiece("d4")?.position, "d4");
  test("the bench is empty afterwards", board.getBench().length, 0);
  test("a drop uses up the turn", board.getTurn(), "black");
  test("a drop is recorded in the history", board.getHistory().map(h => [h.from, h.to, h.pieceId]), [["bench", "d4", "w-queen"]]);
}
{
  const game = gameWith(b => {
    place(b, "e1", "king", "white");
    place(b, "d4", "pawn", "black");
    bench(b, "w-queen", "queen", "white");
  });
  test("cannot drop on an occupied square", game.dropPiece("w-queen", "d4"), false);
  test("cannot drop on your own piece", game.dropPiece("w-queen", "e1"), false);
  test("a rejected drop leaves the piece on the bench", game.getBoard().getBench().length, 1);
  test("a rejected drop keeps the turn", game.getBoard().getTurn(), "white");
  test("cannot drop a piece that is not on the bench", game.dropPiece("ghost", "a3"), false);
}
{
  const game = gameWith(
    b => {
      place(b, "e1", "king", "white");
      bench(b, "w-queen", "queen", "white");
    },
    (["a1", "b1", "c1", "d1", "e1"] as Square[]),
  );
  test("cannot drop on an inactive square", game.dropPiece("w-queen", "d4"), false);
  test("can drop on an active square", game.dropPiece("w-queen", "d1"), true);
}
{
  const game = gameWith(b => {
    place(b, "e1", "king", "white");
    bench(b, "b-knight", "knight", "black");
  });
  test("cannot drop the other player's piece", game.dropPiece("b-knight", "d4"), false);
}

// --- pawns -------------------------------------------------------------------
{
  const game = gameWith(b => {
    place(b, "e1", "king", "white");
    bench(b, "w-pawn", "pawn", "white");
  });
  test("a white pawn cannot be dropped on rank 8", game.dropPiece("w-pawn", "a8"), false);
  test("a white pawn can be dropped elsewhere", game.dropPiece("w-pawn", "a7"), true);
}
{
  const game = gameWith(b => {
    place(b, "e1", "king", "white");
    place(b, "e8", "king", "black");
    bench(b, "b-pawn", "pawn", "black");
  });
  game.getBoard().movePiece("e1", "e2"); // white moves, black to play
  test("a black pawn cannot be dropped on rank 1", game.dropPiece("b-pawn", "a1"), false);
  test("a black pawn can be dropped elsewhere", game.dropPiece("b-pawn", "a2"), true);
}

// --- king safety ---------------------------------------------------------------
{
  // The black rook on e8 gives check along the open e-file to the white king on e1.
  const game = gameWith(b => {
    place(b, "e1", "king", "white");
    place(b, "e8", "rook", "black");
    bench(b, "w-queen", "queen", "white");
  });
  test("in check, a drop that does not help is rejected", game.dropPiece("w-queen", "a4"), false);
  test("in check, a drop that blocks the check is allowed", game.dropPiece("w-queen", "e4"), true);
}

// --- game status -----------------------------------------------------------------
{
  // White king in the a1 corner is not in check but every square it could go to is covered.
  const setup = (withBench: boolean) => (b: BoardClass) => {
    place(b, "a1", "king", "white");
    place(b, "b8", "rook", "black");
    place(b, "h2", "rook", "black");
    place(b, "h8", "king", "black");
    if (withBench) bench(b, "w-pawn", "pawn", "white");
  };
  test("no moves and no bench is stalemate", gameWith(setup(false)).getGameStatus(), "stalemate");
  test("no moves but a droppable bench piece is not stalemate", gameWith(setup(true)).getGameStatus(), "normal");
}
{
  // Back-rank mate: rooks on h1 (check) and h2 (covers rank 2).
  const setup = (withBench: boolean) => (b: BoardClass) => {
    place(b, "a1", "king", "white");
    place(b, "h1", "rook", "black");
    place(b, "h2", "rook", "black");
    place(b, "h8", "king", "black");
    if (withBench) bench(b, "w-rook", "rook", "white");
  };
  test("a back-rank mate without a bench is checkmate", gameWith(setup(false)).getGameStatus(), "checkmate");
  test("a bench piece that can block the check prevents checkmate", gameWith(setup(true)).getGameStatus(), "check");
}

// --- legal drop squares -----------------------------------------------------------
{
  const game = gameWith(b => {
    place(b, "e1", "king", "white");
    place(b, "e8", "king", "black");
    bench(b, "w-knight", "knight", "white");
  });
  const squares = game.getLegalDropSquares("w-knight");
  test("every empty square is a legal drop", squares.length, 62);
  test("occupied squares are not", [squares.includes("e1"), squares.includes("e8")], [false, false]);
  test("getLegalDrops lists each (piece, square) pair", game.getLegalDrops().length, 62);
}

// --- undo and cloning ----------------------------------------------------------------
{
  const game = gameWith(b => {
    place(b, "e1", "king", "white");
    bench(b, "w-queen", "queen", "white");
  });
  const board = game.getBoard();
  game.dropPiece("w-queen", "d4");
  board.undo();
  test("undo puts the piece back on the bench", board.getBench().map(p => p.id), ["w-queen"]);
  test("undo empties the square again", board.getPiece("d4"), null);
  test("undo gives the turn back", board.getTurn(), "white");
}
{
  const game = gameWith(b => {
    place(b, "e1", "king", "white");
    bench(b, "w-queen", "queen", "white");
  });
  const board = game.getBoard();
  const copy = board.clone();
  copy.dropPiece("w-queen", "d4");
  test("a clone starts with the same bench", [board.getBench().length, copy.getBench().length], [1, 0]);
  test("dropping on a clone does not touch the original", board.getPiece("d4"), null);
}

// --- hex boards ------------------------------------------------------------------------
{
  const hexSquares = ["-1,0", "0,-1", "0,0", "0,1", "1,-1", "1,0", "1,1"] as Square[];
  const board = new BoardClass({}, hexSquares, 3, 3, "hex");
  board.addToBench(Piece.create("w-pawn", "pawn", "white", "bench"));
  const game = new Game(board);
  test("hex: every active square is a drop target", game.getLegalDropSquares("w-pawn").sort(), [...hexSquares].sort());
  test("hex: a pawn may be dropped anywhere (no fixed promotion rank)", game.dropPiece("w-pawn", "0,-1"), true);
  test("hex: the dropped piece sits on its square", board.getPiece("0,-1")?.type, "pawn");
}

// --- constructor ----------------------------------------------------------------------
{
  const board = new BoardClass({}, undefined, 8, 8, "square", undefined, [
    Piece.create("a", "rook", "white", "bench"),
    Piece.create("b", "rook", "black", "bench"),
  ]);
  test("the constructor takes a starting bench", board.getBench().map(p => p.id), ["a", "b"]);
}

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
if (failed) process.exit(1);
