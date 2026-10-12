export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });
}

export const bad = (msg, status = 400) => json({ error: msg }, status);

export async function body(req) {
  try { return await req.json(); } catch { return {}; }
}

// Cookie-authenticated POSTs must come from our own origin.
export function sameOrigin(req) {
  const origin = req.headers.get('origin');
  if (!origin) return req.headers.get('sec-fetch-site') !== 'cross-site';
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  try { return new URL(origin).host === host; } catch { return false; }
}

const hits = new Map();
// Best-effort per-instance limiter; scrypt cost is the real brake on guessing.
export function limited(req, key, max = 10, windowMs = 60000) {
  const ip = (req.headers.get('x-forwarded-for') || 'local').split(',')[0].trim();
  const k = key + ':' + ip, now = Date.now();
  const arr = (hits.get(k) || []).filter(t => now - t < windowMs);
  arr.push(now); hits.set(k, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > max;
}

export function siteUrl(req) {
  const env = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (env) return env.replace(/\/$/, '');
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || (/^localhost|^127\./.test(host) ? 'http' : 'https');
  return `${proto}://${host}`;
}
