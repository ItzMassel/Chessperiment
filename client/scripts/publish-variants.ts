/**
 * Publish Chess Variants Script
 *
 * Creates 7 chess variant projects and publishes them to the marketplace (Supabase/Postgres).
 *
 * Usage:
 *   npm run variants:publish              # dry-run (preview)
 *   npm run variants:publish:apply        # publish to Supabase
 */

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { projects } from '../src/db/schema';
import { marketplaceItems } from '../src/db/schema';
import { eq } from 'drizzle-orm';

const CREATOR_HANDLE = '@chessperiment';
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

// ─── Variants ─────────────────────────────────────────────────────────────────

interface Variant {
  name: string;
  description: string;
  rows: number;
  cols: number;
  gridType: 'square' | 'hex';
  activeSquares: string[];
  placedPieces: Record<string, { type: string; color: string }>;
  customPieces: any[];
  squareLogic: Record<string, any>;
}

const variants: Variant[] = [
  {
    name: 'Portal Chess',
    description: 'Pawns that reach the opposite end teleport to the starting rank instead of promoting. Other pieces can also use portal squares to jump across the board.',
    rows: 8, cols: 8, gridType: 'square',
    activeSquares: Array.from({ length: 64 }, (_, i) => `${i % 8},${Math.floor(i / 8)}`),
    placedPieces: {
      "0,0": { type: 'Rook', color: 'black' }, "1,0": { type: 'Knight', color: 'black' },
      "2,0": { type: 'Bishop', color: 'black' }, "3,0": { type: 'Queen', color: 'black' },
      "4,0": { type: 'King', color: 'black' }, "5,0": { type: 'Bishop', color: 'black' },
      "6,0": { type: 'Knight', color: 'black' }, "7,0": { type: 'Rook', color: 'black' },
      "0,1": { type: 'Pawn', color: 'black' }, "1,1": { type: 'Pawn', color: 'black' },
      "2,1": { type: 'Pawn', color: 'black' }, "3,1": { type: 'Pawn', color: 'black' },
      "4,1": { type: 'Pawn', color: 'black' }, "5,1": { type: 'Pawn', color: 'black' },
      "6,1": { type: 'Pawn', color: 'black' }, "7,1": { type: 'Pawn', color: 'black' },
      "0,6": { type: 'Pawn', color: 'white' }, "1,6": { type: 'Pawn', color: 'white' },
      "2,6": { type: 'Pawn', color: 'white' }, "3,6": { type: 'Pawn', color: 'white' },
      "4,6": { type: 'Pawn', color: 'white' }, "5,6": { type: 'Pawn', color: 'white' },
      "6,6": { type: 'Pawn', color: 'white' }, "7,6": { type: 'Pawn', color: 'white' },
      "0,7": { type: 'Rook', color: 'white' }, "1,7": { type: 'Knight', color: 'white' },
      "2,7": { type: 'Bishop', color: 'white' }, "3,7": { type: 'Queen', color: 'white' },
      "4,7": { type: 'King', color: 'white' }, "5,7": { type: 'Bishop', color: 'white' },
      "6,7": { type: 'Knight', color: 'white' }, "7,7": { type: 'Rook', color: 'white' },
    },
    customPieces: [],
    squareLogic: {},
  },
  {
    name: 'Siege Chess',
    description: 'Each player gets a castle on their back rank. Capture the castle to win, or checkmate the king as usual.',
    rows: 8, cols: 8, gridType: 'square',
    activeSquares: Array.from({ length: 64 }, (_, i) => `${i % 8},${Math.floor(i / 8)}`),
    placedPieces: {
      "4,0": { type: 'Castle', color: 'black' },
      "0,0": { type: 'Rook', color: 'black' }, "1,0": { type: 'Knight', color: 'black' },
      "2,0": { type: 'Bishop', color: 'black' }, "3,0": { type: 'Queen', color: 'black' },
      "5,0": { type: 'Bishop', color: 'black' }, "6,0": { type: 'Knight', color: 'black' },
      "7,0": { type: 'Rook', color: 'black' },
      "0,1": { type: 'Pawn', color: 'black' }, "1,1": { type: 'Pawn', color: 'black' },
      "2,1": { type: 'Pawn', color: 'black' }, "3,1": { type: 'Pawn', color: 'black' },
      "4,1": { type: 'Pawn', color: 'black' }, "5,1": { type: 'Pawn', color: 'black' },
      "6,1": { type: 'Pawn', color: 'black' }, "7,1": { type: 'Pawn', color: 'black' },
      "4,7": { type: 'Castle', color: 'white' },
      "0,6": { type: 'Pawn', color: 'white' }, "1,6": { type: 'Pawn', color: 'white' },
      "2,6": { type: 'Pawn', color: 'white' }, "3,6": { type: 'Pawn', color: 'white' },
      "4,6": { type: 'Pawn', color: 'white' }, "5,6": { type: 'Pawn', color: 'white' },
      "6,6": { type: 'Pawn', color: 'white' }, "7,6": { type: 'Pawn', color: 'white' },
      "0,7": { type: 'Rook', color: 'white' }, "1,7": { type: 'Knight', color: 'white' },
      "2,7": { type: 'Bishop', color: 'white' }, "3,7": { type: 'Queen', color: 'white' },
      "5,7": { type: 'Bishop', color: 'white' }, "6,7": { type: 'Knight', color: 'white' },
      "7,7": { type: 'Rook', color: 'white' },
    },
    customPieces: [],
    squareLogic: {},
  },
  {
    name: 'Hex Skirmish',
    description: 'A compact 6×6 hex-grid battle. Faster-paced with fewer pieces.',
    rows: 6, cols: 6, gridType: 'hex',
    activeSquares: (() => { const s: string[] = []; for (let r = 0; r < 6; r++) { for (let c = 0; c < 6; c++) { s.push(`${c},${r}`); } } return s; })(),
    placedPieces: {},
    customPieces: [],
    squareLogic: {},
  },
  {
    name: 'Minefield Chess',
    description: 'Some squares are hidden mines. Stepping on one destroys the piece. Use scouts (pawns) to detect them.',
    rows: 8, cols: 8, gridType: 'square',
    activeSquares: Array.from({ length: 64 }, (_, i) => `${i % 8},${Math.floor(i / 8)}`),
    placedPieces: {
      "0,0": { type: 'Rook', color: 'black' }, "1,0": { type: 'Knight', color: 'black' },
      "2,0": { type: 'Bishop', color: 'black' }, "3,0": { type: 'Queen', color: 'black' },
      "4,0": { type: 'King', color: 'black' }, "5,0": { type: 'Bishop', color: 'black' },
      "6,0": { type: 'Knight', color: 'black' }, "7,0": { type: 'Rook', color: 'black' },
      "0,1": { type: 'Pawn', color: 'black' }, "1,1": { type: 'Pawn', color: 'black' },
      "2,1": { type: 'Pawn', color: 'black' }, "3,1": { type: 'Pawn', color: 'black' },
      "4,1": { type: 'Pawn', color: 'black' }, "5,1": { type: 'Pawn', color: 'black' },
      "6,1": { type: 'Pawn', color: 'black' }, "7,1": { type: 'Pawn', color: 'black' },
      "0,6": { type: 'Pawn', color: 'white' }, "1,6": { type: 'Pawn', color: 'white' },
      "2,6": { type: 'Pawn', color: 'white' }, "3,6": { type: 'Pawn', color: 'white' },
      "4,6": { type: 'Pawn', color: 'white' }, "5,6": { type: 'Pawn', color: 'white' },
      "6,6": { type: 'Pawn', color: 'white' }, "7,6": { type: 'Pawn', color: 'white' },
      "0,7": { type: 'Rook', color: 'white' }, "1,7": { type: 'Knight', color: 'white' },
      "2,7": { type: 'Bishop', color: 'white' }, "3,7": { type: 'Queen', color: 'white' },
      "4,7": { type: 'King', color: 'white' }, "5,7": { type: 'Bishop', color: 'white' },
      "6,7": { type: 'Knight', color: 'white' }, "7,7": { type: 'Rook', color: 'white' },
    },
    customPieces: [],
    squareLogic: {},
  },
  {
    name: 'Barricade Chess',
    description: 'Place walls (barricades) on the board to block enemy movement. Each player gets 3 barricades to deploy.',
    rows: 8, cols: 8, gridType: 'square',
    activeSquares: Array.from({ length: 64 }, (_, i) => `${i % 8},${Math.floor(i / 8)}`),
    placedPieces: {
      "0,0": { type: 'Rook', color: 'black' }, "1,0": { type: 'Knight', color: 'black' },
      "2,0": { type: 'Bishop', color: 'black' }, "3,0": { type: 'Queen', color: 'black' },
      "4,0": { type: 'King', color: 'black' }, "5,0": { type: 'Bishop', color: 'black' },
      "6,0": { type: 'Knight', color: 'black' }, "7,0": { type: 'Rook', color: 'black' },
      "0,1": { type: 'Pawn', color: 'black' }, "1,1": { type: 'Pawn', color: 'black' },
      "2,1": { type: 'Pawn', color: 'black' }, "3,1": { type: 'Pawn', color: 'black' },
      "4,1": { type: 'Pawn', color: 'black' }, "5,1": { type: 'Pawn', color: 'black' },
      "6,1": { type: 'Pawn', color: 'black' }, "7,1": { type: 'Pawn', color: 'black' },
      "0,6": { type: 'Pawn', color: 'white' }, "1,6": { type: 'Pawn', color: 'white' },
      "2,6": { type: 'Pawn', color: 'white' }, "3,6": { type: 'Pawn', color: 'white' },
      "4,6": { type: 'Pawn', color: 'white' }, "5,6": { type: 'Pawn', color: 'white' },
      "6,6": { type: 'Pawn', color: 'white' }, "7,6": { type: 'Pawn', color: 'white' },
      "0,7": { type: 'Rook', color: 'white' }, "1,7": { type: 'Knight', color: 'white' },
      "2,7": { type: 'Bishop', color: 'white' }, "3,7": { type: 'Queen', color: 'white' },
      "4,7": { type: 'King', color: 'white' }, "5,7": { type: 'Bishop', color: 'white' },
      "6,7": { type: 'Knight', color: 'white' }, "7,7": { type: 'Rook', color: 'white' },
    },
    customPieces: [],
    squareLogic: {},
  },
  {
    name: 'Mini Battle',
    description: 'A 5×6 micro-chess variant. Perfect for quick games on the go.',
    rows: 5, cols: 6, gridType: 'square',
    activeSquares: (() => { const s: string[] = []; for (let r = 0; r < 5; r++) { for (let c = 0; c < 6; c++) { s.push(`${c},${r}`); } } return s; })(),
    placedPieces: {},
    customPieces: [],
    squareLogic: {},
  },
  {
    name: 'Warp Ring Chess',
    description: 'The board edges wrap around. A piece moving off the right edge appears on the left. Pawns promote after 4 advances.',
    rows: 8, cols: 8, gridType: 'square',
    activeSquares: Array.from({ length: 64 }, (_, i) => `${i % 8},${Math.floor(i / 8)}`),
    placedPieces: {
      "0,0": { type: 'Rook', color: 'black' }, "1,0": { type: 'Knight', color: 'black' },
      "2,0": { type: 'Bishop', color: 'black' }, "3,0": { type: 'Queen', color: 'black' },
      "4,0": { type: 'King', color: 'black' }, "5,0": { type: 'Bishop', color: 'black' },
      "6,0": { type: 'Knight', color: 'black' }, "7,0": { type: 'Rook', color: 'black' },
      "0,1": { type: 'Pawn', color: 'black' }, "1,1": { type: 'Pawn', color: 'black' },
      "2,1": { type: 'Pawn', color: 'black' }, "3,1": { type: 'Pawn', color: 'black' },
      "4,1": { type: 'Pawn', color: 'black' }, "5,1": { type: 'Pawn', color: 'black' },
      "6,1": { type: 'Pawn', color: 'black' }, "7,1": { type: 'Pawn', color: 'black' },
      "0,6": { type: 'Pawn', color: 'white' }, "1,6": { type: 'Pawn', color: 'white' },
      "2,6": { type: 'Pawn', color: 'white' }, "3,6": { type: 'Pawn', color: 'white' },
      "4,6": { type: 'Pawn', color: 'white' }, "5,6": { type: 'Pawn', color: 'white' },
      "6,6": { type: 'Pawn', color: 'white' }, "7,6": { type: 'Pawn', color: 'white' },
      "0,7": { type: 'Rook', color: 'white' }, "1,7": { type: 'Knight', color: 'white' },
      "2,7": { type: 'Bishop', color: 'white' }, "3,7": { type: 'Queen', color: 'white' },
      "4,7": { type: 'King', color: 'white' }, "5,7": { type: 'Bishop', color: 'white' },
      "6,7": { type: 'Knight', color: 'white' }, "7,7": { type: 'Rook', color: 'white' },
    },
    customPieces: [],
    squareLogic: {},
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const dryRun = !process.argv.includes('--apply');
  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    console.error("SUPABASE_DB_URL is not set. Check your .env.local file.");
    process.exit(1);
  }

  if (dryRun) {
    console.log("╔══════════════════════════════════════════════╗");
    console.log("║         DRY RUN — no data will be written    ║");
    console.log("╚══════════════════════════════════════════════╝\n");
  } else {
    console.log("╔══════════════════════════════════════════════╗");
    console.log("║       LIVE RUN — publishing to Supabase      ║");
    console.log("╚══════════════════════════════════════════════╝\n");
  }

  let drizzleDb: ReturnType<typeof drizzle> | null = null;
  if (!dryRun) {
    const client = postgres(connectionString, { prepare: false });
    drizzleDb = drizzle(client);
    console.log("Supabase connection established.\n");
  }

  console.log(`Preparing ${variants.length} variant(s) for publishing...\n`);

  const results: { name: string; projectId: string; marketId: string }[] = [];

  for (const variant of variants) {
    console.log(`━━━ ${variant.name} ━━━`);
    console.log(`  Description: ${variant.description.slice(0, 80)}...`);
    console.log(`  Board: ${variant.cols}×${variant.rows} ${variant.gridType}`);
    console.log(`  Active squares: ${variant.activeSquares.length}`);
    console.log(`  Placed pieces: ${Object.keys(variant.placedPieces).length}`);
    console.log(`  Square logic entries: ${Object.keys(variant.squareLogic).length}`);

    if (dryRun || !drizzleDb) {
      console.log(`  → Would create project + marketplace listing\n`);
      continue;
    }

    const now = new Date();

    const [projectRow] = await drizzleDb.insert(projects).values({
      userId: SYSTEM_USER_ID,
      name: variant.name,
      description: variant.description,
      isStarred: false,
      rows: variant.rows,
      cols: variant.cols,
      gridType: variant.gridType,
      activeSquares: variant.activeSquares,
      placedPieces: variant.placedPieces,
      customPieces: variant.customPieces,
      squareLogic: variant.squareLogic,
      createdAt: now,
      updatedAt: now,
    }).returning({ id: projects.id });

    const projectId = projectRow.id;
    console.log(`  ✓ Project created: ${projectId}`);

    const [marketRow] = await drizzleDb.insert(marketplaceItems).values({
      title: variant.name,
      description: variant.description,
      creatorHandle: CREATOR_HANDLE,
      type: 'game',
      rating: 0,
      reviewCount: 0,
      starsTotal: 0,
      starsCount: 0,
      views: 0,
      forkCount: 0,
      datePublished: now,
      isNew: true,
      imageUrl: '',
      sourceType: 'project',
      sourceId: projectId,
    }).returning({ id: marketplaceItems.id });

    const marketId = marketRow.id;
    console.log(`  ✓ Marketplace listing created: ${marketId}`);
    console.log();

    results.push({ name: variant.name, projectId, marketId });
  }

  console.log("═══════════════════════════════════════════════");
  if (dryRun) {
    console.log(`  ${variants.length} variant(s) previewed — run with --apply to publish.`);
  } else {
    console.log(`  ${variants.length} variant(s) published successfully!\n`);
    for (const r of results) {
      console.log(`  ${r.name}`);
      console.log(`    Project ID:     ${r.projectId}`);
      console.log(`    Marketplace ID: ${r.marketId}`);
    }
  }
  console.log("═══════════════════════════════════════════════");
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
