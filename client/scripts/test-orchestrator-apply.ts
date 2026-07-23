/**
 * Directly tests orchestrator's applyStepResult against a real project in the DB.
 * Usage (from client/): node --env-file=.env.local -e "require('child_process').execSync('npx tsx scripts/test-orchestrator-apply.ts', {stdio:'inherit',env:{...process.env}})"
 */

import { getProject, saveProject, saveProjectBoard } from '../src/db';
import { applyStepResult } from '../src/lib/ai/orchestrator';
import { Job } from '../src/lib/ai/jobStore';
import { GenStep } from '../src/lib/ai/types';

async function main() {
  const userId = process.env.TEST_USER_ID;
  const projectId = process.env.TEST_PROJECT_ID;
  if (!userId || !projectId) {
    console.error('Set TEST_USER_ID and TEST_PROJECT_ID in .env.local');
    process.exit(1);
  }

  // Load original project state
  const orig = await getProject(projectId, userId);
  if (!orig) {
    console.error(`Project ${projectId} not found for user ${userId}`);
    process.exit(1);
  }
  console.log(`Project: "${orig.name}" (${orig.rows}x${orig.cols})`);

  // Build a mock job
  const job: Job = {
    id: 'test-job',
    secret: 'test-secret',
    status: 'running',
    apiMessages: [{ role: 'user', content: 'test' }],
    chatMessages: [],
    events: [],
    projectId,
    userId,
    isGuest: false,
    currentPage: 'board-editor',
    cumulativeTokens: 0,
    pendingClientResult: null,
    pendingClientToolCalls: null,
    pendingCheckpoint: null,
    genProgress: null,
    subscribers: new Set(),
    createdAt: Date.now(),
  };

  // ── Test 1: Board step — resize to 10x10 ──
  console.log('\n=== Test 1: Board step — 10x10 ===');
  await applyStepResult(job, 'board', {
    rows: 10, cols: 10, gridType: 'square',
    activeSquares: [],
    startingPieces: [],
    description: 'A spacious 10x10 battlefield',
  });
  const afterBoard = await getProject(projectId, userId);
  if (!afterBoard) { console.error('Project lost!'); process.exit(1); }
  console.log(`  rows: ${afterBoard.rows} (expect 10)`);
  console.log(`  cols: ${afterBoard.cols} (expect 10)`);
  if (afterBoard.rows !== 10 || afterBoard.cols !== 10) {
    console.error('FAIL: Board not resized');
    process.exit(1);
  }
  console.log('  PASS');

  // ── Test 2: Board step — null startingPieces (was crashing) ──
  console.log('\n=== Test 2: Board step — null startingPieces ===');
  await applyStepResult(job, 'board', {
    rows: 8, cols: 8, gridType: 'square',
    activeSquares: null,
    startingPieces: null,
  });
  console.log('  PASS (no crash)');

  // ── Test 3: Piece-roster step ──
  console.log('\n=== Test 3: Piece-roster ===');
  await applyStepResult(job, 'piece-roster', [
    { name: 'Phoenix', role: 'Rises from ashes', count: 1 },
    { name: 'Dragon', role: 'Breathes fire', count: 2 },
    { name: 'Rook', role: 'Standard', count: 2 }, // standard — should be skipped
  ]);
  const afterRoster = await getProject(projectId, userId);
  if (!afterRoster) { console.error('Project lost!'); process.exit(1); }
  const created = afterRoster.customPieces?.filter(p => p.name === 'Phoenix' || p.name === 'Dragon') || [];
  console.log(`  custom pieces created: ${created.length} (expect 2)`);
  console.log(`  names: ${created.map(p => p.name).join(', ')}`);
  if (created.length !== 2) {
    console.error('FAIL: Wrong number of pieces created');
    process.exit(1);
  }
  // Rook should NOT have been created
  const rookCreated = afterRoster.customPieces?.some(p => p.name === 'Rook');
  if (rookCreated) {
    console.error('FAIL: Standard piece Rook should not be created');
    process.exit(1);
  }
  console.log('  PASS');

  // ── Test 4: Piece-design step ──
  console.log('\n=== Test 4: Piece-design ===');
  await applyStepResult(job, 'piece-design', {
    pieces: [
      {
        name: 'Phoenix',
        whitePixels: [{ x: 0, y: 0, color: '#ff0000' }],
        blackPixels: [{ x: 1, y: 1, color: '#00ff00' }],
      },
    ],
  });
  const afterDesign = await getProject(projectId, userId);
  if (!afterDesign) { console.error('Project lost!'); process.exit(1); }
  const phoenix = afterDesign.customPieces?.find(p => p.name === 'Phoenix');
  if (!phoenix) { console.error('FAIL: Phoenix piece not found'); process.exit(1); }
  const hasRed = phoenix.pixelsWhite?.[0]?.[0] === '#ff0000';
  const hasGreen = phoenix.pixelsBlack?.[1]?.[1] === '#00ff00';
  console.log(`  white pixel (0,0): ${phoenix.pixelsWhite?.[0]?.[0]} (expect #ff0000)`);
  console.log(`  black pixel (1,1): ${phoenix.pixelsBlack?.[1]?.[1]} (expect #00ff00)`);
  if (!hasRed || !hasGreen) {
    console.error('FAIL: Pixels not set correctly');
    process.exit(1);
  }
  console.log('  PASS');

  // ── Test 4b: Piece-design with raw array format ──
  console.log('\n=== Test 4b: Piece-design (raw array) ===');
  await applyStepResult(job, 'piece-design', [
    { name: 'Dragon', whitePixels: [{ x: 0, y: 0, color: '#ff8800' }] },
  ]);
  const afterDesign2 = await getProject(projectId, userId);
  const dragonPixels = afterDesign2?.customPieces?.find(p => p.name === 'Dragon')?.pixelsWhite?.[0]?.[0];
  console.log(`  Dragon pixel (0,0): ${dragonPixels} (expect #ff8800)`);
  if (dragonPixels !== '#ff8800') { console.error('FAIL'); process.exit(1); }
  console.log('  PASS');

  // ── Test 5: Movement step ──
  console.log('\n=== Test 5: Movement ===');
  await applyStepResult(job, 'movement', {
    pieces: [
      {
        name: 'Phoenix',
        moves: [
          {
            conditions: [
              { variable: 'absDiffX', operator: '<=', value: 1 },
              { variable: 'absDiffY', operator: '<=', value: 1 },
            ],
            result: 'allow',
            type: 'jump',
          },
        ],
      },
    ],
  });
  const afterMovement = await getProject(projectId, userId);
  const phoenixMoves = afterMovement?.customPieces?.find(p => p.name === 'Phoenix')?.moves;
  console.log(`  moves count: ${phoenixMoves?.length} (expect 1)`);
  if (phoenixMoves?.length !== 1) { console.error('FAIL'); process.exit(1); }
  const cond = phoenixMoves[0].conditions?.[0];
  console.log(`  condition operator: ${cond?.operator} (expect <=)`);
  if (cond?.operator !== '<=') { console.error('FAIL: wrong operator'); process.exit(1); }
  console.log('  PASS');

  // ── Test 5b: Movement with raw array format ──
  console.log('\n=== Test 5b: Movement (raw array) ===');
  await applyStepResult(job, 'movement', [
    { name: 'Dragon', moves: [{ conditions: [{ variable: 'absDiffX', operator: '==', value: 2 }, { variable: 'absDiffY', operator: '==', value: 1, logic: 'AND' }], result: 'allow', type: 'jump' }] },
  ]);
  const afterMovement2 = await getProject(projectId, userId);
  const dragonMoves = afterMovement2?.customPieces?.find(p => p.name === 'Dragon')?.moves;
  console.log(`  Dragon moves: ${dragonMoves?.length} (expect 1)`);
  if (dragonMoves?.length !== 1) { console.error('FAIL'); process.exit(1); }
  console.log(`  operator normalized: ${dragonMoves[0].conditions[0].operator} (expect ===)`);
  if (dragonMoves[0].conditions[0].operator !== '===') { console.error('FAIL'); process.exit(1); }
  console.log('  PASS');

  // ── Test 6: Square-patterns (should not crash) ──
  console.log('\n=== Test 6: Square-patterns (no-op) ===');
  await applyStepResult(job, 'square-patterns', {
    patterns: [{ name: 'Fire', trigger: 'on-step', effect: 'kill', squares: ['0,0'] }],
  });
  console.log('  PASS (no crash)');

  // ── Cleanup: restore original board ──
  console.log('\n=== Cleanup: restoring original project ===');
  await saveProjectBoard(projectId, userId, {
    rows: orig.rows, cols: orig.cols,
    gridType: orig.gridType as 'square' | 'hex',
    activeSquares: orig.activeSquares,
    placedPieces: orig.placedPieces,
  });
  // Remove test custom pieces
  const cleaned = (orig.customPieces || []).filter(
    p => p.name !== 'Phoenix' && p.name !== 'Dragon'
  );
  await saveProject({ ...orig, customPieces: cleaned });
  console.log('  Restored');

  console.log('\n=== ALL TESTS PASSED ===');
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
