# Supabase Migration Progress

**Status:** 🟡 In Progress — now migrating *off* Supabase/Firebase entirely onto self-hosted infra
**Started:** 2026-07-18

## ✅ Phase 1: Setup Supabase + Drizzle
- [x] Install drizzle-orm, postgres, @supabase/supabase-js, drizzle-kit
- [x] Create drizzle.config.ts
- [x] Create src/db/schema.ts (15 tables)
- [x] Create src/db/index.ts (Drizzle instance)
- [x] Create src/lib/supabase.ts (server client)
- [x] Create src/lib/supabase-client.ts (client-side)
- [x] Add Supabase env vars to .env.example
- [x] Generate initial migration SQL (0000_zippy_inertia.sql)
- [ ] **USER ACTION:** Run `npx drizzle-kit migrate` against Supabase DB

## Phase 3b: Domain Data Access Modules
- [ ] lib/db/projects.ts
- [ ] lib/db/stats.ts
- [ ] lib/db/marketplace.ts
- [ ] lib/db/creators.ts
- [ ] lib/db/notifications.ts
- [ ] lib/db/library.ts

## Phase 3c: Rewrite Server Actions
- [ ] app/actions/editor.ts
- [ ] app/actions/marketplace.ts
- [ ] app/actions/creator.ts
- [ ] app/actions/notifications.ts
- [ ] app/actions/library.ts
- [ ] app/actions/user.ts

## Phase 3d: Rewrite API Routes
- [ ] app/api/community-feedback/route.ts

## Phase 3e: Rewrite Scripts
- [ ] scripts/publish-variants.ts
- [ ] scripts/cleanup-marketplace.ts

## Phase 4: Storage
- [x] Update CreatorProfileSection.tsx (now uploads via `app/actions/storage.ts`)
- [x] Update creator page ClientPage.tsx (same)
- [x] Set up storage: self-hosted on local disk (`client/public/uploads/`), not
      Supabase Storage and not MinIO (MinIO's free binary was discontinued in 2026).
      `@supabase/supabase-js`, `lib/supabase.ts` and `lib/supabase-client.ts` removed.

## Phase 0 (retroactive): Database now self-hosted too
- [x] `SUPABASE_DB_URL` now points at a self-hosted PostgreSQL 16 instance on
      the production server instead of Supabase-hosted Postgres. No code
      changes were needed — the app only ever used Supabase here as a managed
      Postgres host via Drizzle. All rows migrated and verified (row counts
      matched exactly).

## Phase 5: Analytics → Umami
- [ ] Deploy Umami in Docker
- [ ] Add tracking script to layout
- [ ] Remove old analytics routes

## Phase 6: Data Migration Script
- [ ] Create scripts/firestore-to-supabase.ts
- [ ] Run migration

## Phase 7: Cleanup
- [ ] Remove firebase-admin.ts and firebase-client.ts
- [ ] Remove firestore.ts and firestore-client.ts
- [ ] Remove firestore.indexes.json
- [ ] Uninstall firebase, firebase-admin packages
- [ ] Remove old Firebase env vars from .env.example
- [ ] Remove unused auth component imports
