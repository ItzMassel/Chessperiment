export type Square = string; // Erlaubt "a1", "0,0", etc.

export interface PieceState {
    id: string;       // unique ID der Figur: 1,2,3,4,5...
    type: string;     // z.B. "pawn", "knight", "custom_piece"
    color: "white" | "black" | string;
    position: Square;
    hasMoved?: boolean; // für Spezialregeln wie Rochade
    customProps?: Record<string, any>; // für chessperiment-spezifische Regeln
}

export interface BoardState {
    squares: Record<Square, PieceState | null>; // null = leer
    turn: "white" | "black";
    history: Array<{ from: Square; to: Square; pieceId: string }>;
    gridType?: 'square' | 'hex';
    meta?: Record<string, any>; // z.B. Regeln, Sonderbedingungen
}

export interface MoveCondition {
    id: string;
    variable: 'diffX' | 'diffY' | 'absDiffX' | 'absDiffY' | 'dist' | 'cooldown' | 'charge' | 'mode';
    variableVariable?: string; // If set, compare this piece variable instead of the spatial/state variable
    operator: '===' | '>' | '<' | '>=' | '<=';
    value: number;
    valueVariable?: string; // If set, compare against this piece variable instead of `value`
    logic?: 'AND' | 'OR';
}

export interface MoveRule {
    id: string;
    conditions: MoveCondition[];
    result: 'allow' | 'disallow';
    type?: 'jump' | 'slide' | 'run' | 'running'; // jump = can move over obstacles, slide/run = must have clear path
}

export type pieces = "pawn" | "knight" | "bishop" | "rook" | "queen" | "king"
