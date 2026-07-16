/**
 * Publish Chess Variants Script
 *
 * Creates 7 chess variant projects and publishes them to the Firestore marketplace.
 *
 * Each variant gets:
 *   1. A document in `projects` (the source project with full board config)
 *   2. A document in `marketplace` (the public listing referencing the project)
 *
 * Usage:
 *   npm run variants:publish              # dry-run (preview)
 *   npm run variants:publish:apply        # publish to Firestore
 */

import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

// ─── Firebase init ───────────────────────────────────────────────────────────

function initFirebase() {
  if (getApps().length > 0) return getApp();

  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!privateKey) {
    console.error("FIREBASE_PRIVATE_KEY is not set. Check your .env.local file.");
    process.exit(1);
  }

  const formattedKey = privateKey
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\\n/g, "\n");

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: formattedKey,
    }),
  });
}

// ─── Board helpers ───────────────────────────────────────────────────────────

/** Convert algebraic notation (e.g. "a1") to the x,y format used by the board editor */
function toGrid(sq: string, boardHeight: number): string {
  const x = sq.charCodeAt(0) - 97; // 'a' -> 0
  const rank = parseInt(sq.slice(1), 10);
  const y = boardHeight - rank;
  return `${x},${y}`;
}

/** Generate all active squares for an 8×8 board in x,y format */
function standardSquares(): string[] {
  const squares: string[] = [];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      squares.push(`${x},${y}`);
    }
  }
  return squares;
}

/** Generate all active squares for any board size in x,y format */
function allSquares(cols: number, rows: number): string[] {
  const squares: string[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      squares.push(`${x},${y}`);
    }
  }
  return squares;
}

/** Standard chess starting position using x,y coordinates (8×8 board) */
function standardPieces(): Record<string, { type: string; color: string }> {
  // In x,y: y=0 is top (black's back rank), y=7 is bottom (white's back rank)
  const pieces: Record<string, { type: string; color: string }> = {};
  const backRank = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"];
  for (let x = 0; x < 8; x++) {
    pieces[`${x},0`] = { type: backRank[x], color: "black" };  // rank 8
    pieces[`${x},1`] = { type: "pawn",       color: "black" };  // rank 7
    pieces[`${x},6`] = { type: "pawn",       color: "white" };  // rank 2
    pieces[`${x},7`] = { type: backRank[x], color: "white" };  // rank 1
  }
  return pieces;
}

/** Build a squareLogic entry for a teleport portal using x,y square IDs */
function portalLogic(squareId: string, target: string, userId: string) {
  return {
    projectId: "",
    userId,
    squareId,
    logic: [
      {
        type: "trigger",
        id: "on-step",
        instanceId: "t1",
        childId: "e1",
        socketValues: {},
      },
      {
        type: "block",
        id: "teleport",
        instanceId: "e1",
        childId: null,
        socketValues: { targetSquare: target },
      },
    ],
    variables: [],
  };
}

/** Build a squareLogic entry for a mine (kills any piece that steps on it) */
function mineLogic(squareId: string, userId: string) {
  return {
    projectId: "",
    userId,
    squareId,
    logic: [
      {
        type: "trigger",
        id: "on-step",
        instanceId: "t1",
        childId: "e1",
        socketValues: {},
      },
      {
        type: "block",
        id: "kill",
        instanceId: "e1",
        childId: null,
        socketValues: {},
      },
    ],
    variables: [],
  };
}

// ─── Variant Definitions ─────────────────────────────────────────────────────

const SYSTEM_USER_ID = "system-chessperiment";
const CREATOR_HANDLE = "@chessperiment";

interface VariantDef {
  name: string;
  description: string;
  rows: number;
  cols: number;
  gridType: "square" | "hex";
  activeSquares: string[];
  placedPieces: Record<string, { type: string; color: string }>;
  customPieces: any[];
  squareLogic: Record<string, any>;
}

const variants: VariantDef[] = [
  // ── 1. Portal Chess ────────────────────────────────────────────────────────
  //
  // Standard 8×8 board with 4 portal squares that teleport pieces:
  //   c3 ↔ f6    and    d3 ↔ e6
  //
  {
    name: "Portal Chess",
    description:
      "Four portal squares warp pieces across the board! " +
      "Landing on c3 teleports you to f6 (and vice-versa), while d3 links to e6. " +
      "Use portals to launch surprise attacks deep behind enemy lines. " +
      "Standard pieces, extraordinary tactics.",
    rows: 8,
    cols: 8,
    gridType: "square",
    activeSquares: standardSquares(),
    placedPieces: standardPieces(),
    customPieces: [],
    squareLogic: (() => {
      const c3 = toGrid("c3", 8), f6 = toGrid("f6", 8);
      const d3 = toGrid("d3", 8), e6 = toGrid("e6", 8);
      return {
        [c3]: portalLogic(c3, f6, SYSTEM_USER_ID),
        [f6]: portalLogic(f6, c3, SYSTEM_USER_ID),
        [d3]: portalLogic(d3, e6, SYSTEM_USER_ID),
        [e6]: portalLogic(e6, d3, SYSTEM_USER_ID),
      };
    })(),
  },

  // ── 2. Siege Chess ─────────────────────────────────────────────────────────
  //
  // Asymmetric variant: White gets extra knights; center squares are removed
  // to create a fortress wall.
  //
  {
    name: "Siege Chess",
    description:
      "An asymmetric battle of attack vs. defense! " +
      "White has a standard army plus two extra knights on a3 and h3 — the siege force. " +
      "Black's center is fortified: d4, e4, d5, e5 are walled off (removed from the board), " +
      "creating a natural fortress. Can the siege break through, or will the fortress hold?",
    rows: 8,
    cols: 8,
    gridType: "square",
    activeSquares: (() => {
      const removed = new Set(["d4", "e4", "d5", "e5"].map(s => toGrid(s, 8)));
      return standardSquares().filter(sq => !removed.has(sq));
    })(),
    placedPieces: {
      ...standardPieces(),
      [toGrid("a3", 8)]: { type: "knight", color: "white" },
      [toGrid("h3", 8)]: { type: "knight", color: "white" },
    },
    customPieces: [],
    squareLogic: {},
  },

  // ── 3. Hex Skirmish ────────────────────────────────────────────────────────
  //
  // A 7×7 hexagonal board with lighter armies for fast, tactical games.
  //
  {
    name: "Hex Skirmish",
    description:
      "Chess goes hexagonal! A compact 7×7 hex board that forces close-range combat. " +
      "With no long diagonals and hex-based movement, every piece feels different. " +
      "Knights become devastating, bishops gain new angles, and the king is always in danger. " +
      "A fast, tactical variant for quick games.",
    rows: 7,
    cols: 7,
    gridType: "hex",
    activeSquares: allSquares(7, 7),
    placedPieces: (() => {
      const g = (sq: string) => toGrid(sq, 7);
      const p: Record<string, { type: string; color: string }> = {};
      // White back rank (rank 1) and pawns (rank 2)
      p[g("a1")] = { type: "rook",   color: "white" };
      p[g("b1")] = { type: "knight", color: "white" };
      p[g("c1")] = { type: "bishop", color: "white" };
      p[g("d1")] = { type: "king",   color: "white" };
      p[g("e1")] = { type: "bishop", color: "white" };
      p[g("f1")] = { type: "knight", color: "white" };
      p[g("g1")] = { type: "rook",   color: "white" };
      p[g("b2")] = { type: "pawn",   color: "white" };
      p[g("c2")] = { type: "pawn",   color: "white" };
      p[g("d2")] = { type: "queen",  color: "white" };
      p[g("e2")] = { type: "pawn",   color: "white" };
      p[g("f2")] = { type: "pawn",   color: "white" };
      // Black back rank (rank 7) and pawns (rank 6)
      p[g("a7")] = { type: "rook",   color: "black" };
      p[g("b7")] = { type: "knight", color: "black" };
      p[g("c7")] = { type: "bishop", color: "black" };
      p[g("d7")] = { type: "king",   color: "black" };
      p[g("e7")] = { type: "bishop", color: "black" };
      p[g("f7")] = { type: "knight", color: "black" };
      p[g("g7")] = { type: "rook",   color: "black" };
      p[g("b6")] = { type: "pawn",   color: "black" };
      p[g("c6")] = { type: "pawn",   color: "black" };
      p[g("d6")] = { type: "queen",  color: "black" };
      p[g("e6")] = { type: "pawn",   color: "black" };
      p[g("f6")] = { type: "pawn",   color: "black" };
      return p;
    })(),
    customPieces: [],
    squareLogic: {},
  },

  // ── 4. Minefield Chess ─────────────────────────────────────────────────────
  //
  // Standard 8×8 board with 6 mine squares in the center zone.
  // Any piece that steps on a mine is immediately destroyed.
  //
  {
    name: "Minefield Chess",
    description:
      "The board is riddled with hidden mines — step on one and your piece is instantly destroyed! " +
      "Six danger zones lurk in the center of the board, turning every pawn push and piece " +
      "development into a nerve-wracking gamble. Can you navigate the minefield to victory, " +
      "or will a single misstep cost you the game?",
    rows: 8,
    cols: 8,
    gridType: "square",
    activeSquares: standardSquares(),
    placedPieces: standardPieces(),
    customPieces: [],
    squareLogic: Object.fromEntries(
      ["c4", "d4", "f4", "b5", "e5", "g5"].map((alg) => {
        const sq = toGrid(alg, 8);
        return [sq, mineLogic(sq, SYSTEM_USER_ID)];
      })
    ),
  },

  // ── 5. Barricade Chess ─────────────────────────────────────────────────────
  //
  // 8 squares removed in a cross pattern, forcing armies through narrow corridors.
  //
  {
    name: "Barricade Chess",
    description:
      "A great stone barricade splits the board! Eight squares have been walled off in a " +
      "cross formation, forcing both armies to fight through narrow corridors. " +
      "Your bishops are restricted, knights become kings of the passages, and every " +
      "breakthrough feels earned. Classic chess tactics reborn in a maze.",
    rows: 8,
    cols: 8,
    gridType: "square",
    activeSquares: (() => {
      const removed = new Set(
        ["d4", "e4", "d5", "e5", "c3", "f3", "c6", "f6"].map(s => toGrid(s, 8))
      );
      return standardSquares().filter(sq => !removed.has(sq));
    })(),
    placedPieces: standardPieces(),
    customPieces: [],
    squareLogic: {},
  },

  // ── 6. Mini Battle ─────────────────────────────────────────────────────────
  //
  // 6×6 board with reduced armies — no bishops, just R-N-Q-K-N-R per side.
  // Fast, tactical games with no slow diagonal play.
  //
  {
    name: "Mini Battle",
    description:
      "Stripped down to the essentials, Mini Battle puts six pieces per side on a tight 6×6 board. " +
      "No bishops, no slow diagonal creep — just knights leaping, rooks charging, and queens " +
      "hunting in close quarters. Games are fast, decisive, and full of tactical fireworks. " +
      "Perfect when you want a full chess battle in half the space.",
    rows: 6,
    cols: 6,
    gridType: "square",
    activeSquares: allSquares(6, 6),
    placedPieces: (() => {
      const g = (sq: string) => toGrid(sq, 6);
      return {
        // White back rank (rank 1): R-N-Q-K-N-R
        [g("a1")]: { type: "rook",   color: "white" },
        [g("b1")]: { type: "knight", color: "white" },
        [g("c1")]: { type: "queen",  color: "white" },
        [g("d1")]: { type: "king",   color: "white" },
        [g("e1")]: { type: "knight", color: "white" },
        [g("f1")]: { type: "rook",   color: "white" },
        // White pawns (rank 2)
        [g("a2")]: { type: "pawn", color: "white" },
        [g("b2")]: { type: "pawn", color: "white" },
        [g("c2")]: { type: "pawn", color: "white" },
        [g("d2")]: { type: "pawn", color: "white" },
        [g("e2")]: { type: "pawn", color: "white" },
        [g("f2")]: { type: "pawn", color: "white" },
        // Black back rank (rank 6): R-N-Q-K-N-R
        [g("a6")]: { type: "rook",   color: "black" },
        [g("b6")]: { type: "knight", color: "black" },
        [g("c6")]: { type: "queen",  color: "black" },
        [g("d6")]: { type: "king",   color: "black" },
        [g("e6")]: { type: "knight", color: "black" },
        [g("f6")]: { type: "rook",   color: "black" },
        // Black pawns (rank 5)
        [g("a5")]: { type: "pawn", color: "black" },
        [g("b5")]: { type: "pawn", color: "black" },
        [g("c5")]: { type: "pawn", color: "black" },
        [g("d5")]: { type: "pawn", color: "black" },
        [g("e5")]: { type: "pawn", color: "black" },
        [g("f5")]: { type: "pawn", color: "black" },
      };
    })(),
    customPieces: [],
    squareLogic: {},
  },

  // ── 7. Warp Ring Chess ─────────────────────────────────────────────────────
  //
  // Standard 8×8 board with 4 bidirectional portal pairs forming a ring.
  //   a4 ↔ h5    (cross-link flanks)
  //   h4 ↔ a5    (cross-link flanks)
  //   d2 ↔ d7    (vertical shortcut)
  //   e2 ↔ e7    (vertical shortcut)
  //
  {
    name: "Warp Ring Chess",
    description:
      "Four pairs of warp gates ring the board — step through one side and emerge somewhere " +
      "completely different! Lateral portals connect flanks across the board, while vertical " +
      "gates create surprise shortcuts through the center. No square is safe, no position is " +
      "stable. Warp Ring Chess rewards creative chaos.",
    rows: 8,
    cols: 8,
    gridType: "square",
    activeSquares: standardSquares(),
    placedPieces: standardPieces(),
    customPieces: [],
    squareLogic: (() => {
      const pairs: Array<[string, string]> = [
        ["a4", "h5"],
        ["h4", "a5"],
        ["d2", "d7"],
        ["e2", "e7"],
      ];
      const logic: Record<string, any> = {};
      for (const [alg1, alg2] of pairs) {
        const sq1 = toGrid(alg1, 8), sq2 = toGrid(alg2, 8);
        logic[sq1] = portalLogic(sq1, sq2, SYSTEM_USER_ID);
        logic[sq2] = portalLogic(sq2, sq1, SYSTEM_USER_ID);
      }
      return logic;
    })(),
  },
];

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const dryRun = !process.argv.includes("--apply");

  if (dryRun) {
    console.log("╔══════════════════════════════════════════════╗");
    console.log("║       DRY RUN — no changes will be made      ║");
    console.log("║    Run with --apply to publish to Firestore   ║");
    console.log("╚══════════════════════════════════════════════╝\n");
  } else {
    console.log("╔══════════════════════════════════════════════╗");
    console.log("║       LIVE RUN — publishing to Firestore      ║");
    console.log("╚══════════════════════════════════════════════╝\n");
  }

  // Only init Firebase when actually writing
  let db: FirebaseFirestore.Firestore | null = null;
  let now: FirebaseFirestore.Timestamp | null = null;

  if (!dryRun) {
    const app = initFirebase();
    db = getFirestore(app);
    now = Timestamp.now();
    console.log("Firebase Admin initialized.\n");
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

    if (dryRun || !db || !now) {
      console.log(`  → Would create project + marketplace listing\n`);
      continue;
    }

    // ── 1. Create the project document ─────────────────────────────────────

    // Serialize squareLogic for Firestore (logic arrays → JSON strings)
    const serializedSquareLogic: Record<string, any> = {};
    for (const [squareId, logicDef] of Object.entries(variant.squareLogic)) {
      serializedSquareLogic[squareId] = {
        ...logicDef,
        logic: JSON.stringify(logicDef.logic),
        createdAt: now,
        updatedAt: now,
      };
    }

    const projectData = {
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
      squareLogic: serializedSquareLogic,
      createdAt: now,
      updatedAt: now,
    };

    const projectRef = await db.collection("projects").add(projectData);
    console.log(`  ✓ Project created: ${projectRef.id}`);

    // Back-fill projectId into squareLogic entries
    if (Object.keys(serializedSquareLogic).length > 0) {
      const updates: Record<string, string> = {};
      for (const squareId of Object.keys(serializedSquareLogic)) {
        updates[`squareLogic.${squareId}.projectId`] = projectRef.id;
      }
      await projectRef.update(updates);
    }

    // ── 2. Create the marketplace listing ──────────────────────────────────

    const marketplaceData = {
      title: variant.name,
      description: variant.description,
      creator_handle: CREATOR_HANDLE,
      type: "game" as const,
      rating: 0,
      reviewCount: 0,
      stars_total: 0,
      stars_count: 0,
      views: 0,
      forkCount: 0,
      date_published: now,
      isNew: true,
      imageUrl: "",
      sourceType: "project",
      sourceId: projectRef.id,
      config_data: null, // Fetched from source on fork
    };

    const marketRef = await db.collection("marketplace").add(marketplaceData);
    console.log(`  ✓ Marketplace listing created: ${marketRef.id}`);
    console.log();

    results.push({ name: variant.name, projectId: projectRef.id, marketId: marketRef.id });
  }

  // ── Summary ──────────────────────────────────────────────────────────────

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
