import { query } from '../_lib/db.js';
import { verifyPassword, hashPassword, sessionCookie } from '../_lib/auth.js';
import { json, bad, body, sameOrigin, limited } from '../_lib/http.js';

const DUMMY = await hashPassword('timing-equaliser');

export async function POST(req) {
  if (!sameOrigin(req)) return bad('Forbidden', 403);
  if (limited(req, 'login', 10)) return bad('Too many attempts. Try again in a minute.', 429);
  const { email: raw, password } = await body(req);
  const email = String(raw || '').trim().toLowerCase();
  const { rows } = await query('SELECT id, email, name, password_hash FROM users WHERE email = $1', [email]);
  const user = rows[0];
  const ok = await verifyPassword(String(password || ''), user?.password_hash || DUMMY) && !!user?.password_hash;
  if (!user || !ok) return bad('Wrong email or password.', 401);
  return json({ user: { id: user.id, email: user.email, name: user.name } }, 200, { 'set-cookie': sessionCookie(user.id, req) });
}
