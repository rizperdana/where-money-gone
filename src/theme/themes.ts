// Two themes: light + dark. Driven by the `.dark` class on <html>.
// shadcn's index.css owns the actual oklch palette; this file just toggles classes
// and persists the choice via Settings.theme.
export type ThemeId = 'light' | 'dark';

export interface Theme {
  id: ThemeId;
  name: string;
}

export const THEMES: Record<ThemeId, Theme> = {
  light: { id: 'light', name: 'Light' },
  dark: { id: 'dark', name: 'Dark' },
};

export const DEFAULT_THEME: ThemeId = 'light';

export function applyTheme(themeId: string): void {
  const t: ThemeId = themeId === 'dark' ? 'dark' : 'light';
  const root = document.documentElement;
  if (t === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}
