# Where Money Gone

A mobile-first PWA that lets you snap a paper or online receipt, run on-device OCR,
review the extracted fields (merchant, date, total, line items, currency), tag your GPS
at capture and the merchant's geocoded location, and store everything locally.

Later it will be ported to React Native against the same data model.

## Stack

- **Vite + React + TypeScript** — SPA, no backend.
- **vite-plugin-pwa** — installable, offline-capable PWA (service worker + manifest).
- **Tailwind CSS** — mobile-first utility styling.
- **Dexie** — IndexedDB wrapper; all data is local-only in the browser.
- **tesseract.js** — on-device OCR (worker/wasm/lang data fetched from CDN at runtime).
- **Nominatim (OpenStreetMap)** — free, keyless merchant geocoding, client-throttled + cached.

No cloud account, no auth, no sync in v1. The full dependency list is in `package.json`.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

Open in Chrome DevTools device emulation (e.g. iPhone 14 Pro), tap **Add receipt**,
choose a receipt photo. OCR runs on-device; the review form is pre-filled; save it.

## Scripts

| Command         | Purpose                                  |
| --------------- | ---------------------------------------- |
| `npm run dev`   | Vite dev server                          |
| `npm run build` | Type-check + production build to `dist` |
| `npm run preview` | Serve the production build            |
| `npm run test`  | Vitest parser unit tests                |
| `npm run lint`  | ESLint                                   |
| `npm run typecheck` | `tsc --noEmit`                      |

## Architecture

```
src/
  db/index.ts          Dexie schema (receipts + settings) + helpers
  types.ts             Shared types
  util/image.ts        Client-side image downscale (1600px, JPEG q0.85)
  capture/
    CaptureScreen.tsx  Camera input + GPS + initial DB row insert
    ocr.ts             Lazy-loaded Tesseract worker wrapper
    parse.ts           Heuristic receipt parser (pure, unit-tested)
    parse.test.ts      Vitest fixtures (US / EU / JP / CJK, no-total)
    ReviewScreen.tsx   OCR → parse → geocode → editable review form
  location/
    geocode.ts         Nominatim search (throttled, in-memory cache)
  ui/
    ListScreen.tsx     Receipts list (newest first)
    DetailScreen.tsx   Full receipt + edit/delete
  App.tsx, main.tsx, index.css
```

Data flow: `CaptureScreen` downscales the photo, grabs GPS, inserts a `pending` row →
`ReviewScreen` runs OCR, parses, geocodes, and writes fields back → user confirms →
`user_confirmed` → visible in the list and detail views.

## Data model (IndexedDB `receipts`)

Single store, keyed by `id` (uuid). Stores the original `imageBlob`, raw `ocrText`
(re-runnable without re-OCR), `merchant` (raw + normalized + geocoded), `purchaseAt`,
`currency`, `total`/`subtotal`/`tax`, `lineItems`, `userLocation` (GPS at capture),
`locationSource` (`user` | `merchant` | `both` | `none`), and `parseStatus`.

Indexs: `createdAt`, `purchaseAt`, `merchant.normalized`.

## Privacy

All data lives in the browser's IndexedDB. Clearing site data or reinstalling the app
deletes it — there is no cloud backup in v1. Tested on iOS Safari and Android Chrome.

## Deploy (Cloudflare Pages)

This is a static SPA. `public/_redirects` (`/* /index.html 200`) makes deep links work
under client-side routing.

```bash
npm run build
CLOUDFLARE_API_TOKEN=<token> npx wrangler pages deploy dist --project-name where-money-gone
```

The Cloudflare API token is supplied at deploy time only — **never committed**. The
account also has R2 credentials available, but they are unused in v1 (no backend). For
GitHub-connected auto-deploy, link the repo in the Cloudflare Pages dashboard.

## v2 (explicitly out of scope)

Cloud auth + sync, email/screenshot ingestion, server-side OCR fallback, real app
icons, R2-backed storage.
