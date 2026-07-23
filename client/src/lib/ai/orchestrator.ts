import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { Job, emitJobEvent } from './jobStore';
import { buildGenStepPrompt } from './systemPrompt';
import {
  GenStep, GenPlan, GenProgress, StepResult,
} from './types';
import { getProject, saveProject, saveProjectBoard } from '@/db';
import type { CustomPiece } from '@/types/firestore';

const apiKey = process.env.DEEPSEEK_API_KEY || '';
const isOpenRouter = apiKey.startsWith('sk-or-');
const baseURL = isOpenRouter ? 'https://openrouter.ai/api/v1' : 'https://api.deepseek.com';
const model = isOpenRouter ? 'deepseek/deepseek-v4-flash' : 'deepseek-v4-flash';
const openai = new OpenAI({ baseURL, apiKey });

const STEP_ORDER: GenStep[] = [
  'plan', 'board', 'piece-roster', 'piece-design', 'movement',
  'square-patterns', 'validation', 'summary',
];

const MAX_OUTPUT_TOKENS = 4096;
const ORCHESTRATOR_TOKEN_BUDGET = 150_000;

async function callLlm(job: Job, prompt: string, userMsg: string): Promise<string> {
  const history = job.apiMessages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .filter(m => !m.tool_calls)
    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content || '' }));
  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: prompt },
      ...history,
      { role: 'user', content: userMsg },
    ],
    stream: false,
    max_tokens: MAX_OUTPUT_TOKENS,
    ...(isOpenRouter ? {} : { thinking: { type: 'disabled' } }),
  });

  if (completion.usage) {
    job.cumulativeTokens += completion.usage.total_tokens;
    if (job.cumulativeTokens >= ORCHESTRATOR_TOKEN_BUDGET) {
      throw new Error(`Token budget reached (${job.cumulativeTokens.toLocaleString()})`);
    }
  }

  return completion.choices[0]?.message?.content || '';
}

function extractJson(text: string): any {
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try { return JSON.parse(braceMatch[0]); } catch { /* fall through */ }
  }
  const bracketMatch = text.match(/\[[\s\S]*\]/);
  if (bracketMatch) {
    try { return JSON.parse(bracketMatch[0]); } catch { /* fall through */ }
  }
  return null;
}

function emitProgress(job: Job, progress: GenProgress) {
  emitJobEvent(job, 'gen_progress', { progress });
}

const STANDARD_PIECES = new Set(['Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King']);

function createEmptyPiece(name: string, userId: string, projectId: string): CustomPiece {
  return {
    id: uuidv4(), projectId, userId, name,
    pixelsWhite: Array(64).fill(null).map(() => Array(64).fill('transparent')),
    pixelsBlack: Array(64).fill(null).map(() => Array(64).fill('transparent')),
    moves: [], createdAt: new Date(), updatedAt: new Date(), setId: '',
  };
}

function generateAllSquares(rows: number, cols: number): string[] {
  const squares: string[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) squares.push(`${c},${r}`);
  return squares;
}

function pixelsToGrid(sparse: { x: number; y: number; color: string }[]): string[][] {
  const grid = Array(64).fill(null).map(() => Array(64).fill('transparent'));
  for (const p of sparse) {
    if (p.x >= 0 && p.x < 64 && p.y >= 0 && p.y < 64) grid[p.y][p.x] = p.color;
  }
  return grid;
}

function normalizeOperator(op: string): string {
  return { '==': '===', '===': '===', '!=': '!==', '!==': '!==', '>': '>', '<': '<', '>=': '>=', '<=': '<=' }[op] || '===';
}

export async function applyStepResult(job: Job, step: GenStep, artifacts: any): Promise<void> {
  if (!artifacts) return;
  const project = await getProject(job.projectId, job.userId);
  if (!project) throw new Error('Project not found');

  switch (step) {
    case 'board': {
      const { rows, cols, gridType, activeSquares, startingPieces } = artifacts;
      const r = Math.max(1, Math.min(20, rows ?? project.rows));
      const c = Math.max(1, Math.min(20, cols ?? project.cols));
      const squares = activeSquares?.length ? activeSquares : generateAllSquares(r, c);
      const pieces: Record<string, { type: string; color: string }> = {};
      if (Array.isArray(startingPieces)) {
        for (const sp of startingPieces) {
          const sq = sp.square || (sp.position ? `${sp.position.x},${sp.position.y}` : null);
          if (sq && sp.type) pieces[sq] = { type: sp.type, color: sp.color || 'white' };
        }
      }
      await saveProjectBoard(job.projectId, job.userId, {
        rows: r, cols: c,
        gridType: gridType === 'hex' ? 'hex' : 'square',
        activeSquares: squares, placedPieces: pieces,
      });
      break;
    }

    case 'piece-roster': {
      const roster = Array.isArray(artifacts) ? artifacts : (Array.isArray(artifacts.pieces) ? artifacts.pieces : []);
      if (!roster.length) break;
      const existing = [...(project.customPieces || [])];
      let changed = false;
      for (const entry of roster) {
        const name = entry.name || entry.type;
        if (!name || STANDARD_PIECES.has(name)) continue;
        if (existing.some(p => p.name === name)) continue;
        existing.push(createEmptyPiece(name, job.userId, project.id!));
        changed = true;
      }
      if (changed) await saveProject({ ...project, customPieces: existing });
      break;
    }

    case 'piece-design': {
      const designs = Array.isArray(artifacts) ? artifacts : (Array.isArray(artifacts.pieces) ? artifacts.pieces : []);
      if (!designs.length) break;
      const pieces = [...(project.customPieces || [])];
      let changed = false;
      for (const d of designs) {
        let piece = pieces.find(p => p.name === d.name);
        if (!piece) {
          if (STANDARD_PIECES.has(d.name)) continue;
          piece = createEmptyPiece(d.name, job.userId, project.id!);
          pieces.push(piece);
          changed = true;
        }
        if (d.whitePixels) { piece.pixelsWhite = pixelsToGrid(d.whitePixels); changed = true; }
        if (d.blackPixels) { piece.pixelsBlack = pixelsToGrid(d.blackPixels); changed = true; }
      }
      if (changed) await saveProject({ ...project, customPieces: pieces });
      break;
    }

    case 'movement': {
      const movesData = Array.isArray(artifacts) ? artifacts : (Array.isArray(artifacts.pieces) ? artifacts.pieces : []);
      if (!movesData.length) break;
      const pieces = [...(project.customPieces || [])];
      let changed = false;
      for (const d of movesData) {
        let piece = pieces.find(p => p.name === d.name);
        if (!piece) {
          if (STANDARD_PIECES.has(d.name)) continue;
          piece = createEmptyPiece(d.name, job.userId, project.id!);
          pieces.push(piece);
          changed = true;
        }
        if (!d.moves?.length) continue;
        piece.moves = d.moves.map((m: any) => ({
          id: uuidv4(),
          conditions: (m.conditions || []).map((c: any) => ({
            id: uuidv4(), variable: c.variable,
            operator: normalizeOperator(c.operator),
            value: Number(c.value), logic: c.logic || 'AND',
          })),
          result: m.result || 'allow',
          type: m.type === 'slide' || m.type === 'running' ? m.type
            : m.type === 'run' ? 'slide' : 'jump',
        }));
        changed = true;
      }
      if (changed) await saveProject({ ...project, customPieces: pieces });
      break;
    }

    case 'square-patterns':
      // square-patterns produces high-level descriptions, not Blockly XML — skip applying
      break;

    default:
      break;
  }
}

export async function runGenerationFlow(job: Job): Promise<void> {
  const userMessages = job.apiMessages?.filter(m => m.role === 'user' && m.content) || [];
  const userRequest = userMessages[userMessages.length - 1]?.content || 'Create a chess variant';

  try {
    job.status = 'running';

    const progress: GenProgress = {
      currentStep: 'plan', completedSteps: [], stepResults: {},
      plan: null, status: 'generating',
    };
    emitProgress(job, progress);

    for (const step of STEP_ORDER) {
      progress.currentStep = step;
      emitProgress(job, progress);

      const plan: GenPlan = progress.plan || {
        theme: 'Custom Chess', description: 'A custom chess variant',
        boardSize: '8x8 square', pieces: [],
        movementPhilosophy: 'Standard', squareEffectIdeas: 'None',
        keyConstraints: [], skipSteps: [],
      };

      // Skip irrelevant steps based on plan analysis
      if (step !== 'plan' && plan.skipSteps?.includes(step)) {
        progress.completedSteps.push(step);
        emitProgress(job, progress);
        continue;
      }

      const state = progress.stepResults['board']?.artifacts?.boardState || null;
      const prompt = buildGenStepPrompt(step, plan, state);
      const userMsg = buildStepUserMessage(step, plan, progress, userRequest);

      let result: string;

      // Plan step uses the user's request directly
      if (step === 'plan') {
        result = await callLlm(job, prompt, userRequest);
      } else {
        result = await callLlm(job, prompt, userMsg);
      }

      let parsed: any = null;
      if (step !== 'summary') {
        parsed = extractJson(result);
      }

      // Special: apply skipSteps from parsed plan
      if (step === 'plan' && parsed?.skipSteps) {
        plan.skipSteps = parsed.skipSteps;
        progress.plan = parsed;
      } else if (step === 'plan' && parsed) {
        progress.plan = parsed;
      }

      const stepResult: StepResult = {
        step, success: true, summary: result,
        artifacts: parsed || { raw: result },
      };

      progress.stepResults[step] = stepResult;
      progress.completedSteps.push(step);

      // Apply generated artifacts to the actual project
      if (parsed && step !== 'plan' && step !== 'validation' && step !== 'summary') {
        await applyStepResult(job, step, parsed);
        emitJobEvent(job, 'project_updated', { step });
      }

      emitProgress(job, progress);
    }

    progress.status = 'done';
    emitJobEvent(job, 'gen_complete', { progress });

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    emitJobEvent(job, 'gen_error', { error: errMsg });
    emitJobEvent(job, 'gen_progress', {
      progress: {
        currentStep: 'plan', completedSteps: [], stepResults: {},
        plan: null, status: 'error', error: errMsg,
      },
    });
  } finally {
    job.status = 'done';
    emitJobEvent(job, 'done', {});
  }
}

function buildStepUserMessage(
  step: GenStep, plan: GenPlan, progress: GenProgress, userRequest: string,
): string {
  const requestPrefix = `User request: "${userRequest}"\n\n`;

  switch (step) {
    case 'plan':
      return ''; // not used — plan step uses raw userRequest

    case 'board':
      return `${requestPrefix}Design the board. Output JSON: { rows, cols, gridType, activeSquares, startingPieces, description }`;

    case 'piece-roster':
      return `${requestPrefix}Propose a piece roster. Output JSON array of: { name, role, visualDescription, count? }`;

    case 'piece-design': {
      const rosterArtifacts = progress.stepResults['piece-roster']?.artifacts;
      const rosterList = Array.isArray(rosterArtifacts) ? rosterArtifacts : (rosterArtifacts?.pieces || []);
      const pieceNames = (Array.isArray(rosterList) ? rosterList : []).map((p: any) => p.name).filter(Boolean).join(', ') || 'unknown roster';
      return `${requestPrefix}Design piece art for: ${pieceNames}. Output: { pieces: [{ name, whitePixels: [{x,y,color}], blackPixels: [{x,y,color}] }] }`;
    }

    case 'movement':
      return `${requestPrefix}Define movement rules. Output: { pieces: [{ name, moves: [{ conditions: [{ variable, operator, value, logic }], result, type }] }] }`;

    case 'square-patterns':
      return `${requestPrefix}Design square effect patterns. Output: { patterns: [{ name, trigger, effect, squares, socketValues }] }`;

    case 'validation':
      return `${requestPrefix}Review the variant "${plan.theme}" for coherence and playability. Output JSON: { passed, issues, summary }`;

    case 'summary':
      return `${requestPrefix}Write an engaging summary of "${plan.theme}". Include board, pieces, movement, effects, how to win.`;

    default:
      return `${requestPrefix}Continue the design according to the plan.`;
  }
}
