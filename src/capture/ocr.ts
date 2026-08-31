// Lazy-loaded Tesseract worker. Default lang list comes from Settings.ocrLanguages.
// core/wasm fetched at runtime from CDN (offline OCR not in v1 scope).
// ponytail: one worker reused across reviews; lang set can change, so the worker is
// rebuilt on lang change. tesseract.js's setParameters doesn't cover language switches.
import type { Worker } from 'tesseract.js';
import { DEFAULT_OCR_LANGS, type LocaleCode } from '../types';
import { getSettings } from '../db';

const LANG_MAP: Record<LocaleCode, string> = {
  en: 'eng',
  id: 'eng', // ponytail: Tesseract has no Indonesian traineddata; fall back to eng.
};

let workerPromise: Promise<Worker> | null = null;
let workerLangs = '';
// ponytail: latest per-call progress sink; Tesseract v5 reports progress via the
// createWorker logger, not a recognize() callback.
let currentProgress: ((ratio: number) => void) | null = null;

export interface OcrResult {
  text: string;
  confidence: number;
}

function buildLangString(langs: LocaleCode[]): string {
  const unique = Array.from(new Set(langs));
  const mapped = unique.map((l) => LANG_MAP[l]).filter(Boolean);
  // ponytail: always include eng as a base; Tesseract needs at least one lang.
  if (!mapped.includes('eng')) mapped.unshift('eng');
  return mapped.join('+');
}

async function createWorkerWith(langString: string): Promise<Worker> {
  const { createWorker } = await import('tesseract.js');
  return createWorker(langString, undefined, {
    logger: (m: { status: string; progress: number }) => {
      if (currentProgress && m.status === 'recognizing text') {
        currentProgress(m.progress);
      }
    },
  });
}

async function getWorker(langString: string): Promise<Worker> {
  if (workerPromise && workerLangs === langString) return workerPromise;
  // ponytail: language change means rebuild the worker; the old one is useless.
  if (workerPromise) {
    const w = await workerPromise;
    await w.terminate();
  }
  workerLangs = langString;
  workerPromise = createWorkerWith(langString);
  return workerPromise;
}

export async function runOcr(
  blob: Blob,
  onProgress?: (ratio: number) => void,
): Promise<OcrResult> {
  currentProgress = onProgress ?? null;
  try {
    const settings = await getSettings();
    const langs = settings.ocrLanguages?.length ? settings.ocrLanguages : DEFAULT_OCR_LANGS;
    const langString = buildLangString(langs);
    const worker = await getWorker(langString);
    const result = await worker.recognize(blob);
    return { text: result.data.text, confidence: result.data.confidence };
  } finally {
    currentProgress = null;
  }
}

export async function terminateOcr(): Promise<void> {
  if (workerPromise) {
    const w = await workerPromise;
    await w.terminate();
    workerPromise = null;
    workerLangs = '';
  }
}
