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
const CURRENCY_CODE_RE = /\b(USD|EUR|GBP|JPY|SGD|IDR|MYR|THB|CNY|INR|AUD|CAD|NZD)\b/;

// ponytail: script detection runs once per receipt, returns first script hit.
// Hiragana/Katakana = ja, CJK-only = zh; Latin = en; everything else falls back to en.
const SCRIPT_RANGES: Array<{ re: RegExp; locale: LocaleCode }> = [
  { re: /[\u3040-\u309F\u30A0-\u30FF]/, locale: 'ja' },
  { re: /[\u4E00-\u9FFF]/, locale: 'zh' },
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
  const t = raw.replace(/\s+/g, ' ').trim();
  if (!t) return null;
  return t.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

// Parse a monetary token (digits, dots, commas) into a number.
function toAmount(s: string): number | null {
  let t = s.trim();
  if (!t) return null;
  const hasDot = t.includes('.');
  const hasComma = t.includes(',');
  if (hasDot && hasComma) {
    // Last separator is the decimal point.
    if (t.lastIndexOf('.') > t.lastIndexOf(',')) {
      t = t.replace(/,/g, '');
    } else {
      t = t.replace(/\./g, '').replace(',', '.');
    }
  } else if (hasComma) {
    if (/,\d{3}\b/.test(t)) {
      t = t.replace(/,/g, '');
    } else {
      t = t.replace(',', '.'); // decimal comma
    }
  }
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : null;
}
// Pull the most money-like amount from a line: prefer 2-decimal values, keep the last.
// Pull the most money-like amount from a line: prefer 2-decimal values, take last.
function extractAmount(line: string): number | null {
  const tokens = line.match(/-?\d[\d.,]*\d|-?\d/g);
  if (!tokens) return null;
  let lastMoney: number | null = null;
  let last: number | null = null;
  for (const tk of tokens) {
    const n = toAmount(tk);
    if (n === null) continue;
    last = n;
    if (/\d[.,]\d{2}\b/.test(tk)) lastMoney = n;
  }
  // ponytail: money-shaped wins; if no money-shaped token, last number on the line wins.
  return lastMoney ?? last;
}

function parseDateLine(line: string): number | null {
  let m: RegExpMatchArray | null;
  // ISO YYYY-MM-DD / YYYY/MM/DD
  m = line.match(/\b(20\d{2})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])\b/);
  if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3]);
  // MM/DD/YYYY or DD/MM/YYYY (2-digit or 4-digit year)
  m = line.match(/\b(0?[1-9]|1[0-2])[/.-](0?[1-9]|[12]\d|3[01])[/.-](\d{2}|\d{4})\b/);
  if (m) {
    let year = +m[3];
    if (year < 100) year += 2000;
    const a = +m[1];
    const b = +m[2];
    let month: number;
    let day: number;
    if (a <= 12 && b > 12) {
      month = a; day = b;
    } else if (b <= 12 && a > 12) {
      month = b; day = a;
    } else {
      month = a; day = b; // assume MM/DD (US receipts)
    }
    return Date.UTC(year, month - 1, day);
  }
  // ponytail: try every locale's month table — covers 合计 + 15 mar 2026
  m = line.match(/\b(\d{1,2})[ ]?([A-Za-z\u4E00-\u9FFF]{3,10})[ ,]+(20\d{2})\b/);
  if (m) {
    const monthIdx = getMonthIndex(m[2]);
    if (monthIdx !== null) return Date.UTC(+m[3], monthIdx - 1, +m[1]);
  }
  m = line.match(/\b([A-Za-z\u4E00-\u9FFF]{3,10})[ ]?(\d{1,2}),?[ ]?(20\d{2})\b/);
  if (m) {
    const monthIdx = getMonthIndex(m[1]);
    if (monthIdx !== null) return Date.UTC(+m[3], monthIdx - 1, +m[2]);
  }
  return null;
}

function detectCurrency(text: string, locale: LocaleCode): string | null {
  const code = text.match(CURRENCY_CODE_RE);
  if (code) return code[1];
  // ponytail: locale symbols (Rp, 元, 円) don't appear in the global CURRENCY_CODE_RE.
  for (const sym of KEYWORDS[locale].currency) {
    if (sym.length <= 3 && /[A-Za-z]/.test(sym)) continue;
    if (text.includes(sym)) {
      const mapped = CURRENCY_SYMBOLS[sym];
      if (mapped) return mapped;
    }
  }
  for (const [sym, iso] of Object.entries(CURRENCY_SYMBOLS)) {
    if (text.includes(sym)) return iso;
  }
  return null;
}

function findAmountNearKeyword(lines: string[], kwRe: RegExp, exclude?: RegExp[]): number | null {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (exclude?.some((re) => re.test(line))) continue;
    if (kwRe.test(line)) {
      let a = extractAmount(line);
      if (a === null && i + 1 < lines.length) a = extractAmount(lines[i + 1]);
      return a;
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
    const qm = line.match(QTY_LINE_RE);
    if (qm) {
      const desc = qm[1].trim();
      const qty = toAmount(qm[2]);
      const unit = toAmount(qm[3]);
      const sub = toAmount(qm[4]);
      if (desc.length >= 2 && qty !== null && unit !== null) {
        items.push({
          description: desc,
          qty,
          unitPrice: unit,
          total: sub,
        });
        continue;
      }
    }
    const m = line.match(/^(.*?)\s+(\d[\d.,]*\d|\d)\s*$/);
    if (!m) continue;
    const desc = m[1].trim();
    if (desc.length < 2 || /^\d+$/.test(desc)) continue;
    const num = toAmount(m[2]);
    if (num === null) continue;
    items.push({ description: desc, qty: null, unitPrice: null, total: num });
  }
  return items;
}

function mergeKeywords(list: ReceiptKeywords[]): ReceiptKeywords {
  const out: ReceiptKeywords = {
    total: [], subtotal: [], tax: [], item: [], qty: [], skip: [], currency: [],
    monthsShort: [], monthsLong: [],
  };
  for (const k of list) {
    (Object.keys(out) as Array<keyof ReceiptKeywords>).forEach((key) => {
      out[key].push(...k[key]);
    });
  }
  return out;
}

export function parseReceipt(ocrText: string, ocrConfidence: number, locale?: LocaleCode): ParsedReceipt {
  const detected: LocaleCode = locale ?? detectLocale(ocrText);
  // ponytail: Latin script is shared by EN/DE/ID — union so a German SUMME or
  // Indonesian PPN in an otherwise-English receipt still parses. Upgrade: per-locale auto-detect.
  const keywords: ReceiptKeywords = detected === 'en'
    ? mergeKeywords([KEYWORDS.en, KEYWORDS.de, KEYWORDS.id])
    : KEYWORDS[detected];

  const rawLines = ocrText.split(/\r?\n/);
  const lines = rawLines.map((l) => l.trim()).filter((l) => l.length > 0);

  // Merchant: first non-empty line that isn't a date or a pure number.
  let merchantRaw: string | null = null;
  for (const l of lines) {
    if (parseDateLine(l)) continue;
    if (/^\d+$/.test(l)) continue;
    if (l.length < 2) continue;
    merchantRaw = l;
    break;
  }

  // Date: first line that parses, weighted to header/footer by position.
  let purchaseAt: number | null = null;
  let bestScore = -1;
  for (let i = 0; i < lines.length; i++) {
    const d = parseDateLine(lines[i]);
    if (d === null) continue;
    const pos = i / Math.max(1, lines.length - 1);
    const score = pos < 0.2 || pos > 0.8 ? 2 : 1;
    if (score > bestScore) {
      bestScore = score;
      purchaseAt = d;
    }
  }

  const currency = detectCurrency(ocrText, detected);

  const totalRe = buildKeywordRegex(keywords.total);
  const subtotalRe = buildKeywordRegex(keywords.subtotal);
  const taxRe = buildKeywordRegex(keywords.tax);
  const total = findAmountNearKeyword(lines, totalRe, [subtotalRe, taxRe]);
  const subtotal = findAmountNearKeyword(lines, subtotalRe, [totalRe, taxRe]);
  const tax = findAmountNearKeyword(lines, taxRe, [totalRe, subtotalRe]);

  // Line items: exclude the merchant line and anything at/after the total line.
  const totalIdx = lines.findIndex((l) => totalRe.test(l));
  const itemLines = totalIdx >= 0 ? lines.slice(1, totalIdx) : lines.slice(1);
  const skip = buildSkipRegex(keywords);
  const lineItems = parseLineItems(itemLines, skip);

  const criticalPresent = merchantRaw !== null && total !== null;
  let parseStatus: ParseStatus = 'parsed';
  if (!criticalPresent || ocrConfidence < 40) {
    parseStatus = 'pending';
  }

  return {
    merchantRaw,
    merchantNormalized: normalizeMerchant(merchantRaw),
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
