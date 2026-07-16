import { Job } from './jobStore';

const SERVER_TOOL_NAMES = new Set([
  'get_project_state',
  'update_project_info',
  'save_project',
  'get_block_templates',
  'list_pieces',
  'get_piece_details',
  'get_current_context',
]);

/** Guest projects live in localStorage — server can't access them, so all tools stay client-side. */
export function isServerTool(name: string, isGuest: boolean): boolean {
  if (isGuest) return false;
  return SERVER_TOOL_NAMES.has(name);
}

export async function executeServerTool(
  name: string,
  args: Record<string, any>,
  job: Job
): Promise<string> {
  const { getProject, saveProject } = await import('@/lib/firestore');

  switch (name) {
    case 'get_project_state': {
      const project = await getProject(job.projectId, job.userId);
      if (!project) return JSON.stringify({ error: 'Project not found' });
      return JSON.stringify({
        id: project.id,
        name: project.name,
        description: project.description,
        rows: project.rows,
        cols: project.cols,
        gridType: project.gridType || 'square',
        activeSquares: project.activeSquares,
        placedPieces: project.placedPieces,
        customPieces: (project.customPieces || []).map((cp: any) => ({
          id: cp.id,
          name: cp.name,
          movesCount: cp.moves?.length || 0,
          hasLogic: !!(cp.logic && (Array.isArray(cp.logic) ? cp.logic.length > 0 : true)),
          variablesCount: cp.variables?.length || 0,
        })),
        squareLogicSquares: project.squareLogic ? Object.keys(project.squareLogic) : [],
      });
    }

    case 'update_project_info': {
      const project = await getProject(job.projectId, job.userId);
      if (!project) return JSON.stringify({ error: 'Project not found' });
      const updates: Record<string, string> = {};
      if (args.name) updates.name = args.name;
      if (args.description !== undefined) updates.description = args.description;
      await saveProject({ ...project, ...updates });
      return JSON.stringify({ success: true });
    }

    case 'save_project': {
      const project = await getProject(job.projectId, job.userId);
      if (!project) return JSON.stringify({ error: 'Project not found' });
      await saveProject(project);
      return JSON.stringify({ success: true });
    }

    case 'list_pieces': {
      const project = await getProject(job.projectId, job.userId);
      if (!project) return JSON.stringify({ error: 'Project not found' });
      return JSON.stringify(
        (project.customPieces || []).map((cp: any) => ({ id: cp.id, name: cp.name }))
      );
    }

    case 'get_piece_details': {
      const project = await getProject(job.projectId, job.userId);
      if (!project) return JSON.stringify({ error: 'Project not found' });
      const piece = (project.customPieces || []).find((cp: any) => cp.id === args.pieceId);
      if (!piece) return JSON.stringify({ error: 'Piece not found' });
      return JSON.stringify({
        id: (piece as any).id,
        name: (piece as any).name,
        movesCount: (piece as any).moves?.length || 0,
        moves: (piece as any).moves,
        logicBlocksCount: Array.isArray((piece as any).logic) ? (piece as any).logic.length : 0,
        variables: (piece as any).variables || [],
        hasWhitePixels: !!(piece as any).pixelsWhite,
        hasBlackPixels: !!(piece as any).pixelsBlack,
      });
    }

    case 'get_block_templates': {
      return JSON.stringify([
        { id: 'on-is-captured', type: 'trigger', label: 'onIsCaptured', sockets: [{ id: 'by', type: 'select', options: ['Any', 'Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King'] }] },
        { id: 'on-threat', type: 'trigger', label: 'onThreat', sockets: [{ id: 'by', type: 'select', options: ['Any', 'Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King'] }] },
        { id: 'on-move', type: 'trigger', label: 'onMove', sockets: [] },
        { id: 'on-environment', type: 'trigger', label: 'onEnvironment', sockets: [{ id: 'condition', type: 'select', options: ['White Square', 'Black Square', 'Is Attacked'] }] },
        { id: 'on-var', type: 'trigger', label: 'onVar', sockets: [{ id: 'varName', type: 'text' }, { id: 'op', type: 'select', options: ['==', '!=', '>', '<', '>=', '<='] }, { id: 'value', type: 'text' }] },
        { id: 'cooldown', type: 'effect', label: 'cooldown', sockets: [{ id: 'duration', type: 'number' }, { id: 'unit', type: 'select', options: ['seconds', 'half-moves', 'full-moves'] }] },
        { id: 'transformation', type: 'effect', label: 'transformation', sockets: [{ id: 'target', type: 'select', options: ['Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King'] }] },
        { id: 'modify-var', type: 'effect', label: 'modVar', sockets: [{ id: 'varName', type: 'text' }, { id: 'op', type: 'select', options: ['+=', '-=', '='] }, { id: 'value', type: 'number' }] },
        { id: 'prevent', type: 'effect', label: 'prevent', sockets: [] },
        { id: 'kill', type: 'terminal', label: 'kill', sockets: [{ id: 'target', type: 'select', options: ['Selected Piece', 'Attacker'] }] },
        { id: 'explode', type: 'terminal', label: 'explode', sockets: [{ id: 'radius', type: 'number' }] },
        { id: 'win', type: 'terminal', label: 'win', sockets: [] },
      ]);
    }

    case 'get_current_context': {
      return JSON.stringify({
        currentPage: job.currentPage,
        projectId: job.projectId,
      });
    }

    default:
      throw new Error(`Unknown server tool: ${name}`);
  }
}
