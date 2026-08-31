import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGame, getSettings, saveGame, saveSettings } from '../db';
import { applyTheme, THEMES } from '../theme/themes';
import TerminalHeader from './TerminalHeader';
import { SUPPORTED_LOCALES, type LocaleCode, type Settings } from '../types';
import { notify } from './toast-bus';

const LOCALE_LABEL: Record<LocaleCode, string> = {
  en: 'English',
  id: 'Bahasa Indonesia',
};

export default function SettingsScreen() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [monthlyBudget, setMonthlyBudget] = useState<string>('');

  useEffect(() => {
    (async () => {
      const [s, g] = await Promise.all([getSettings(), getGame()]);
      setSettings(s);
      setMonthlyBudget(g.monthlyBudget > 0 ? String(g.monthlyBudget) : '');
    })();
  }, []);

  async function pickTheme(id: string) {
    applyTheme(id);
    const next = await saveSettings({ theme: id });
    setSettings(next);
  }

  async function toggleOcrLang(code: LocaleCode) {
    if (!settings) return;
    const has = settings.ocrLanguages.includes(code);
    const next = has
      ? settings.ocrLanguages.filter((c) => c !== code)
      : [...settings.ocrLanguages, code];
    // ponytail: at least one OCR lang is required; refuse to leave it empty.
    if (next.length === 0) {
      notify('At least one OCR language required');
      return;
    }
    const updated = await saveSettings({ ocrLanguages: next });
    setSettings(updated);
  }

  async function pickDateLocale(code: LocaleCode) {
    const updated = await saveSettings({ dateLocale: code });
    setSettings(updated);
  }

  async function pickNumberLocale(code: LocaleCode) {
    const updated = await saveSettings({ numberLocale: code });
    setSettings(updated);
  }

  async function saveBudget() {
    const n = parseFloat(monthlyBudget);
    if (Number.isNaN(n) || n < 0) {
      notify('Budget must be a positive number');
      return;
    }
    await saveGame({ monthlyBudget: n });
    notify('Budget saved');
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
                  className="w-8 h-8 border-2"
                  style={{
                    background: `linear-gradient(135deg, ${t.fg} 0 50%, ${t.accent} 50% 100%)`,
                    borderColor: t.fgDim,
                    imageRendering: 'pixelated',
                  }}
                />
              </button>
            );
          })}
        </div>
      </section>

      <section className="wmg-panel flex flex-col gap-3">
        <h2 className="wmg-pixel">OCR LANGUAGES</h2>
        <p className="text-xs text-[var(--wmg-fg-dim)]">
          Languages Tesseract will recognize on receipts. More = larger worker download.
        </p>
        <div className="flex flex-col gap-1">
          {SUPPORTED_LOCALES.map((code) => {
            const active = settings.ocrLanguages.includes(code);
            return (
              <label key={code} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => toggleOcrLang(code)}
                />
                <span>{LOCALE_LABEL[code]}</span>
              </label>
            );
          })}
        </div>
      </section>

      <section className="wmg-panel flex flex-col gap-3">
        <h2 className="wmg-pixel">DATE FORMAT</h2>
        <select
          value={settings.dateLocale}
          onChange={(e) => pickDateLocale(e.target.value as LocaleCode)}
          className="bg-transparent border border-current/30 px-2 py-1"
        >
          {SUPPORTED_LOCALES.map((code) => (
            <option key={code} value={code}>
              {LOCALE_LABEL[code]}
            </option>
          ))}
        </select>
      </section>

      <section className="wmg-panel flex flex-col gap-3">
        <h2 className="wmg-pixel">NUMBER FORMAT</h2>
        <select
          value={settings.numberLocale}
          onChange={(e) => pickNumberLocale(e.target.value as LocaleCode)}
          className="bg-transparent border border-current/30 px-2 py-1"
        >
          {SUPPORTED_LOCALES.map((code) => (
            <option key={code} value={code}>
              {LOCALE_LABEL[code]}
            </option>
          ))}
        </select>
      </section>

      <section className="wmg-panel flex flex-col gap-3">
        <h2 className="wmg-pixel">MONTHLY BUDGET</h2>
        <p className="text-xs text-[var(--wmg-fg-dim)]">
          Used for HP calculation. Leave 0 to disable.
        </p>
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            value={monthlyBudget}
            onChange={(e) => setMonthlyBudget(e.target.value)}
            onBlur={saveBudget}
            className="flex-1 bg-transparent border border-current/30 px-2 py-1 outline-none"
          />
          <button
            className="wmg-panel px-3 py-1 text-sm"
            onClick={saveBudget}
          >
            SAVE
          </button>
        </div>
      </section>

      <section className="wmg-panel flex flex-col gap-3">
        <h2 className="wmg-pixel">ABOUT</h2>
        <p className="wmg-pixel text-[0.5rem] text-[var(--wmg-fg-dim)]">Where Money Gone — v2.1</p>
        <p className="text-[var(--wmg-fg-dim)] text-xs">
          Local-only. No cloud. No backup. You are the backup.
        </p>
      </section>
    </div>
  );
}
