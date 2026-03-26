import { OllamaTool } from './types';

/** Returns only tools relevant to the current editor page — saves ~60% tokens vs sending all 48 */
export function getToolsForPage(currentPage: string): OllamaTool[] {
  switch (currentPage) {
    case 'board-editor': return [...GLOBAL_TOOLS, ...BOARD_TOOLS];
    case 'piece-editor': return [...GLOBAL_TOOLS, ...PIECE_CRUD_TOOLS, ...PIECE_DRAWING_TOOLS, ...MOVEMENT_TOOLS];
    case 'piece-logic': return [...GLOBAL_TOOLS, ...LOGIC_TOOLS];
    case 'square-editor': return [...GLOBAL_TOOLS, ...SQUARE_TOOLS];
    default: return [...GLOBAL_TOOLS, ...BOARD_TOOLS, ...PIECE_CRUD_TOOLS];
  }
}

// ─── Navigation + Project (5 tools, always sent) ───
const GLOBAL_TOOLS: OllamaTool[] = [
  { type: 'function', function: { name: 'navigate_to_page', description: 'Navigate to editor page. Use before actions on another page.', parameters: { type: 'object', properties: { page: { type: 'string', enum: ['project-overview', 'board-editor', 'piece-editor', 'piece-logic', 'square-editor'] }, pieceId: { type: 'string', description: 'Required for piece-logic' } }, required: ['page'] } } },
  { type: 'function', function: { name: 'get_current_context', description: 'Get current page and project summary.', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'get_project_state', description: 'Get full project data.', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'update_project_info', description: 'Update project name/description.', parameters: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' } } } } },
  { type: 'function', function: { name: 'save_project', description: 'Persist changes.', parameters: { type: 'object', properties: {} } } },
];

// ─── Board Editor (10 tools) ───
const BOARD_TOOLS: OllamaTool[] = [
  { type: 'function', function: { name: 'resize_board', description: 'Resize board (1-20 rows/cols).', parameters: { type: 'object', properties: { rows: { type: 'number' }, cols: { type: 'number' } }, required: ['rows', 'cols'] } } },
  { type: 'function', function: { name: 'set_grid_type', description: 'Switch square/hex grid.', parameters: { type: 'object', properties: { gridType: { type: 'string', enum: ['square', 'hex'] } }, required: ['gridType'] } } },
  { type: 'function', function: { name: 'enable_squares', description: 'Enable squares. Coords: "x,y".', parameters: { type: 'object', properties: { squares: { type: 'array', items: { type: 'string' } } }, required: ['squares'] } } },
  { type: 'function', function: { name: 'disable_squares', description: 'Disable squares.', parameters: { type: 'object', properties: { squares: { type: 'array', items: { type: 'string' } } }, required: ['squares'] } } },
  { type: 'function', function: { name: 'set_all_active_squares', description: 'Replace entire activeSquares array.', parameters: { type: 'object', properties: { squares: { type: 'array', items: { type: 'string' } } }, required: ['squares'] } } },
  { type: 'function', function: { name: 'place_piece', description: 'Place piece. Standard: Pawn/Knight/Bishop/Rook/Queen/King or custom name.', parameters: { type: 'object', properties: { square: { type: 'string' }, pieceType: { type: 'string' }, color: { type: 'string', enum: ['white', 'black'] }, movement: { type: 'string', enum: ['run', 'jump'] } }, required: ['square', 'pieceType', 'color'] } } },
  { type: 'function', function: { name: 'remove_piece', description: 'Remove piece from square.', parameters: { type: 'object', properties: { square: { type: 'string' } }, required: ['square'] } } },
  { type: 'function', function: { name: 'clear_all_pieces', description: 'Remove all pieces.', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'apply_board_preset', description: 'Apply preset layout.', parameters: { type: 'object', properties: { preset: { type: 'string', enum: ['standard-chess', 'empty-8x8', 'small-5x5', 'large-10x10'] } }, required: ['preset'] } } },
  { type: 'function', function: { name: 'set_symmetry_mode', description: 'Set symmetry for editing.', parameters: { type: 'object', properties: { mode: { type: 'string', enum: ['none', 'horizontal', 'vertical', 'rotational'] } }, required: ['mode'] } } },
];

// ─── Piece CRUD (5 tools) ───
const PIECE_CRUD_TOOLS: OllamaTool[] = [
  { type: 'function', function: { name: 'create_piece', description: 'Create custom piece. Returns pieceId.', parameters: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } } },
  { type: 'function', function: { name: 'delete_piece', description: 'Delete piece by ID.', parameters: { type: 'object', properties: { pieceId: { type: 'string' } }, required: ['pieceId'] } } },
  { type: 'function', function: { name: 'rename_piece', description: 'Rename piece.', parameters: { type: 'object', properties: { pieceId: { type: 'string' }, name: { type: 'string' } }, required: ['pieceId', 'name'] } } },
  { type: 'function', function: { name: 'list_pieces', description: 'List all pieces with IDs.', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'get_piece_details', description: 'Get piece pixels, moves, logic.', parameters: { type: 'object', properties: { pieceId: { type: 'string' } }, required: ['pieceId'] } } },
];

// ─── Piece Drawing (7 tools) ───
const PIECE_DRAWING_TOOLS: OllamaTool[] = [
  { type: 'function', function: { name: 'set_pixels', description: 'Set pixels on 64x64 canvas.', parameters: { type: 'object', properties: { pieceId: { type: 'string' }, variant: { type: 'string', enum: ['white', 'black'] }, pixels: { type: 'array', items: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' }, color: { type: 'string' } }, required: ['x', 'y', 'color'] } } }, required: ['pieceId', 'variant', 'pixels'] } } },
  { type: 'function', function: { name: 'draw_rectangle', description: 'Draw rectangle on canvas.', parameters: { type: 'object', properties: { pieceId: { type: 'string' }, variant: { type: 'string', enum: ['white', 'black'] }, x1: { type: 'number' }, y1: { type: 'number' }, x2: { type: 'number' }, y2: { type: 'number' }, color: { type: 'string' }, filled: { type: 'boolean' } }, required: ['pieceId', 'variant', 'x1', 'y1', 'x2', 'y2', 'color', 'filled'] } } },
  { type: 'function', function: { name: 'draw_circle', description: 'Draw circle on canvas.', parameters: { type: 'object', properties: { pieceId: { type: 'string' }, variant: { type: 'string', enum: ['white', 'black'] }, centerX: { type: 'number' }, centerY: { type: 'number' }, radius: { type: 'number' }, color: { type: 'string' }, filled: { type: 'boolean' } }, required: ['pieceId', 'variant', 'centerX', 'centerY', 'radius', 'color', 'filled'] } } },
  { type: 'function', function: { name: 'draw_line', description: 'Draw line on canvas.', parameters: { type: 'object', properties: { pieceId: { type: 'string' }, variant: { type: 'string', enum: ['white', 'black'] }, x1: { type: 'number' }, y1: { type: 'number' }, x2: { type: 'number' }, y2: { type: 'number' }, color: { type: 'string' }, thickness: { type: 'number' } }, required: ['pieceId', 'variant', 'x1', 'y1', 'x2', 'y2', 'color', 'thickness'] } } },
  { type: 'function', function: { name: 'fill_region', description: 'Flood-fill from point.', parameters: { type: 'object', properties: { pieceId: { type: 'string' }, variant: { type: 'string', enum: ['white', 'black'] }, x: { type: 'number' }, y: { type: 'number' }, color: { type: 'string' } }, required: ['pieceId', 'variant', 'x', 'y', 'color'] } } },
  { type: 'function', function: { name: 'clear_canvas', description: 'Clear canvas to transparent.', parameters: { type: 'object', properties: { pieceId: { type: 'string' }, variant: { type: 'string', enum: ['white', 'black'] } }, required: ['pieceId', 'variant'] } } },
  { type: 'function', function: { name: 'invert_piece_colors', description: 'Invert lightness to generate other color variant.', parameters: { type: 'object', properties: { pieceId: { type: 'string' }, source: { type: 'string', enum: ['white', 'black'] } }, required: ['pieceId', 'source'] } } },
];

// ─── Movement Rules (5 tools) ───
const MOVEMENT_TOOLS: OllamaTool[] = [
  { type: 'function', function: { name: 'load_movement_preset', description: 'Load standard movement rules, replacing existing.', parameters: { type: 'object', properties: { pieceId: { type: 'string' }, preset: { type: 'string', enum: ['Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King'] } }, required: ['pieceId', 'preset'] } } },
  { type: 'function', function: { name: 'add_movement_rule', description: 'Add rule. Vars: diffX/diffY (signed), absDiffX/absDiffY. Ops: ===,>,<,>=,<=. Type: run=sliding, jump=leaping.', parameters: { type: 'object', properties: { pieceId: { type: 'string' }, conditions: { type: 'array', items: { type: 'object', properties: { variable: { type: 'string', enum: ['diffX', 'diffY', 'absDiffX', 'absDiffY'] }, operator: { type: 'string', enum: ['===', '>', '<', '>=', '<='] }, value: { type: 'number' }, logic: { type: 'string', enum: ['AND', 'OR'] } }, required: ['variable', 'operator', 'value'] } }, result: { type: 'string', enum: ['allow', 'disallow'] }, type: { type: 'string', enum: ['run', 'jump'] } }, required: ['pieceId', 'conditions', 'result', 'type'] } } },
  { type: 'function', function: { name: 'remove_movement_rule', description: 'Remove rule.', parameters: { type: 'object', properties: { pieceId: { type: 'string' }, ruleId: { type: 'string' } }, required: ['pieceId', 'ruleId'] } } },
  { type: 'function', function: { name: 'update_movement_rule', description: 'Update existing rule.', parameters: { type: 'object', properties: { pieceId: { type: 'string' }, ruleId: { type: 'string' }, conditions: { type: 'array', items: { type: 'object', properties: { variable: { type: 'string', enum: ['diffX', 'diffY', 'absDiffX', 'absDiffY'] }, operator: { type: 'string', enum: ['===', '>', '<', '>=', '<='] }, value: { type: 'number' }, logic: { type: 'string', enum: ['AND', 'OR'] } }, required: ['variable', 'operator', 'value'] } }, result: { type: 'string', enum: ['allow', 'disallow'] }, type: { type: 'string', enum: ['run', 'jump'] } }, required: ['pieceId', 'ruleId'] } } },
  { type: 'function', function: { name: 'clear_movement_rules', description: 'Remove all rules.', parameters: { type: 'object', properties: { pieceId: { type: 'string' } }, required: ['pieceId'] } } },
];

// ─── Advanced Piece Logic (9 tools) ───
const LOGIC_TOOLS: OllamaTool[] = [
  { type: 'function', function: { name: 'get_block_templates', description: 'Get available block templates with socket configs.', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'add_logic_block', description: 'Add block to canvas. Triggers→Effects chain. Sockets: on-is-captured{by}, on-environment{condition}, on-var{varName,op,value}, cooldown{duration,unit}, transformation{target}, modify-var{varName,op,value}, kill{target}, explode{radius}.', parameters: { type: 'object', properties: { pieceId: { type: 'string' }, templateId: { type: 'string', enum: ['on-is-captured', 'on-threat', 'on-move', 'on-environment', 'on-var', 'cooldown', 'transformation', 'modify-var', 'prevent', 'kill', 'explode', 'win'] }, position: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] }, socketValues: { type: 'object' } }, required: ['pieceId', 'templateId', 'position'] } } },
  { type: 'function', function: { name: 'remove_logic_block', description: 'Remove block.', parameters: { type: 'object', properties: { pieceId: { type: 'string' }, instanceId: { type: 'string' } }, required: ['pieceId', 'instanceId'] } } },
  { type: 'function', function: { name: 'connect_blocks', description: 'Chain child after parent.', parameters: { type: 'object', properties: { pieceId: { type: 'string' }, parentInstanceId: { type: 'string' }, childInstanceId: { type: 'string' } }, required: ['pieceId', 'parentInstanceId', 'childInstanceId'] } } },
  { type: 'function', function: { name: 'disconnect_block', description: 'Remove from chain.', parameters: { type: 'object', properties: { pieceId: { type: 'string' }, instanceId: { type: 'string' } }, required: ['pieceId', 'instanceId'] } } },
  { type: 'function', function: { name: 'update_block_sockets', description: 'Update block socket values.', parameters: { type: 'object', properties: { pieceId: { type: 'string' }, instanceId: { type: 'string' }, socketValues: { type: 'object' } }, required: ['pieceId', 'instanceId', 'socketValues'] } } },
  { type: 'function', function: { name: 'move_block', description: 'Reposition block on canvas.', parameters: { type: 'object', properties: { pieceId: { type: 'string' }, instanceId: { type: 'string' }, position: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] } }, required: ['pieceId', 'instanceId', 'position'] } } },
  { type: 'function', function: { name: 'create_piece_variable', description: 'Create variable for logic. Usable in onVar/modVar.', parameters: { type: 'object', properties: { pieceId: { type: 'string' }, name: { type: 'string' } }, required: ['pieceId', 'name'] } } },
  { type: 'function', function: { name: 'delete_piece_variable', description: 'Delete variable.', parameters: { type: 'object', properties: { pieceId: { type: 'string' }, variableId: { type: 'string' } }, required: ['pieceId', 'variableId'] } } },
];

// ─── Square Editor (7 tools) ───
const SQUARE_TOOLS: OllamaTool[] = [
  { type: 'function', function: { name: 'get_square_logic', description: 'Get logic for a square.', parameters: { type: 'object', properties: { squareId: { type: 'string' } }, required: ['squareId'] } } },
  { type: 'function', function: { name: 'add_square_block', description: 'Add block. Triggers: on-step, on-proximity. Effects: teleport, disable-square, enable-square. Terminals: kill, win.', parameters: { type: 'object', properties: { squareId: { type: 'string' }, blockType: { type: 'string', enum: ['on-step', 'on-proximity', 'teleport', 'disable-square', 'enable-square', 'kill', 'win'] }, socketValues: { type: 'object' } }, required: ['squareId', 'blockType'] } } },
  { type: 'function', function: { name: 'remove_square_block', description: 'Remove block.', parameters: { type: 'object', properties: { squareId: { type: 'string' }, blockId: { type: 'string' } }, required: ['squareId', 'blockId'] } } },
  { type: 'function', function: { name: 'update_square_block_sockets', description: 'Update block sockets.', parameters: { type: 'object', properties: { squareId: { type: 'string' }, blockId: { type: 'string' }, socketValues: { type: 'object' } }, required: ['squareId', 'blockId', 'socketValues'] } } },
  { type: 'function', function: { name: 'connect_square_blocks', description: 'Chain blocks.', parameters: { type: 'object', properties: { squareId: { type: 'string' }, parentBlockId: { type: 'string' }, childBlockId: { type: 'string' } }, required: ['squareId', 'parentBlockId', 'childBlockId'] } } },
  { type: 'function', function: { name: 'create_square_variable', description: 'Create square variable.', parameters: { type: 'object', properties: { squareId: { type: 'string' }, name: { type: 'string' } }, required: ['squareId', 'name'] } } },
  { type: 'function', function: { name: 'delete_square_variable', description: 'Delete square variable.', parameters: { type: 'object', properties: { squareId: { type: 'string' }, variableId: { type: 'string' } }, required: ['squareId', 'variableId'] } } },
];
