import { Piece } from "./Piece";

export interface PieceType {
    type: string;           // z. B. "pawn", "rook", "queen" …
    color: string;          // "white" oder "black"
    position: string;       // z. B. "a2", "e4"
    size?: number;          // optional: die Darstellungsgröße
    id?: number;            // optional server-provided id
}


export const pieces: Piece[] = [
    new Piece("Rook", "white", "a1", 1),
    new Piece("Knight", "white", "b1", 2),
    new Piece("Bishop", "white", "c1", 3),
    new Piece("Queen", "white", "d1", 4),
    new Piece("King", "white", "e1", 5),
    new Piece("Bishop", "white", "f1", 6),
    new Piece("Knight", "white", "g1", 7),
    new Piece("Rook", "white", "h1", 8),

    new Piece("Pawn", "white", "a2", 9),
    new Piece("Pawn", "white", "b2", 10),
    new Piece("Pawn", "white", "c2", 11),
    new Piece("Pawn", "white", "d2", 12),
    new Piece("Pawn", "white", "e2", 13),
    new Piece("Pawn", "white", "f2", 14),
    new Piece("Pawn", "white", "g2", 15),
    new Piece("Pawn", "white", "h2", 16),

    new Piece("Pawn", "black", "a7", 17),
    new Piece("Pawn", "black", "b7", 18),
    new Piece("Pawn", "black", "c7", 19),
    new Piece("Pawn", "black", "d7", 20),
    new Piece("Pawn", "black", "e7", 21),
    new Piece("Pawn", "black", "f7", 22),
    new Piece("Pawn", "black", "g7", 23),
    new Piece("Pawn", "black", "h7", 24),

    new Piece("Rook", "black", "a8", 25),
    new Piece("Knight", "black", "b8", 26),
    new Piece("Bishop", "black", "c8", 27),
    new Piece("Queen", "black", "d8", 28),
    new Piece("King", "black", "e8", 29),
    new Piece("Bishop", "black", "f8", 30),
    new Piece("Knight", "black", "g8", 31),
    new Piece("Rook", "black", "h8", 32),
];

export const pieceImagesv3: Record<string, string> = {
    white_pawn: "/pieces-v3/white_pawn.png",
    black_pawn: "/pieces-v3/black_pawn.png",
    white_bishop: "/pieces-v3/white_bishop.png",
    black_bishop: "/pieces-v3/black_bishop.png",
    white_knight: "/pieces-v3/white_knight.png",
    black_knight: "/pieces-v3/black_knight.png",
    white_rook: "/pieces-v3/white_rook.png",
    black_rook: "/pieces-v3/black_rook.png",
    white_queen: "/pieces-v3/white_queen.png",
    black_queen: "/pieces-v3/black_queen.png",
    white_king: "/pieces-v3/white_king.png",
    black_king: "/pieces-v3/black_king.png",
};

export const pieceImagesv2: Record<string, string> = {
    white_pawn: "/pieces-v2/white_pawn.png",
    black_pawn: "/pieces-v2/black_pawn.png",
    white_bishop: "/pieces-v2/white_bishop.png",
    black_bishop: "/pieces-v2/black_bishop.png",
    white_knight: "/pieces-v2/white_knight.png",
    black_knight: "/pieces-v2/black_knight.png",
    white_rook: "/pieces-v2/white_rook.png",
    black_rook: "/pieces-v2/black_rook.png",
    white_queen: "/pieces-v2/white_queen.png",
    black_queen: "/pieces-v2/black_queen.png",
    white_king: "/pieces-v2/white_king.png",
    black_king: "/pieces-v2/black_king.png",
};

export const getPieceImage = (style: string, color: string, type: string) => {
    const key = `${color}_${type.toLowerCase()}`;
    if (style === "v2") return pieceImagesv2[key];
    return pieceImagesv3[key];
};
