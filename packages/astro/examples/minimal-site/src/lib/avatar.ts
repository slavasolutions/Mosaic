/**
 * Deterministic inline-SVG avatar for any Person record.
 *
 * No image asset needed — the avatar is a coloured circle with the
 * person's initials. Background hue is derived from the name so the
 * same name always produces the same avatar across both adapter sites.
 */

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function renderAvatar(name: string, size = 40): string {
  const hue = hashName(name) % 360;
  const bg = `hsl(${hue} 55% 62%)`;
  const fg = '#ffffff';
  const label = initials(name);
  const fontSize = Math.round(size * 0.42);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${name}">` +
    `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${bg}"/>` +
    `<text x="50%" y="50%" dy="0.06em" text-anchor="middle" dominant-baseline="middle" ` +
    `font-family="ui-sans-serif, -apple-system, BlinkMacSystemFont, sans-serif" ` +
    `font-size="${fontSize}" font-weight="600" fill="${fg}">${label}</text>` +
    `</svg>`
  );
}
