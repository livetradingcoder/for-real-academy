import { currentUser } from './_lib/auth.js';
import { json, bad, body, sameOrigin, siteUrl } from './_lib/http.js';
import { COURSES, PLANS, grants } from './_lib/catalog.js';
import { polar, polarConfigured, findProduct } from './_lib/polar.js';
import { query } from './_lib/db.js';

export async function POST(req) {
  if (!sameOrigin(req)) return bad('Forbidden', 403);
  const user = await currentUser(req);
  if (!user) return bad('Log in to continue.', 401);
  const { course, plan } = await body(req);
  if (!COURSES[course] || !PLANS.includes(plan)) return bad('Unknown course or payment plan.');
  if (!polarConfigured()) return json({ error: 'Checkout is not open yet. Please check back soon.', code: 'not_configured' }, 503);

  const owned = await query(`SELECT course_id FROM enrollments WHERE user_id = $1 AND status = 'active' AND course_id = ANY($2)`, [user.id, grants(course)]);
  if (owned.rows.length === grants(course).length) return json({ error: 'You already own this course.', code: 'owned' }, 409);

  const client = polar();
  const product = await findProduct(client, course, plan);
  if (!product) return json({ error: 'This option is not available yet.', code: 'no_product' }, 503);

  const site = siteUrl(req);
  const checkout = await client.checkouts.create({
    products: [product.id],
    customer_email: user.email,
    ...(user.name ? { customer_name: user.name } : {}),
    metadata: { academy: '1', user_id: user.id, course_id: course, plan },
    // {CHECKOUT_ID} is substituted by Polar, so it is appended by hand to keep the braces unencoded.
    success_url: `${site}/success.html?checkout_id={CHECKOUT_ID}`,
    return_url: `${site}/checkout.html?course=${encodeURIComponent(course)}&plan=${plan}`
  });
  return json({ url: checkout.url });
}
