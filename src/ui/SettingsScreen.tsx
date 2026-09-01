import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaFloppyDisk } from 'react-icons/fa6';
import { getGame, getSettings, saveGame, saveSettings } from '../db';
import { applyTheme, THEMES } from '../theme/themes';
import TerminalHeader from './TerminalHeader';
import { SUPPORTED_LOCALES, type LocaleCode, type Settings } from '../types';
import { notify } from './toast-bus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
      const s = await getSettings();
      setSettings(s);
      const g = await getGame();
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
      notify('Need at least one OCR language');
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
    const num = parseFloat(monthlyBudget);
    if (!Number.isFinite(num) || num < 0) {
      notify('Invalid budget');
      return;
    }
    await saveGame({ monthlyBudget: num });
    notify('Budget saved');
  }

  if (!settings) return null;

  return (
    <div className="max-w-md mx-auto p-4 flex flex-col gap-4 min-h-screen">
      <TerminalHeader route="SETTINGS" />

      <div className="flex items-center justify-between">
        <h1 className="wmg-title">[ SETTINGS ]</h1>
        <Button variant="ghost" size="sm" onClick={() => navigate('/receipts')}>
          <FaArrowLeft /> Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="wmg-pixel">THEME</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="wmg-pixel">OCR LANGUAGES</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-xs text-[var(--wmg-fg-dim)]">
            Languages Tesseract will recognize on receipts. More = larger worker download.
          </p>
          {SUPPORTED_LOCALES.map((code) => {
            const active = settings.ocrLanguages.includes(code);
            return (
              <div key={code} className="flex items-center justify-between gap-2">
                <Label htmlFor={`ocr-${code}`}>{LOCALE_LABEL[code]}</Label>
                <Switch
                  id={`ocr-${code}`}
                  checked={active}
                  onCheckedChange={() => toggleOcrLang(code)}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="wmg-pixel">DATE FORMAT</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={settings.dateLocale}
            onValueChange={(v) => pickDateLocale(v as LocaleCode)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LOCALES.map((code) => (
                <SelectItem key={code} value={code}>
                  {LOCALE_LABEL[code]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="wmg-pixel">NUMBER FORMAT</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={settings.numberLocale}
            onValueChange={(v) => pickNumberLocale(v as LocaleCode)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LOCALES.map((code) => (
                <SelectItem key={code} value={code}>
                  {LOCALE_LABEL[code]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="wmg-pixel">MONTHLY BUDGET</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-[var(--wmg-fg-dim)] mb-2">
            Used for HP calculation. Leave 0 to disable.
          </p>
          <div className="flex gap-2">
            <Input
              type="number"
              min="0"
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(e.target.value)}
              onBlur={saveBudget}
              className="flex-1"
            />
            <Button onClick={saveBudget}>
              <FaFloppyDisk /> SAVE
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="wmg-pixel">ABOUT</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="wmg-pixel text-[0.5rem] text-[var(--wmg-fg-dim)]">
            Where Money Gone — v2.2
          </p>
          <p className="text-[var(--wmg-fg-dim)] text-xs mt-1">
            Local-only. No cloud. No backup. You are the backup.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
