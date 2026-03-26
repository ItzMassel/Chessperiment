/**
 * Marketplace Cleanup Script
 *
 * Scans all documents in the `marketplace` collection and:
 *   1. Deletes items missing required fields (title, type, creator_handle)
 *   2. Repairs items with fixable issues (missing numeric defaults)
 *   3. Prints a summary of everything it found and did
 *
 * Usage:
 *   npx tsx scripts/cleanup-marketplace.ts              # dry-run (default)
 *   npx tsx scripts/cleanup-marketplace.ts --apply      # actually write changes
 */

import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Env vars are loaded via Node's --env-file flag in the npm script

const REQUIRED_FIELDS = ["title", "type", "creator_handle"] as const;
const VALID_TYPES = ["game", "board", "pieces"];

const NUMERIC_DEFAULTS: Record<string, number> = {
  rating: 0,
  reviewCount: 0,
  stars_total: 0,
  stars_count: 0,
  views: 0,
  forkCount: 0,
};

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

// ─── Types ───────────────────────────────────────────────────────────────────

interface CleanupResult {
  id: string;
  action: "deleted" | "repaired" | "ok";
  issues: string[];
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const dryRun = !process.argv.includes("--apply");

  if (dryRun) {
    console.log("╔══════════════════════════════════════════════╗");
    console.log("║           DRY RUN — no changes will be made ║");
    console.log("║      Run with --apply to execute changes     ║");
    console.log("╚══════════════════════════════════════════════╝\n");
  } else {
    console.log("╔══════════════════════════════════════════════╗");
    console.log("║         LIVE RUN — changes will be applied   ║");
    console.log("╚══════════════════════════════════════════════╝\n");
  }

  const app = initFirebase();
  const db = getFirestore(app);

  const snapshot = await db.collection("marketplace").get();
  console.log(`Found ${snapshot.size} marketplace item(s).\n`);

  if (snapshot.empty) {
    console.log("Nothing to clean up.");
    return;
  }

  const results: CleanupResult[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const result: CleanupResult = { id: doc.id, action: "ok", issues: [] };

    // ── Check required fields ──────────────────────────────────────────────
    const missingRequired: string[] = [];
    for (const field of REQUIRED_FIELDS) {
      if (!data[field] || (typeof data[field] === "string" && !data[field].trim())) {
        missingRequired.push(field);
      }
    }

    // Check for invalid type value
    if (data.type && !VALID_TYPES.includes(data.type)) {
      missingRequired.push(`type (invalid value: "${data.type}")`);
    }

    if (missingRequired.length > 0) {
      result.action = "deleted";
      result.issues.push(`Missing/invalid required fields: ${missingRequired.join(", ")}`);

      if (!dryRun) {
        // Delete reviews subcollection first
        const reviews = await doc.ref.collection("reviews").get();
        const batch = db.batch();
        for (const review of reviews.docs) {
          batch.delete(review.ref);
        }
        batch.delete(doc.ref);
        await batch.commit();
      }

      results.push(result);
      continue;
    }

    // ── Check & repair numeric fields ──────────────────────────────────────
    const repairs: Record<string, number> = {};
    for (const [field, defaultValue] of Object.entries(NUMERIC_DEFAULTS)) {
      const val = data[field];
      if (val === undefined || val === null || typeof val !== "number" || isNaN(val)) {
        repairs[field] = defaultValue;
        result.issues.push(`${field}: ${JSON.stringify(val)} -> ${defaultValue}`);
      }
    }

    // Check rating consistency: if stars_count > 0, recalculate rating
    const starsTotal = repairs.stars_total ?? data.stars_total ?? 0;
    const starsCount = repairs.stars_count ?? data.stars_count ?? 0;
    if (starsCount > 0) {
      const expectedRating = parseFloat((starsTotal / starsCount).toFixed(1));
      const currentRating = repairs.rating ?? data.rating ?? 0;
      if (Math.abs(currentRating - expectedRating) > 0.01) {
        repairs.rating = expectedRating;
        result.issues.push(`rating recalculated: ${currentRating} -> ${expectedRating}`);
      }
    }

    // Check reviewCount vs actual reviews subcollection count
    const reviewsSnap = await doc.ref.collection("reviews").get();
    const actualReviewCount = reviewsSnap.size;
    const storedReviewCount = repairs.reviewCount ?? data.reviewCount ?? 0;
    if (storedReviewCount !== actualReviewCount) {
      repairs.reviewCount = actualReviewCount;
      result.issues.push(`reviewCount mismatch: stored=${storedReviewCount}, actual=${actualReviewCount}`);
    }

    // Check price field
    if (data.price === undefined || data.price === null || data.price === "undefined") {
      repairs["price"] = 0; // Will be displayed as "Free"
      result.issues.push(`price: ${JSON.stringify(data.price)} -> "Free" (0)`);
    }

    if (Object.keys(repairs).length > 0) {
      result.action = "repaired";
      if (!dryRun) {
        await doc.ref.update(repairs);
      }
    }

    results.push(result);
  }

  // ── Summary ────────────────────────────────────────────────────────────────

  const deleted = results.filter((r) => r.action === "deleted");
  const repaired = results.filter((r) => r.action === "repaired");
  const ok = results.filter((r) => r.action === "ok");

  console.log("═══════════════════════════════════════════════");
  console.log("                    RESULTS                    ");
  console.log("═══════════════════════════════════════════════\n");

  if (deleted.length > 0) {
    console.log(`DELETED (${deleted.length}):`);
    for (const r of deleted) {
      console.log(`  [${r.id}]`);
      for (const issue of r.issues) console.log(`    - ${issue}`);
    }
    console.log();
  }

  if (repaired.length > 0) {
    console.log(`REPAIRED (${repaired.length}):`);
    for (const r of repaired) {
      console.log(`  [${r.id}]`);
      for (const issue of r.issues) console.log(`    - ${issue}`);
    }
    console.log();
  }

  console.log(`CLEAN (${ok.length})`);
  console.log();
  console.log("───────────────────────────────────────────────");
  console.log(`Total: ${results.length} | Deleted: ${deleted.length} | Repaired: ${repaired.length} | Clean: ${ok.length}`);
  console.log("───────────────────────────────────────────────");

  if (dryRun && (deleted.length > 0 || repaired.length > 0)) {
    console.log("\nThis was a dry run. Run with --apply to execute these changes.");
  }
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
