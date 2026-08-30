# AGENTS.md — Where Money Gone

Local-only PWA receipt tracker. Snap a receipt → on-device OCR → review fields →
store in IndexedDB. v1 has no backend, auth, or sync.

## Conventions

- **TypeScript strict**, React 18 function components + hooks.
- **No new dependencies** beyond: `react`, `react-dom`, `react-router-dom`, `dexie`,
  `tesseract.js`, `vite-plugin-pwa`, `tailwindcss`, `vite`, `vitest`, ESLint/Prettier.
  Adding anything else requires a justification in the PR.
- **Edit, don't append scaffolding.** Keep the fewest files; prefer boring stdlib/native.
- **Pure logic is unit-tested.** The parser (`src/capture/parse.ts`) is the only tested
  module; everything else is verified via `npm run build` + manual browser smoke.
- Secrets (Cloudflare tokens, R2 keys) are **never** written to files or committed.
  Pass the CF token as `CLOUDFLARE_API_TOKEN` env var at deploy time only.

## Key files (anchors)

- `src/db/index.ts` — Dexie `db` singleton; `receipts` + `settings` tables.
- `src/capture/parse.ts` — `parseReceipt(ocrText, confidence): ParsedReceipt`. Pure.
- `src/capture/ocr.ts` — `runOcr(blob, onProgress?)`. Tesseract worker, lazy-loaded.
- `src/capture/ReviewScreen.tsx` — orchestrates OCR→parse→geocode→form.
- `src/capture/CaptureScreen.tsx` — `<input capture="environment">` + GPS + row insert.
- `src/location/geocode.ts` — `geocodeMerchant(name)`; Nominatim, throttled + cached.

## Run / verify

```bash
npm install
npm run dev        # localhost:5173
npm run test       # vitest: parser fixtures
npm run typecheck  # tsc --noEmit
npm run lint       # eslint src
npm run build      # type-check + vite build -> dist
```

## Parser notes (read before touching `parse.ts`)

- Date formats: ISO `YYYY-MM-DD`, `MM/DD/YYYY` (assumes US when ambiguous), `DD MMM YYYY`.
- Amounts: handles `.`/`_` thousand separators and `,` decimal commas (EU).
- Currency: ISO codes first, then symbols (`$`→USD, `€`→EUR, `¥`→JPY, …). `¥` defaults to
  JPY (ambiguous with CNY) — revisit if CNY receipts appear.
- Total keywords (Latin + CJK): `total|summe|gesamt|amount due|grand total|balance due|
  総計|合計`. Use `\b` for Latin so `subtotal` is excluded.
- `parseStatus`: `pending` when critical fields (merchant + total) missing or OCR
  confidence < 40; otherwise `parsed`. The parser never returns `failed`/`user_confirmed`
  (those are set by OCR errors / the review screen).

## Deploy

Static SPA → Cloudflare Pages. `public/_redirects` (`/* /index.html 200`) handles SPA
deep links. Build then `CLOUDFLARE_API_TOKEN=<token> npx wrangler pages deploy dist
--project-name where-money-gone`.
