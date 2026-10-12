import { currentUser, hashPassword, verifyPassword } from '../_lib/auth.js';
import { query } from '../_lib/db.js';
import { json, bad, body, sameOrigin, limited } from '../_lib/http.js';

// Finish account setup after a guest purchase (no current password needed), or change an existing password.
export async function POST(req) {
  if (!sameOrigin(req)) return bad('Forbidden', 403);
  if (limited(req, 'setpw', 10)) return bad('Too many attempts. Try again in a minute.', 429);
  const user = await currentUser(req);
  if (!user) return bad('Log in to continue.', 401);
  const { password, current, name } = await body(req);
  if (typeof password !== 'string' || password.length < 8 || password.length > 200) return bad('Password must be at least 8 characters.');
  const { rows } = await query('SELECT password_hash FROM users WHERE id = $1', [user.id]);
  if (rows[0]?.password_hash && !(await verifyPassword(String(current || ''), rows[0].password_hash))) return bad('Current password is wrong.', 403);
  const display = typeof name === 'string' ? name.trim().slice(0, 80) : '';
  await query('UPDATE users SET password_hash = $2, name = COALESCE(NULLIF($3, \'\'), name) WHERE id = $1', [user.id, await hashPassword(password), display]);
  return json({ ok: true });
}
