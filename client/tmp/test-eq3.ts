import { eq } from 'drizzle-orm';
import { projects } from '../src/db/schema';

const r = eq(projects.id, 'some-firestore-id');
console.log('chunks:', r.queryChunks.map((c: any) => c.constructor?.name || typeof c).join(', '));

const sql = r.queryChunks.map((c: any) => {
  if (c.constructor?.name === 'StringChunk') return c.value;
  if (c.constructor?.name === 'Param') return '';
  return c.constructor?.name || typeof c;
}).join('');
console.log('approx SQL:', sql);
