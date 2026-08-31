// ponytail: keyword table is the only thing to edit when adding a new locale.
// add a LocaleCode to types.ts, add an entry here, done. No regex rewrites.

import type { LocaleCode } from '../types';

export interface ReceiptKeywords {
  total: string[];
  subtotal: string[];
  tax: string[];
  item: string[];
  qty: string[];
  skip: string[]; // "thank you", "change", etc. — these never become line items
  currency: string[]; // ISO codes + symbols
  monthsShort: string[]; // 12 month names, lowercase, 3-4 chars
  monthsLong: string[]; // 12 month names, lowercase
}

const EN: ReceiptKeywords = {
  total: ['total', 'grand total', 'amount due', 'balance due', 'sum'],
  subtotal: ['subtotal', 'sub-total', 'sub total'],
  tax: ['tax', 'vat', 'gst', 'sales tax'],
  item: ['item', 'description', 'qty', 'quantity'],
  qty: ['qty', 'quantity', 'x'],
  skip: ['thank you', 'welcome', 'receipt', 'change', 'cash', 'tender', 'discount', 'phone', 'tel', 'www', '.com', 'http', 'invoice'],
  currency: ['USD', 'EUR', 'GBP', 'JPY', 'SGD', 'IDR', 'MYR', 'THB', 'CNY', 'INR', 'AUD', 'CAD', 'NZD', '$', '€', '£', '¥'],
  monthsShort: ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'],
  monthsLong: ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'],
};

const ID: ReceiptKeywords = {
  total: ['total', 'jumlah', 'grand total', 'total bayar', 'total belanja', 'jumlah bayar'],
  subtotal: ['subtotal', 'sub-total', 'sub jumlah'],
  tax: ['pajak', 'ppn', 'tax'],
  item: ['item', 'nama barang', 'qty', 'jumlah', 'deskripsi'],
  qty: ['qty', 'jumlah', 'x', 'banyak'],
  skip: ['terima kasih', 'selamat', 'kembalian', 'tunai', 'diskon', 'telepon', 'telp', 'struk', 'nota', 'alamat'],
  currency: ['IDR', 'Rp', 'rp'],
  monthsShort: ['jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agu', 'sep', 'okt', 'nov', 'des'],
  monthsLong: ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember'],
};

export const KEYWORDS: Record<LocaleCode, ReceiptKeywords> = {
  en: EN,
  id: ID,
};

function buildMonthIndex(): Record<string, number> {
  const m: Record<string, number> = {};
  for (const code of Object.keys(KEYWORDS) as LocaleCode[]) {
    const k = KEYWORDS[code];
    k.monthsShort.forEach((name, i) => { m[name.toLowerCase()] = i + 1; });
    k.monthsLong.forEach((name, i) => { m[name.toLowerCase()] = i + 1; });
  }
  return m;
}

const MONTH_INDEX = buildMonthIndex();

export function getMonthIndex(name: string): number | null {
  return MONTH_INDEX[name.toLowerCase()] ?? null;
}

export function buildKeywordRegex(words: string[]): RegExp {
  if (words.length === 0) return /(?!)/; // never matches
  // ponytail: all current keywords are Latin, so \b always applies; symbols
  // (e.g. "$", "Rp", "¥") are escaped and don't get \b, which is what we want.
  const parts = words.map((w) => {
    const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return /[a-zA-Z]/.test(w) ? `\\b${escaped}\\b` : escaped;
  });
  return new RegExp(`(?:${parts.join('|')})`, 'i');
}

export function buildSkipRegex(keywords: ReceiptKeywords): RegExp {
  const all = [...keywords.total, ...keywords.subtotal, ...keywords.tax, ...keywords.skip];
  return buildKeywordRegex(all);
}
