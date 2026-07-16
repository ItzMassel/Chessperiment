import { BoardClass } from '../board';
import { Piece } from '../piece';
import { toCoords, toSquare } from '../utils';
import { EffectFactory, EffectExecutor } from '../effects';

interface LogicPiece extends Piece {
    logic: any[];
    variables: Record<string, any>;
    isCustom: boolean;
    executeLogic: (type: string, context: any, board: BoardClass) => void;
}

export class LogicRunner {
    // Prevent infinite recursion
    private static pendingTriggers: Array<{ pieceId: string, type: string, context: any }> = [];
    private static isExecuting: boolean = false;
    private static MAX_ITERATIONS = 20;
    
    // Effect executor for enqueueing effects
    private static effectExecutor: EffectExecutor | null = null;
    
    static setEffectExecutor(executor: EffectExecutor) {
        this.effectExecutor = executor;
    }

    static execute(piece: LogicPiece, triggerType: string, context: any, board: BoardClass, effectExecutor?: EffectExecutor) {
        if (!piece.logic || !Array.isArray(piece.logic)) return;
        
        // Use provided executor or stored one
        if (effectExecutor) {
            this.effectExecutor = effectExecutor;
        }

        // Queue trigger if already executing
        if (this.isExecuting) {
            this.pendingTriggers.push({ pieceId: piece.id, type: triggerType, context });
            return;
        }

        this.isExecuting = true;
        this.executeInternal(piece, triggerType, context, board);

        // Process queue
        let iterations = 0;
        while (this.pendingTriggers.length > 0 && iterations < this.MAX_ITERATIONS) {
            const pending = this.pendingTriggers.shift()!;
            // Fetch piece again in case it changed/moved
            const currentPiece = board.getPiece(pending.context.square || piece.position); 
            // Fallback to original piece instance if living on board, but 'piece' ref might be stale if it moved?
            // Actually 'piece' objects are mutated in this engine mostly.
            // But if we look up by ID it's safer.
            // For now, let's use the pieces passed or find them.
            
            // To keep it simple: just run on the original piece object reference if possible, 
            // or find it in board if needed. 
            // Since pieces are objects, we can just use the object if it's still valid.
            const targetPiece = (currentPiece?.id === pending.pieceId) ? currentPiece : piece;
            
            if (targetPiece && (targetPiece as any).isCustom) {
                this.executeInternal(targetPiece as LogicPiece, pending.type, pending.context, board);
            }
            iterations++;
        }

        if (this.pendingTriggers.length > 0) {
            console.warn('[LogicRunner] Infinite loop risk loop detected. Clearing queue.');
            this.pendingTriggers = [];
        }

        this.isExecuting = false;
    }

    // Fires only triggers with checkFrequency === 'every-square' for the given triggerType.
    // Used when a sliding piece passes through intermediate squares.
    static executeForIntermediateSquare(piece: LogicPiece, triggerType: string, context: any, board: BoardClass) {
        if (!piece.logic || !Array.isArray(piece.logic)) return;

        const triggers = piece.logic.filter((b: any) =>
            b.type === 'trigger' && b.id === triggerType && b.checkFrequency === 'every-square'
        );

        for (const trigger of triggers) {
            if (this.evaluateTriggerCondition(piece, trigger, context, board)) {
                if (trigger.childId) {
                    this.runBlock(piece, trigger.childId, context, board);
                }
            }
        }
    }

    private static executeInternal(piece: LogicPiece, triggerType: string, context: any, board: BoardClass) {
        // Fallback for renamed triggers
        let targetType = triggerType;
        if (triggerType === 'on-is-captured') {
            // Fires on the victim only
            const triggers = piece.logic.filter((b: any) =>
                b.type === 'trigger' && (b.id === 'on-is-captured' || b.id === 'on-capture')
            );
            for (const trigger of triggers) {
                if (this.evaluateTriggerCondition(piece, trigger, context, board)) {
                    if (trigger.childId) {
                        this.runBlock(piece, trigger.childId, context, board);
                    }
                }
            }
            return;
        }

        if (triggerType === 'on-captured') {
            // Fires on the attacker only (when this piece captures another)
            const triggers = piece.logic.filter((b: any) =>
                b.type === 'trigger' && b.id === 'on-captured'
            );
            for (const trigger of triggers) {
                if (this.evaluateTriggerCondition(piece, trigger, context, board)) {
                    if (trigger.childId) {
                        this.runBlock(piece, trigger.childId, context, board);
                    }
                }
            }
            return;
        }

        const triggers = piece.logic.filter((b: any) => b.type === 'trigger' && b.id === targetType);
        
        for (const trigger of triggers) {
            if (this.evaluateTriggerCondition(piece, trigger, context, board)) {
                if (trigger.childId) {
                    this.runBlock(piece, trigger.childId, context, board);
                }
            }
        }
    }

    private static evaluateTriggerCondition(piece: LogicPiece, trigger: any, context: any, board: BoardClass): boolean {
        const vals = this.resolveSocketValues(piece, trigger.socketValues);

        // Helper for piece matching
        const matchesType = (p: Piece | null, expected: string) => {
            if (!expected || expected === 'Any') return true;
            if (!p) return false;
            const pType = p.type.toLowerCase();
            const pName = p.name.toLowerCase();
            const exp = expected.toLowerCase();
            return pType === exp || pType.startsWith(exp + '_') || pName === exp || pName.startsWith(exp + '_');
        };

        switch (trigger.id) {
            case 'on-is-captured':
            case 'on-capture':
                // Fires on the victim: match against the attacker type
                if (context.attacker && context.attacker.id !== piece.id) {
                    return matchesType(context.attacker, vals.by);
                }
                return false;

            case 'on-captured':
                // Fires on the attacker: match against the captured piece type
                if (context.capturedPiece && context.capturedPiece.id !== piece.id) {
                    return matchesType(context.capturedPiece, vals.by);
                }
                return false;

            case 'on-threat': // Passive: I am threatened BY ...
                return matchesType(context.attacker, vals.by);

            case 'on-move':
                return true; // No conditions on the move trigger itself usually

            case 'on-environment':
                const [col, row] = toCoords(piece.position);
                const isWhiteSquare = (col + row) % 2 === 0;
                
                // Check square tag conditions
                if (vals.condition === 'White Square') return isWhiteSquare;
                if (vals.condition === 'Black Square') return !isWhiteSquare;
                if (vals.condition === 'Is Attacked') return context.isAttacked || false;
                
                // Check square tags from context
                if (context.squareTags && vals.tag) {
                    return context.squareTags.includes(vals.tag);
                }
                
                return true;

            case 'on-var':
                if (vals.varName) {
                    const current = piece.variables[vals.varName] || 0;
                    // Support text comparison as requested
                    const isNumber = !isNaN(Number(vals.value)) && !isNaN(Number(current));
                    
                    if (isNumber) {
                         const v = Number(vals.value);
                         const c = Number(current);
                         switch (vals.op) {
                             case '==': return c === v;
                             case '!=': return c !== v;
                             case '>': return c > v;
                             case '<': return c < v;
                             case '>=': return c >= v;
                             case '<=': return c <= v;
                         }
                    } else {
                        // Text comparison
                        const v = String(vals.value);
                        const c = String(current);
                        switch (vals.op) {
                            case '==': return c === v;
                            case '!=': return c !== v;
                            default: return false; // Ordered comparison not supported for text
                        }
                    }
                }
                return false;

            default:
                return true;
        }
    }

    private static runBlock(piece: LogicPiece, blockId: string, context: any, board: BoardClass) {
        const block = piece.logic.find((b: any) => b.instanceId === blockId);
        if (!block) return;

        const vals = this.resolveSocketValues(piece, block.socketValues);

        switch (block.id) {
            case 'kill':
                const isAttackerTarget = vals.target === 'Attacker';
                const targetPiece = isAttackerTarget ? context.attacker : piece;
                
                if (targetPiece && this.effectExecutor) {
                    const tPos = targetPiece.position;
                    
                    // Enqueue remove effect instead of direct mutation
                    this.effectExecutor.enqueue(EffectFactory.remove(tPos, 'on-move'));

                    // If the piece itself or the active attacker is killed, enqueue cancelMove
                    if (targetPiece.id === piece.id || (context.attacker && targetPiece.id === context.attacker.id)) {
                        context.movePrevented = true;
                    }
                }
                break;

            case 'transformation':
                if (vals.target && this.effectExecutor) {
                    // Enqueue transform effect instead of direct mutation
                    this.effectExecutor.enqueue(EffectFactory.transform(
                        piece.position,
                        vals.target,
                        'on-move',
                        piece.color
                    ));
                }
                break;

            case 'modify-var':
                if (vals.varName && vals.op && vals.value !== undefined) {
                    const current = piece.variables[vals.varName] || 0;
                    const val = Number(vals.value); // Operations imply numbers usually
                    if (!isNaN(val)) {
                        let next = Number(current);
                        if (vals.op === '+=') next += val;
                        else if (vals.op === '-=') next -= val;
                        else if (vals.op === '=') next = val;
                        piece.variables[vals.varName] = next;
                        
                        // Recursive check
                        this.execute(piece, 'on-var', {}, board);
                    } else if (vals.op === '=') {
                        // Text assignment
                        piece.variables[vals.varName] = vals.value;
                        this.execute(piece, 'on-var', {}, board);
                    }
                }
                break;

            case 'cooldown':
                if (vals.duration) {
                    const d = Number(vals.duration);
                    if (d > 0) piece.variables['cooldown'] = d; 
                }
                break;

            case 'explode':
                if (vals.radius !== undefined && this.effectExecutor) {
                    this.effectExecutor.enqueue(EffectFactory.explode(
                        piece.position,
                        Number(vals.radius),
                        'on-move'
                    ));
                }
                break;

            // Removed 'charge' and 'mode' as per Step 1, but if they exist in old logic we ignore or support generic mod-var.

            case 'prevent':
                // Enqueue cancelMove effect for pre-move phase
                if (this.effectExecutor) {
                    this.effectExecutor.enqueue(EffectFactory.cancelMove('pre-move'));
                }
                context.prevented = true;
                context.movePrevented = true;
                context.capturePrevented = true;
                context.preventAction = vals.action || 'Jump Back';
                break;

            case 'win':
                // Enqueue win effect
                if (this.effectExecutor) {
                    this.effectExecutor.enqueue(EffectFactory.win(
                        piece.color as 'white' | 'black',
                        'post-move'
                    ));
                }
                context.gameWon = true;
                context.winner = piece.color;
                break;

            case 'tell-user':
                board.triggerEffect('tell-user', piece.position, { message: vals.message || '' });
                break;
        }

        if (block.childId) {
            this.runBlock(piece, block.childId, context, board);
        }
    }

    // Resolves values from sockets, handling dynamic variables (dropped variables)
    private static resolveSocketValues(piece: LogicPiece, socketValues: any): any {
        const resolved: any = {};
        if (!socketValues) return resolved;

        for (const [key, val] of Object.entries(socketValues)) {
            if (val && typeof val === 'object' && (val as any).type === 'variable') {
                const varObj = val as any;
                const varName = varObj.name;
                
                // If it's explicitly a variable-only field (target name) or the key is 'varName'
                if (varObj.variableOnly || key === 'varName') {
                    resolved[key] = varName;
                } else {
                    resolved[key] = piece.variables[varName] !== undefined ? piece.variables[varName] : 0;
                }
            } else {
                resolved[key] = val;
            }
        }
        return resolved;
    }
}
