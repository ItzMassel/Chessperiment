import { BoardClass } from '../board';
import { Piece } from '../piece';
import { Square } from '../types';
import { toCoords, toSquare } from '../utils';

export interface SquareLogic {
    logic: any[];
    variables: Record<string, any>;
    squareId: Square;
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
                    const current = squareLogic.variables[vals.varName] || 0;
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
        }

        if (block.childId) {
            this.runBlock(squareLogic, block.childId, context, board);
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
                    resolved[key] = squareLogic.variables[varName] !== undefined ? squareLogic.variables[varName] : 0;
                }
            } else {
                resolved[key] = val;
            }
        }
        return resolved;
    }
}
