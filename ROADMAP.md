# Where Money Gone — Roadmap

> Features that could make this sustainable. Local-first, privacy-respecting.

The roadmap lives here on the GitHub Wiki (this file is rendered as the wiki home page once the Wiki is enabled in repo settings). Track progress via GitHub Issues / Projects.

## Status legend

- `shipped` — live in the app
- `in-progress` — actively being built
- `planned` — accepted, queued
- `proposed` — needs community feedback

Build cost: **S** = weekend, **M** = 1-2 weeks, **L** = 1+ month

---

## Features

| Status | Cost | Title | Monetization |
|---|---|---|---|
| planned | S | **QRIS Cashback Affiliate** — detect QRIS / GoPay / OVO / ShopeePay strings on Indonesian receipts, deep-link a one-tap cashback lookup via Shopee / Tokopedia / Flip affiliate APIs. | Affiliate commission 1.5–12% per category (7-day cookie). |
| planned | S | **Pro Lifetime Unlock** — one-time $9.99 checkout via Lemon Squeezy (hosted, no backend). Unlocks unlimited scans, AI auto-categorization, PDF export, multi-currency. | One-time purchase via MoR (5% + $0.50). Optional annual subscription. |
| planned | M | **AI Monthly Insights** — "Analyze my month" button. Cloudflare Workers AI free tier surfaces anomalies, overspend patterns, one smart savings tip. | Pay-per-use token top-up (Pro coins) or monthly Pro subscription. |
| planned | M | **Indonesian Tax Export (SPT-ready)** — one-click ZIP: PDF receipts + CSV journal + auto-flag invoices above IDR 5,000,000 needing e-Materai stamp. Mekari Sign API integration. | Per-stamp markup via Mekari Sign + Pro export unlock. |
| planned | M | **Sponsored Brand Quests** — use existing HP/RP/streak engine to run sponsored quests ("scan 5 Indomaret receipts this week → bonus RP + voucher"). Brands pay to be featured. | Sponsored quests (B2C brand pay-per-engagement). |
| planned | M | **AI Budget Coach** — weekly Bahasa/English nudge via Cloudflare Workers AI, integrated into the existing streak system. Spots drift early, suggests a realistic weekly cap. | Pro subscription add-on. |
| planned | L | **Anonymized Spend Data API** — aggregate category/region spend data (opt-in, fully anonymized) and sell aggregate insights to market-research firms and local brands. | B2B SaaS data licensing. |
| planned | S | **Trakteer / KaryaKarsa Tip Jar** — Trakteer.id donate button in the app footer. Supporters get a cosmetic theme unlock as a thank-you badge. | Donations (Trakteer / KaryaKarsa). |

---

## How to suggest a feature

Open a GitHub issue with the `feature-request` label. Include:
1. The user problem it solves
2. A short user-story ("As a [user], I want [X], so I can [Y]")
3. Any privacy / local-only concerns
4. Willingness to sponsor the build (Linked to monetization)
