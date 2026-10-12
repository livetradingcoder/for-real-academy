import { currentUser } from './_lib/auth.js';
import { query } from './_lib/db.js';
import { json, bad, body, sameOrigin } from './_lib/http.js';
import { COURSES } from './_lib/catalog.js';
import { hasAccess } from './_lib/fulfil.js';

export async function POST(req) {
  if (!sameOrigin(req)) return bad('Forbidden', 403);
  const user = await currentUser(req);
  if (!user) return bad('Log in to continue.', 401);
  const { course, module, done } = await body(req);
  const c = COURSES[course];
  if (!c || !c.modules || !Number.isInteger(module) || module < 0 || module >= c.modules) return bad('Unknown module.');
  if (!(await hasAccess(user.id, course))) return bad('You are not enrolled in this course.', 403);
  if (done) await query('INSERT INTO academy.progress (user_id, course_id, module_index) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING', [user.id, course, module]);
  else await query('DELETE FROM academy.progress WHERE user_id = $1 AND course_id = $2 AND module_index = $3', [user.id, course, module]);
  const { rows } = await query('SELECT module_index FROM academy.progress WHERE user_id = $1 AND course_id = $2 ORDER BY module_index', [user.id, course]);
  return json({ completed: rows.map(r => r.module_index) });
}
