/* Dev-only: show the most recent contact submissions.
   Run:  bun run scripts/check-db.ts   (bun auto-loads .env) */
import postgres from 'postgres';
import { env } from '../src/lib/env';

const sql = postgres(env.DATABASE_URL!, {
  ssl: /@(localhost|127\.0\.0\.1)/.test(env.DATABASE_URL ?? '') ? false : 'require',
  prepare: false,
});

const [{ count }] = await sql`SELECT count(*)::int AS count FROM contact_submissions`;
console.log(`contact_submissions rows: ${count}\n`);

const rows = await sql`
  SELECT id, name, email, need, email_status, created_at
  FROM contact_submissions ORDER BY id DESC LIMIT 5`;
for (const r of rows) {
  console.log(`#${r.id}  ${r.name} <${r.email}>  need=${r.need ?? '—'}  email=${r.email_status}  ${r.created_at.toISOString()}`);
}

await sql.end();
