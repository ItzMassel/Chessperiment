import * as Blockly from 'blockly';
import 'blockly/blocks'; // Registers core blocks: math_number, text, variables_get, etc.

// Variable names that every piece has built in. They aren't stored in the piece's
// custom-variable list (that's only user-created ones), but they still need to exist
// as workspace variables so FieldVariable / variables_get can reference them.
export const PRESET_VARIABLES = ['x', 'y', 'answer'];

const PIECE_TYPE_OPTIONS = ['Any', 'Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King'];

// Updated from PageClient whenever the project's custom piece names change, so the
// "by"/"piece" dropdowns can offer them alongside the standard piece types.
let customPieceNameOptions: string[] = [];
export function setCustomPieceNameOptions(names: string[]) {
    customPieceNameOptions = names;
}

function byFieldOptions(): [string, string][] {
    const extra = customPieceNameOptions.filter(
        n => !PIECE_TYPE_OPTIONS.some(o => o.toLowerCase() === n.toLowerCase())
    );
    return [...PIECE_TYPE_OPTIONS, ...extra].map(o => [o, o]);
}

export type SocketKind = 'select' | 'text' | 'variable' | 'value-number' | 'value-text';

export interface PieceSocketSchema {
    id: string;
    kind: SocketKind;
    label?: string;
    options?: string[];
    dynamicByOptions?: boolean;
    defaultValue?: string | number;
}

export interface PieceBlockSchema {
    sockets: PieceSocketSchema[];
    isTrigger: boolean;
    hasNext: boolean; // false => terminal block (previousStatement only)
}

// Every non-trigger block uses this single built-in Blockly block style (inherited from
// the Classic theme we base our theme on) instead of a hand-picked colour per block, so
// effects look like a cohesive, standard Blockly category rather than a custom paint job.
const EFFECT_BLOCK_STYLE = 'logic_blocks';

export const PIECE_BLOCK_SCHEMA: Record<string, PieceBlockSchema> = {
    'on-is-captured': {
        isTrigger: true, hasNext: true,
        sockets: [{ id: 'by', kind: 'select', label: 'by', options: PIECE_TYPE_OPTIONS, dynamicByOptions: true }]
    },
    'on-captured': {
        isTrigger: true, hasNext: true,
        sockets: [{ id: 'by', kind: 'select', label: 'piece', options: PIECE_TYPE_OPTIONS, dynamicByOptions: true }]
    },
    'on-threat': {
        isTrigger: true, hasNext: true,
        sockets: [{ id: 'by', kind: 'select', label: 'by', options: PIECE_TYPE_OPTIONS, dynamicByOptions: true }]
    },
    'on-move': { isTrigger: true, hasNext: true, sockets: [] },
    'on-environment': {
        isTrigger: true, hasNext: true,
        sockets: [{ id: 'condition', kind: 'select', options: ['White Square', 'Black Square', 'Is Attacked'] }]
    },
    'on-var': {
        isTrigger: true, hasNext: true,
        sockets: [
            { id: 'varName', kind: 'variable', label: 'Var' },
            { id: 'op', kind: 'select', options: ['==', '!=', '>', '<', '>=', '<='] },
            { id: 'value', kind: 'value-text', defaultValue: '' }
        ]
    },
    'cooldown': {
        isTrigger: false, hasNext: true,
        sockets: [
            { id: 'duration', kind: 'value-number', label: 'for', defaultValue: 1 },
            { id: 'unit', kind: 'select', options: ['seconds', 'half-moves', 'full-moves'] }
        ]
    },
    'transformation': {
        isTrigger: false, hasNext: true,
        sockets: [{ id: 'target', kind: 'select', options: ['Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King'] }]
    },
    'modify-var': {
        isTrigger: false, hasNext: true,
        sockets: [
            { id: 'varName', kind: 'variable' },
            { id: 'op', kind: 'select', options: ['+=', '-=', '='] },
            { id: 'value', kind: 'value-number', defaultValue: 0 }
        ]
    },
    'kill': {
        isTrigger: false, hasNext: false,
        sockets: [{ id: 'target', kind: 'select', label: 'Target', options: ['Selected Piece', 'Attacker'] }]
    },
    'prevent': {
        isTrigger: false, hasNext: true,
        sockets: [{ id: 'action', kind: 'select', label: 'by', options: ['Jump Back', 'Nearest Square', 'Share Square'] }]
    },
    'win': { isTrigger: false, hasNext: false, sockets: [] },
    'explode': {
        isTrigger: false, hasNext: true,
        sockets: [{ id: 'radius', kind: 'value-number', label: 'radius', defaultValue: 1 }]
    },
    'tell-user': {
        isTrigger: false, hasNext: true,
        sockets: [{ id: 'message', kind: 'text', label: 'message' }]
    },
    'ask-user': {
        isTrigger: false, hasNext: true,
        sockets: [
            { id: 'question', kind: 'text', label: 'ask' },
            { id: 'options', kind: 'text', label: 'choices (comma-separated)' }
        ]
    },
    'if': {
        isTrigger: false, hasNext: true,
        sockets: [
            { id: 'left', kind: 'value-text', defaultValue: '' },
            { id: 'op', kind: 'select', options: ['==', '!=', '>', '<', '>=', '<='] },
            { id: 'right', kind: 'value-text', defaultValue: '' }
        ]
    }
};

function initPieceBlock(block: Blockly.Block, type: string, schema: PieceBlockSchema) {
    // Built as a sequence of inputs in socket declaration order (switching to a fresh
    // input whenever a value socket needs its own connection), then laid out inline so
    // the whole thing reads as one normal row — "cooldown for [1] seconds" — rather than
    // the value socket dangling on a separate line below the rest of the block.
    let current = block.appendDummyInput();
    current.appendField(type);
    let lastWasValue = false;

    schema.sockets.forEach(socket => {
        if (socket.kind === 'value-number' || socket.kind === 'value-text') {
            if (socket.label) current.appendField(socket.label);
            current = block.appendValueInput(socket.id).setCheck(null);
            lastWasValue = true;
            return;
        }

        if (lastWasValue) {
            current = block.appendDummyInput();
            lastWasValue = false;
        }
        if (socket.label) current.appendField(socket.label);
        if (socket.kind === 'select') {
            const options = socket.dynamicByOptions ? byFieldOptions : (socket.options || []).map(o => [o, o] as [string, string]);
            current.appendField(new Blockly.FieldDropdown(options as any), socket.id);
        } else if (socket.kind === 'variable') {
            current.appendField(new Blockly.FieldVariable(null), socket.id);
        } else if (socket.kind === 'text') {
            current.appendField(new Blockly.FieldTextInput(''), socket.id);
        }
    });

    if (schema.isTrigger) {
        if (lastWasValue) {
            current = block.appendDummyInput();
            lastWasValue = false;
        }
        current.appendField('check').appendField(
            new Blockly.FieldDropdown([['every move', 'every-move'], ['every square', 'every-square']]),
            'freq'
        );
    }

    block.setInputsInline(true);

    if (schema.isTrigger) {
        block.setNextStatement(true, 'Effect');
        block.setStyle('trigger_blocks');
    } else {
        block.setPreviousStatement(true, 'Effect');
        if (schema.hasNext) block.setNextStatement(true, 'Effect');
        block.setStyle(EFFECT_BLOCK_STYLE);
    }
    block.setTooltip(type);
}

export function defineCustomPieceBlocks() {
    Object.entries(PIECE_BLOCK_SCHEMA).forEach(([type, schema]) => {
        Blockly.Blocks[type] = {
            init() {
                initPieceBlock(this, type, schema);
                // 'if' additionally gets two statement inputs for its THEN/ELSE branch
                // bodies, independent of its own previous/next connection (which continues
                // the main chain after the if/else resolves either way).
                if (type === 'if') {
                    this.appendStatementInput('THEN').setCheck('Effect').appendField('then');
                    this.appendStatementInput('ELSE').setCheck('Effect').appendField('else');
                }
            }
        };
    });
}

export function ensurePresetVariables(workspace: Blockly.Workspace) {
    PRESET_VARIABLES.forEach(name => {
        if (!workspace.getVariable(name)) workspace.createVariable(name);
    });
}

/** Reads a value-input socket (a connected variables_get / math_number / text block). */
export function readValueSocket(block: Blockly.Block, inputName: string): any {
    const input = block.getInput(inputName);
    const target = input?.connection?.targetBlock();
    if (!target) return undefined;

    if (target.type === 'variables_get') {
        const varId = target.getFieldValue('VAR');
        const variable = target.workspace.getVariableById(varId);
        return variable ? { type: 'variable', name: variable.getName(), variableOnly: false } : undefined;
    }
    if (target.type === 'math_number') {
        const raw = target.getFieldValue('NUM');
        return raw === '' || raw === null ? undefined : Number(raw);
    }
    if (target.type === 'text') {
        return target.getFieldValue('TEXT');
    }
    return undefined;
}

/** Reads every socket defined for a block's schema into a plain socketValues object. */
export function readBlockSocketValues(block: Blockly.Block): Record<string, any> {
    const schema = PIECE_BLOCK_SCHEMA[block.type];
    const result: Record<string, any> = {};
    if (!schema) return result;

    schema.sockets.forEach(socket => {
        if (socket.kind === 'select' || socket.kind === 'text') {
            const field = block.getField(socket.id);
            if (field) result[socket.id] = field.getValue();
        } else if (socket.kind === 'variable') {
            const field = block.getField(socket.id) as Blockly.FieldVariable | null;
            if (field) {
                const name = field.getText();
                if (name) result[socket.id] = { type: 'variable', name, variableOnly: true };
            }
        } else if (socket.kind === 'value-number' || socket.kind === 'value-text') {
            const value = readValueSocket(block, socket.id);
            if (value !== undefined) result[socket.id] = value;
        }
    });

    return result;
}

/** For the 'if' block: ids of the blocks connected to its THEN/ELSE statement inputs. */
export function readIfBranches(block: Blockly.Block): { thenChildId?: string; elseChildId?: string } {
    if (block.type !== 'if') return {};
    const thenBlock = block.getInputTargetBlock('THEN');
    const elseBlock = block.getInputTargetBlock('ELSE');
    const branches: { thenChildId?: string; elseChildId?: string } = {};
    if (thenBlock) branches.thenChildId = thenBlock.id;
    if (elseBlock) branches.elseChildId = elseBlock.id;
    return branches;
}

export function getCheckFrequency(block: Blockly.Block): 'every-move' | 'every-square' {
    const field = block.getField('freq');
    return (field ? field.getValue() : 'every-move') as 'every-move' | 'every-square';
}

/** Sets a single socket's value on a block, creating shadow/variable blocks as needed. */
export function writeBlockSocketValue(block: Blockly.BlockSvg, socketId: string, value: any) {
    const schema = PIECE_BLOCK_SCHEMA[block.type];
    const socket = schema?.sockets.find(s => s.id === socketId);
    if (!socket) return;
    const ws = block.workspace as Blockly.WorkspaceSvg;

    if (socket.kind === 'select' || socket.kind === 'text') {
        block.setFieldValue(String(value ?? ''), socketId);
    } else if (socket.kind === 'variable') {
        const name = value && typeof value === 'object' ? value.name : value;
        if (!name) return;
        let variable = ws.getVariable(name);
        if (!variable) variable = ws.createVariable(name);
        (block.getField(socketId) as Blockly.FieldVariable).setValue(variable!.getId());
    } else if (socket.kind === 'value-number' || socket.kind === 'value-text') {
        const input = block.getInput(socketId);
        if (!input?.connection) return;
        const existing = input.connection.targetBlock();
        if (existing) existing.dispose(true);

        if (value && typeof value === 'object' && value.type === 'variable') {
            let variable = ws.getVariable(value.name);
            if (!variable) variable = ws.createVariable(value.name);
            const varBlock = ws.newBlock('variables_get') as Blockly.BlockSvg;
            varBlock.setFieldValue(variable!.getId(), 'VAR');
            varBlock.initSvg();
            varBlock.render();
            input.connection.connect(varBlock.outputConnection!);
        } else {
            const shadowType = socket.kind === 'value-number' ? 'math_number' : 'text';
            const shadow = ws.newBlock(shadowType) as Blockly.BlockSvg;
            shadow.setShadow(true);
            shadow.setFieldValue(
                String(value ?? (shadowType === 'math_number' ? 0 : '')),
                shadowType === 'math_number' ? 'NUM' : 'TEXT'
            );
            shadow.initSvg();
            shadow.render();
            input.connection.connect(shadow.outputConnection!);
        }
    }
}

/** Fills in default literal shadows for a freshly created block's value-input sockets. */
export function initializeDefaultSockets(block: Blockly.BlockSvg) {
    const schema = PIECE_BLOCK_SCHEMA[block.type];
    if (!schema) return;
    schema.sockets.forEach(socket => {
        if (socket.kind === 'value-number' || socket.kind === 'value-text') {
            writeBlockSocketValue(block, socket.id, socket.defaultValue);
        }
    });
}

/**
 * One-time best-effort import of logic saved by the old hand-rolled block canvas
 * (an array of {id, type, instanceId, socketValues, parentId, childId, checkFrequency, position})
 * into a live Blockly workspace, so existing pieces keep working after switching to Blockly.
 */
export function migrateLegacyLogicIntoWorkspace(
    ws: Blockly.WorkspaceSvg,
    legacyBlocks: any[],
    variableDefs: { id: string, name: string }[]
) {
    ensurePresetVariables(ws);
    variableDefs.forEach(v => {
        if (v.name && !ws.getVariable(v.name)) ws.createVariable(v.name);
    });

    const created = new Map<string, Blockly.BlockSvg>();
    legacyBlocks.forEach(lb => {
        if (!lb || !PIECE_BLOCK_SCHEMA[lb.id]) return;
        const block = ws.newBlock(lb.id) as Blockly.BlockSvg;
        block.initSvg();
        initializeDefaultSockets(block);

        Object.entries(lb.socketValues || {}).forEach(([key, value]) => {
            writeBlockSocketValue(block, key, value);
        });

        if (lb.type === 'trigger' && lb.checkFrequency) {
            const freqField = block.getField('freq');
            if (freqField) freqField.setValue(lb.checkFrequency);
        }

        if (typeof lb.position?.x === 'number' && typeof lb.position?.y === 'number') {
            block.moveTo(new Blockly.utils.Coordinate(lb.position.x, lb.position.y));
        }

        block.render();
        created.set(lb.instanceId, block);
    });

    legacyBlocks.forEach(lb => {
        const parent = created.get(lb.instanceId);
        if (!parent) return;

        if (lb.childId) {
            const child = created.get(lb.childId);
            if (parent.nextConnection && child?.previousConnection && !child.previousConnection.isConnected()) {
                parent.nextConnection.connect(child.previousConnection);
            }
        }

        // Legacy 'if' blocks kept their THEN/ELSE bodies as thenChildId/elseChildId
        // rather than childId; reconnect those into the new block's statement inputs.
        const branchFields: Array<['thenChildId' | 'elseChildId', 'THEN' | 'ELSE']> = [
            ['thenChildId', 'THEN'],
            ['elseChildId', 'ELSE']
        ];
        branchFields.forEach(([field, inputName]) => {
            const childId = lb[field];
            if (!childId) return;
            const child = created.get(childId);
            const input = parent.getInput(inputName);
            if (input?.connection && child?.previousConnection && !child.previousConnection.isConnected()) {
                input.connection.connect(child.previousConnection);
            }
        });
    });
}

// Run registration immediately
defineCustomPieceBlocks();

if (typeof window !== 'undefined') {
    // Deliberately no custom renderer here: Blockly's default (Geras) renderer is the
    // only one that correctly lays out our multi-row blocks (dummy + value inputs mixed
    // on the same block). A hand-rolled constant provider tuned for single-row blocks
    // badly mis-rendered anything with a value input, so this editor just uses stock
    // Blockly block shapes — only the theme (colours) is customized.
    const PieceDarkTheme = Blockly.Theme.defineTheme('piece_custom_dark', {
        'name': 'piece_custom_dark',
        'base': Blockly.Themes.Classic,
        'blockStyles': {
            'trigger_blocks': {
                'colourPrimary': '#FFD700',
                'colourSecondary': '#FFEC8B',
                'colourTertiary': '#CDBE70'
            }
        },
        'componentStyles': {
            'workspaceBackgroundColour': '#0c0e12',
            'toolboxBackgroundColour': '#1a1d23',
            'flyoutBackgroundColour': '#1a1d23',
            'scrollbarColour': '#ffffff10',
            'scrollbarOpacity': 0.1
        }
    });

    if (!Blockly.registry.hasItem(Blockly.registry.Type.THEME, 'piece_custom_dark')) {
        Blockly.registry.register(Blockly.registry.Type.THEME, 'piece_custom_dark', PieceDarkTheme);
    }
}
