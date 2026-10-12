import { currentUser } from './_lib/auth.js';
import { json, bad } from './_lib/http.js';
import { COURSES } from './_lib/catalog.js';
import { hasAccess } from './_lib/fulfil.js';
import { lesson } from './_lib/content.js';

export async function GET(req) {
  const user = await currentUser(req);
  if (!user) return bad('Log in to continue.', 401);
  const q = new URL(req.url).searchParams;
  const course = q.get('course') || '', index = Number(q.get('module'));
  const c = COURSES[course];
  if (!c || !c.modules || !Number.isInteger(index) || index < 0 || index >= c.modules) return bad('Unknown module.');
  if (!(await hasAccess(user.id, course))) return bad('You are not enrolled in this course.', 403);
  return json(lesson(course, index));
}
