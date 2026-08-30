// Lazy-loaded Tesseract worker. Default eng lang; core/wasm fetched at runtime
// from CDN (offline OCR not in v1 scope). ponytail: one worker reused across reviews.
import type { Worker } from 'tesseract.js';

let workerPromise: Promise<Worker> | null = null;
// ponytail: latest per-call progress sink; Tesseract v5 reports progress via the
// createWorker logger, not a recognize() callback.
let currentProgress: ((ratio: number) => void) | null = null;

export interface OcrResult {
  text: string;
  confidence: number;
}

export async function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      // ponytail justification for dynamic import: Tesseract core is ~2MB; keep it
      // out of the initial bundle + first paint. Vite code-splits this into its own chunk.
      const { createWorker } = await import('tesseract.js');
      return createWorker('eng', undefined, {
        logger: (m: { status: string; progress: number }) => {
          if (currentProgress && m.status === 'recognizing text') {
            currentProgress(m.progress);
          }
        },
      });
    })();
  }
  return workerPromise;
}

export async function runOcr(
  blob: Blob,
  onProgress?: (ratio: number) => void,
): Promise<OcrResult> {
  currentProgress = onProgress ?? null;
  try {
    const worker = await getWorker();
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
  }
}
