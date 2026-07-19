# Supabase Migration — Complete

**Status:** 🟢 Code migration complete — needs user setup steps
**Completed:** 2026-07-18

---

## ✅ Everything Migrated

### Phase 1: Setup
- [x] Installed `drizzle-orm`, `postgres`, `@supabase/supabase-js`, `drizzle-kit`
- [x] Created `drizzle.config.ts`
- [x] Created `src/db/schema.ts` (15 tables)
- [x] Created `src/db/index.ts` (Drizzle + domain re-exports)
- [x] Created `src/lib/supabase.ts` (server client)
- [x] Created `src/lib/supabase-client.ts` (client-side)
- [x] Generated initial migration SQL (`0000_zippy_inertia.sql`)
- [x] Updated `.env.example` with Supabase vars

### Phase 2: Schema (15 tables)
- [x] `projects` — JSONB for customPieces, squareLogic, placedPieces
- [x] `marketplace_items` — JSONB for previewConfig, searchKeywords, configData
- [x] `marketplace_reviews` — FK to marketplace_items
- [x] `marketplace_reports`
- [x] `creator_profiles` — JSONB for followers/following arrays
- [x] `notifications`
- [x] `user_stats`
- [x] `game_history`
- [x] `community_feedback`
- [x] `boards` (legacy)
- [x] `piece_sets` (legacy)
- [x] `custom_pieces` (legacy)
- [x] `analytics_summary`, `analytics_daily_stats`, `analytics_button_clicks`

### Phase 3a: Domain Modules (new `src/db/` folder)
- [x] `src/db/projects.ts` — CRUD + migration stubs
- [x] `src/db/stats.ts` — game stats + history
- [x] `src/db/marketplace.ts` — items, reviews, reports, search
- [x] `src/db/creators.ts` — profiles, follow/unfollow
- [x] `src/db/notifications.ts` — CRUD
- [x] `src/db/library.ts` — boards, piece sets, custom pieces

### Phase 3b: Server Actions Rewritten
- [x] `app/actions/editor.ts` — now imports from `@/db`
- [x] `app/actions/marketplace.ts` — now uses `@/db` instead of raw Firestore
- [x] `app/actions/creator.ts` — now uses `@/db`
- [x] `app/actions/notifications.ts` — now uses `@/db`
- [x] `app/actions/library.ts` — now imports from `@/db`
- [x] `app/actions/user.ts` — now imports from `@/db`

### Phase 3c: API Routes Rewritten
- [x] `app/api/game-result/route.ts` → `@/db`
- [x] `app/api/history/route.ts` → `@/db`
- [x] `app/api/stats/route.ts` → `@/db`
- [x] `app/api/community-feedback/route.ts` → `@/db`

### Phase 3d: Scripts Rewritten
- [x] `scripts/publish-variants.ts` — now uses Drizzle/Postgres
- [x] `scripts/cleanup-marketplace.ts` — now uses Drizzle/Postgres
- [x] `scripts/firestore-to-supabase.ts` — NEW: migrates all Firestore data to Supabase

### Phase 3e: Library File Updated
- [x] `lib/marketplace-data.ts` — now delegates to `@/db`

### Phase 4: Supabase Storage
- [x] `components/dashboard/CreatorProfileSection.tsx` — Firebase Storage → Supabase Storage
- [x] `app/[locale]/creator/ClientPage.tsx` — Firebase Storage → Supabase Storage

### Cleanup Done
- [x] `lib/firestore.ts` — DELETED (no more imports)
- [x] `lib/firestore-client.ts` — DELETED (no more imports)
- [x] `firestore.indexes.json` — DELETED (not needed)
- [x] `firebase-admin.ts` — KEPT (still needed for Firebase Auth + NextAuth)
- [x] `firebase-client.ts` — KEPT (still needed for Firebase Auth)
- [x] `auth.ts` — UNCHANGED (still uses Firebase Auth adapter)

---

## 🔴 User Setup Steps Required

You need to do these in order:

### 1. Create a Supabase project
- Go to https://supabase.com and create a project
- Get your project URL, anon key, service role key, and DB connection string

### 2. Add env vars to `client/.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DB_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
```

### 3. Apply the database schema
```bash
cd client
npx drizzle-kit migrate
```
This creates all 15 tables in your Supabase Postgres database.

### 4. Set up Supabase Storage buckets
In Supabase dashboard → Storage:
- Create bucket `avatars` (public)
- Create bucket `marketplace-thumbnails` (public)

### 5. Migrate your data from Firestore
```bash
cd client
npm run firestore:to:supabase               # dry-run to preview
npm run firestore:to:supabase:apply          # actually migrate
```
This reads from Firestore and writes to Supabase.

### 6. Update npm scripts
Add to `client/package.json`:
```json
"scripts": {
  "firestore:to:supabase": "npx tsx scripts/firestore-to-supabase.ts",
  "firestore:to:supabase:apply": "npx tsx scripts/firestore-to-supabase.ts --apply"
}
```

### 7. (Optional) Set up Umami Analytics
- Add Umami to your Docker compose
- Replace old analytics tracking

---

## Architecture Notes

**auth.ts** still uses `FirestoreAdapter(db)` from `@auth/firebase-adapter` — this stores
NextAuth sessions in Firestore (tiny data). When you swap auth providers later,
this gets replaced entirely.

**The analytics API routes** (`api/track`, `api/analytics/stats`) still use Firebase
Admin directly. They work fine and use minimal quota. Replace with Umami when ready.

**firebase-admin.ts** and **firebase-client.ts** are still imported by:
- `auth.ts` (for NextAuth and Firebase Admin auth verification)
- `SignUpForm.tsx`, `LoginForm.tsx` (for Firebase Auth email/password)
- `AuthContext.tsx` (for auth state)
- Various components that check `isConfigured`
