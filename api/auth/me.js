import { currentUser } from '../_lib/auth.js';
import { query } from '../_lib/db.js';
import { json } from '../_lib/http.js';
import { ownedCourses } from '../_lib/fulfil.js';

export async function GET(req) {
  const user = await currentUser(req);
  if (!user) return json({ user: null });
  const [enrollments, prog, pw] = await Promise.all([
    ownedCourses(user.id),
    query('SELECT course_id, module_index FROM progress WHERE user_id = $1', [user.id]),
    query('SELECT (password_hash IS NOT NULL) AS has FROM users WHERE id = $1', [user.id])
  ]);
  const progress = {};
  for (const r of prog.rows) (progress[r.course_id] ||= []).push(r.module_index);
  return json({ user, enrollments, progress, needsPassword: !pw.rows[0]?.has });
}
