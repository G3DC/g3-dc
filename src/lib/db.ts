/**
 * Postgres access for contact submissions.
 *
 * Uses porsager's `postgres` driver, which speaks the standard wire protocol —
 * works with Neon, Supabase, Vercel Postgres, Cloud SQL, RDS, or a local server,
 * all via a single `DATABASE_URL`. Tuned for serverless (one connection per warm
 * instance, `prepare: false` so it's safe behind transaction-mode poolers).
 */
import postgres from 'postgres';
import { env } from './env';

export interface ContactInput {
  name: string;
  email: string;
  company?: string | null;
  need?: string | null;
  message?: string | null;
  source?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

type Sql = ReturnType<typeof postgres>;

let _sql: Sql | null = null;
let _schemaReady: Promise<void> | null = null;

function sslOption(): 'require' | false {
  const v = env.DATABASE_SSL?.toLowerCase();
  if (v === 'disable' || v === 'false' || v === 'off') return false;
  if (v === 'require' || v === 'true' || v === 'on') return 'require';
  // auto: encrypt for everything except a local server
  return /@(localhost|127\.0\.0\.1|\[::1\])(:|\/)/.test(env.DATABASE_URL ?? '') ? false : 'require';
}

function getSql(): Sql {
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set — cannot log contact submissions.');
  }
  if (!_sql) {
    _sql = postgres(env.DATABASE_URL, {
      max: 1, // one connection per serverless instance
      idle_timeout: 20,
      connect_timeout: 15,
      prepare: false, // safe with PgBouncer / Supabase transaction pooler
      ssl: sslOption(),
    });
  }
  return _sql;
}

/** Idempotently create the table. Runs once per warm instance. */
function ensureSchema(): Promise<void> {
  if (!_schemaReady) {
    const sql = getSql();
    _schemaReady = sql`
      CREATE TABLE IF NOT EXISTS contact_submissions (
        id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name         text        NOT NULL,
        email        text        NOT NULL,
        company      text,
        need         text,
        message      text,
        source       text,
        ip           text,
        user_agent   text,
        email_status text        NOT NULL DEFAULT 'pending',
        created_at   timestamptz NOT NULL DEFAULT now()
      );
    `
      .then(() => undefined)
      .catch((e) => {
        // reset so a later request can retry the DDL
        _schemaReady = null;
        throw e;
      });
  }
  return _schemaReady;
}

/** Insert a submission and return its id. */
export async function insertSubmission(input: ContactInput): Promise<number> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql<Array<{ id: number }>>`
    INSERT INTO contact_submissions
      (name, email, company, need, message, source, ip, user_agent)
    VALUES
      (${input.name}, ${input.email}, ${input.company ?? null}, ${input.need ?? null},
       ${input.message ?? null}, ${input.source ?? null}, ${input.ip ?? null}, ${input.userAgent ?? null})
    RETURNING id;
  `;
  return Number(rows[0].id);
}

/** Record whether the notification/auto-reply emails went out. */
export async function setEmailStatus(id: number, status: 'sent' | 'failed' | 'pending'): Promise<void> {
  const sql = getSql();
  await sql`UPDATE contact_submissions SET email_status = ${status} WHERE id = ${id};`;
}
