/**
 * Hacker handles and high-tech stealth avatar generator
 */

const OPERATIVE_PREFIXES = [
  'CIPHER', 'GHOST', 'HEX', 'ROOT', 'NULL', 'SPECTRE', 'PHANTOM', 'NEXUS',
  'VECTOR', 'ZERO', 'KERNEL', 'SYN', 'ACK', 'SHADOW', 'PROXY', 'CORONA',
  'STATIC', 'VALKYRIE', 'APEX', 'VORTEX', 'COBALT', 'TITAN', 'VOLT', 'ONYX'
];

const OPERATIVE_TAGS = [
  '0x01', '0x44', '0x99', '0xFF', '_SEC', '_DEV', '404', '8080',
  '007', '_NET', '_OPS', 'SYS', 'EXE', '_RAW', '1337', '_V2'
];

const HACKER_PALETTES = [
  { bg: '#052e16', accent: '#00ff88', text: '#dcfce7', border: '#14532d' }, // Matrix Green
  { bg: '#083344', accent: '#00f0ff', text: '#cffafe', border: '#155e75' }, // Cyber Cyan
  { bg: '#311042', accent: '#d946ef', text: '#fae8ff', border: '#701a75' }, // Neon Purple
  { bg: '#422006', accent: '#ffb700', text: '#fef3c7', border: '#78350f' }, // Amber Terminal
  { bg: '#450a0a', accent: '#ff3366', text: '#ffe4e6', border: '#881337' }, // Red Alert
  { bg: '#0f172a', accent: '#38bdf8', text: '#f0f9ff', border: '#1e293b' }, // Obsidian Blue
];

export function generateRandomName() {
  const prefix = OPERATIVE_PREFIXES[Math.floor(Math.random() * OPERATIVE_PREFIXES.length)];
  const tag = OPERATIVE_TAGS[Math.floor(Math.random() * OPERATIVE_TAGS.length)];
  return `${prefix}${tag}`;
}

export function getColorForString(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % HACKER_PALETTES.length;
  return HACKER_PALETTES[index];
}

/**
 * Returns a sleek technical / terminal cyber badge SVG
 */
export function getAvatarSvg(seed = 'user') {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = getColorForString(seed);
  const initials = seed.substring(0, 2).toUpperCase();

  const type = Math.abs(hash) % 4;
  let glyph = '';

  if (type === 0) {
    // Reticle Target / Scope
    glyph = `
      <circle cx="50" cy="50" r="32" fill="none" stroke="${color.accent}" stroke-width="1.5" stroke-dasharray="8 4" />
      <circle cx="50" cy="50" r="20" fill="none" stroke="${color.accent}" stroke-width="1" opacity="0.6" />
      <line x1="50" y1="10" x2="50" y2="28" stroke="${color.accent}" stroke-width="2" />
      <line x1="50" y1="72" x2="50" y2="90" stroke="${color.accent}" stroke-width="2" />
      <line x1="10" y1="50" x2="28" y2="50" stroke="${color.accent}" stroke-width="2" />
      <line x1="72" y1="50" x2="90" y2="50" stroke="${color.accent}" stroke-width="2" />
      <text x="50" y="55" font-family="monospace" font-size="14" font-weight="700" fill="${color.accent}" text-anchor="middle" letter-spacing="1">${initials}</text>
    `;
  } else if (type === 1) {
    // Hexagonal Circuit Node
    glyph = `
      <polygon points="50,16 80,33 80,67 50,84 20,67 20,33" fill="none" stroke="${color.accent}" stroke-width="2" />
      <polygon points="50,26 71,38 71,62 50,74 29,62 29,38" fill="${color.bg}" stroke="${color.accent}" stroke-width="1" opacity="0.8" />
      <text x="50" y="55" font-family="monospace" font-size="13" font-weight="800" fill="#ffffff" text-anchor="middle">${initials}</text>
    `;
  } else if (type === 2) {
    // Terminal Brackets & Crosshair
    glyph = `
      <rect x="18" y="18" width="64" height="64" rx="6" fill="${color.bg}" stroke="${color.accent}" stroke-width="1.5" />
      <path d="M 28 36 L 24 40 L 24 60 L 28 64" fill="none" stroke="${color.accent}" stroke-width="2" />
      <path d="M 72 36 L 76 40 L 76 60 L 72 64" fill="none" stroke="${color.accent}" stroke-width="2" />
      <text x="50" y="55" font-family="monospace" font-size="15" font-weight="700" fill="${color.accent}" text-anchor="middle">${initials}</text>
    `;
  } else {
    // Cyber Glitch Matrix Matrix
    glyph = `
      <circle cx="50" cy="50" r="34" fill="${color.bg}" stroke="${color.accent}" stroke-width="2" />
      <rect x="36" y="36" width="28" height="28" fill="none" stroke="${color.accent}" stroke-width="1" stroke-dasharray="3 3" />
      <text x="50" y="55" font-family="monospace" font-size="14" font-weight="800" fill="#ffffff" text-anchor="middle">${initials}</text>
    `;
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
      <rect width="100" height="100" rx="10" fill="#06090e" />
      <rect width="98" height="98" x="1" y="1" rx="9" fill="none" stroke="#1c2638" stroke-width="1" />
      ${glyph}
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}
