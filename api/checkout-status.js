import { currentUser, mintSession } from './_lib/auth.js';
import { json, bad } from './_lib/http.js';
import { polar, polarConfigured } from './_lib/polar.js';
import { grant, userFromMetadata, ownedCourses } from './_lib/fulfil.js';
import { COURSES, expiryFor } from './_lib/catalog.js';

const WINDOW_MS = 48 * 3600 * 1000;

// Polar redirects the buyer here after paying. The checkout id is confirmed directly with Polar, access is granted,
// and a buyer whose account has no password yet is signed in (proof of purchase) so they can set one.
export async function GET(req) {
  const id = new URL(req.url).searchParams.get('checkout_id') || '';
  if (!/^[\w-]{8,64}$/.test(id)) return bad('Missing checkout id.');
  if (!polarConfigured()) return json({ status: 'unavailable' }, 503);

  let co;
  try { co = await polar().checkouts.get(id); } catch { return bad('Unknown checkout.', 404); }
  const md = co.metadata || {};
  if (md.academy !== '1' || !COURSES[md.course_id]) return bad('Unknown checkout.', 404);
  if (co.status !== 'succeeded') return json({ status: co.status, course: md.course_id });

  const owner = await userFromMetadata(md);
  if (!owner) return bad('Unknown checkout.', 404);
  await grant({ userId: owner.id, course: md.course_id, plan: md.plan, orderId: 'checkout:' + co.id, checkoutId: co.id, expiresAt: expiryFor(md.course_id) });

  const me = await currentUser(req);
  const headers = {};
  let signedIn = me?.id === owner.id;
  const age = Date.now() - Date.parse(co.created_at);
  if (!signedIn && !owner.has_password && Number.isFinite(age) && age < WINDOW_MS) {
    headers['set-cookie'] = mintSession(owner.id, req);
    signedIn = true;
  }
  return json({ status: 'succeeded', course: md.course_id, email: owner.email, needsPassword: !owner.has_password && signedIn, signedIn, enrollments: signedIn ? await ownedCourses(owner.id) : undefined }, 200, headers);
}
