export type Square = string; // Erlaubt "a1", "0,0", etc.

export interface PieceState {
    id: string;       // unique ID der Figur: 1,2,3,4,5...
    type: string;     // z.B. "pawn", "knight", "custom_piece"
    color: "white" | "black" | string;
    position: Square;
    hasMoved?: boolean; // für Spezialregeln wie Rochade
    customProps?: Record<string, any>; // für chessperiment-spezifische Regeln
}

/**
 * SquareState - Mutable runtime state for a square.
 * Separated from immutable topology.
 */
export interface SquareState {
    tags: Set<string>; // Generic tags: 'lava', 'water', 'white-square', etc.
    disabled: boolean;
    customProps: Record<string, any>;
}

export interface BoardState {
    squares: Record<Square, PieceState | null>; // null = leer
    turn: "white" | "black";
    history: Array<{ from: Square; to: Square; pieceId: string }>;
    gridType?: 'square' | 'hex';
    version?: string; // For migration
    meta?: Record<string, any>; // z.B. Regeln, Sonderbedingungen
}

/**
 * Effect phase - determines execution order
 */
export type EffectPhase = 'pre-move' | 'on-move' | 'post-move' | 'end-of-turn';

/**
 * Trigger types for piece and square logic
 */
export type TriggerType =
    | 'on-move'
    | 'on-is-captured'
    | 'on-captured'
    | 'on-threat'
    | 'on-environment'
    | 'on-turn-start'
    | 'on-turn-end'
    | 'on-cooldown-ready';

export interface MoveCondition {
    id: string;
    variable: 'diffX' | 'diffY' | 'absDiffX' | 'absDiffY' | 'dist' | 'cooldown' | 'charge' | 'mode';
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
