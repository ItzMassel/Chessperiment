/**
 * Marketplace Cleanup Script
 *
 * Scans all documents in the `marketplace_items` table and:
 *   1. Deletes items missing required fields (title, type, creator_handle)
 *   2. Repairs items with fixable issues (missing numeric defaults)
 *   3. Prints a summary of everything it found and did
 *
 * Usage:
 *   npx tsx scripts/cleanup-marketplace.ts              # dry-run (default)
 *   npx tsx scripts/cleanup-marketplace.ts --apply      # actually write changes
 */

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { marketplaceItems, marketplaceReviews } from '../src/db/schema';
import { eq, isNull, or, sql } from 'drizzle-orm';

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

interface CleanupResult {
  id: string;
  action: "deleted" | "repaired" | "ok";
  issues: string[];
}

async function main() {
  const dryRun = !process.argv.includes("--apply");
  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    console.error("SUPABASE_DB_URL is not set. Check your .env.local file.");
    process.exit(1);
  }

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

  const client = postgres(connectionString, { prepare: false });
  const db = drizzle(client);

  const items = await db.select().from(marketplaceItems);
  console.log(`Found ${items.length} marketplace item(s).\n`);

  if (items.length === 0) {
    console.log("Nothing to clean up.");
    return;
  }

  const results: CleanupResult[] = [];

  for (const item of items) {
    const result: CleanupResult = { id: item.id, action: "ok", issues: [] };
    const data = item;

    const missingRequired: string[] = [];
    for (const field of REQUIRED_FIELDS) {
      const val = (data as any)[field];
      if (!val || (typeof val === "string" && !val.trim())) {
        missingRequired.push(field);
      }
    }

    if (data.type && !VALID_TYPES.includes(data.type)) {
      missingRequired.push(`type (invalid value: "${data.type}")`);
    }

    if (missingRequired.length > 0) {
      result.action = "deleted";
      result.issues.push(`Missing/invalid required fields: ${missingRequired.join(", ")}`);

      if (!dryRun) {
        await db.delete(marketplaceReviews).where(eq(marketplaceReviews.marketplaceItemId, item.id));
        await db.delete(marketplaceItems).where(eq(marketplaceItems.id, item.id));
      }

      results.push(result);
      continue;
    }

    // Check & repair numeric fields
    const repairs: Record<string, any> = {};
    const fieldMap: Record<string, string> = {
      rating: 'rating',
      reviewCount: 'review_count',
      stars_total: 'stars_total',
      stars_count: 'stars_count',
      views: 'views',
      forkCount: 'fork_count',
    };

    for (const [field, defaultValue] of Object.entries(NUMERIC_DEFAULTS)) {
      const colName = fieldMap[field];
      const val = (data as any)[colName];
      if (val === undefined || val === null || typeof val !== "number" || isNaN(val)) {
        repairs[colName] = defaultValue;
        result.issues.push(`${field}: ${JSON.stringify(val)} -> ${defaultValue}`);
      }
    }

    const starsTotal = repairs.stars_total ?? (data as any).stars_total ?? 0;
    const starsCount = repairs.stars_count ?? (data as any).stars_count ?? 0;
    if (starsCount > 0) {
      const expectedRating = parseFloat((starsTotal / starsCount).toFixed(1));
      const currentRating = repairs.rating ?? (data as any).rating ?? 0;
      if (Math.abs(currentRating - expectedRating) > 0.01) {
        repairs.rating = expectedRating;
        result.issues.push(`rating recalculated: ${currentRating} -> ${expectedRating}`);
      }
    }

    const actualReviewCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(marketplaceReviews)
      .where(eq(marketplaceReviews.marketplaceItemId, item.id))
      .then(r => Number(r[0]?.count || 0));

    const storedReviewCount = repairs.review_count ?? (data as any).review_count ?? 0;
    if (storedReviewCount !== actualReviewCount) {
      repairs.review_count = actualReviewCount;
      result.issues.push(`reviewCount mismatch: stored=${storedReviewCount}, actual=${actualReviewCount}`);
    }

    if (Object.keys(repairs).length > 0) {
      result.action = "repaired";
      if (!dryRun) {
        await db.update(marketplaceItems)
          .set(repairs as any)
          .where(eq(marketplaceItems.id, item.id));
      }
    }

    results.push(result);
  }

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
