import Dexie, { type Table } from 'dexie';
import type { Receipt, Settings } from '../types';

export class WmgDB extends Dexie {
  receipts!: Table<Receipt, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super('where-money-gone');
    this.version(1).stores({
      // Index on these fields; non-listed fields are still stored. Captured == createdAt.
      receipts: 'id, createdAt, purchaseAt, merchant.normalized',
      settings: 'key',
    });
  }
}

export const db = new WmgDB();

// ponytail: single-row settings table keyed by 'app'; auto-seed on first read.
const DEFAULT_SETTINGS: Settings = {
  key: 'app',
  activeLocationSource: 'user',
  defaultCurrency: '',
};

export async function getSettings(): Promise<Settings> {
  const existing = await db.settings.get('app');
  if (existing) return existing;
  await db.settings.put(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  await db.settings.put({ ...current, ...patch, key: 'app' });
}

export function newId(): string {
  // ponytail: crypto.randomUUID is ubiquitous on modern mobile browsers; no dep needed.
  return crypto.randomUUID();
}
