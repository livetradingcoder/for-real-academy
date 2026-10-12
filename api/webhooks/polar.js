import { webhooks } from '@polar-sh/sdk/2026-10';
import { json } from '../_lib/http.js';
import { polar } from '../_lib/polar.js';
import { onOrderPaid, onOrderRefunded, onSubscriptionRevoked } from '../_lib/fulfil.js';

export async function POST(req) {
  const secret = process.env.POLAR_WEBHOOK_SECRET?.trim();
  if (!secret) return json({ error: 'Webhook not configured' }, 503);

  const raw = await req.text(); // the signature covers the exact bytes
  let event;
  try {
    event = await webhooks.validateEvent(raw, {
      'webhook-id': req.headers.get('webhook-id') ?? '',
      'webhook-timestamp': req.headers.get('webhook-timestamp') ?? '',
      'webhook-signature': req.headers.get('webhook-signature') ?? ''
    }, secret);
  } catch (e) {
    if (e instanceof webhooks.PolarWebhookVerificationError) return json({ received: false }, 403);
    if (e instanceof webhooks.PolarWebhookError) return json({ received: false }, 400);
    throw e;
  }

  // Webhooks are org-wide: events for other apps' products are acknowledged and ignored.
  switch (event.type) {
    case 'order.paid': await onOrderPaid(event.data, polar()); break;
    case 'order.refunded': await onOrderRefunded(event.data); break;
    case 'subscription.revoked': await onSubscriptionRevoked(event.data); break;
  }
  return json({ received: true });
}
