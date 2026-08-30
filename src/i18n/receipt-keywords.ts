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

// ponytail: 合计 = total, not subtotal. 小计 alone is the subtotal keyword.
const ZH: ReceiptKeywords = {
  total: ['合计', '总计', '应付', '应收', '总额', '实付', '总计应付'],
  subtotal: ['小计'],
  tax: ['税', '增值税', '消费税', '附加税'],
  item: ['品名', '项目', '商品', '数量', '名称'],
  qty: ['数量', 'x', '×'],
  skip: ['谢谢', '欢迎', '找零', '现金', '折扣', '电话', '地址', '收据', '小票'],
  currency: ['CNY', 'RMB', '¥', '￥', '元'],
  monthsShort: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
  monthsLong: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
};

const DE: ReceiptKeywords = {
  total: ['summe', 'gesamt', 'gesamtbetrag', 'zu zahlen', 'endbetrag', 'rechnungsbetrag'],
  subtotal: ['zwischensumme', 'subtotal', 'sub-total'],
  tax: ['mwst', 'ust', 'vat', 'steuer', 'tax'],
  item: ['pos', 'artikel', 'bezeichnung', 'menge'],
  qty: ['menge', 'anzahl', 'x', '×'],
  skip: ['danke', 'vielen dank', 'tschuess', 'auf wiedersehen', 'rueckgeld', 'bar', 'wechselgeld', 'telefon', 'tel', 'rechnung', 'quittung', 'adresse'],
  currency: ['EUR', '€', 'CHF', 'DEM'],
  monthsShort: ['jan', 'feb', 'mae', 'mrz', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dez'],
  monthsLong: ['januar', 'februar', 'maerz', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'dezember'],
};

const JA: ReceiptKeywords = {
  total: ['合計', '総計', 'お会計', 'お買上げ', '合計金額', '税込合計'],
  subtotal: ['小計'],
  tax: ['税', '消費税', '税金', '内税'],
  item: ['品名', '商品名', '項目', '数量'],
  qty: ['数量', 'x', '×'],
  skip: ['ありがとうございました', 'また', 'お預かり', 'お釣り', '現金', '電話', '住所', '領収書'],
  currency: ['JPY', '¥', '￥', '円'],
  monthsShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  monthsLong: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
};

export const KEYWORDS: Record<LocaleCode, ReceiptKeywords> = {
  en: EN,
  id: ID,
  zh: ZH,
  de: DE,
  ja: JA,
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
  const parts = words.map((w) => {
    const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // ponytail: word boundaries only make sense for Latin; CJK/Hangul would break.
    return /[a-zA-Z]/.test(w) ? `\\b${escaped}\\b` : escaped;
  });
  return new RegExp(`(?:${parts.join('|')})`, 'i');
}

export function buildSkipRegex(keywords: ReceiptKeywords): RegExp {
  const all = [...keywords.total, ...keywords.subtotal, ...keywords.tax, ...keywords.skip];
  return buildKeywordRegex(all);
}
