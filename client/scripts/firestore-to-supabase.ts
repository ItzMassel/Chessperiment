/**
 * Firestore → Supabase Data Migration Script
 *
 * Reads all data from Firebase Firestore and writes it to Supabase (Postgres).
 *
 * Usage:
 *   npx tsx scripts/firestore-to-supabase.ts              # dry-run (preview)
 *   npx tsx scripts/firestore-to-supabase.ts --apply      # actually migrate
 *
 * Prerequisites:
 *   - FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, FIREBASE_PROJECT_ID in env
 *   - SUPABASE_DB_URL in env
 */

import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import {
  projects, marketplaceItems, marketplaceReviews, marketplaceReports,
  creatorProfiles, notifications, userStats, gameHistory,
  communityFeedback, boards, pieceSets, customPieces,
} from '../src/db/schema';

// ─── Firebase init ───────────────────────────────────────────────────────────

function initFirebaseAdmin() {
  if (getApps().length > 0) return getApp();

  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!privateKey) {
    console.error('FIREBASE_PRIVATE_KEY is not set.');
    process.exit(1);
  }

  const formattedKey = privateKey
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\\n/g, '\n');

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: formattedKey,
    }),
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDate(val: any): Date | null {
  if (!val) return null;
  if (typeof val.toDate === 'function') return val.toDate();
  if (val instanceof Date) return val;
  if (typeof val === 'string') return new Date(val);
  if (typeof val._seconds === 'number') return new Date(val._seconds * 1000);
  return null;
}

function parseJsonField(val: any): any {
  if (!val) return null;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return val; }
  }
  return val;
}

// ─── Collection Migrators ────────────────────────────────────────────────────

interface MigrationResult {
  collection: string;
  total: number;
  inserted: number;
  skipped: number;
  errors: number;
}

async function migrateProjects(firestoreDb: FirebaseFirestore.Firestore, pgDb: ReturnType<typeof drizzle>, dryRun: boolean): Promise<MigrationResult> {
  const result: MigrationResult = { collection: 'projects', total: 0, inserted: 0, skipped: 0, errors: 0 };
  const snapshot = await firestoreDb.collection('projects').get();
  result.total = snapshot.size;

  for (const doc of snapshot.docs) {
    try {
      const d = doc.data();
      if (dryRun) continue;

      // Check if already exists
      const existing = await pgDb.select({ id: projects.id }).from(projects).where(projects.id as any, doc.id).limit(1);
      if (existing.length > 0) { result.skipped++; continue; }

      await pgDb.insert(projects).values({
        id: doc.id,
        userId: d.userId || '',
        name: d.name || 'Untitled Project',
        description: d.description || '',
        isStarred: !!d.isStarred,
        forkedFrom: d.forkedFrom || null,
        rows: d.rows || 8,
        cols: d.cols || 8,
        gridType: d.gridType || 'square',
        activeSquares: d.activeSquares || [],
        placedPieces: d.placedPieces || {},
        customPieces: (d.customPieces || []).map((p: any) => ({
          ...p,
          pixelsWhite: parseJsonField(p.pixelsWhite) || p.pixelsWhite,
          pixelsBlack: parseJsonField(p.pixelsBlack) || p.pixelsBlack,
          logic: parseJsonField(p.logic) || p.logic,
        })),
        squareLogic: parseSquareLogic(d.squareLogic || {}),
        history: d.history || [],
        createdAt: toDate(d.createdAt) || new Date(),
        updatedAt: toDate(d.updatedAt) || new Date(),
      }).onConflictDoNothing();
      result.inserted++;
    } catch (e) {
      console.error(`  ✗ Error migrating project ${doc.id}:`, e);
      result.errors++;
    }
  }
  return result;
}

function parseSquareLogic(squareLogic: any): any {
  if (!squareLogic) return {};
  const result: any = {};
  for (const [key, val] of Object.entries(squareLogic)) {
    const v = val as any;
    result[key] = {
      ...v,
      logic: parseJsonField(v.logic) || v.logic,
    };
  }
  return result;
}

async function migrateMarketplace(firestoreDb: FirebaseFirestore.Firestore, pgDb: ReturnType<typeof drizzle>, dryRun: boolean): Promise<MigrationResult> {
  const result: MigrationResult = { collection: 'marketplace', total: 0, inserted: 0, skipped: 0, errors: 0 };
  const snapshot = await firestoreDb.collection('marketplace').get();
  result.total = snapshot.size;

  for (const doc of snapshot.docs) {
    try {
      const d = doc.data();
      if (dryRun) continue;

      const existing = await pgDb.select({ id: marketplaceItems.id }).from(marketplaceItems).where(marketplaceItems.id as any, doc.id).limit(1);
      if (existing.length > 0) { result.skipped++; continue; }

      const id = doc.id;
      // Handle non-UUID Firestore IDs by using the doc ID as-is
      // Drizzle with postgres.js requires UUID format; if the ID isn't a UUID,
      // we'll cast accordingly or use the text field approach
      const insertData: any = {
        title: d.title || 'Untitled',
        description: d.description || '',
        creatorHandle: d.creator_handle || '@unknown',
        type: d.type || 'game',
        rating: d.rating || 0,
        reviewCount: d.reviewCount || 0,
        starsTotal: d.stars_total || 0,
        starsCount: d.stars_count || 0,
        views: d.views || 0,
        forkCount: d.forkCount || 0,
        datePublished: toDate(d.date_published) || new Date(),
        configData: d.config_data || null,
        sourceType: d.sourceType || null,
        sourceId: d.sourceId || null,
        forkedFrom: d.forkedFrom || null,
        isNew: d.isNew ?? true,
        imageUrl: d.imageUrl || '',
        searchKeywords: d.searchKeywords || [],
        previewConfig: d.preview_config || null,
      };

      try {
        await pgDb.insert(marketplaceItems).values({ id, ...insertData }).onConflictDoNothing();
      } catch {
        // If the ID is not a valid UUID, insert without specifying ID
        await pgDb.insert(marketplaceItems).values(insertData).onConflictDoNothing();
      }
      result.inserted++;
    } catch (e) {
      console.error(`  ✗ Error migrating marketplace item ${doc.id}:`, e);
      result.errors++;
    }
  }
  return result;
}

async function migrateMarketplaceReviews(firestoreDb: FirebaseFirestore.Firestore, pgDb: ReturnType<typeof drizzle>, dryRun: boolean): Promise<MigrationResult> {
  const result: MigrationResult = { collection: 'marketplace_reviews', total: 0, inserted: 0, skipped: 0, errors: 0 };
  const snapshot = await firestoreDb.collection('marketplace').get();
  let count = 0;

  for (const itemDoc of snapshot.docs) {
    const reviewsSnap = await itemDoc.ref.collection('reviews').get();
    count += reviewsSnap.size;

    for (const doc of reviewsSnap.docs) {
      try {
        const d = doc.data();
        if (dryRun) continue;

        await pgDb.insert(marketplaceReviews).values({
          marketplaceItemId: itemDoc.id,
          userId: d.userId || '',
          creatorHandle: d.creatorHandle || null,
          displayName: d.displayName || 'Anonymous',
          rating: d.rating || 0,
          text: d.text || '',
          createdAt: toDate(d.createdAt) || new Date(),
          updatedAt: toDate(d.updatedAt) || null,
        }).onConflictDoNothing();
        result.inserted++;
      } catch (e) {
        console.error(`  ✗ Error migrating review ${doc.id}:`, e);
        result.errors++;
      }
    }
  }
  result.total = count;
  return result;
}

async function migrateCollection<T extends Record<string, any>>(
  name: string,
  firestoreDb: FirebaseFirestore.Firestore,
  collectionName: string,
  pgDb: ReturnType<typeof drizzle>,
  pgTable: any,
  transformer: (d: FirebaseFirestore.DocumentData, id: string) => T,
  dryRun: boolean,
): Promise<MigrationResult> {
  const result: MigrationResult = { collection: name, total: 0, inserted: 0, skipped: 0, errors: 0 };
  const snapshot = await firestoreDb.collection(collectionName).get();
  result.total = snapshot.size;

  for (const doc of snapshot.docs) {
    try {
      if (dryRun) continue;
      const values = transformer(doc.data(), doc.id);
      await pgDb.insert(pgTable).values(values as any).onConflictDoNothing();
      result.inserted++;
    } catch (e) {
      console.error(`  ✗ Error migrating ${name} ${doc.id}:`, e);
      result.errors++;
    }
  }
  return result;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const dryRun = !process.argv.includes('--apply');
  const supabaseUrl = process.env.SUPABASE_DB_URL;

  if (!supabaseUrl) {
    console.error('SUPABASE_DB_URL is not set.');
    process.exit(1);
  }

  console.log('Firestore → Supabase Migration');
  console.log('═══════════════════════════════════════\n');

  if (dryRun) {
    console.log('⚠️  DRY RUN — no data will be written');
    console.log('   Run with --apply to execute\n');
  }

  // Initialize connections
  console.log('Initializing Firebase Admin...');
  const app = initFirebaseAdmin();
  const firestoreDb = getFirestore(app);

  console.log('Connecting to Supabase...');
  const client = postgres(supabaseUrl, { prepare: false });
  const pgDb = drizzle(client);

  const allResults: MigrationResult[] = [];

  // ── Projects ──────────────────────────────────────────────────────────────
  console.log('\n📁 Migrating projects...');
  allResults.push(await migrateProjects(firestoreDb, pgDb, dryRun));

  // ── Marketplace Items ─────────────────────────────────────────────────────
  console.log('\n📁 Migrating marketplace items...');
  allResults.push(await migrateMarketplace(firestoreDb, pgDb, dryRun));

  // ── Marketplace Reviews (from subcollections) ─────────────────────────────
  console.log('\n📁 Migrating marketplace reviews...');
  allResults.push(await migrateMarketplaceReviews(firestoreDb, pgDb, dryRun));

  // ── Reports ───────────────────────────────────────────────────────────────
  console.log('\n📁 Migrating marketplace reports...');
  allResults.push(await migrateCollection(
    'marketplace_reports', firestoreDb, 'marketplace_reports', pgDb, marketplaceReports,
    (d, id) => ({
      marketplaceId: d.marketplaceId || id,
      itemTitle: d.itemTitle || 'Untitled',
      creatorHandle: d.creatorHandle || '',
      creatorUserId: d.creatorUserId || '',
      reporterUserId: d.reporterUserId || '',
      reporterHandle: d.reporterHandle || '',
      reporterEmail: d.reporterEmail || '',
      reason: d.reason || '',
      details: d.details || '',
      status: d.status || 'new',
      createdAt: toDate(d.createdAt) || new Date(),
    }),
    dryRun,
  ));

  // ── Creator Profiles ──────────────────────────────────────────────────────
  console.log('\n📁 Migrating creator profiles...');
  allResults.push(await migrateCollection(
    'creator_profiles', firestoreDb, 'creators', pgDb, creatorProfiles,
    (d, id) => ({
      userId: id,
      handle: d.handle || `@user_${id.slice(0, 8)}`,
      displayName: d.displayName || d.handle || 'Unknown',
      bio: d.bio || null,
      photoUrl: d.photoUrl || null,
      dateJoined: toDate(d.date_joined) || new Date(),
      rating: d.rating || 0,
      followers: d.followers || [],
      following: d.following || [],
    }),
    dryRun,
  ));

  // ── Notifications ─────────────────────────────────────────────────────────
  console.log('\n📁 Migrating notifications...');
  allResults.push(await migrateCollection(
    'notifications', firestoreDb, 'notifications', pgDb, notifications,
    (d, id) => ({
      userId: d.userId || '',
      type: d.type || 'new_publish',
      message: d.message || '',
      link: d.link || null,
      read: !!d.read,
      createdAt: toDate(d.createdAt) || new Date(),
      actorHandle: d.actorHandle || null,
      actorPhotoUrl: d.actorPhotoUrl || null,
    }),
    dryRun,
  ));

  // ── User Stats ────────────────────────────────────────────────────────────
  console.log('\n📁 Migrating user stats...');
  allResults.push(await migrateCollection(
    'user_stats', firestoreDb, 'userStats', pgDb, userStats,
    (d, id) => ({
      userId: id,
      gamesPlayed: d.gamesPlayed || 0,
      wins: d.wins || 0,
      losses: d.losses || 0,
      draws: d.draws || 0,
      rating: d.rating || 1500,
    }),
    dryRun,
  ));

  // ── Game History ──────────────────────────────────────────────────────────
  console.log('\n📁 Migrating game history...');
  allResults.push(await migrateCollection(
    'game_history', firestoreDb, 'gameHistory', pgDb, gameHistory,
    (d, id) => ({
      userId: d.userId || '',
      result: d.result || 'draw',
      opponent: d.opponent || null,
      timestamp: toDate(d.timestamp) || new Date(),
      roomId: d.roomId || null,
    }),
    dryRun,
  ));

  // ── Community Feedback ────────────────────────────────────────────────────
  console.log('\n📁 Migrating community feedback...');
  allResults.push(await migrateCollection(
    'community_feedback', firestoreDb, 'community_feedback', pgDb, communityFeedback,
    (d, id) => ({
      type: d.type || 'general',
      message: d.message || '',
      email: d.email || '',
      status: d.status || 'new',
      createdAt: toDate(d.createdAt) || new Date(),
    }),
    dryRun,
  ));

  // ── Boards (legacy) ───────────────────────────────────────────────────────
  console.log('\n📁 Migrating boards...');
  allResults.push(await migrateCollection(
    'boards', firestoreDb, 'boards', pgDb, boards,
    (d, id) => ({
      userId: d.userId || '',
      name: d.name || 'Untitled Board',
      description: d.description || '',
      isStarred: !!d.isStarred,
      projectId: d.projectId || null,
      forkedFrom: d.forkedFrom || null,
      topologyType: d.topologyType || null,
      topologyParams: d.topologyParams || null,
      rows: d.rows || 8,
      cols: d.cols || 8,
      gridType: d.gridType || 'square',
      activeSquares: d.activeSquares || [],
      placedPieces: d.placedPieces || {},
      squareStates: d.squareStates || null,
      version: d.version || null,
      createdAt: toDate(d.createdAt) || new Date(),
      updatedAt: toDate(d.updatedAt) || new Date(),
    }),
    dryRun,
  ));

  // ── Piece Sets (legacy) ───────────────────────────────────────────────────
  console.log('\n📁 Migrating piece sets...');
  allResults.push(await migrateCollection(
    'piece_sets', firestoreDb, 'pieceSets', pgDb, pieceSets,
    (d, id) => ({
      userId: d.userId || '',
      name: d.name || 'Untitled Set',
      description: d.description || '',
      isStarred: !!d.isStarred,
      projectId: d.projectId || null,
      forkedFrom: d.forkedFrom || null,
      createdAt: toDate(d.createdAt) || new Date(),
      updatedAt: toDate(d.updatedAt) || new Date(),
    }),
    dryRun,
  ));

  // ── Custom Pieces (legacy) ────────────────────────────────────────────────
  console.log('\n📁 Migrating custom pieces...');
  allResults.push(await migrateCollection(
    'custom_pieces', firestoreDb, 'customPieces', pgDb, customPieces,
    (d, id) => ({
      setId: d.setId || null,
      projectId: d.projectId || null,
      userId: d.userId || '',
      name: d.name || 'Untitled Piece',
      description: d.description || '',
      pixelsWhite: parseJsonField(d.pixelsWhite) || d.pixelsWhite || null,
      pixelsBlack: parseJsonField(d.pixelsBlack) || d.pixelsBlack || null,
      imageWhite: d.imageWhite || null,
      imageBlack: d.imageBlack || null,
      moves: d.moves || [],
      logic: parseJsonField(d.logic) || d.logic || null,
      variables: d.variables || null,
      shape: d.shape || null,
      color: d.color || null,
      pixels: parseJsonField(d.pixels) || d.pixels || null,
      createdAt: toDate(d.createdAt) || new Date(),
      updatedAt: toDate(d.updatedAt) || new Date(),
    }),
    dryRun,
  ));

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════');
  console.log('              RESULTS');
  console.log('═══════════════════════════════════════\n');

  let grandTotal = 0, grandInserted = 0, grandSkipped = 0, grandErrors = 0;
  for (const r of allResults) {
    const status = dryRun ? ' (preview)' : '';
    console.log(`  ${r.collection}:`);
    console.log(`    Total: ${r.total} | Inserted: ${r.inserted} | Skipped: ${r.skipped} | Errors: ${r.errors}${status}`);
    grandTotal += r.total;
    grandInserted += r.inserted;
    grandSkipped += r.skipped;
    grandErrors += r.errors;
  }

  console.log('\n───────────────────────────────────────');
  console.log(`  Grand Total: ${grandTotal}`);
  if (!dryRun) {
    console.log(`  Inserted:    ${grandInserted}`);
    console.log(`  Skipped:     ${grandSkipped}`);
    console.log(`  Errors:      ${grandErrors}`);
  }
  console.log('───────────────────────────────────────');

  if (dryRun) {
    console.log('\n⚠️  This was a dry run. Run with --apply to execute the migration.');
  } else {
    console.log('\n✅ Migration complete!');
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
