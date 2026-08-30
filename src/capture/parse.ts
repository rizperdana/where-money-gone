import type { LineItem, ParsedReceipt, ParseStatus } from '../types';

// Symbol -> ISO. ¥ ambiguous (JPY/CNY); default JPY for v1.
const CURRENCY_SYMBOLS: Record<string, string> = {
  $: 'USD',
  '€': 'EUR',
  '£': 'GBP',
  '¥': 'JPY',
  '₹': 'INR',
};
const CURRENCY_CODE_RE = /\b(USD|EUR|GBP|JPY|SGD|IDR|MYR|THB|CNY|INR|AUD|CAD|NZD)\b/;

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

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

// Pull the most money-like amount from a line: prefer a 2-decimal value, keep the last.
function extractAmount(line: string): number | null {
  const tokens = line.match(/-?\d[\d.,]*\d|-?\d/g);
  if (!tokens) return null;
  let best: number | null = null;
  for (const tk of tokens) {
    const n = toAmount(tk);
    if (n === null) continue;
    const isMoney = /\d[.,]\d{2}\b/.test(tk);
    if (best === null || isMoney) best = n;
  }
  return best;
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
  // DD MMM YYYY
  m = line.match(/\b(\d{1,2})[ ]?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[ ,]+(20\d{2})\b/i);
  if (m) return Date.UTC(+m[3], MONTHS[m[2].toLowerCase()] - 1, +m[1]);
  // MMM DD, YYYY
  m = line.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[ ]?(\d{1,2}),?[ ]?(20\d{2})\b/i);
  if (m) return Date.UTC(+m[3], MONTHS[m[1].toLowerCase()] - 1, +m[2]);
  return null;
}

function detectCurrency(text: string): string | null {
  const code = text.match(CURRENCY_CODE_RE);
  if (code) return code[1];
  for (const [sym, iso] of Object.entries(CURRENCY_SYMBOLS)) {
    if (text.includes(sym)) return iso;
  }
  return null;
}

function findAmountNearKeyword(lines: string[], kwRe: RegExp): number | null {
  for (let i = 0; i < lines.length; i++) {
    if (kwRe.test(lines[i].toLowerCase())) {
      let a = extractAmount(lines[i]);
      if (a === null && i + 1 < lines.length) a = extractAmount(lines[i + 1]);
      return a;
    }
  }
  return null;
}

function parseLineItems(lines: string[]): LineItem[] {
  const items: LineItem[] = [];
  const skip = /(^|\b)(sub)?total|tax|change|cash|balance|tender|discount|date|phone|tel|www|\.com|http|receipt|invoice/i;
  for (const line of lines) {
    if (skip.test(line)) continue;
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

export function parseReceipt(ocrText: string, ocrConfidence: number): ParsedReceipt {
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

  const currency = detectCurrency(ocrText);

  const total = findAmountNearKeyword(
    lines,
    /\b(total|summe|gesamt|amount\s*due|grand\s*total|balance\s*due)\b|総計|合計/i,
  );
  const subtotal = findAmountNearKeyword(lines, /(subtotal|zwischensumme|sub-total|小計)/i);
  const tax = findAmountNearKeyword(lines, /(tax|mwst|vat|税)/i);

  // Line items: exclude the merchant line and anything at/after the total line.
  const totalIdx = lines.findIndex((l) => /\b(total|summe|gesamt)\b|合計|総計/i.test(l));
  const itemLines = totalIdx >= 0 ? lines.slice(1, totalIdx) : lines.slice(1);
  const lineItems = parseLineItems(itemLines);

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
  };
}
