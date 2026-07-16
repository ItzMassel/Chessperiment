
import { Game } from './game';
import { Square } from './types';

const testMove = (game: Game, from: Square, to: Square, expected: boolean) => {
    const board = game.getBoard();
    const piece = board.getPiece(from);
    const result = game.makeMove(from, to);
    if (result !== expected) {
        console.error(`  [FAIL] Move ${from} -> ${to}: expected ${expected}, got ${result}`);
    }
};

const runTests = () => {
    let game: Game;

    console.log('--- VALID GAME SEQUENCE ---');
    game = new Game();
    testMove(game, 'e2', 'e4', true);  // White
    testMove(game, 'e7', 'e5', true);  // Black
    testMove(game, 'g1', 'f3', true);  // White
    testMove(game, 'b8', 'c6', true);  // Black
    testMove(game, 'f1', 'b5', true);  // White
    testMove(game, 'a7', 'a6', true);  // Black

    console.log('\n--- ILLEGAL MOVES ---');
    game = new Game();
    // 1. Moving opponent's piece
    testMove(game, 'e7', 'e5', false); // White tries to move black pawn

    // 2. Moving to a square occupied by own piece
    testMove(game, 'e2', 'e3', true);
    testMove(game, 'e7', 'e6', true);
    testMove(game, 'd1', 'd2', false); // White queen tries to move to square occupied by white pawn

    // 3. Invalid pawn moves
    game = new Game();
    testMove(game, 'e2', 'e5', false); // Invalid 3-square move
    testMove(game, 'd2', 'd5', false); // Invalid 3-square move

    // 4. Knight moving like a rook
    game = new Game();
    testMove(game, 'g1', 'g3', false);

    // 5. Moving through another piece (rook)
    game = new Game();
    testMove(game, 'h1', 'h5', false);

    console.log('\n--- KING SAFETY & PAWN ATTACKS ---');
    game = new Game();
    // Setup: White pawn e4, Black pawn d5.
    testMove(game, 'e2', 'e4', true);  // W
    testMove(game, 'd7', 'd5', true);  // B
    testMove(game, 'e4', 'd5', true);  // W captures B pawn
    testMove(game, 'e8', 'd7', true);  // B King moves (illegal usually but let's check geometry)
    
    // Test King moving to square in front of pawn (should be legal)
    game = new Game();
    testMove(game, 'e2', 'e4', true);
    testMove(game, 'e7', 'e5', true);
    testMove(game, 'd1', 'e2', true); // Move Queen out
    testMove(game, 'a7', 'a6', true);
    testMove(game, 'e1', 'd1', true); // Move King to d1
    testMove(game, 'b7', 'b6', true);
    testMove(game, 'd1', 'd2', true); // Move King to d2 (in front of d-pawn)
    // Wait, d2 is occupied by white pawn. Let's move it first.
    game = new Game();
    testMove(game, 'd2', 'd4', true);
    testMove(game, 'e7', 'e5', true);
    testMove(game, 'e1', 'd2', true); // White King to d2.
    // e7..e5 pawn is at rank 5. White King at rank 2. 
    // Let's test a Black pawn at e3.
    game = new Game();
    testMove(game, 'e2', 'e4', true);
    testMove(game, 'e7', 'e5', true);
    testMove(game, 'f2', 'f4', true);
    testMove(game, 'e5', 'f4', true);
    testMove(game, 'e4', 'e5', true);
    testMove(game, 'f4', 'f3', true); // Black pawn at f3.
    // Now f3 pawn attacks e2 and g2. It does NOT attack f2.
    testMove(game, 'e1', 'f2', true); // King moves to f2, in front of pawn. SHOULD BE LEGAL.
    testMove(game, 'a7', 'a6', true);
    testMove(game, 'f2', 'e2', false); // King moves to e2, which is attacked by f3 pawn. SHOULD BE ILLEGAL.
};

runTests();
