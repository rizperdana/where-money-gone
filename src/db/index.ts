import Dexie, { type Table } from 'dexie';
import { DEFAULT_OCR_LANGS, type GameState, type Receipt, type Settings } from '../types';

export class WmgDB extends Dexie {
  receipts!: Table<Receipt, string>;
  settings!: Table<Settings, string>;
  gamification!: Table<GameState, string>;

  constructor() {
    super('where-money-gone');
    this.version(1).stores({
      receipts: 'id, createdAt, purchaseAt, merchant.normalized',
      settings: 'key',
    });
    // Tier 0.8: gamification table. Default seeded on first read.
    this.version(2).stores({
      receipts: 'id, createdAt, purchaseAt, merchant.normalized',
      settings: 'key',
      gamification: 'key',
    });
    // v3: no schema change; defaults seeded in getSettings() for new fields.
    this.version(3).stores({
      receipts: 'id, createdAt, purchaseAt, merchant.normalized, ocrLocale',
      settings: 'key',
      gamification: 'key',
    });
  }
}

export const db = new WmgDB();

const DEFAULT_SETTINGS: Settings = {
  key: 'app',
  activeLocationSource: 'user',
  defaultCurrency: '',
  theme: 'green',
  ocrLanguages: [...DEFAULT_OCR_LANGS],
  dateLocale: 'en',
  numberLocale: 'en',
};

const DEFAULT_GAME: GameState = {
  key: 'app',
  streak: { current: 0, best: 0, lastLogDate: null },
  rp: 0,
  achievements: [],
  monthlyBudget: 0,
};

export async function getSettings(): Promise<Settings> {
  return db.transaction('rw', db.settings, async () => {
    const existing = await db.settings.get('app');
    if (existing) {
      // One-time migration: c64 theme renamed to cobalt.
      let s = existing;
      if (s.theme === 'c64') s = { ...s, theme: 'cobalt' };
      // v3: backfill new locale fields.
      if (!s.ocrLanguages || !s.dateLocale || !s.numberLocale) {
        s = {
          ...s,
          ocrLanguages: s.ocrLanguages ?? [...DEFAULT_OCR_LANGS],
          dateLocale: s.dateLocale ?? 'en',
          numberLocale: s.numberLocale ?? 'en',
        };
        await db.settings.put(s);
      }
      return s;
    }
    await db.settings.put(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  });
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  return db.transaction('rw', db.settings, async () => {
    const current = (await db.settings.get('app')) ?? DEFAULT_SETTINGS;
    const next: Settings = { ...current, ...patch, key: 'app' };
    await db.settings.put(next);
    return next;
  });
}

export async function getGame(): Promise<GameState> {
  return db.transaction('r', db.gamification, async () => {
    const existing = await db.gamification.get('app');
    if (existing) return existing;
    await db.gamification.put(DEFAULT_GAME);
    return DEFAULT_GAME;
  });
}

export async function saveGame(patch: Partial<GameState>): Promise<GameState> {
  return db.transaction('rw', db.gamification, async () => {
    const current = (await db.gamification.get('app')) ?? DEFAULT_GAME;
    const next: GameState = { ...current, ...patch, key: 'app' };
    await db.gamification.put(next);
    return next;
  });
}

export function newId(): string {
  return crypto.randomUUID();
}
