// Creates the Polar products this site sells (one per course and payment plan), tagged with metadata
// { academy_course, academy_plan } so /api/checkout can find them. Safe to re-run: existing products are skipped.
//
//   POLAR_ACCESS_TOKEN=polar_oat_... node scripts/polar-setup.mjs           # dry run: prints what it would create
//   POLAR_ACCESS_TOKEN=polar_oat_... node scripts/polar-setup.mjs --create  # actually creates them
//
// Set POLAR_SERVER=sandbox to target Polar's sandbox. Prices come from config.js (USD).
import fs from 'node:fs';
import vm from 'node:vm';
import { createPolar } from '@polar-sh/sdk/2026-10';

globalThis.window = {};
vm.runInThisContext(fs.readFileSync(new URL('../config.js', import.meta.url), 'utf8'));
const courses = window.ACADEMY.courses;
const create = process.argv.includes('--create');
const accessToken = process.env.POLAR_ACCESS_TOKEN;
if (!accessToken) { console.error('Set POLAR_ACCESS_TOKEN'); process.exit(1); }
const client = createPolar({ accessToken, environment: process.env.POLAR_SERVER === 'sandbox' ? 'sandbox' : 'production' });

for (const c of courses) {
  for (const plan of ['full', 'split']) {
    const found = await client.products.list({ metadata: { academy_course: c.id, academy_plan: plan }, is_archived: false, limit: 5 });
    if (found.items.some(p => p.metadata?.academy_course === c.id && p.metadata?.academy_plan === plan)) { console.log(`exists   ${c.id} / ${plan}`); continue; }
    const cents = Math.round((plan === 'full' ? c.price : c.installments.each) * 100);
    const body = {
      name: plan === 'full' ? c.title : `${c.title} (${c.installments.count} monthly payments)`,
      description: c.blurb,
      metadata: { academy_course: c.id, academy_plan: plan },
      prices: [{ amount_type: 'fixed', price_currency: 'usd', price_amount: cents }],
      ...(plan === 'split' ? { recurring_interval: 'month', recurring_interval_count: 1 } : {})
    };
    console.log(`${create ? 'creating' : 'would create'} ${c.id} / ${plan}  $${cents / 100}${plan === 'split' ? '/month' : ''}`);
    if (create) await client.products.create(body);
  }
}
if (!create) console.log('\nDry run only. Re-run with --create to create these products.');
