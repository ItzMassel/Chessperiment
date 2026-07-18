import { Piece } from '../piece.js';
import { toCoords, toSquare } from '../utils.js';
export class LogicRunner {
    static execute(piece, triggerType, context, board) {
        if (!piece.logic || !Array.isArray(piece.logic))
            return;
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
            const pending = this.pendingTriggers.shift();
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
            if (targetPiece && targetPiece.isCustom) {
                this.executeInternal(targetPiece, pending.type, pending.context, board);
            }
            iterations++;
        }
        if (this.pendingTriggers.length > 0) {
            console.warn('[LogicRunner] Infinite loop risk loop detected. Clearing queue.');
            this.pendingTriggers = [];
        }
        this.isExecuting = false;
    }
    static executeInternal(piece, triggerType, context, board) {
        // Fallback for renamed triggers
        let targetType = triggerType;
        if (triggerType === 'on-is-captured') {
            // Check both new and old IDs
            const triggers = piece.logic.filter((b) => b.type === 'trigger' && (b.id === 'on-is-captured' || b.id === 'on-capture' || b.id === 'on-captured'));
            for (const trigger of triggers) {
                if (this.evaluateTriggerCondition(piece, trigger, context, board)) {
                    if (trigger.childId) {
                        this.runBlock(piece, trigger.childId, context, board);
                    }
                }
            }
            return;
        }
        const triggers = piece.logic.filter((b) => b.type === 'trigger' && b.id === targetType);
        for (const trigger of triggers) {
            if (this.evaluateTriggerCondition(piece, trigger, context, board)) {
                if (trigger.childId) {
                    this.runBlock(piece, trigger.childId, context, board);
                }
            }
        }
    }
    static evaluateTriggerCondition(piece, trigger, context, board) {
        const vals = this.resolveSocketValues(piece, trigger.socketValues);
        // Helper for piece matching
        const matchesType = (p, expected) => {
            if (!expected || expected === 'Any')
                return true;
            if (!p)
                return false;
            const pType = p.type.toLowerCase();
            const pName = p.name.toLowerCase();
            const exp = expected.toLowerCase();
            return pType === exp || pType.startsWith(exp + '_') || pName === exp || pName.startsWith(exp + '_');
        };
        switch (trigger.id) {
            case 'on-is-captured':
            case 'on-capture':
            case 'on-captured':
                // Smart trigger: handles both "I captured something" and "I was captured"
                // If we are the victim (context.attacker exists and it's not us)
                if (context.attacker && context.attacker.id !== piece.id) {
                    return matchesType(context.attacker, vals.by);
                }
                // If we are the attacker (context.capturedPiece exists and it's not us)
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
                if (vals.condition === 'White Square')
                    return isWhiteSquare;
                if (vals.condition === 'Black Square')
                    return !isWhiteSquare;
                if (vals.condition === 'Is Attacked')
                    return context.isAttacked || false;
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
                    }
                    else {
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
    static runBlock(piece, blockId, context, board) {
        const block = piece.logic.find((b) => b.instanceId === blockId);
        if (!block)
            return;
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
                        if (vals.op === '+=')
                            next += val;
                        else if (vals.op === '-=')
                            next -= val;
                        else if (vals.op === '=')
                            next = val;
                        piece.variables[vals.varName] = next;
                        // Recursive check
                        this.execute(piece, 'on-var', {}, board);
                    }
                    else if (vals.op === '=') {
                        // Text assignment
                        piece.variables[vals.varName] = vals.value;
                        this.execute(piece, 'on-var', {}, board);
                    }
                }
                break;
            case 'cooldown':
                if (vals.duration) {
                    const d = Number(vals.duration);
                    if (d > 0)
                        piece.variables['cooldown'] = d;
                }
                break;
            case 'explode':
                if (vals.radius !== undefined) {
                    const r = Number(vals.radius) || 0;
                    const square = piece.position;
                    const [targetCol, targetRow] = toCoords(square);
                    const useAlgebraic = !square.includes(',');
                    for (let col = targetCol - r; col <= targetCol + r; col++) {
                        for (let row = targetRow - r; row <= targetRow + r; row++) {
                            const sq = toSquare([col, row], useAlgebraic);
                            if (board.isActive(sq)) {
                                board.setPiece(sq, null);
                                board.triggerEffect('kill', sq);
                            }
                        }
                    }
                }
                break;
            // Removed 'charge' and 'mode' as per Step 1, but if they exist in old logic we ignore or support generic mod-var.
            case 'prevent':
                context.prevented = true;
                context.movePrevented = true;
                context.capturePrevented = true;
                context.preventAction = vals.action || 'Jump Back';
                break;
            case 'win':
                context.gameWon = true;
                context.winner = piece.color;
                break;
        }
        if (block.childId) {
            this.runBlock(piece, block.childId, context, board);
        }
    }
    // Resolves values from sockets, handling dynamic variables (dropped variables)
    static resolveSocketValues(piece, socketValues) {
        const resolved = {};
        if (!socketValues)
            return resolved;
        for (const [key, val] of Object.entries(socketValues)) {
            if (val && typeof val === 'object' && val.type === 'variable') {
                const varObj = val;
                const varName = varObj.name;
                // If it's explicitly a variable-only field (target name) or the key is 'varName'
                if (varObj.variableOnly || key === 'varName') {
                    resolved[key] = varName;
                }
                else {
                    resolved[key] = piece.variables[varName] !== undefined ? piece.variables[varName] : 0;
                }
            }
            else {
                resolved[key] = val;
            }
        }
        return resolved;
    }
}
// Prevent infinite recursion
LogicRunner.pendingTriggers = [];
LogicRunner.isExecuting = false;
LogicRunner.MAX_ITERATIONS = 20;
