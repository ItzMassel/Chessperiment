import { eq } from 'drizzle-orm';
import { pgTable, uuid, text } from 'drizzle-orm/pg-core';

const t = pgTable('t', { id: uuid('id').primaryKey(), name: text('name') });
const r1 = eq(t.id, 'abc');
const r2 = eq(t.name, 'hello');
console.log('uuid chunks:', r1.queryChunks.map((c: any) => c.constructor?.name || typeof c).join(', '));
console.log('text chunks:', r2.queryChunks.map((c: any) => c.constructor?.name || typeof c).join(', '));
