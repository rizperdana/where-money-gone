# Where Money Gone

> **Snap a receipt. Watch where every dollar goes.** A local-first PWA that turns your phone into a privacy-respecting receipt scanner — on-device OCR, instant geocoding, zero cloud, zero accounts, zero tracking.

[**Live Demo**](https://where-money-gone.pages.dev) · [Features](#features) · [Quick Start](#quick-start) · [How It Works](#how-it-works) · [Architecture](#architecture)

[![Live Demo](https://img.shields.io/badge/Live-where--money--gone.pages.dev-00cc66?style=for-the-badge)](https://where-money-gone.pages.dev)
[![PWA](https://img.shields.io/badge/PWA-Installable-blueviolet?style=for-the-badge)](#pwa)
[![Offline First](https://img.shields.io/badge/Offline-First-orange?style=for-the-badge)](#pwa)
[![No Cloud](https://img.shields.io/badge/Cloud-Zero-critical?style=for-the-badge)](#privacy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](#license)

## The Problem

Receipts are the most boring financial data in your life — and the most important. They tell you where you actually spend money versus where you think you do. Every existing tracker wants you to type entries by hand, upload your data to a server, or sign up for a subscription. **Where Money Gone does none of that.**

## Features

- 📸 **Snap and save** — point camera at receipt, OCR extracts merchant/date/amount in seconds
- 🗺️ **Geocoded merchants** — every purchase tagged with where you actually were
- 🎮 **Gamified spending** — earn RP, build streaks, unlock 15 achievements
- 🎨 **Retro pixel theme** — three skins: green phosphor, cobalt blue, daylight
- 💬 **Satirical narrator** — the app roasts your spending habits with terminal-style commentary
- 📅 **Receipts everywhere, data nowhere** — all data lives in your phone's IndexedDB. No backend, no accounts, no telemetry
- 📱 **Install as PWA** — add to home screen, works offline, camera-only
- 🌍 **9 languages, multi-currency** — locale-aware, ISO codes, comma decimals (EU) supported
- ⚡ **Fast** — Tesseract worker lazy-loaded, parser < 1ms per receipt

## Quick Start

### Docker (recommended)

```bash
git clone https://github.com/rizperdana/where-money-gone.git
cd where-money-gone
docker compose up
```

Open http://localhost:5173

### npm

```bash
git clone https://github.com/rizperdana/where-money-gone.git
cd where-money-gone
npm install
npm run dev
```

## How It Works

```
📸 Snap receipt
   ↓
🤖 Tesseract.js (on-device OCR)
   ↓
🧮 Pure parser (merchant/date/amount/currency)
   ↓
🌍 Nominatim geocoding (cached for 1h)
   ↓
✏️ Review screen — confirm/edit fields
   ↓
💾 IndexedDB (Dexie) — local-only storage
   ↓
🎮 Gamification hook — RP, streak, HP, achievements
```

**No step leaves your device.** OCR runs in a Web Worker. Geocoding hits OpenStreetMap only for the merchant name (no location data sent). Everything else is local.

## Architecture

| Layer | Tech |
|---|---|
| **Framework** | React 18 + TypeScript (strict) |
| **Build** | Vite 5 |
| **Styling** | Tailwind CSS + custom retro-pixel utility classes |
| **Storage** | Dexie 4 (IndexedDB wrapper) |
| **OCR** | Tesseract.js 5 (lazy-loaded Web Worker) |
| **Geocoding** | Nominatim / OpenStreetMap (throttled, 1h cache) |
| **PWA** | vite-plugin-pwa (app-shell, autoUpdate) |
| **Deploy** | Cloudflare Pages via GitHub Actions |
| **State** | React hooks + custom i18n + toast bus |

**No external runtime services.** The app is a static SPA — the only network call is Nominatim (geocoding) which is cache-first.

## PWA

Installable as a standalone app on iOS and Android. After install:

- Opens in its own window (no browser chrome)
- Works offline (service worker pre-caches the app shell)
- Camera and GPS permissions requested on first capture only
- Themed splash screen via `apple-mobile-web-app-capable`

To install on iOS: Safari → Share → Add to Home Screen. On Android: Chrome → menu → Install app.

## Privacy

- **No accounts.** No signup, no login, no password.
- **No backend.** All data lives in your device's IndexedDB. If you uninstall the app, your data is gone (export coming in v2).
- **No analytics.** Zero tracking, no telemetry, no error reporting.
- **One network call** — Nominatim geocoding, with a 1-hour cache. Your IP is visible to OSM, not to us.
- **Camera and GPS** only used at capture time. We never upload photos.

## Development

```bash
npm install          # install deps
npm run dev          # vite dev server on :5173
npm run build        # tsc + vite build → dist/
npm run test         # vitest: parser fixtures
npm run typecheck    # tsc --noEmit
npm run lint         # eslint src
```

**Hard verification gate** (run before any commit):

```bash
npx tsc --noEmit && npx eslint src && npx vitest run && npx vite build
```

## Deploy

Push to `master` → GitHub Actions runs `tsc` + `eslint` + `vitest` + `vite build` → deploys to Cloudflare Pages. The live URL auto-updates on every green run.

**Manual deploy** (if needed):

```bash
CLOUDFLARE_API_TOKEN=<token> CLOUDFLARE_ACCOUNT_ID=<id> \
  npx wrangler pages deploy dist --project-name where-money-gone --branch master
```

Secrets stored in GitHub: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`. **Never** commit these.

## Project Structure

```
src/
├── capture/         OCR + parser + capture/review screens
├── db/              Dexie schema (v2: gamification table)
├── gamification/    Achievements, streaks, HP, save hook
├── location/        Nominatim geocoding (cached)
├── narrator/        Satirical voice (12 intents, hash-stable)
├── theme/           3 themes, applyTheme()
├── ui/              BootScreen, TerminalHeader, Toast, Settings
├── format.ts        Single source of truth for money/date formatting
└── i18n/            9 language files
```

## Roadmap

- [x] v1 — local PWA, OCR, geocoding, gamification, retro themes
- [x] v1.1 — retro pixel + modern theme pivot
- [ ] v2 — sync (optional, user-controlled), receipt categories, monthly analytics
- [ ] React Native port — same codebase, native camera + storage

## Contributing

PRs welcome. Open an issue first for major changes. The parser (`src/capture/parse.ts`) is the only unit-tested module; the rest is verified via `npm run build` + manual browser smoke.

## License

MIT — see [LICENSE](LICENSE). Do whatever you want, just don't blame us when your spending stats are too honest.

---

**Tags:** `receipt-tracker` · `expense-tracker` · `purchase-tracker` · `pwa` · `ocr` · `local-first` · `offline-first` · `privacy` · `react` · `typescript` · `tesseract.js` · `dexie` · `vite` · `cloudflare-pages` · `retro-pixel`
