// 3 themes: green phosphor, cobalt blue, light. Pure CSS custom properties.
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
    name: 'Green Phosphor',
    bg: '#0a0a0a',
    surface: '#111111',
    fg: '#00ff41',
    fgDim: '#008822',
    fgBright: '#aaffaa',
    accent: '#00ff41',
    danger: '#ff3333',
    warning: '#ffcc00',
  },
  cobalt: {
    id: 'cobalt',
    name: 'Cobalt Blue',
    bg: '#0a0e1a',
    surface: '#111726',
    fg: '#5eb3ff',
    fgDim: '#3a6da8',
    fgBright: '#b8dcff',
    accent: '#5eb3ff',
    danger: '#ff5577',
    warning: '#ffcc00',
  },
  light: {
    id: 'light',
    name: 'Daylight',
    bg: '#f5f1e8',
    surface: '#ffffff',
    fg: '#1a4d2e',
    fgDim: '#7a8a7e',
    fgBright: '#0d2818',
    accent: '#ff6b35',
    danger: '#d63031',
    warning: '#fdcb6e',
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
  document.body.classList.add(`theme-${t.id}`);
}
