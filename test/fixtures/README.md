# Manual e2e fixture

The e2e smoke test (plan step: capture → OCR → review → save → persist) needs a real
receipt photo with a camera, which can't be automated here.

Drop a real paper/online receipt photo at `test/fixtures/sample-receipt.jpg` and run the
smoke manually per the plan:

1. `npm run dev`, open in Chrome DevTools device emulation (iPhone 14 Pro).
2. Tap "Add receipt", choose `sample-receipt.jpg`.
3. Confirm the row flips `pending` → `parsed` and the review form is pre-filled.
4. Save, then hard-refresh — the receipt persists (IndexedDB).
5. DevTools → Sensors → override Geolocation to confirm `userLocation` capture.

The parser logic itself is covered by `src/capture/parse.test.ts` (Vitest) with text fixtures,
so the data path is verified without a binary artifact.
