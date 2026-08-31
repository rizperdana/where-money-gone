import type { LineItem, LocaleCode, ParsedReceipt, ParseStatus } from '../types';
import {
  KEYWORDS,
  buildKeywordRegex,
  buildSkipRegex,
  getMonthIndex,
  type ReceiptKeywords,
} from '../i18n/receipt-keywords';

// Symbol -> ISO. ¥ ambiguous (JPY/CNY); default JPY for v1.
const CURRENCY_SYMBOLS: Record<string, string> = {
  $: 'USD',
  '€': 'EUR',
  '£': 'GBP',
  '¥': 'JPY',
  '₹': 'INR',
  Rp: 'IDR',
};
const CURRENCY_CODE_RE = /\b(USD|EUR|GBP|JPY|SGD|IDR|MYR|THB|INR|AUD|CAD|NZD)\b/;

// ponytail: only en+id are user-facing. Non-Latin scripts (Cyrillic, Arabic,
// Devanagari, Thai) still fall through to 'en' for the parser — not exposed in UI.
const SCRIPT_RANGES: Array<{ re: RegExp; locale: LocaleCode }> = [
  { re: /[\u0400-\u04FF]/, locale: 'en' },
  { re: /[\u0600-\u06FF]/, locale: 'en' },
  { re: /[\u0900-\u097F]/, locale: 'en' },
  { re: /[\u0E00-\u0E7F]/, locale: 'en' },
];

export function detectLocale(text: string): LocaleCode {
  for (const { re, locale } of SCRIPT_RANGES) {
    if (re.test(text)) return locale;
  }
  return 'en';
}

function normalizeMerchant(raw: string | null): string | null {
  if (!raw) return null;
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => (w.length <= 3 ? w : w[0].toUpperCase() + w.slice(1)))
    .join(' ') || null;
}

// Parse a monetary token (digits, dots, commas) into a number.
function toAmount(s: string): number | null {
  if (!s) return null;
  // EU: "2,50" or "1.234,56" — comma is decimal, dot is thousands.
  // US: "2.50" or "1,234.56" — dot is decimal, comma is thousands.
  // ponytail: detect by the LAST separator: if last is comma → EU, else US.
  const trimmed = s.trim();
  const hasDot = trimmed.includes('.');
  const hasComma = trimmed.includes(',');
  let normalized: string;
  if (hasDot && hasComma) {
    if (trimmed.lastIndexOf(',') > trimmed.lastIndexOf('.')) {
      normalized = trimmed.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = trimmed.replace(/,/g, '');
    }
  } else if (hasComma) {
    // Could be EU decimal (one comma, two digits after) or US thousands.
    const parts = trimmed.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      normalized = `${parts[0]}.${parts[1]}`;
    } else {
      normalized = parts.join('');
    }
  } else {
    normalized = trimmed;
  }
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : null;
}
// Pull the most money-like amount from a line: prefer 2-decimal values, take last.
function extractAmount(line: string): number | null {
  const matches = line.match(/\d[\d.,]*/g);
  if (!matches || matches.length === 0) return null;
  // ponytail: take LAST token, prefer money-shaped (2 decimals). Money-shaped wins;
  // otherwise the trailing number on the line is usually the line total.
  const moneyToken = [...matches].reverse().find((m) => /^\d+[.,]\d{2}$/.test(m));
  const candidate = moneyToken ?? matches[matches.length - 1];
  return toAmount(candidate);
}

function parseDateLine(line: string): number | null {
  // ISO YYYY-MM-DD
  const iso = line.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (iso) return Date.UTC(+iso[1], +iso[2] - 1, +iso[3]);
  // DD/MM/YYYY or MM/DD/YYYY — assume US when ambiguous (ponytail: detect via year position)
  const slash = line.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/);
  if (slash) {
    const a = +slash[1];
    const b = +slash[2];
    let y = +slash[3];
    if (y < 100) y += 2000;
    // ponytail: if first part > 12, it must be day (DD/MM). Otherwise assume US (MM/DD).
    if (a > 12) return Date.UTC(y, b - 1, a);
    return Date.UTC(y, a - 1, b);
  }
  // ponytail: try every locale's month table — covers en "15 mar 2026" / id "15 mar 2026"
  const m1 = line.match(/\b(\d{1,2})[ ]?([A-Za-z]{3,10})[ ,]+(20\d{2})\b/);
  if (m1) {
    const monthIdx = getMonthIndex(m1[2]);
    if (monthIdx !== null) return Date.UTC(+m1[3], monthIdx - 1, +m1[1]);
  }
  const m2 = line.match(/\b([A-Za-z]{3,10})[ ]?(\d{1,2}),?[ ]?(20\d{2})\b/);
  if (m2) {
    const monthIdx = getMonthIndex(m2[1]);
    if (monthIdx !== null) return Date.UTC(+m2[3], monthIdx - 1, +m2[2]);
  }
  return null;
}

function detectCurrency(text: string): string | null {
  // Symbols first — single char wins regardless of order.
  for (const [sym, code] of Object.entries(CURRENCY_SYMBOLS)) {
    if (text.includes(sym)) return code;
  }
  const codeMatch = text.match(CURRENCY_CODE_RE);
  if (codeMatch) return codeMatch[1];
  return null;
}

function findAmountNearKeyword(lines: string[], kwRe: RegExp, exclude?: RegExp[]): number | null {
  const excl = exclude ?? [];
  for (let i = 0; i < lines.length; i++) {
    if (!kwRe.test(lines[i])) continue;
    // First try: same line.
    const inline = extractAmount(lines[i]);
    if (inline !== null) return inline;
    // Fallback: next non-empty line.
    for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
      if (excl.some((re) => re.test(lines[j]))) continue;
      const v = extractAmount(lines[j]);
      if (v !== null) return v;
    }
  }
  return null;
}
// ponytail: qty×unit_price line shapes vary; this regex covers the 4 common ones in 1 pass.
const QTY_LINE_RE = /^(.+?)\s+(\d+)\s*[x×]\s*(\d[\d.,]*)\s+(\d[\d.,]*)\s*$/;

function parseLineItems(lines: string[], skip: RegExp): LineItem[] {
  const items: LineItem[] = [];
  for (const line of lines) {
    if (skip.test(line)) continue;
    // 1) qty × unit_price total
    const qtyMatch = line.match(QTY_LINE_RE);
    if (qtyMatch) {
      const desc = qtyMatch[1].trim();
      const qty = +qtyMatch[2];
      const unit = toAmount(qtyMatch[3]);
      const total = toAmount(qtyMatch[4]);
      if (unit !== null || total !== null) {
        items.push({ description: desc, qty, unitPrice: unit, total });
        continue;
      }
    }
    // 2) bare item + amount
    const m = line.match(/^(.+?)\s+(\d[\d.,]*)\s*$/);
    if (!m) continue;
    const desc = m[1].trim();
    if (desc.length < 2) continue;
    // skip lines where the description is itself a keyword (e.g. "TOTAL 5.50" shouldn't add an item).
    if (skip.test(desc)) continue;
    const amt = toAmount(m[2]);
    if (amt === null) continue;
    items.push({ description: desc, qty: null, unitPrice: null, total: amt });
  }
  return items;
}

function mergeKeywords(list: ReceiptKeywords[]): ReceiptKeywords {
  const out: ReceiptKeywords = {
    total: [],
    subtotal: [],
    tax: [],
    item: [],
    qty: [],
    skip: [],
    currency: [],
    monthsShort: [],
    monthsLong: [],
  };
  for (const k of list) {
    out.total.push(...k.total);
    out.subtotal.push(...k.subtotal);
    out.tax.push(...k.tax);
    out.item.push(...k.item);
    out.qty.push(...k.qty);
    out.skip.push(...k.skip);
    out.currency.push(...k.currency);
    out.monthsShort.push(...k.monthsShort);
    out.monthsLong.push(...k.monthsLong);
  }
  // dedupe
  for (const key of Object.keys(out) as Array<keyof ReceiptKeywords>) {
    out[key] = Array.from(new Set(out[key]));
  }
  return out;
}

export function parseReceipt(ocrText: string, ocrConfidence: number, locale?: LocaleCode): ParsedReceipt {
  const detected: LocaleCode = locale ?? detectLocale(ocrText);
  // ponytail: EN + ID share Latin script. Unioning both so Indonesian PPN, IDR,
  // terima kasih, etc. parse in an otherwise-English receipt.
  const keywords: ReceiptKeywords = detected === 'en'
    ? mergeKeywords([KEYWORDS.en, KEYWORDS.id])
    : KEYWORDS[detected];

  const rawLines = ocrText.split(/\r?\n/);
  const lines = rawLines.map((l) => l.trim()).filter((l) => l.length > 0);

  // Merchant: first non-empty line that isn't a date or a pure number.
  let merchantRaw: string | null = null;
  for (const l of lines) {
    if (parseDateLine(l) !== null) continue;
    if (/^\d+([.,]\d+)?$/.test(l)) continue;
    if (buildSkipRegex(keywords).test(l)) continue;
    merchantRaw = l;
    break;
  }
  const merchantNormalized = normalizeMerchant(merchantRaw);

  // Date: first line that parses.
  let purchaseAt: number | null = null;
  for (const l of lines) {
    const d = parseDateLine(l);
    if (d !== null) { purchaseAt = d; break; }
  }

  // Currency.
  const currency = detectCurrency(ocrText);
  // Total: prefer total kw; exclude subtotal/tax near it.
  const totalRe = buildKeywordRegex(keywords.total);
  const subtotalRe = buildKeywordRegex(keywords.subtotal);
  const taxRe = buildKeywordRegex(keywords.tax);
  const total = findAmountNearKeyword(lines, totalRe, [subtotalRe, taxRe]);

  const subtotal = findAmountNearKeyword(lines, subtotalRe, [totalRe, taxRe]);
  const tax = findAmountNearKeyword(lines, taxRe, [totalRe, subtotalRe]);

  const lineItems = parseLineItems(lines, buildSkipRegex(keywords));

  const parseStatus: ParseStatus =
    ocrConfidence < 40 || !merchantRaw || total === null
      ? 'pending'
      : 'parsed';

  return {
    merchantRaw,
    merchantNormalized,
    purchaseAt,
    currency,
    total,
    subtotal,
    tax,
    lineItems,
    parseStatus,
    locale: detected,
  };
}
