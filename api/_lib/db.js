import pg from 'pg';

const SCHEMA = `
-- Everything lives in its own schema so it can share a database with other apps without touching their tables.
CREATE SCHEMA IF NOT EXISTS academy;
CREATE TABLE IF NOT EXISTS academy.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text,
  password_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE academy.users ALTER COLUMN password_hash DROP NOT NULL;
CREATE TABLE IF NOT EXISTS academy.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES academy.users(id) ON DELETE CASCADE,
  course_id text NOT NULL,
  plan text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  polar_order_id text NOT NULL,
  polar_checkout_id text,
  polar_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);
ALTER TABLE academy.enrollments ADD COLUMN IF NOT EXISTS expires_at timestamptz;
CREATE INDEX IF NOT EXISTS enrollments_sub_idx ON academy.enrollments (polar_subscription_id);
CREATE INDEX IF NOT EXISTS enrollments_order_idx ON academy.enrollments (polar_order_id);
CREATE TABLE IF NOT EXISTS academy.payments (
  order_id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES academy.users(id) ON DELETE CASCADE,
  course_id text NOT NULL,
  subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payments_sub_idx ON academy.payments (subscription_id);
CREATE TABLE IF NOT EXISTS academy.progress (
  user_id uuid NOT NULL REFERENCES academy.users(id) ON DELETE CASCADE,
  course_id text NOT NULL,
  module_index int NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, course_id, module_index)
);`;

let pool;
let ready;

function getPool() {
  if (pool) return pool;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
  pool = new pg.Pool({ connectionString: url, max: 5, idleTimeoutMillis: 10000, ssl: local ? false : { rejectUnauthorized: false } });
  return pool;
}

export async function db() {
  const p = getPool();
  ready ??= p.query(SCHEMA).catch(e => { ready = undefined; throw e; });
  await ready;
  return p;
}

export async function query(text, params) {
  return (await db()).query(text, params);
}
