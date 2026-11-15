import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let _db: ReturnType<typeof drizzle> | null = null;

function getDb(): ReturnType<typeof drizzle> {
  if (!_db) {
    const connectionString = process.env.SUPABASE_DB_URL;
    if (!connectionString) {
      throw new Error('SUPABASE_DB_URL environment variable is required');
    }
    const client = postgres(connectionString, {
      prepare: false,
      ssl: 'require',
    });
    _db = drizzle(client, { schema });
  }
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_, prop) {
    return (getDb() as any)[prop];
  },
});

// For code that needs the real (non-proxied) instance — e.g. @auth/drizzle-adapter,
// which does `instanceof`-style checks that the lazy proxy above can't satisfy
// since its target is a plain `{}`, not an actual drizzle instance.
export { getDb };

export * from './projects';
export * from './stats';
export * from './marketplace';
export * from './creators';
export * from './notifications';
export * from './library';
export * from './users';

export { schema };
