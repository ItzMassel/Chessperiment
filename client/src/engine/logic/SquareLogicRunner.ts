import { BoardClass } from '../board';
import { Piece } from '../piece';
import { Square } from '../types';
import { toCoords, toSquare } from '../utils';

export interface SquareLogic {
    logic: any[];
    variables: Record<string, any>;
    squareId: Square;
    // Bounds for variables created as "random" in the square editor. A variable listed
    // here re-rolls to a fresh integer in [min, max] every time logic reads it, instead
    // of returning a fixed stored value (see getVariableValue below).
    randomVars?: Record<string, { min: number, max: number }>;
}

export class SquareLogicRunner {
    private static isExecuting: boolean = false;
    private static pendingTriggers: Array<{ squareId: Square, type: string, context: any }> = [];
    private static MAX_ITERATIONS = 20;

    static execute(squareId: Square, triggerType: string, context: any, board: BoardClass) {
        const squareLogic = (board as any).squareLogic?.[squareId];
        if (!squareLogic || !squareLogic.logic || !Array.isArray(squareLogic.logic)) return;

        if (this.isExecuting) {
            this.pendingTriggers.push({ squareId, type: triggerType, context });
            return;
        }

        this.isExecuting = true;
        this.executeInternal(squareLogic, triggerType, context, board);

        let iterations = 0;
        while (this.pendingTriggers.length > 0 && iterations < this.MAX_ITERATIONS) {
            const pending = this.pendingTriggers.shift()!;
            const nextLogic = (board as any).squareLogic?.[pending.squareId];
            if (nextLogic) {
                this.executeInternal(nextLogic, pending.type, pending.context, board);
            }
            iterations++;
        }

        if (this.pendingTriggers.length > 0) {
            console.warn('[SquareLogicRunner] Infinite loop risk detected. Clearing queue.');
            this.pendingTriggers = [];
        }

        this.isExecuting = false;
    }

    private static executeInternal(squareLogic: SquareLogic, triggerType: string, context: any, board: BoardClass) {
        const triggers = squareLogic.logic.filter((b: any) => b.type === 'trigger' && b.id === triggerType);
        
        for (const trigger of triggers) {
            if (this.evaluateTriggerCondition(squareLogic, trigger, context, board)) {
                if (trigger.childId) {
                    this.runBlock(squareLogic, trigger.childId, context, board);
                }
            }
        }
    }

    private static evaluateTriggerCondition(squareLogic: SquareLogic, trigger: any, context: any, board: BoardClass): boolean {
        const vals = this.resolveSocketValues(squareLogic, trigger.socketValues);

        const matchesType = (p: Piece | null, expected: string) => {
            if (!expected || expected === 'Any') return true;
            if (!p) return false;
            const pType = p.type.toLowerCase();
            const pName = p.name.toLowerCase();
            const exp = expected.toLowerCase();
            return pType === exp || pType.startsWith(exp + '_') || pName === exp || pName.startsWith(exp + '_');
        };

        const matchesColor = (p: Piece | null, expected: string) => {
            if (!expected || expected === 'Any') return true;
            if (!p) return false;
            return p.color.toLowerCase() === expected.toLowerCase();
        };

        switch (trigger.id) {
            case 'on-step':
                // context.piece is the piece that stepped on the square
                if (!context.piece) return false;
                return matchesType(context.piece, vals.pieceType) && matchesColor(context.piece, vals.pieceColor);

            case 'on-proximity':
                {
                    if (!context.piece) return false;
                    const [px, py] = toCoords(context.piece.position);
                    const [sx, sy] = toCoords(squareLogic.squareId);
                    
                    const dist = Math.max(Math.abs(px - sx), Math.abs(py - sy));
                    const threshold = Number(vals.distance || 1);
                    return dist <= threshold;
                }

            default:
                return true;
        }
    }

    private static runBlock(squareLogic: SquareLogic, blockId: string, context: any, board: BoardClass) {
        const block = squareLogic.logic.find((b: any) => b.instanceId === blockId);
        if (!block) return;

        const vals = this.resolveSocketValues(squareLogic, block.socketValues);

        switch (block.id) {
            case 'teleport':
                if (context.piece && vals.targetSquare) {
                    const target = vals.targetSquare as Square;
                    if (board.isActive(target) && board.getPiece(target) === null) {
                        board.setPiece(context.piece.position, null);
                        board.setPiece(target, context.piece);
                        context.piece.position = target;
                        board.triggerEffect('teleport', target);
                    }
                }
                break;

            case 'kill':
                if (context.piece) {
                    board.setPiece(context.piece.position, null);
                    board.triggerEffect('kill', context.piece.position);
                    context.movePrevented = true;
                }
                break;

            case 'disable-square':
                board.setActive(squareLogic.squareId, false);
                board.triggerEffect('disable_square', squareLogic.squareId);
                break;

            case 'enable-square':
                board.setActive(squareLogic.squareId, true);
                board.triggerEffect('enable_square', squareLogic.squareId);
                break;

            case 'win':
                if (context.piece) {
                    context.gameWon = true;
                    if (vals.side === 'White') context.winner = 'white';
                    else if (vals.side === 'Black') context.winner = 'black';
                    else context.winner = context.piece.color;
                }
                break;

            case 'modify-var':
                if (vals.varName && vals.op && vals.value !== undefined) {
                    const current = this.getVariableValue(squareLogic, vals.varName) || 0;
                    const val = Number(vals.value);
                    if (!isNaN(val)) {
                        let next = Number(current);
                        if (vals.op === '+=') next += val;
                        else if (vals.op === '-=') next -= val;
                        else if (vals.op === '=') next = val;
                        squareLogic.variables[vals.varName] = next;
                    } else if (vals.op === '=') {
                        squareLogic.variables[vals.varName] = vals.value;
                    }
                }
                break;

            case 'if': {
                // 'left'/'right' may each be a literal, or the name of an existing square variable.
                const resolveOperand = (raw: any) =>
                    (squareLogic.variables && Object.prototype.hasOwnProperty.call(squareLogic.variables, raw))
                        ? this.getVariableValue(squareLogic, raw)
                        : raw;
                const left = resolveOperand(block.socketValues?.left);
                const right = resolveOperand(block.socketValues?.right);
                const result = this.evaluateComparison(left, block.socketValues?.op, right);
                const branchId = result ? block.thenChildId : block.elseChildId;
                if (branchId) {
                    this.runBlock(squareLogic, branchId, context, board);
                }
                break;
            }
        }

        if (block.childId) {
            this.runBlock(squareLogic, block.childId, context, board);
        }
    }

    // Shared comparison logic for the 'if' block.
    private static evaluateComparison(left: any, op: string, right: any): boolean {
        const isNumber = left !== '' && right !== '' && left !== undefined && right !== undefined &&
            !isNaN(Number(left)) && !isNaN(Number(right));

        if (isNumber) {
            const l = Number(left);
            const r = Number(right);
            switch (op) {
                case '==': return l === r;
                case '!=': return l !== r;
                case '>': return l > r;
                case '<': return l < r;
                case '>=': return l >= r;
                case '<=': return l <= r;
                default: return false;
            }
        } else {
            const l = String(left);
            const r = String(right);
            switch (op) {
                case '==': return l === r;
                case '!=': return l !== r;
                default: return false; // Ordered comparison not supported for text
            }
        }
    }

    private static resolveSocketValues(squareLogic: SquareLogic, socketValues: any): any {
        const resolved: any = {};
        if (!socketValues) return resolved;

        for (const [key, val] of Object.entries(socketValues)) {
            if (val && typeof val === 'object' && (val as any).type === 'variable') {
                const varObj = val as any;
                const varName = varObj.name;

                if (varObj.variableOnly || key === 'varName') {
                    resolved[key] = varName;
                } else {
                    resolved[key] = this.getVariableValue(squareLogic, varName);
                }
            } else {
                resolved[key] = val;
            }
        }
        return resolved;
    }

    // Reads a square variable's current value. A variable flagged as random in
    // randomVars re-rolls to a fresh integer in [min, max] on every read (and the roll is
    // written back into squareLogic.variables so anything inspecting the stored value,
    // e.g. saving or debugging, sees the value that was actually used), rather than
    // returning the same stored number every time it's used.
    private static getVariableValue(squareLogic: SquareLogic, varName: string): any {
        const bounds = squareLogic.randomVars?.[varName];
        if (bounds) {
            const lo = Math.min(Number(bounds.min) || 0, Number(bounds.max) || 0);
            const hi = Math.max(Number(bounds.min) || 0, Number(bounds.max) || 0);
            const rolled = lo + Math.floor(Math.random() * (hi - lo + 1));
            squareLogic.variables[varName] = rolled;
            return rolled;
        }
        return squareLogic.variables[varName] !== undefined ? squareLogic.variables[varName] : 0;
    }
}
