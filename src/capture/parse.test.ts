import { describe, it, expect } from 'vitest';
import { parseReceipt } from './parse';

const CLEAN_US = `WALMART SUPERCENTER
123 Main St
01/15/2024
SUBTOTAL      $12.50
TAX            $1.05
TOTAL         $13.55
CASH          $20.00`;

// ponytail: keep EU decimal-comma branch, but use English TOTAL (de keywords dropped).
const MESSY_EU = `CAFE CENTRAL
03/12/2024
Kaffee          2,50
Gebäck          3,00
TOTAL           5,50`;

const ID_RECEIPT = `TOKO MAKMUR
Jl. Sudirman 123
Tanggal: 15/03/2026
Nasi Goreng 2 x 25000 50000
Es Teh 1 x 8000 8000
Subtotal: Rp 58000
PPN 10%: 5800
Total: Rp 63800
Terima kasih`;

const NO_TOTAL = `THANK YOU
VISIT US AGAIN`;

describe('parseReceipt', () => {
  it('parses a clean US receipt', () => {
    const r = parseReceipt(CLEAN_US, 92);
    expect(r.merchantRaw).toBe('WALMART SUPERCENTER');
    expect(r.merchantNormalized).toBe('Walmart Supercenter');
    expect(r.currency).toBe('USD');
    expect(r.subtotal).toBeCloseTo(12.5);
    expect(r.tax).toBeCloseTo(1.05);
    expect(r.total).toBeCloseTo(13.55);
    expect(r.purchaseAt).toBe(Date.UTC(2024, 0, 15));
    expect(r.parseStatus).toBe('parsed');
    expect(r.lineItems.length).toBe(0);
  });

  it('handles European decimal comma + TOTAL keyword', () => {
    const r = parseReceipt(MESSY_EU, 80);
    expect(r.merchantNormalized).toBe('Cafe Central');
    expect(r.currency).toBeNull();
    expect(r.total).toBeCloseTo(5.5);
    expect(r.purchaseAt).toBe(Date.UTC(2024, 2, 12));
    expect(r.lineItems).toEqual([
      { description: 'Kaffee', qty: null, unitPrice: null, total: 2.5 },
      { description: 'Gebäck', qty: null, unitPrice: null, total: 3.0 },
    ]);
  });

  it('returns pending when no total is parseable', () => {
    const r = parseReceipt(NO_TOTAL, 60);
    expect(r.total).toBeNull();
    expect(r.parseStatus).toBe('pending');
  });

  it('returns pending when OCR confidence is low even with a total', () => {
    const r = parseReceipt(CLEAN_US, 20);
    expect(r.total).toBeCloseTo(13.55);
    expect(r.parseStatus).toBe('pending');
  });

  it('parses Indonesian receipt with qty×unit_price lines', () => {
    const r = parseReceipt(ID_RECEIPT, 85);
    expect(r.merchantNormalized).toBe('Toko Makmur');
    expect(r.currency).toBe('IDR');
    expect(r.subtotal).toBe(58000);
    expect(r.tax).toBe(5800);
    expect(r.total).toBe(63800);
    expect(r.lineItems.length).toBeGreaterThanOrEqual(2);
    const nasi = r.lineItems.find((i) => i.description.includes('Nasi'));
    expect(nasi?.qty).toBe(2);
    expect(nasi?.unitPrice).toBe(25000);
  });
});
