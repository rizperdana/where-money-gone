// 2 themes: pixel-dark (16-bit deep purple) + pixel-light (warm parchment).
// Pure CSS custom properties.
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
  'pixel-dark': {
    id: 'pixel-dark',
    name: 'Pixel Dark',
    bg: '#0f0f23',
    surface: '#1a1a3e',
    fg: '#f8f8f8',
    fgDim: '#7b7bc8',
    fgBright: '#ffe07a',
    accent: '#ff6bff',
    danger: '#ff4040',
    warning: '#ffcc00',
  },
  'pixel-light': {
    id: 'pixel-light',
    name: 'Pixel Light',
    bg: '#f5eedc',
    surface: '#fffbf0',
    fg: '#1e1e1e',
    fgDim: '#7a7060',
    fgBright: '#1a237e',
    accent: '#c62828',
    danger: '#b71c1c',
    warning: '#f57f17',
  },
};

export const DEFAULT_THEME = 'pixel-dark';

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
  document.body.classList.add(`theme-${t.id}`);
}
