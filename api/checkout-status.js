import { currentUser } from './_lib/auth.js';
import { json, bad } from './_lib/http.js';
import { polar, polarConfigured } from './_lib/polar.js';
import { grant, ownedCourses } from './_lib/fulfil.js';
import { COURSES } from './_lib/catalog.js';

// After Polar redirects back, confirm payment directly with Polar so access doesn't depend on webhook timing.
export async function GET(req) {
  const user = await currentUser(req);
  if (!user) return bad('Log in to continue.', 401);
  const id = new URL(req.url).searchParams.get('checkout_id') || '';
  if (!/^[\w-]{8,64}$/.test(id)) return bad('Missing checkout id.');
  if (!polarConfigured()) return json({ status: 'unavailable' }, 503);
  const client = polar();
  const co = await client.checkouts.get(id);
  const md = co.metadata || {};
  if (md.academy !== '1' || md.user_id !== user.id || !COURSES[md.course_id]) return bad('This checkout does not belong to your account.', 403);
  if (co.status === 'succeeded') {
    await grant({ userId: user.id, course: md.course_id, plan: md.plan, orderId: 'checkout:' + co.id, checkoutId: co.id });
    return json({ status: 'succeeded', course: md.course_id, enrollments: await ownedCourses(user.id) });
  }
  return json({ status: co.status, course: md.course_id });
}
