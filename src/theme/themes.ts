// 6 CRT-style themes. Pure CSS custom properties — Tailwind reads them at runtime.
// ponytail: theme values are static; no need for a state machine or context.
// Add a theme by adding a `theme-<name>` body class + entries here.

export interface Theme {
  id: string;
  name: string;
  bg: string;        // body background
  surface: string;   // card / panel background
  fg: string;        // primary text
  fgDim: string;     // secondary text, borders
  fgBright: string;  // headings, emphasis
  accent: string;    // highlights, links
  danger: string;    // errors, danger state
  warning: string;   // warnings, mid-bad HP
}

export const THEMES: Record<string, Theme> = {
  green: {
    id: 'green',
    name: 'Classic Green Phosphor',
    bg: '#0a0a0a',
    surface: '#111111',
    fg: '#00ff41',
    fgDim: '#008822',
    fgBright: '#aaffaa',
    accent: '#00ff41',
    danger: '#ff3333',
    warning: '#ffcc00',
  },
  amber: {
    id: 'amber',
    name: 'Amber Terminal',
    bg: '#0a0a0a',
    surface: '#1a1100',
    fg: '#ffb000',
    fgDim: '#996600',
    fgBright: '#ffdd88',
    accent: '#ffb000',
    danger: '#ff5500',
    warning: '#ffee00',
  },
  fallout: {
    id: 'fallout',
    name: 'Fallout Blue',
    bg: '#1a1a2e',
    surface: '#222244',
    fg: '#99ccff',
    fgDim: '#5577aa',
    fgBright: '#cce0ff',
    accent: '#99ccff',
    danger: '#ff6644',
    warning: '#ffcc66',
  },
  crimson: {
    id: 'crimson',
    name: 'Crimson Alert',
    bg: '#0a0a0a',
    surface: '#1a0000',
    fg: '#ff0040',
    fgDim: '#880022',
    fgBright: '#ff8899',
    accent: '#ff0040',
    danger: '#ff0040',
    warning: '#ffaa00',
  },
  c64: {
    id: 'c64',
    name: 'C64 Nostalgia',
    bg: '#40318d',
    surface: '#5040a0',
    fg: '#706deb',
    fgDim: '#a099cc',
    fgBright: '#cce0ff',
    accent: '#b8b0ff',
    danger: '#ff7777',
    warning: '#ffcc66',
  },
  night: {
    id: 'night',
    name: 'Terminal Night',
    bg: '#111111',
    surface: '#1c1c1c',
    fg: '#00ff88',
    fgDim: '#007744',
    fgBright: '#88ffcc',
    accent: '#00ff88',
    danger: '#ff5555',
    warning: '#ffdd55',
  },
};

export const DEFAULT_THEME = 'green';

// Inject theme CSS vars onto <body class="theme-X">. One-time on mount.
export function applyTheme(themeId: string): void {
  const t = THEMES[themeId] ?? THEMES[DEFAULT_THEME];
  const root = document.documentElement;
  root.style.setProperty('--wmg-bg', t.bg);
  root.style.setProperty('--wmg-surface', t.surface);
  root.style.setProperty('--wmg-fg', t.fg);
  root.style.setProperty('--wmg-fg-dim', t.fgDim);
  root.style.setProperty('--wmg-fg-bright', t.fgBright);
  root.style.setProperty('--wmg-accent', t.accent);
  root.style.setProperty('--wmg-danger', t.danger);
  root.style.setProperty('--wmg-warning', t.warning);
  document.body.classList.remove(...Object.keys(THEMES).map((k) => `theme-${k}`));
  document.body.classList.add(`theme-${themeId}`);
}
