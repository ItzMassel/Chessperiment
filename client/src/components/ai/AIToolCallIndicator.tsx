'use client';

import { ToolCall } from '@/lib/ai/types';
import { Wrench, CheckCircle } from 'lucide-react';

// Human-readable descriptions for tool calls
const TOOL_LABELS: Record<string, (args: Record<string, any>) => string> = {
  navigate_to_page: (a) => `Navigating to ${a.page}`,
  get_current_context: () => 'Getting current context',
  get_project_state: () => 'Reading project state',
  update_project_info: (a) => `Updating project ${a.name ? `name to "${a.name}"` : 'info'}`,
  save_project: () => 'Saving project',
  resize_board: (a) => `Resizing board to ${a.rows}x${a.cols}`,
  set_grid_type: (a) => `Switching to ${a.gridType} grid`,
  enable_squares: (a) => `Enabling ${a.squares?.length} squares`,
  disable_squares: (a) => `Disabling ${a.squares?.length} squares`,
  set_all_active_squares: (a) => `Setting ${a.squares?.length} active squares`,
  place_piece: (a) => `Placing ${a.color} ${a.pieceType} on ${a.square}`,
  remove_piece: (a) => `Removing piece from ${a.square}`,
  clear_all_pieces: () => 'Clearing all pieces',
  apply_board_preset: (a) => `Applying ${a.preset} preset`,
  set_symmetry_mode: (a) => `Setting ${a.mode} symmetry`,
  create_piece: (a) => `Creating piece "${a.name}"`,
  delete_piece: () => 'Deleting piece',
  rename_piece: (a) => `Renaming piece to "${a.name}"`,
  list_pieces: () => 'Listing pieces',
  get_piece_details: () => 'Getting piece details',
  set_pixels: (a) => `Drawing ${a.pixels?.length} pixels`,
  draw_rectangle: () => 'Drawing rectangle',
  draw_circle: () => 'Drawing circle',
  draw_line: () => 'Drawing line',
  fill_region: () => 'Filling region',
  clear_canvas: () => 'Clearing canvas',
  invert_piece_colors: () => 'Inverting colors',
  load_movement_preset: (a) => `Loading ${a.preset} movement`,
  add_movement_rule: () => 'Adding movement rule',
  remove_movement_rule: () => 'Removing movement rule',
  update_movement_rule: () => 'Updating movement rule',
  clear_movement_rules: () => 'Clearing movement rules',
  get_block_templates: () => 'Getting block templates',
  add_logic_block: (a) => `Adding ${a.templateId} block`,
  remove_logic_block: () => 'Removing logic block',
  connect_blocks: () => 'Connecting blocks',
  disconnect_block: () => 'Disconnecting block',
  update_block_sockets: () => 'Updating block values',
  move_block: () => 'Moving block',
  create_piece_variable: (a) => `Creating variable "${a.name}"`,
  delete_piece_variable: () => 'Deleting variable',
  get_square_logic: (a) => `Reading square ${a.squareId} logic`,
  add_square_block: (a) => `Adding ${a.blockType} to square`,
  remove_square_block: () => 'Removing square block',
  update_square_block_sockets: () => 'Updating square block',
  connect_square_blocks: () => 'Connecting square blocks',
  create_square_variable: (a) => `Creating square variable "${a.name}"`,
  delete_square_variable: () => 'Deleting square variable',
};

interface AIToolCallIndicatorProps {
  toolCall: ToolCall;
}

export default function AIToolCallIndicator({ toolCall }: AIToolCallIndicatorProps) {
  const { name, arguments: args } = toolCall.function;
  const labelFn = TOOL_LABELS[name];
  const label = labelFn ? labelFn(args || {}) : name.replace(/_/g, ' ');

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-xs text-white/50">
      <Wrench className="w-3 h-3 flex-shrink-0" />
      <span className="truncate">{label}</span>
      <CheckCircle className="w-3 h-3 flex-shrink-0 text-green-400/60 ml-auto" />
    </div>
  );
}
