import postgres from 'postgres';

// URL-encode the password to handle special chars like !
const password = encodeURIComponent('Nuheva37123!');
const projectRef = 'hppijqxbupszparkmfbz';
const regions = [
  'aws-0-eu-west-1.pooler.supabase.com',
  'aws-0-eu-west-2.pooler.supabase.com',
  'aws-0-eu-central-1.pooler.supabase.com',
  'aws-0-us-east-1.pooler.supabase.com',
  'aws-0-eu-west-3.pooler.supabase.com',
];

async function main() {
  for (const region of regions) {
    const url = `postgresql://postgres.${projectRef}:${password}@${region}:6543/postgres?pgbouncer=true`;
    console.log(`Trying ${region}...`);
    try {
      const sql = postgres(url, { prepare: false, connect_timeout: 10, ssl: 'require' });
      const r = await sql.unsafe('SELECT 1 AS ok');
      console.log(`  ✅ Connected!`);
      await sql.end();
      process.exit(0);
    } catch (e: any) {
      console.log(`  ❌ ${e.message}`);
    }
  }
  console.log('All regions failed');
  process.exit(1);
}
main();
