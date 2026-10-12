// One-shot Polar setup for this site. Run it yourself so the access token never leaves your machine.
//
//   POLAR_ACCESS_TOKEN=polar_oat_... SITE_URL=https://your-domain \
//   VERCEL_BIN=/path/to/vercel VERCEL_ARGS="--global-config ~/.vercel-ltl --scope ltl-proj" \
//   node scripts/polar-bootstrap.mjs            # dry run: shows what it would do
//   ... node scripts/polar-bootstrap.mjs --apply
//
// It (1) creates the Polar products (one per course and plan, tagged academy_course/academy_plan),
// (2) registers the webhook endpoint SITE_URL/api/webhooks/polar (raw format, API 2026-10) and captures its secret,
// (3) stores POLAR_ACCESS_TOKEN, POLAR_WEBHOOK_SECRET and NEXT_PUBLIC_SITE_URL on the linked Vercel project
//     (production, sensitive) by piping them to `vercel env add`, never printing them.
// Then redeploy and run a 100%-discount test purchase. Safe to re-run; --rotate replaces an existing endpoint's secret.
import fs from 'node:fs';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { createPolar } from '@polar-sh/sdk/2026-10';

const apply = process.argv.includes('--apply'), rotate = process.argv.includes('--rotate');
const token = process.env.POLAR_ACCESS_TOKEN?.trim();
const site = (process.env.SITE_URL || '').replace(/\/$/, '');
if (!token) { console.error('Set POLAR_ACCESS_TOKEN'); process.exit(1); }
if (!/^https:\/\/[^/\s]+$/.test(site)) { console.error('Set SITE_URL to the canonical https origin, e.g. https://example.com (no path; use the www/non-www host that serves the site, Polar does not follow redirects)'); process.exit(1); }
const server = process.env.POLAR_SERVER === 'sandbox' ? 'sandbox' : 'production';
const client = createPolar({ accessToken: token, environment: server, ...(process.env.POLAR_BASE_URL ? { baseUrl: process.env.POLAR_BASE_URL } : {}) });
const say = (m) => console.log((apply ? '' : '[dry run] ') + m);

globalThis.window = {};
vm.runInThisContext(fs.readFileSync(new URL('../config.js', import.meta.url), 'utf8'));

// 1. products
let firstProduct = null;
for (const c of window.ACADEMY.courses) {
  for (const plan of c.installments ? ['full', 'split'] : ['full']) {
    const found = await client.products.list({ metadata: { academy_course: c.id, academy_plan: plan }, is_archived: false, limit: 5 });
    const existing = found.items.find(p => p.metadata?.academy_course === c.id && p.metadata?.academy_plan === plan);
    if (existing) { firstProduct ??= existing; say(`product exists   ${c.id} / ${plan}`); continue; }
    const cents = Math.round((plan === 'full' ? c.price : c.installments.each) * 100);
    say(`product create   ${c.id} / ${plan}  $${cents / 100}${plan === 'split' ? '/month' : ''}`);
    if (!apply) continue;
    const p = await client.products.create({
      name: plan === 'full' ? c.title : `${c.title} (${c.installments.count} monthly payments)`,
      description: c.blurb,
      metadata: { academy_course: c.id, academy_plan: plan },
      prices: [{ amount_type: 'fixed', price_currency: 'usd', price_amount: cents }],
      ...(plan === 'split' ? { recurring_interval: 'month', recurring_interval_count: 1 } : {})
    });
    firstProduct ??= p;
  }
}

// 2. webhook endpoint
const hookUrl = `${site}/api/webhooks/polar`;
const events = ['order.paid', 'order.refunded', 'subscription.revoked'];
const endpoints = (await client.webhooks.listWebhookEndpoints({ limit: 100 })).items;
let endpoint = endpoints.find(e => e.url === hookUrl), secret = null;
if (endpoint && !rotate) { say(`webhook exists   ${hookUrl} (re-run with --rotate to replace its secret and store the new one)`); }
else if (endpoint) { say(`webhook rotate   ${hookUrl}`); if (apply) secret = (await client.webhooks.resetWebhookEndpointSecret(endpoint.id)).secret; }
else { say(`webhook create   ${hookUrl}  events: ${events.join(', ')}`); if (apply) { endpoint = await client.webhooks.createWebhookEndpoint({ url: hookUrl, name: 'For Real Academy', format: 'raw', api_version: '2026-10', events }); secret = endpoint.secret; } }
if (endpoint && endpoint.enabled === false && apply) { await client.webhooks.updateWebhookEndpoint(endpoint.id, { enabled: true }); say('webhook re-enabled'); }

// 3. Vercel env vars (values go over stdin, never argv or output)
const vercel = process.env.VERCEL_BIN || 'vercel';
const extra = (process.env.VERCEL_ARGS || '').split(/\s+/).filter(Boolean);
const setEnv = (name, value, sensitive = true) => {
  say(`vercel env      ${name} (production${sensitive ? ', sensitive' : ''})`);
  if (!apply) return true;
  const r = spawnSync(vercel, ['env', 'add', name, 'production', ...(sensitive ? ['--sensitive'] : []), '--force', ...extra], { input: value, encoding: 'utf8' });
  if (r.error) { console.error(`  could not run ${vercel}: ${r.error.message}. Set VERCEL_BIN to the full path of the vercel CLI (see: which vercel).`); return false; }
  if (r.status !== 0) { console.error(`  failed to set ${name}: ${(r.stderr || r.stdout || '').trim().split('\n').pop()}`); return false; }
  return true;
};
let ok = setEnv('POLAR_ACCESS_TOKEN', token) && setEnv('NEXT_PUBLIC_SITE_URL', site, false);
if (server === 'sandbox') ok = setEnv('POLAR_SERVER', 'sandbox', false) && ok;
if (secret) ok = setEnv('POLAR_WEBHOOK_SECRET', secret) && ok;
else if (apply && !endpoint) ok = false;

if (apply && firstProduct) {
  try { const co = await client.checkouts.create({ products: [firstProduct.id], customer_email: `setup-check@${new URL(site).hostname.replace(/^www\./, '')}` }); say(`checkout API OK (${co.id}); it expires unused, nothing is charged`); }
  catch (e) { console.error('Checkout test failed:', e.message); ok = false; }
}
console.log(apply ? (ok ? '\nDone. Redeploy the project so the new env vars apply, then check /api/status and run a 100%-discount test purchase.' : '\nFinished with errors, see above.') : '\nDry run only. Re-run with --apply.');
process.exit(ok || !apply ? 0 : 1);
