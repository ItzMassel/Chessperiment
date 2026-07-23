/** List projects for testing */
import { db, schema } from '../src/db';

async function main() {
  const rows = await db.select({
    id: schema.projects.id,
    userId: schema.projects.userId,
    name: schema.projects.name,
    rows: schema.projects.rows,
    cols: schema.projects.cols,
  }).from(schema.projects).limit(10);
  
  for (const r of rows) {
    console.log(`${r.id} | user: ${r.userId} | "${r.name}" | ${r.rows}x${r.cols}`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
