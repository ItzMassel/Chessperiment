export function piecesListToBoard(pieces: any) {
  // 8x8 mit null füllen
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));

  pieces.forEach((piece: any) => {
    const file = piece.position[0]; // a–h
    const rank = piece.position[1]; // 1–8

    const col = file.charCodeAt(0) - "a".charCodeAt(0);
    const row = 8 - parseInt(rank); // rank 8 = row 0, rank 1 = row 7

    board[row][col] = piece;
  });

  return board;
}

export function calcSize(baseSize: number, sw: number, sh: number) {
  if (sw > 1200) return baseSize;
  else if (sw > 800) return baseSize * 0.8;
  else if (sw > 600) return baseSize * 0.7;
  else return baseSize * 0.5;
}

export function boardToFEN(board: any) {
  type PieceType = "Pawn" | "Knight" | "Bishop" | "Rook" | "Queen" | "King";

  interface Piece {
    type: PieceType;
    color: "white" | "black";
    position: string;
    id: number;
    size?: number;
    gridPos?: string;
  }
  const typeToFEN: Record<PieceType, string> = {
    Pawn: "p",
    Knight: "n",
    Bishop: "b",
    Rook: "r",
    Queen: "q",
    King: "k",
  };
  let fen = "";

  for (let row = 0; row < 8; row++) {
    let empty = 0;

    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];

      if (!piece) {
        empty++;
      } else {
        if (empty > 0) {
          fen += empty;
          empty = 0;
        }
        let symbol: string = typeToFEN[piece.type as PieceType] ?? "?";
        if (!symbol) {
          console.error("Unknown piece type:", piece.type);
          symbol = "?";
        }

        fen += piece.color === "white"
          ? symbol.toUpperCase()
          : symbol.toLowerCase();
      }
    }

    if (empty > 0) fen += empty;
    if (row < 7) fen += "/";
  }

  // Basic extra fields
  fen += " w KQkq - 0 1";

  return fen;
}