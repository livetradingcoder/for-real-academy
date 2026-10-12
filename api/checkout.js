import { currentUser, validEmail } from './_lib/auth.js';
import { json, bad, body, sameOrigin, siteUrl, limited } from './_lib/http.js';
import { COURSES, plansFor, grants } from './_lib/catalog.js';
import { polar, polarConfigured, findProduct } from './_lib/polar.js';
import { query } from './_lib/db.js';

// Guest checkout: no account is needed to pay. The account is created from the payment (webhook / success page)
// and the buyer sets a password right after.
export async function POST(req) {
  if (!sameOrigin(req)) return bad('Forbidden', 403);
  if (limited(req, 'checkout', 20)) return bad('Too many attempts. Try again in a minute.', 429);
  const { course, plan, email: rawEmail, name: rawName } = await body(req);
  if (!COURSES[course] || !plansFor(course).includes(plan)) return bad('Unknown course or payment plan.');
  if (!polarConfigured()) return json({ error: 'Checkout is not open yet. Please check back soon.', code: 'not_configured' }, 503);

  const user = await currentUser(req);
  const email = (user ? user.email : String(rawEmail || '')).trim().toLowerCase();
  const name = (user ? user.name : typeof rawName === 'string' ? rawName.trim().slice(0, 80) : '') || '';
  if (!validEmail(email)) return bad('Enter a valid email address.');

  const owned = await query(
    `SELECT e.course_id FROM academy.enrollments e JOIN academy.users u ON u.id = e.user_id WHERE u.email = $1 AND e.status = 'active' AND (e.expires_at IS NULL OR e.expires_at > now()) AND e.course_id = ANY($2)`,
    [email, grants(course)]
  );
  if (owned.rows.length === grants(course).length) return json({ error: 'This email already has access to this.', code: 'owned' }, 409);

  const client = polar();
  const product = await findProduct(client, course, plan);
  if (!product) return json({ error: 'This option is not available yet.', code: 'no_product' }, 503);

  const site = siteUrl(req);
  const checkout = await client.checkouts.create({
    products: [product.id],
    customer_email: email,
    ...(name ? { customer_name: name } : {}),
    metadata: { academy: '1', course_id: course, plan, ...(user ? { user_id: user.id } : { email, ...(name ? { name } : {}) }) },
    // {CHECKOUT_ID} is substituted by Polar, so it is appended by hand to keep the braces unencoded.
    success_url: `${site}/success.html?checkout_id={CHECKOUT_ID}`,
    return_url: `${site}/checkout.html?course=${encodeURIComponent(course)}&plan=${plan}`
  });
  return json({ url: checkout.url });
}
