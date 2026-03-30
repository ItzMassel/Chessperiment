import { Square, MoveRule } from './types';
import { toCoords, toSquare } from './utils';
import type { BoardClass } from './board';
import { LogicRunner } from './logic/LogicRunner';

export abstract class Piece {
    id: string;
    type: string;
    name: string;
    color: "white" | "black";
    position: Square;
    hasMoved: boolean = false;

    constructor(id: string, type: string, color: "white" | "black", position: Square, name?: string) {
        this.id = id;
        this.type = type;
        this.color = color;
        this.position = position;
        this.name = name || type;
    }

    abstract isValidMove(from: Square, to: Square, board: BoardClass): boolean;
    abstract canAttack(target: Square, board: BoardClass): boolean;
    abstract clone(): Piece;

    static create(id: string, type: string, color: "white" | "black", position: Square, rules: any = [], logic: any = [], name?: string): Piece {
        const actualRules = typeof rules === 'string' ? JSON.parse(rules) : (Array.isArray(rules) ? rules : []);
        const actualLogic = typeof logic === 'string' ? JSON.parse(logic) : (Array.isArray(logic) ? logic : []);

        if (actualRules.length > 0 || actualLogic.length > 0) {
            return new CustomPiece(id, type, color, position, actualRules, actualLogic, name);
        }

        const lowerType = type.toLowerCase();
        let piece: Piece;
        switch (lowerType) {
            case 'pawn': piece = new Pawn(id, color, position); break;
            case 'knight': piece = new Knight(id, color, position); break;
            case 'bishop': piece = new Bishop(id, color, position); break;
            case 'rook': piece = new Rook(id, color, position); break;
            case 'queen': piece = new Queen(id, color, position); break;
            case 'king': piece = new King(id, color, position); break;
            default: piece = new CustomPiece(id, type, color, position, actualRules, actualLogic, name); break;
        }
        if (name) piece.name = name;
        return piece;
    }

    static createStandard(id: string, type: string, color: "white" | "black", position: Square): Piece | null {
        const lowerType = type.toLowerCase();
        switch (lowerType) {
            case 'pawn': return new Pawn(id, color, position);
            case 'knight': return new Knight(id, color, position);
            case 'bishop': return new Bishop(id, color, position);
            case 'rook': return new Rook(id, color, position);
            case 'queen': return new Queen(id, color, position);
            case 'king': return new King(id, color, position);
            default: return null;
        }
    }
}

export class CustomPiece extends Piece {
    rules: MoveRule[];
    logic: any[];
    variables: Record<string, any> = {};
    public isCustom = true;
    public pixelsWhite?: string[][];
    public pixelsBlack?: string[][];
    public image?: string;
    
    // Multi-cell piece support (anchor model)
    public shape?: {
        anchor: [number, number]; // Relative coords [0,0] for single-cell
        extensions: [number, number][]; // Additional cells relative to anchor
    };

    constructor(id: string, type: string, color: "white" | "black", position: Square, rules: any = [], logic: any = [], name?: string, shape?: { anchor: [number, number], extensions: [number, number][] }) {
        super(id, type, color, position, name);
        this.rules = typeof rules === 'string' ? JSON.parse(rules) : (Array.isArray(rules) ? rules : []);
        this.logic = typeof logic === 'string' ? JSON.parse(logic) : (Array.isArray(logic) ? logic : []);
        this.shape = shape || { anchor: [0, 0], extensions: [] };
    }
    
    /**
     * Get all squares occupied by this multi-cell piece.
     */
    getOccupiedSquares(board: BoardClass): Square[] {
        if (!this.shape || this.shape.extensions.length === 0) {
            return [this.position]; // Single-cell piece
        }
        
        const [baseX, baseY] = toCoords(this.position);
        const squares: Square[] = [this.position];
        
        for (const [dx, dy] of this.shape.extensions) {
            const sq = toSquare([baseX + dx, baseY + dy], board.gridType === 'square');
            squares.push(sq);
        }
        
        return squares;
    }
    
    /**
     * Check if all cells of a multi-cell piece can fit at target position.
     */
    canFitAt(targetSquare: Square, board: BoardClass): boolean {
        if (!this.shape || this.shape.extensions.length === 0) {
            return true; // Single-cell always fits
        }
        
        const [baseX, baseY] = toCoords(targetSquare);
        
        // Check anchor
        if (!board.isActive(targetSquare)) return false;
        
        // Check extensions
        for (const [dx, dy] of this.shape.extensions) {
            const sq = toSquare([baseX + dx, baseY + dy], board.gridType === 'square');
            if (!board.isActive(sq)) return false;
        }
        
        return true;
    }

    executeLogic(triggerType: string, context: any, board: BoardClass) {
        LogicRunner.execute(this, triggerType, context, board);
    }



    updateTurnState(board: BoardClass) {
        // Cooldown processing
        if (this.variables['cooldown'] && this.variables['cooldown'] > 0) {
            this.variables['cooldown']--;
            
            // Trigger on-cooldown-tick
            this.executeLogic('on-cooldown-tick', { remaining: this.variables['cooldown'] }, board);
            
            // Trigger on-cooldown-end when it reaches 0
            if (this.variables['cooldown'] === 0) {
                this.executeLogic('on-cooldown-end', {}, board);
            }
        }


        // Fire on-turn-start trigger for general logic
        this.executeLogic('on-turn-start', {}, board);

        // Environment checks - now includes square tags
        const [col, row] = toCoords(this.position);
        const isWhiteSquare = (col + row) % 2 === 0;
        const squareState = board.getSquareState(this.position);
        
        this.executeLogic('on-environment', { 
            isWhiteSquare, 
            isBlackSquare: !isWhiteSquare,
            isAttacked: false, // Will be updated by checkThreats later
            squareTags: Array.from(squareState.tags), // Available tags
            squareProps: squareState.customProps
        }, board); 
        
        // General variable check trigger
        this.executeLogic('on-var', {}, board);
    }

    isValidMove(from: Square, to: Square, board: BoardClass): boolean {
        // Cooldown check: if > 0, the piece cannot move.
        if (this.variables['cooldown'] && this.variables['cooldown'] > 0) {
            return false;
        }

        // Standard: Cannot capture your own pieces
        const targetPiece = board.getPiece(to);
        if (targetPiece && targetPiece.color === this.color) {
            return false;
        }

        if (this.rules.length === 0) {
            // Fallback to standard piece behavior if no custom rules defined
            const standardPiece = Piece.createStandard(this.id, this.type, this.color, from);
            if (standardPiece) {
                return standardPiece.isValidMove(from, to, board);
            }
        }

        const fromCoords = toCoords(from);
        const toCoordsCoords = toCoords(to);
        
        // Horizontal/Vertical steps
        const dx = toCoordsCoords[0] - fromCoords[0];
        const dy = toCoordsCoords[1] - fromCoords[1];

        // Horizontal/Vertical distance (absolute)
        const adx = Math.abs(dx);
        const ady = Math.abs(dy);

        // Directions from white's perspective are different for black
        // However, ΔY in our visual editor usually means "forward" for the color.
        // Let's adjust dy based on color so that positive is always "forward"
        let forwardDy = dy;
        if (board.gridType === 'hex') {
            // In hex pointy-top, white moving up is r decreasing.
            // So if dy (dr) is negative, it's forward for white.
            forwardDy = this.color === 'white' ? -dy : dy;
        } else {
            forwardDy = this.color === 'white' ? dy : -dy;
        }

        let isAllowed = false;

        for (const rule of this.rules) {
            let ruleResult = true; // For AND logic
            let currentLogic: 'AND' | 'OR' = 'AND';

            for (let i = 0; i < rule.conditions.length; i++) {
                const cond = rule.conditions[i];
                let value = 0;
                
                // Helper to check standard spatial conditions
                if (cond.variable === 'diffX') value = dx;
                else if (cond.variable === 'diffY') value = forwardDy;
                else if (cond.variable === 'absDiffX') value = adx;
                else if (cond.variable === 'absDiffY') value = ady;
                // Hex specific / generic distance
                else if (cond.variable === 'dist') {
                    if (board.gridType === 'hex') {
                        const ds = -dx - dy;
                        value = (Math.abs(dx) + Math.abs(dy) + Math.abs(ds)) / 2;
                    } else {
                        value = Math.max(adx, ady); // Chebyshev distance for square
                    }
                }
                // NEW: Check state variable conditions
                else if (cond.variable === 'cooldown') value = this.variables['cooldown'] || 0;
                else if (cond.variable === 'charge') value = this.variables['charge'] || 0;
                else if (cond.variable === 'mode') value = this.variables['mode'] || 0;


                // Resolve the comparison value: either a literal number or a piece variable reference
                const compareValue = cond.valueVariable !== undefined
                    ? (this.variables[cond.valueVariable] ?? 0)
                    : cond.value;

                let condSatisfied = false;
                switch (cond.operator) {
                    case '===': condSatisfied = value === compareValue; break;
                    case '>': condSatisfied = value > compareValue; break;
                    case '<': condSatisfied = value < compareValue; break;
                    case '>=': condSatisfied = value >= compareValue; break;
                    case '<=': condSatisfied = value <= compareValue; break;
                }

                if (i === 0) {
                    ruleResult = condSatisfied;
                } else {
                    if (currentLogic === 'AND') {
                        ruleResult = ruleResult && condSatisfied;
                    } else {
                        ruleResult = ruleResult || condSatisfied;
                    }
                }
                
                // Prepare logic for NEXT condition
                currentLogic = cond.logic || 'AND';
            }

            if (ruleResult) {
                // If a rule is met, it dictates the result
                if (rule.result === 'allow') {
                    // Check if this is a 'slide' (run) move - path must be clear
                    if (rule.type === 'slide' || rule.type === 'run' || (rule as any).type === 'running') {
                        // Calculate number of steps using GCD
                        const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
                        const steps = gcd(Math.abs(dx), Math.abs(dy));
                        let pathClear = true;
                        
                        // Check intermediate squares
                        if (steps > 1) {
                            const stepX = dx / steps;
                            const stepY = dy / steps;
                            for (let s = 1; s < steps; s++) {
                                const iX = fromCoords[0] + s * stepX;
                                const iY = fromCoords[1] + s * stepY;
                                const iSq = toSquare([iX, iY], board.gridType === 'square');
                                
                                if (board.getPiece(iSq) !== null || !board.isActive(iSq)) {
                                    pathClear = false;
                                    break;
                                }
                            }
                        }
                        
                        if (!pathClear) {
                            // Path blocked, continue to next rule
                            continue;
                        }
                    }
                    // If we get here, the move is allowed (either jump or clear slide path)
                    isAllowed = true;
                } else {
                    // If an illegal rule is met, we return false immediately (illegal rules override legal ones)
                    return false;
                }
            }
        }

        return isAllowed;
    }

    canAttack(target: Square, board: BoardClass): boolean {
        // For now, custom pieces attack using their normal move rules
        // In the future, we might add separate attack rules
        return this.isValidMove(this.position, target, board);
    }

    clone(): CustomPiece {
        const p = new CustomPiece(this.id, this.type, this.color, this.position, this.rules, this.logic, this.name, this.shape);
        p.hasMoved = this.hasMoved;
        p.variables = { ...this.variables };
        p.pixelsWhite = this.pixelsWhite;
        p.pixelsBlack = this.pixelsBlack;
        p.image = this.image;
        return p;
    }
}

export class Pawn extends Piece {
    constructor(id: string, color: "white" | "black", position: Square) {
        super(id, 'pawn', color, position);
    }

    isValidMove(from: Square, to: Square, board: BoardClass): boolean {
        if (board.gridType === 'hex') {
            const [fq, fr] = toCoords(from);
            const [tq, tr] = toCoords(to);
            const dq = tq - fq;
            const dr = tr - fr;

            // Forward direction depends on color
            const forward = this.color === 'white' ? { dq: 0, dr: -1 } : { dq: 0, dr: 1 };
            const captures = this.color === 'white' ? 
                [{ dq: -1, dr: 0 }, { dq: 1, dr: -1 }] : 
                [{ dq: 1, dr: 0 }, { dq: -1, dr: 1 }];

            // Standard one-square move
            if (dq === forward.dq && dr === forward.dr) {
                return board.getPiece(to) === null;
            }

            // Capture
            if (captures.some(c => c.dq === dq && c.dr === dr)) {
                const destinationPiece = board.getPiece(to);
                return destinationPiece !== null && destinationPiece.color !== this.color;
            }

            return false;
        }

        const fromCoords = toCoords(from);
        const toCoordsCoords = toCoords(to);
        const diffX = Math.abs(fromCoords[0] - toCoordsCoords[0]);
        const diffY = toCoordsCoords[1] - fromCoords[1];

        const direction = this.color === 'white' ? 1 : -1;
        const startingRank = this.color === 'white' ? 1 : board.height - 2;

        if (diffX === 0 && diffY === direction) {
            return board.getPiece(to) === null;
        }

        if (diffX === 0 && fromCoords[1] === startingRank && diffY === 2 * direction) {
            const pathClear = board.getPiece(toSquare([fromCoords[0], fromCoords[1] + direction], board.gridType === 'square')) === null;
            return pathClear && board.getPiece(to) === null;
        }

        if (diffX === 1 && diffY === direction) {
            const destinationPiece = board.getPiece(to);
            return destinationPiece !== null && destinationPiece.color !== this.color;
        }

        return false;
    }

    canAttack(target: Square, board: BoardClass): boolean {
        if (board.gridType === 'hex') {
            const [fq, fr] = toCoords(this.position);
            const [tq, tr] = toCoords(target);
            const dq = tq - fq;
            const dr = tr - fr;

            const captures = this.color === 'white' ? 
                [{ dq: -1, dr: 0 }, { dq: 1, dr: -1 }] : 
                [{ dq: 1, dr: 0 }, { dq: -1, dr: 1 }];

            return captures.some(c => c.dq === dq && c.dr === dr);
        }

        const fromCoords = toCoords(this.position);
        const toCoordsCoords = toCoords(target);
        const diffX = Math.abs(fromCoords[0] - toCoordsCoords[0]);
        const diffY = toCoordsCoords[1] - fromCoords[1];
        const direction = this.color === 'white' ? 1 : -1;
        return diffX === 1 && diffY === direction;
    }

    clone(): Pawn {
        const p = new Pawn(this.id, this.color, this.position);
        p.hasMoved = this.hasMoved;
        return p;
    }
}

export class Knight extends Piece {
    constructor(id: string, color: "white" | "black", position: Square) {
        super(id, 'knight', color, position);
    }

    isValidMove(from: Square, to: Square, board: BoardClass): boolean {
        if (board.gridType === 'hex') {
            const [fq, fr] = toCoords(from);
            const [tq, tr] = toCoords(to);
            const dq = tq - fq;
            const dr = tr - fr;
            const ds = -dq - dr;

            // Knight move is (dq, dr, ds) = permutation of (+-2, +-1, -+3) or similar
            // 12 possible jumps
            const absQ = Math.abs(dq);
            const absR = Math.abs(dr);
            const absS = Math.abs(ds);
            
            const isKnightJump = (absQ === 2 && absR === 1) || (absQ === 1 && absR === 2) ||
                                (absQ === 3 && absR === 1) || (absQ === 1 && absR === 3) ||
                                (absQ === 3 && absR === 2) || (absQ === 2 && absR === 3);
            
            if (!isKnightJump) return false;

            const destinationPiece = board.getPiece(to);
            return destinationPiece === null || destinationPiece.color !== this.color;
        }

        const fromCoords = toCoords(from);
        const toCoordsCoords = toCoords(to);
        const diffX = Math.abs(fromCoords[0] - toCoordsCoords[0]);
        const diffY = Math.abs(fromCoords[1] - toCoordsCoords[1]);

        const destinationPiece = board.getPiece(to);
        if (destinationPiece !== null && destinationPiece.color === this.color) {
            return false;
        }

        return (diffX === 2 && diffY === 1) || (diffX === 1 && diffY === 2);
    }

    canAttack(target: Square, board: BoardClass): boolean {
        return this.isValidMove(this.position, target, board);
    }

    clone(): Knight {
        const p = new Knight(this.id, this.color, this.position);
        p.hasMoved = this.hasMoved;
        return p;
    }
}

export class Bishop extends Piece {
    constructor(id: string, color: "white" | "black", position: Square) {
        super(id, 'bishop', color, position);
    }

    isValidMove(from: Square, to: Square, board: BoardClass): boolean {
        if (board.gridType === 'hex') {
            const [fq, fr] = toCoords(from);
            const [tq, tr] = toCoords(to);
            const dq = tq - fq;
            const dr = tr - fr;
            if (!(dq === dr || dq === -2 * dr || 2 * dq === -dr)) return false;
            const destinationPiece = board.getPiece(to);
            if (destinationPiece !== null && destinationPiece.color === this.color) return false;
            const dist = Math.abs(dq === dr ? dq : (dq === -2*dr ? dr : dq/2));
            const sqDir = { q: dq / dist, r: dr / dist };
            for (let i = 1; i < dist; i++) {
                const sq = `${fq + i * sqDir.q},${fr + i * sqDir.r}` as Square;
                if (board.getPiece(sq) !== null || !board.isActive(sq)) return false;
            }
            return true;
        }

        const fromCoords = toCoords(from);
        const toCoordsCoords = toCoords(to);
        const diffX = Math.abs(fromCoords[0] - toCoordsCoords[0]);
        const diffY = Math.abs(fromCoords[1] - toCoordsCoords[1]);
        if (diffX !== diffY) return false;
        const destinationPiece = board.getPiece(to);
        if (destinationPiece !== null && destinationPiece.color === this.color) return false;
        const xDirection = toCoordsCoords[0] > fromCoords[0] ? 1 : -1;
        const yDirection = toCoordsCoords[1] > fromCoords[1] ? 1 : -1;
        for (let i = 1; i < diffX; i++) {
            const square = toSquare([fromCoords[0] + i * xDirection, fromCoords[1] + i * yDirection], board.gridType === 'square');
            if (board.getPiece(square) !== null || !board.isActive(square)) return false;
        }
        return true;
    }

    canAttack(target: Square, board: BoardClass): boolean {
        return this.isValidMove(this.position, target, board);
    }

    clone(): Bishop {
        const p = new Bishop(this.id, this.color, this.position);
        p.hasMoved = this.hasMoved;
        return p;
    }
}

export class Rook extends Piece {
    constructor(id: string, color: "white" | "black", position: Square) {
        super(id, 'rook', color, position);
    }

    isValidMove(from: Square, to: Square, board: BoardClass): boolean {
        if (board.gridType === 'hex') {
            const [fq, fr] = toCoords(from);
            const [tq, tr] = toCoords(to);
            const dq = tq - fq;
            const dr = tr - fr;
            if (!(dq === 0 || dr === 0 || dq === -dr)) return false;
            const destinationPiece = board.getPiece(to);
            if (destinationPiece !== null && destinationPiece.color === this.color) return false;
            const dist = Math.max(Math.abs(dq), Math.abs(dr), Math.abs(-dq - dr));
            const sqDir = { q: dq / dist, r: dr / dist };
            for (let i = 1; i < dist; i++) {
                const sq = `${fq + i * sqDir.q},${fr + i * sqDir.r}` as Square;
                if (board.getPiece(sq) !== null || !board.isActive(sq)) return false;
            }
            return true;
        }

        const fromCoords = toCoords(from);
        const toCoordsCoords = toCoords(to);
        const diffX = Math.abs(fromCoords[0] - toCoordsCoords[0]);
        const diffY = Math.abs(fromCoords[1] - toCoordsCoords[1]);
        if (diffX !== 0 && diffY !== 0) return false;
        const destinationPiece = board.getPiece(to);
        if (destinationPiece !== null && destinationPiece.color === this.color) return false;
        if (diffX === 0) {
            const yDirection = toCoordsCoords[1] > fromCoords[1] ? 1 : -1;
            for (let i = 1; i < diffY; i++) {
                const square = toSquare([fromCoords[0], fromCoords[1] + i * yDirection], board.gridType === 'square');
                if (board.getPiece(square) !== null || !board.isActive(square)) return false;
            }
        } else {
            const xDirection = toCoordsCoords[0] > fromCoords[0] ? 1 : -1;
            for (let i = 1; i < diffX; i++) {
                const square = toSquare([fromCoords[0] + i * xDirection, fromCoords[1]], board.gridType === 'square');
                if (board.getPiece(square) !== null || !board.isActive(square)) return false;
            }
        }
        return true;
    }

    canAttack(target: Square, board: BoardClass): boolean {
        return this.isValidMove(this.position, target, board);
    }

    clone(): Rook {
        const p = new Rook(this.id, this.color, this.position);
        p.hasMoved = this.hasMoved;
        return p;
    }
}


export class Queen extends Piece {
    constructor(id: string, color: "white" | "black", position: Square) {
        super(id, 'queen', color, position);
    }

    isValidMove(from: Square, to: Square, board: BoardClass): boolean {
        if (board.gridType === 'hex') {
            return this.canAttack(to, board) && (board.getPiece(to) === null || board.getPiece(to)?.color !== this.color);
        }
        // A queen's move is valid if it's a valid rook or bishop move
        return this.canAttack(to, board) && (board.getPiece(to) === null || board.getPiece(to)?.color !== this.color);
    }

    canAttack(target: Square, board: BoardClass): boolean {
        if (board.gridType === 'hex') {
            // Queen = Rook + Bishop
            const [fq, fr] = toCoords(this.position);
            const [tq, tr] = toCoords(target);
            const dq = tq - fq;
            const dr = tr - fr;

            const isRookMove = (dq === 0 || dr === 0 || dq === -dr);
            const isBishopMove = (dq === dr || dq === -2 * dr || 2 * dq === -dr);
            
            if (!isRookMove && !isBishopMove) return false;

            // Obstruction check
            let dist: number;
            let sqDir: { q: number, r: number };
            
            if (isRookMove) {
                dist = Math.max(Math.abs(dq), Math.abs(dr), Math.abs(-dq - dr));
                sqDir = { q: dq / dist, r: dr / dist };
            } else {
                dist = Math.abs(dq === dr ? dq : (dq === -2*dr ? dr : dq/2));
                sqDir = { q: dq / dist, r: dr / dist };
            }

            for (let i = 1; i < dist; i++) {
                const sq = `${fq + i * sqDir.q},${fr + i * sqDir.r}` as Square;
                if (board.getPiece(sq) !== null || !board.isActive(sq)) return false;
            }
            return true;
        }

        const fromCoords = toCoords(this.position);
        const toCoordsCoords = toCoords(target);
        const diffX = Math.abs(fromCoords[0] - toCoordsCoords[0]);
        const diffY = Math.abs(fromCoords[1] - toCoordsCoords[1]);

        // Rook-like check
        if (diffX === 0 || diffY === 0) {
            if (diffX === 0) {
                const yDirection = toCoordsCoords[1] > fromCoords[1] ? 1 : -1;
                for (let i = 1; i < diffY; i++) {
                    const square = toSquare([fromCoords[0], fromCoords[1] + i * yDirection], board.gridType === 'square');
                    if (board.getPiece(square) !== null || !board.isActive(square)) return false;
                }
            } else {
                const xDirection = toCoordsCoords[0] > fromCoords[0] ? 1 : -1;
                for (let i = 1; i < diffX; i++) {
                    const square = toSquare([fromCoords[0] + i * xDirection, fromCoords[1]], board.gridType === 'square');
                    if (board.getPiece(square) !== null || !board.isActive(square)) return false;
                }
            }
            return true;
        }

        // Bishop-like check
        if (diffX === diffY) {
            const xDirection = toCoordsCoords[0] > fromCoords[0] ? 1 : -1;
            const yDirection = toCoordsCoords[1] > fromCoords[1] ? 1 : -1;
            for (let i = 1; i < diffX; i++) {
                const square = toSquare([fromCoords[0] + i * xDirection, fromCoords[1] + i * yDirection], board.gridType === 'square');
                if (board.getPiece(square) !== null || !board.isActive(square)) return false;
            }
            return true;
        }

        return false;
    }

    clone(): Queen {
        const p = new Queen(this.id, this.color, this.position);
        p.hasMoved = this.hasMoved;
        return p;
    }
}

export class King extends Piece {
    constructor(id: string, color: "white" | "black", position: Square) {
        super(id, 'king', color, position);
    }

    isValidMove(from: Square, to: Square, board: BoardClass): boolean {
        if (board.gridType === 'hex') {
            const [fq, fr] = toCoords(from);
            const [tq, tr] = toCoords(to);
            const dq = tq - fq;
            const dr = tr - fr;
            const dist = (Math.abs(dq) + Math.abs(dr) + Math.abs(-dq - dr)) / 2;
            
            if (dist === 1) return true;
            if (dist === 2 && (dq === dr || dq === -2 * dr || 2 * dq === -dr)) return true;
            return false;
        }

        const fromCoords = toCoords(from);
        const toCoordsCoords = toCoords(to);
        const diffX = Math.abs(fromCoords[0] - toCoordsCoords[0]);
        const diffY = Math.abs(fromCoords[1] - toCoordsCoords[1]);

        const destinationPiece = board.getPiece(to);
        if (destinationPiece !== null && destinationPiece.color === this.color) {
            return false;
        }

        return diffX <= 1 && diffY <= 1;
    }

    canAttack(target: Square, board: BoardClass): boolean {
        return this.isValidMove(this.position, target, board);
    }

    clone(): King {
        const p = new King(this.id, this.color, this.position);
        p.hasMoved = this.hasMoved;
        return p;
    }
}
