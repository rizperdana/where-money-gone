import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSettings, saveSettings } from '../db';
import { applyTheme, THEMES } from '../theme/themes';
import TerminalHeader from './TerminalHeader';
import type { Settings } from '../types';

export default function SettingsScreen() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  async function pickTheme(id: string) {
    applyTheme(id);
    const next = await saveSettings({ theme: id });
    setSettings(next);
  }

  if (!settings) return null;

  return (
    <div className="max-w-md mx-auto p-4 flex flex-col gap-4 min-h-screen">
      <TerminalHeader route="SETTINGS" />

      <div className="flex items-center justify-between">
        <h1 className="wmg-title">[ SETTINGS ]</h1>
        <button
          className="text-[var(--wmg-fg-dim)] text-sm"
          onClick={() => navigate('/receipts')}
        >
          [ BACK ]
        </button>
      </div>

      <section className="wmg-panel flex flex-col gap-3">
        <h2 className="wmg-pixel">THEME</h2>
        <div className="grid grid-cols-3 gap-2">
          {Object.values(THEMES).map((t) => {
            const active = settings.theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => pickTheme(t.id)}
                className={`wmg-panel hover:opacity-80 flex flex-col items-center gap-2 ${
                  active ? 'outline outline-2 outline-[var(--wmg-accent)]' : ''
                }`}
                style={{
                  background: t.surface,
                  color: t.fg,
                  borderColor: active ? t.accent : t.fgDim,
                }}
              >
                <span
                  className="w-6 h-6 border-2"
                  style={{ background: t.fg, borderColor: t.fgDim }}
                />
                <span className="wmg-pixel text-[0.5rem]">{t.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="wmg-panel flex flex-col gap-3">
        <h2 className="wmg-pixel">ABOUT</h2>
        <p className="wmg-modern text-sm">Where Money Gone — v1.1</p>
        <p className="text-[var(--wmg-fg-dim)] text-xs">
          Local-only. No cloud. No backup. You are the backup.
        </p>
      </section>
    </div>
  );
}
