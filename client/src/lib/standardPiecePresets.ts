/**
 * Standard chess piece presets for the Piece Editor.
 * Each preset defines move rules in the same format as VisualMoveEditor MoveRule[].
 *
 * Variables used:
 *   diffX / diffY     = signed delta (directional)
 *   absDiffX / absDiffY = absolute delta
 *
 * Rule types:
 *   'jump' = can leap over pieces
 *   'run'  = must have a clear path (sliding)
 */

import { v4 as uuidv4 } from 'uuid';

export interface PresetMoveCondition {
    id: string;
    variable: 'diffX' | 'diffY' | 'absDiffX' | 'absDiffY';
    operator: '===' | '>' | '<' | '>=' | '<=';
    value: number;
    logic?: 'AND' | 'OR';
}

export interface PresetMoveRule {
    id: string;
    conditions: PresetMoveCondition[];
    result: 'allow' | 'disallow';
    type?: 'run' | 'jump';
}

function cond(variable: PresetMoveCondition['variable'], operator: PresetMoveCondition['operator'], value: number, logic?: 'AND' | 'OR'): PresetMoveCondition {
    return { id: uuidv4(), variable, operator, value, logic };
}

function rule(conditions: PresetMoveCondition[], result: 'allow' | 'disallow' = 'allow', type: 'run' | 'jump' = 'jump'): PresetMoveRule {
    return { id: uuidv4(), conditions, result, type };
}

// ─── KING ────────────────────────────────────────────
// Moves 1 square in any direction
const kingPreset: PresetMoveRule[] = [
    rule([cond('absDiffX', '<=', 1), cond('absDiffY', '<=', 1)], 'allow', 'jump'),
];

// ─── QUEEN ───────────────────────────────────────────
// Slides any distance horizontally, vertically, or diagonally
const queenPreset: PresetMoveRule[] = [
    // Horizontal (ΔY = 0)
    rule([cond('absDiffY', '===', 0), cond('absDiffX', '>=', 1)], 'allow', 'run'),
    // Vertical (ΔX = 0)
    rule([cond('absDiffX', '===', 0), cond('absDiffY', '>=', 1)], 'allow', 'run'),
    // Diagonal (|ΔX| = |ΔY|)
    rule([cond('absDiffX', '===', 1, 'AND'), cond('absDiffY', '===', 1)], 'allow', 'run'), // handled by sliding
    rule([cond('absDiffX', '>=', 1), cond('absDiffY', '>=', 1)], 'allow', 'run'), // general diagonal handled by engine equality check
];

// Actually let's make it simpler — the engine checks path clearance for 'run' moves
// In reality the custom piece engine uses the condition-matching differently from standard pieces.
// Let me re-define using the exact condition format the VisualMoveEditor creates:

const queenPresetClean: PresetMoveRule[] = [
    // Rook-like: horizontal  
    rule([cond('absDiffY', '===', 0), cond('absDiffX', '>=', 1)], 'allow', 'run'),
    // Rook-like: vertical
    rule([cond('absDiffX', '===', 0), cond('absDiffY', '>=', 1)], 'allow', 'run'),
    // Bishop-like: diagonal — engine checks |ΔX|=|ΔY| via GCD logic for sliding moves
    // We match when |ΔX| >= 1 AND |ΔY| >= 1 with equal values
    // The simplest approach: add one rule per direction magnitude isn't feasible,
    // so we rely on the engine's path-check using: |ΔX| >= 1 AND |ΔY| >= 1 (diagonal implied by equal)
    // NOTE: This will also allow non-diagonal moves — we need |ΔX| === |ΔY| but that can't be expressed
    // directly in the current condition system. For presets, we'll use a pragmatic approach.
];

// ─── ROOK ────────────────────────────────────────────
// Slides horizontally or vertically
const rookPreset: PresetMoveRule[] = [
    rule([cond('absDiffY', '===', 0), cond('absDiffX', '>=', 1)], 'allow', 'run'),
    rule([cond('absDiffX', '===', 0), cond('absDiffY', '>=', 1)], 'allow', 'run'),
];

// ─── BISHOP ──────────────────────────────────────────
// Slides diagonally — in the current system, we express this as
// matching specific distances since |ΔX|===|ΔY| requires cross-variable comparison
// which the editor doesn't support. We'll approximate for up to 8 squares.
const bishopPreset: PresetMoveRule[] = Array.from({ length: 7 }, (_, i) => {
    const dist = i + 1; // 1..7
    return rule(
        [cond('absDiffX', '===', dist), cond('absDiffY', '===', dist)],
        'allow',
        'run'
    );
});

// ─── KNIGHT ──────────────────────────────────────────
// L-shape: (1,2) or (2,1)
const knightPreset: PresetMoveRule[] = [
    rule([cond('absDiffX', '===', 1), cond('absDiffY', '===', 2)], 'allow', 'jump'),
    rule([cond('absDiffX', '===', 2), cond('absDiffY', '===', 1)], 'allow', 'jump'),
];

// ─── PAWN ────────────────────────────────────────────
// Forward 1 (ΔY = 1 for the piece's color, ΔX = 0)
// Note: diffY is automatically adjusted by the engine based on piece color
const pawnPreset: PresetMoveRule[] = [
    // Forward 1 step
    rule([cond('diffY', '===', 1), cond('absDiffX', '===', 0)], 'allow', 'run'),
    // Forward 2 from start – the engine doesn't check "has not moved" in custom rules,
    // so this is an approximation. Players can refine with advanced logic.
    rule([cond('diffY', '===', 2), cond('absDiffX', '===', 0)], 'allow', 'run'),
    // Diagonal capture (forward-left and forward-right)
    rule([cond('diffY', '===', 1), cond('absDiffX', '===', 1)], 'allow', 'jump'),
];

// ─── EXPORTS ─────────────────────────────────────────

export interface PiecePreset {
    name: string;
    icon: string;
    description: string;
    rules: PresetMoveRule[];
}

export const STANDARD_PIECE_PRESETS: PiecePreset[] = [
    {
        name: 'King',
        icon: '♚',
        description: 'Moves 1 square in any direction',
        rules: kingPreset,
    },
    {
        name: 'Queen',
        icon: '♛',
        description: 'Slides horizontally, vertically, and diagonally',
        rules: [...rookPreset, ...bishopPreset], // Queen = Rook + Bishop moves
    },
    {
        name: 'Rook',
        icon: '♜',
        description: 'Slides horizontally or vertically',
        rules: rookPreset,
    },
    {
        name: 'Bishop',
        icon: '♝',
        description: 'Slides diagonally',
        rules: bishopPreset,
    },
    {
        name: 'Knight',
        icon: '♞',
        description: 'L-shaped jump (2+1 squares)',
        rules: knightPreset,
    },
    {
        name: 'Pawn',
        icon: '♟',
        description: 'Forward 1 (or 2 from start), diagonal capture',
        rules: pawnPreset,
    },
];

/**
 * Returns a deep copy of the preset rules with fresh IDs.
 * This ensures each loaded preset has unique rule IDs.
 */
export function getPresetRules(presetName: string): PresetMoveRule[] {
    const preset = STANDARD_PIECE_PRESETS.find(p => p.name === presetName);
    if (!preset) return [];

    return preset.rules.map(r => ({
        ...r,
        id: uuidv4(),
        conditions: r.conditions.map(c => ({ ...c, id: uuidv4() })),
    }));
}
