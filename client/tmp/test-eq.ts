import { eq } from 'drizzle-orm';
import { pgTable, uuid } from 'drizzle-orm/pg-core';
const t = pgTable('t', { id: uuid('id').primaryKey() });
const r = eq(t.id, 'abc');
console.log('chunks:', JSON.stringify(r.queryChunks.map((c: any) => typeof c === 'string' ? c : typeof c)));
