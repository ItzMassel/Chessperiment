/**
 * Publish Chess Variants Script
 *
 * Creates 3 chess variant projects and publishes them to the Firestore marketplace.
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

/** Generate all active squares for an 8×8 board (a1–h8) */
function standardSquares(): string[] {
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const squares: string[] = [];
  for (let rank = 1; rank <= 8; rank++) {
    for (const file of files) {
      squares.push(`${file}${rank}`);
    }
  }
  return squares;
}

/** Standard chess starting position */
function standardPieces(): Record<string, { type: string; color: string }> {
  const pieces: Record<string, { type: string; color: string }> = {};
  const backRank = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"];
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  for (let i = 0; i < 8; i++) {
    pieces[`${files[i]}1`] = { type: backRank[i], color: "white" };
    pieces[`${files[i]}2`] = { type: "pawn", color: "white" };
    pieces[`${files[i]}7`] = { type: "pawn", color: "black" };
    pieces[`${files[i]}8`] = { type: backRank[i], color: "black" };
  }
  return pieces;
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
    squareLogic: {
      c3: {
        projectId: "",
        userId: SYSTEM_USER_ID,
        squareId: "c3",
        logic: [{ trigger: "on-move", effect: "teleport", target: "f6", label: "Portal: c3 → f6" }],
        variables: [],
      },
      f6: {
        projectId: "",
        userId: SYSTEM_USER_ID,
        squareId: "f6",
        logic: [{ trigger: "on-move", effect: "teleport", target: "c3", label: "Portal: f6 → c3" }],
        variables: [],
      },
      d3: {
        projectId: "",
        userId: SYSTEM_USER_ID,
        squareId: "d3",
        logic: [{ trigger: "on-move", effect: "teleport", target: "e6", label: "Portal: d3 → e6" }],
        variables: [],
      },
      e6: {
        projectId: "",
        userId: SYSTEM_USER_ID,
        squareId: "e6",
        logic: [{ trigger: "on-move", effect: "teleport", target: "d3", label: "Portal: e6 → d3" }],
        variables: [],
      },
    },
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
    activeSquares: standardSquares().filter(
      (sq) => !["d4", "e4", "d5", "e5"].includes(sq)
    ),
    placedPieces: {
      ...standardPieces(),
      a3: { type: "knight", color: "white" },
      h3: { type: "knight", color: "white" },
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
    activeSquares: (() => {
      const squares: string[] = [];
      const files = ["a", "b", "c", "d", "e", "f", "g"];
      for (let rank = 1; rank <= 7; rank++) {
        for (const file of files) squares.push(`${file}${rank}`);
      }
      return squares;
    })(),
    placedPieces: (() => {
      const p: Record<string, { type: string; color: string }> = {};
      // White (ranks 1–2)
      p["a1"] = { type: "rook", color: "white" };
      p["b1"] = { type: "knight", color: "white" };
      p["c1"] = { type: "bishop", color: "white" };
      p["d1"] = { type: "king", color: "white" };
      p["e1"] = { type: "bishop", color: "white" };
      p["f1"] = { type: "knight", color: "white" };
      p["g1"] = { type: "rook", color: "white" };
      p["b2"] = { type: "pawn", color: "white" };
      p["c2"] = { type: "pawn", color: "white" };
      p["d2"] = { type: "queen", color: "white" };
      p["e2"] = { type: "pawn", color: "white" };
      p["f2"] = { type: "pawn", color: "white" };

      // Black (ranks 6–7)
      p["a7"] = { type: "rook", color: "black" };
      p["b7"] = { type: "knight", color: "black" };
      p["c7"] = { type: "bishop", color: "black" };
      p["d7"] = { type: "king", color: "black" };
      p["e7"] = { type: "bishop", color: "black" };
      p["f7"] = { type: "knight", color: "black" };
      p["g7"] = { type: "rook", color: "black" };
      p["b6"] = { type: "pawn", color: "black" };
      p["c6"] = { type: "pawn", color: "black" };
      p["d6"] = { type: "queen", color: "black" };
      p["e6"] = { type: "pawn", color: "black" };
      p["f6"] = { type: "pawn", color: "black" };
      return p;
    })(),
    customPieces: [],
    squareLogic: {},
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
      price: "Free",
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
