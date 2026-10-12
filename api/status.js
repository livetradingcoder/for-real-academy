import { json } from './_lib/http.js';

// Booleans only: which settings the running deployment can see.
export function GET() {
  const e = process.env;
  return json({
    database: !!e.DATABASE_URL,
    session: !!(e.SESSION_SECRET && e.SESSION_SECRET.length >= 32),
    polar: { accessToken: !!e.POLAR_ACCESS_TOKEN, webhookSecret: !!e.POLAR_WEBHOOK_SECRET, server: e.POLAR_SERVER === 'sandbox' ? 'sandbox' : 'production' },
    siteUrl: !!(e.NEXT_PUBLIC_SITE_URL || e.SITE_URL)
  });
}
