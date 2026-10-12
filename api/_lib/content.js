// Protected lesson content, served only to enrolled users by /api/lesson.
// Fill in per module: `video` (https embed URL, e.g. YouTube/Vimeo/Mux player) and `notes` (plain text, blank line = new paragraph).
// Index matches the module order in config.js. Left empty on purpose: no placeholder lesson content is invented.
export const CONTENT = {
  'web-launch': [],
  'ai-tools': [],
  'ai-web-apps': []
};

export function lesson(course, index) {
  const m = CONTENT[course]?.[index] || {};
  const video = typeof m.video === 'string' && m.video.startsWith('https://') ? m.video : '';
  return { video, notes: typeof m.notes === 'string' ? m.notes : '' };
}
