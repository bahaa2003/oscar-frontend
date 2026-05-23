import { resolveImageUrl } from './imageUrl';

const AVATAR_PALETTES = [
  ['#06b6d4', '#7c3aed', '#d946ef'],
  ['#0ea5e9', '#2563eb', '#a855f7'],
  ['#14b8a6', '#0284c7', '#7c3aed'],
  ['#f59e0b', '#ef4444', '#d946ef'],
  ['#22c55e', '#14b8a6', '#0ea5e9'],
  ['#8b5cf6', '#ec4899', '#f97316'],
];

const isUiAvatarUrl = (value) => /\/\/ui-avatars\.com\//i.test(String(value || ''));

const hashString = (value) => {
  const text = String(value || 'OSCAR STORE');
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
};

const getInitials = (value) => {
  const parts = String(value || 'OSCAR USER')
    .replace(/[^\p{L}\p{N}\s._-]/gu, ' ')
    .split(/[\s._-]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) return 'OU';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
};

export const getDefaultAvatarUrl = (identity = 'OSCAR USER') => {
  const seed = String(identity || 'OSCAR USER').trim() || 'OSCAR USER';
  const palette = AVATAR_PALETTES[hashString(seed) % AVATAR_PALETTES.length];
  const initials = getInitials(seed);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-label="${initials}">
      <defs>
        <linearGradient id="bg" x1="30" y1="18" x2="224" y2="238" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="${palette[0]}"/>
          <stop offset="0.52" stop-color="${palette[1]}"/>
          <stop offset="1" stop-color="${palette[2]}"/>
        </linearGradient>
        <radialGradient id="shine" cx="35%" cy="20%" r="65%">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.62"/>
          <stop offset="0.34" stop-color="#ffffff" stop-opacity="0.18"/>
          <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
        </radialGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#020617" flood-opacity="0.26"/>
        </filter>
      </defs>
      <rect width="256" height="256" rx="68" fill="url(#bg)"/>
      <rect width="256" height="256" rx="68" fill="url(#shine)"/>
      <circle cx="208" cy="48" r="34" fill="#ffffff" opacity="0.12"/>
      <circle cx="42" cy="212" r="50" fill="#ffffff" opacity="0.1"/>
      <path d="M67 191c8-35 31-56 61-56s53 21 61 56" fill="none" stroke="#ffffff" stroke-width="18" stroke-linecap="round" opacity="0.88" filter="url(#softShadow)"/>
      <circle cx="128" cy="91" r="38" fill="#ffffff" opacity="0.9" filter="url(#softShadow)"/>
      <text x="128" y="216" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="800" fill="#ffffff" opacity="0.92">${initials}</text>
      <path d="M72 44l8 16 17 3-13 12 3 17-15-8-15 8 3-17-13-12 17-3 8-16z" fill="#ffffff" opacity="0.34"/>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export const resolveUserAvatar = (source, fallbackIdentity = 'OSCAR USER') => {
  const isObject = source && typeof source === 'object';
  const rawAvatar = isObject ? source.avatar : source;
  const identity = String(
    fallbackIdentity
    || (isObject ? (source.name || source.username || source.email) : '')
    || 'OSCAR USER'
  ).trim();
  const resolved = resolveImageUrl(rawAvatar);

  if (resolved && !isUiAvatarUrl(resolved)) {
    return resolved;
  }

  return getDefaultAvatarUrl(identity);
};

