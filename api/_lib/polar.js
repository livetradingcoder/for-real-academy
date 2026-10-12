import { createPolar } from '@polar-sh/sdk/2026-10';

export function polarConfigured() {
  return !!(process.env.POLAR_ACCESS_TOKEN && process.env.POLAR_WEBHOOK_SECRET);
}

export function polar() {
  const accessToken = process.env.POLAR_ACCESS_TOKEN?.trim();
  if (!accessToken) throw new Error('POLAR_ACCESS_TOKEN is not set');
  return createPolar({
    accessToken,
    environment: process.env.POLAR_SERVER === 'sandbox' ? 'sandbox' : 'production',
    ...(process.env.POLAR_BASE_URL ? { baseUrl: process.env.POLAR_BASE_URL } : {})
  });
}

// Products are tagged in Polar with metadata { academy_course, academy_plan }.
export async function findProduct(client, course, plan) {
  const res = await client.products.list({ metadata: { academy_course: course, academy_plan: plan }, is_archived: false, limit: 5 });
  const items = res?.items ?? res?.result?.items ?? [];
  return items.find(p => p.metadata?.academy_course === course && p.metadata?.academy_plan === plan) || null;
}
