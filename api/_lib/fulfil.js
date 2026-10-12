import { query } from './db.js';
import { COURSES, INSTALMENTS, grants, expiryFor } from './catalog.js';

export async function findOrCreateUser(email, name) {
  const { rows } = await query(
    `INSERT INTO users (email, name, password_hash) VALUES ($1,$2,NULL)
     ON CONFLICT (email) DO UPDATE SET name = COALESCE(users.name, EXCLUDED.name)
     RETURNING id, email, name, (password_hash IS NOT NULL) AS has_password`,
    [String(email).trim().toLowerCase(), name || null]
  );
  return rows[0];
}

// Who a checkout belongs to: the logged-in user who started it, or the email typed at checkout (guest).
export async function userFromMetadata(md) {
  if (md.user_id) {
    const { rows } = await query('SELECT id, email, name, (password_hash IS NOT NULL) AS has_password FROM users WHERE id = $1', [md.user_id]);
    return rows[0] || null;
  }
  return md.email ? findOrCreateUser(md.email, md.name) : null;
}

export async function grant({ userId, course, plan, orderId, checkoutId, subscriptionId, expiresAt = null }) {
  for (const id of grants(course)) {
    await query(
      `INSERT INTO enrollments (user_id, course_id, plan, polar_order_id, polar_checkout_id, polar_subscription_id, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (user_id, course_id) DO UPDATE SET
         status = 'active', plan = EXCLUDED.plan, polar_order_id = EXCLUDED.polar_order_id,
         polar_checkout_id = COALESCE(EXCLUDED.polar_checkout_id, enrollments.polar_checkout_id),
         polar_subscription_id = COALESCE(EXCLUDED.polar_subscription_id, enrollments.polar_subscription_id),
         expires_at = CASE
           WHEN EXCLUDED.expires_at IS NULL THEN NULL
           WHEN enrollments.status = 'active' AND enrollments.expires_at IS NULL THEN NULL
           ELSE GREATEST(COALESCE(enrollments.expires_at, EXCLUDED.expires_at), EXCLUDED.expires_at) END
       WHERE
         -- a timed pass never replaces (or takes over the refund link of) access that is already permanent
         NOT (EXCLUDED.expires_at IS NOT NULL AND enrollments.status = 'active' AND enrollments.expires_at IS NULL)
         AND (
           -- the checkout-return fallback only fills a gap; it never overwrites what the webhook recorded
           (EXCLUDED.polar_order_id LIKE 'checkout:%' AND enrollments.polar_checkout_id IS DISTINCT FROM EXCLUDED.polar_checkout_id)
           OR (EXCLUDED.polar_order_id NOT LIKE 'checkout:%' AND enrollments.polar_order_id IS DISTINCT FROM EXCLUDED.polar_order_id)
         )`,
      [userId, id, plan, orderId, checkoutId || null, subscriptionId || null, expiresAt]
    );
  }
}

// Returns true when the order belongs to this app (and was processed), false to ignore.
export async function onOrderPaid(order, client) {
  const md = order.metadata || {};
  let userId, course, plan;
  if (md.academy === '1' && COURSES[md.course_id] && (md.user_id || md.email)) {
    ({ course_id: course, plan } = md);
    userId = (await userFromMetadata(md))?.id;
  } else if (order.subscription_id) {
    const { rows } = await query('SELECT user_id, course_id, plan FROM enrollments WHERE polar_subscription_id = $1 LIMIT 1', [order.subscription_id]);
    if (!rows[0]) return false;
    ({ user_id: userId, course_id: course, plan } = rows[0]);
    // enrollment rows hold the granted courses; the paid course is the bundle if several share the subscription
    const all = await query('SELECT course_id FROM enrollments WHERE polar_subscription_id = $1', [order.subscription_id]);
    if (all.rows.length > 1) course = 'bundle';
  } else return false;
  if (!userId || !COURSES[course]) return false;
  if (!userId) throw new Error('order has no resolvable user'); // 5xx -> Polar retries and it shows in the dashboard

  const orderId = order.id;
  const subscriptionId = order.subscription_id || null;
  await query('INSERT INTO payments (order_id, user_id, course_id, subscription_id) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING', [orderId, userId, course, subscriptionId]);
  if (order.billing_reason === 'purchase' || order.billing_reason === 'subscription_create') {
    await grant({ userId, course, plan, orderId, checkoutId: order.checkout_id, subscriptionId, expiresAt: expiryFor(course, Date.parse(order.created_at) || Date.now()) });
  }
  if (plan === 'split' && subscriptionId) {
    const { rows } = await query('SELECT count(*)::int AS n FROM payments WHERE subscription_id = $1', [subscriptionId]);
    if (rows[0].n >= INSTALMENTS) {
      try { await client.subscriptions.update(subscriptionId, { cancel_at_period_end: true }); }
      catch (e) { console.error('[polar] could not stop billing after final instalment', subscriptionId, e?.message); }
    }
  }
  return true;
}

export async function onOrderRefunded(order) {
  if (order.status !== 'refunded') return; // partial refunds keep access
  await query(`UPDATE enrollments SET status = 'refunded' WHERE polar_order_id = $1`, [order.id]);
}

export async function onSubscriptionRevoked(sub) {
  const { rows } = await query('SELECT count(*)::int AS n FROM payments WHERE subscription_id = $1', [sub.id]);
  if (rows[0].n >= INSTALMENTS) return; // all instalments paid, access stays
  await query(`UPDATE enrollments SET status = 'lapsed' WHERE polar_subscription_id = $1 AND status = 'active'`, [sub.id]);
}

export async function ownedCourses(userId) {
  const { rows } = await query(`SELECT course_id, plan, status, expires_at FROM enrollments WHERE user_id = $1 ORDER BY created_at`, [userId]);
  return rows;
}

export async function hasAccess(userId, course) {
  const { rows } = await query(`SELECT 1 FROM enrollments WHERE user_id = $1 AND course_id = $2 AND status = 'active' AND (expires_at IS NULL OR expires_at > now())`, [userId, course]);
  return !!rows[0];
}
