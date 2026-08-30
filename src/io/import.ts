import type { Receipt } from '../types';

interface ImportedPayload {
  version?: number;
  exportedAt?: string;
  receipts: Array<Record<string, unknown>>;
}

function dataUriToBlob(dataUri: string): Blob {
  const [meta, b64] = dataUri.split(',');
  const mime = meta.match(/data:([^;]+)/)?.[1] ?? 'image/jpeg';
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function coerceReceipt(raw: Record<string, unknown>): Receipt {
  // ponytail: old exports may use imageBlob as a Blob; new ones use imageDataUri string.
  // Both end up as a real Blob on the imported record.
  let imageBlob: Blob;
  if (typeof raw.imageDataUri === 'string') {
    imageBlob = dataUriToBlob(raw.imageDataUri);
  } else if (raw.imageBlob instanceof Blob) {
    imageBlob = raw.imageBlob;
  } else {
    // ponytail: receipt without an image is still importable; UI shows a placeholder.
    imageBlob = new Blob([new Uint8Array(0)], { type: 'image/jpeg' });
  }
  const merged: Record<string, unknown> = { ...raw, imageBlob };
  delete merged.imageDataUri;
  return merged as unknown as Receipt;
}

export async function importJson(file: File): Promise<Receipt[]> {
  const text = await file.text();
  const parsed = JSON.parse(text) as ImportedPayload;
  if (!Array.isArray(parsed.receipts)) {
    throw new Error('Invalid export: missing receipts array');
  }
  return parsed.receipts.map(coerceReceipt);
}
