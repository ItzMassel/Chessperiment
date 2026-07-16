import { BoardClass } from '../board';
import { Piece } from '../piece';
import { toCoords, toSquare } from '../utils';

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

    static execute(piece: LogicPiece, triggerType: string, context: any, board: BoardClass) {
        if (!piece.logic || !Array.isArray(piece.logic)) return;

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

    private static executeInternal(piece: LogicPiece, triggerType: string, context: any, board: BoardClass) {
        const triggers = piece.logic.filter((b: any) => b.type === 'trigger' && b.id === triggerType);
        
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
                // Triggers when this piece is the victim of a capture
                if (context.attacker && context.attacker.id !== piece.id) {
                    return matchesType(context.attacker, vals.by);
                }
                return false;

            case 'on-captures':
                // Triggers when this piece is the attacker in a capture
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
                const isWhiteSquare = (col + row) % 2 !== 0;
                if (vals.condition === 'White Square') return isWhiteSquare;
                if (vals.condition === 'Black Square') return !isWhiteSquare;
                if (vals.condition === 'Is Attacked') return context.isAttacked || false;
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
                
                if (targetPiece) {
                    const tPos = targetPiece.position;
                    board.setPiece(tPos, null);
                    board.triggerEffect('kill', tPos);

                    // If the piece itself or the active attacker is killed, stop the move
                    if (targetPiece.id === piece.id || (context.attacker && targetPiece.id === context.attacker.id)) {
                        context.movePrevented = true;
                    }
                }
                break;

            case 'transformation':
                if (vals.target) {
                    const newPiece = Piece.create(piece.id, vals.target, piece.color, piece.position);
                    newPiece.hasMoved = piece.hasMoved;
                    // Preserve variables? Maybe. Logic suggests transformation usually resets or inherits.
                    // Let's inherit "charge", "cooldown" if they exist, or just full variables?
                    // Currently piece.ts re-creates. Let's keep it simple: new piece replaces old.
                    board.setPiece(piece.position, newPiece);
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

            // Removed 'charge' and 'mode' as per Step 1, but if they exist in old logic we ignore or support generic mod-var.

            case 'prevent':
                context.prevented = true;
                context.movePrevented = true;
                context.capturePrevented = true;
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
                // It's a linked variable!
                const varName = (val as any).name; // Or ID? The drop payload had { name: ... }
                // In PageClient we stored: { type: 'variable', id: ..., name: ... }
                // But the variable VALUE comes from piece.variables[resolvedName]
                // Wait, "name" in payload is the Variable Name (e.g. "MyVar").
                resolved[key] = piece.variables[varName] !== undefined ? piece.variables[varName] : 0;
            } else {
                resolved[key] = val;
            }
        }
        return resolved;
    }
}
