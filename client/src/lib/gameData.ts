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

export interface PieceType {
    type: string;
    color: string;
    position: string;
    size?: number;
    id?: number;
}
