import { query } from '../_lib/db.js';
import { hashPassword, sessionCookie, validEmail } from '../_lib/auth.js';
import { json, bad, body, sameOrigin, limited } from '../_lib/http.js';

export async function POST(req) {
  if (!sameOrigin(req)) return bad('Forbidden', 403);
  if (limited(req, 'signup', 8)) return bad('Too many attempts. Try again in a minute.', 429);
  const { email: raw, password, name } = await body(req);
  const email = String(raw || '').trim().toLowerCase();
  if (!validEmail(email)) return bad('Enter a valid email address.');
  if (typeof password !== 'string' || password.length < 8 || password.length > 200) return bad('Password must be at least 8 characters.');
  const display = typeof name === 'string' ? name.trim().slice(0, 80) : '';
  const { rows } = await query(
    'INSERT INTO academy.users (email, name, password_hash) VALUES ($1,$2,$3) ON CONFLICT (email) DO NOTHING RETURNING id, email, name',
    [email, display || null, await hashPassword(password)]
  );
  if (!rows[0]) return bad('An account with this email already exists. Log in instead. If you bought a course without setting a password, log in from the browser you paid with or email hello@forrealtech.dev.', 409);
  return json({ user: rows[0] }, 201, { 'set-cookie': sessionCookie(rows[0].id, req) });
}
