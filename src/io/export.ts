import type { Receipt } from '../types';

// ponytail: JSON includes imageBlob as base64 data URI; file gets big. CSV is flattened.
const EXPORT_VERSION = 3;

async function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

async function receiptToJson(r: Receipt): Promise<unknown> {
  const imageDataUri = r.imageBlob ? await blobToDataUri(r.imageBlob) : null;
  return {
    ...r,
    imageBlob: undefined,
    imageDataUri,
  };
}

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function receiptToCsvRow(r: Receipt): string {
  const lat = r.userLocation?.lat ?? '';
  const lng = r.userLocation?.lng ?? '';
  const name = r.merchant.geocoded?.displayName ?? '';
  return [
    r.id,
    new Date(r.createdAt).toISOString(),
    r.purchaseAt ? new Date(r.purchaseAt).toISOString() : '',
    r.merchant.raw,
    r.currency ?? '',
    r.total ?? '',
    r.subtotal ?? '',
    r.tax ?? '',
    lat,
    lng,
    name,
  ].map(csvEscape).join(',');
}

const CSV_HEADER = 'id,createdAt,purchaseAt,merchant,currency,total,subtotal,tax,latitude,longitude,displayName';

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // ponytail: revoke after click — Chromium needs the URL alive during navigation.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportJson(receipts: Receipt[]): Promise<void> {
  const items = await Promise.all(receipts.map(receiptToJson));
  const payload = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    receipts: items,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `wmg-receipts-${Date.now()}.json`);
}

export function exportCsv(receipts: Receipt[]): void {
  const rows = [CSV_HEADER, ...receipts.map(receiptToCsvRow)];
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, `wmg-receipts-${Date.now()}.csv`);
}
