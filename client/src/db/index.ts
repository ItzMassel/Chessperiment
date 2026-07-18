import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  throw new Error('SUPABASE_DB_URL environment variable is required');
}

const client = postgres(connectionString, {
  prepare: false,
  ssl: 'require',
});
export const db = drizzle(client, { schema });

export * from './projects';
export * from './stats';
export * from './marketplace';
export * from './creators';
export * from './notifications';
export * from './library';

export { schema };
