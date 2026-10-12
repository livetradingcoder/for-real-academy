// Server-side course catalogue: ids, module counts and which courses a purchase unlocks.
// Prices are NOT here: Polar products are the price authority. config.js shows display prices only.
export const COURSES = {
  'web-launch': { title: 'Launch Your First Website', modules: 6 },
  'ai-tools': { title: 'AI Tools for Everyday Work', modules: 6 },
  'ai-web-apps': { title: 'Build Web Apps with AI Coding Assistants', modules: 8 },
  bundle: { title: 'Complete Bundle', modules: 0, includes: ['web-launch', 'ai-tools', 'ai-web-apps'] },
  // Timed pass: unlocks every course for `validityDays` from payment. One payment only.
  'platform-access': { title: 'Platform Access', modules: 0, includes: ['web-launch', 'ai-tools', 'ai-web-apps'], validityDays: 3, plans: ['full'] }
};
export const PLANS = ['full', 'split'];
export const plansFor = id => COURSES[id]?.plans || PLANS;
export const expiryFor = (id, from = Date.now()) => COURSES[id]?.validityDays ? new Date(from + COURSES[id].validityDays * 86400000) : null;
export const INSTALMENTS = 3;
export const grants = id => COURSES[id]?.includes || [id];
