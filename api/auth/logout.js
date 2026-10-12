import { clearCookie } from '../_lib/auth.js';
import { json, bad, sameOrigin } from '../_lib/http.js';

export async function POST(req) {
  if (!sameOrigin(req)) return bad('Forbidden', 403);
  return json({ ok: true }, 200, { 'set-cookie': clearCookie() });
}
