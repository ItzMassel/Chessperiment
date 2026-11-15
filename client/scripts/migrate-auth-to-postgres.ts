/**
 * Firebase Auth / Firestore (NextAuth adapter) → Postgres migration.
 *
 * Migrates:
 *  - Firestore `users` + `accounts` collections (Google OAuth identities used
 *    by the old @auth/firebase-adapter) into the new Postgres users/accounts
 *    tables, preserving the Firestore doc id as users.id so existing
 *    projects/creator_profiles/etc. rows (plain-text userId columns, no FK)
 *    keep resolving to the same user.
 *  - Firebase Auth's email/password users into Postgres `users` rows with
 *    passwordHash left null; these get a local bcrypt hash lazily on next
 *    successful login via lib/firebase-legacy-auth.ts, so no password reset
 *    is required for anyone.
 *
 * Usage:
 *   npx tsx scripts/migrate-auth-to-postgres.ts          # dry-run (preview)
 *   npx tsx scripts/migrate-auth-to-postgres.ts --apply  # actually migrate
 *
 * Prerequisites:
 *   - FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, FIREBASE_PROJECT_ID in env
 *   - SUPABASE_DB_URL in env (the self-hosted Postgres connection string)
 */

import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { users, accounts } from '../src/db/schema';

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

interface MigrationResult {
  name: string;
  total: number;
  inserted: number;
  skipped: number;
  errors: number;
}

async function migrateFirestoreUsersAndAccounts(
  firestoreDb: FirebaseFirestore.Firestore,
  pgDb: ReturnType<typeof drizzle>,
  dryRun: boolean,
): Promise<MigrationResult[]> {
  const userResult: MigrationResult = { name: 'users (Google OAuth, Firestore)', total: 0, inserted: 0, skipped: 0, errors: 0 };
  const accountResult: MigrationResult = { name: 'accounts (Google OAuth links)', total: 0, inserted: 0, skipped: 0, errors: 0 };

  const usersSnap = await firestoreDb.collection('users').get();
  userResult.total = usersSnap.size;
  for (const doc of usersSnap.docs) {
    try {
      const d = doc.data();
      if (!dryRun) {
        await pgDb.insert(users).values({
          id: doc.id,
          name: d.name || null,
          email: d.email ? String(d.email).toLowerCase() : null,
          emailVerified: d.emailVerified ? new Date(d.emailVerified) : null,
          image: d.image || null,
        }).onConflictDoNothing();
      }
      userResult.inserted++;
    } catch (e) {
      console.error(`  ✗ Error migrating Firestore user ${doc.id}:`, e);
      userResult.errors++;
    }
  }

  const accountsSnap = await firestoreDb.collection('accounts').get();
  accountResult.total = accountsSnap.size;
  for (const doc of accountsSnap.docs) {
    try {
      const d = doc.data();
      if (!dryRun) {
        await pgDb.insert(accounts).values({
          userId: d.userId,
          type: d.type || 'oauth',
          provider: d.provider,
          providerAccountId: d.providerAccountId,
          refresh_token: d.refresh_token || null,
          access_token: d.access_token || null,
          expires_at: d.expires_at ?? null,
          token_type: d.token_type || null,
          scope: d.scope || null,
          id_token: d.id_token || null,
          session_state: d.session_state || null,
        }).onConflictDoNothing();
      }
      accountResult.inserted++;
    } catch (e) {
      console.error(`  ✗ Error migrating Firestore account ${doc.id}:`, e);
      accountResult.errors++;
    }
  }

  return [userResult, accountResult];
}

async function migrateFirebaseAuthUsers(
  firebaseApp: ReturnType<typeof initializeApp>,
  pgDb: ReturnType<typeof drizzle>,
  dryRun: boolean,
): Promise<MigrationResult> {
  const result: MigrationResult = { name: 'users (email/password, Firebase Auth)', total: 0, inserted: 0, skipped: 0, errors: 0 };

  let pageToken: string | undefined;
  do {
    const page = await getAuth(firebaseApp).listUsers(1000, pageToken);
    result.total += page.users.length;
    for (const u of page.users) {
      try {
        if (!u.email) { result.skipped++; continue; }
        if (!dryRun) {
          await pgDb.insert(users).values({
            id: u.uid,
            name: u.displayName || null,
            email: u.email.toLowerCase(),
            emailVerified: u.emailVerified ? new Date() : null,
            image: u.photoURL || null,
            // passwordHash intentionally left null — migrated lazily on next login.
          }).onConflictDoNothing();
        }
        result.inserted++;
      } catch (e) {
        console.error(`  ✗ Error migrating Firebase Auth user ${u.uid}:`, e);
        result.errors++;
      }
    }
    pageToken = page.pageToken;
  } while (pageToken);

  return result;
}

async function main() {
  const dryRun = !process.argv.includes('--apply');

  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    console.error('SUPABASE_DB_URL is not set.');
    process.exit(1);
  }

  const firebaseApp = initFirebaseAdmin();
  const firestoreDb = getFirestore(firebaseApp);
  const pgClient = postgres(connectionString, { prepare: false, ssl: 'require' });
  const pgDb = drizzle(pgClient);

  console.log(dryRun ? 'Running in DRY-RUN mode (no writes). Pass --apply to write.\n' : 'Running with --apply: writing to Postgres.\n');

  const results: MigrationResult[] = [];
  results.push(...(await migrateFirestoreUsersAndAccounts(firestoreDb, pgDb, dryRun)));
  results.push(await migrateFirebaseAuthUsers(firebaseApp, pgDb, dryRun));

  console.log('\n═══════════════════════════════════════');
  console.log('              RESULTS');
  console.log('═══════════════════════════════════════\n');

  let grandTotal = 0, grandInserted = 0, grandSkipped = 0, grandErrors = 0;
  for (const r of results) {
    console.log(`  ${r.name}:`);
    console.log(`    Total: ${r.total} | Inserted: ${r.inserted} | Skipped: ${r.skipped} | Errors: ${r.errors}`);
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

  await pgClient.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
