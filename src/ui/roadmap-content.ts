export type RoadmapStatus = 'planned' | 'in-progress' | 'shipped';
export type BuildCost = 'S' | 'M' | 'L';

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  monetization: string;
  status: RoadmapStatus;
  buildCost: BuildCost;
}

export const ROADMAP_ITEMS: RoadmapItem[] = [
  {
    id: 'qris-affiliate',
    title: 'QRIS Cashback Affiliate',
    description:
      'Detect QRIS / GoPay / OVO / ShopeePay strings on Indonesian receipts, surface the merchant, then deep-link a one-tap cashback lookup via Shopee / Tokopedia / Flip affiliate APIs.',
    monetization: 'Affiliate commission 1.5–12% per category (7-day cookie eligible).',
    status: 'planned',
    buildCost: 'S',
  },
  {
    id: 'pro-unlock',
    title: 'Pro Lifetime Unlock',
    description:
      'One-time $9.99 checkout via Lemon Squeezy (hosted, no backend). Unlocks unlimited receipt scans, AI auto-categorization, PDF export, and multi-currency.',
    monetization: 'One-time purchase via MoR (5% + $0.50). Optional annual subscription.',
    status: 'planned',
    buildCost: 'S',
  },
  {
    id: 'ai-insights',
    title: 'AI Monthly Insights',
    description:
      'Add-on button "Analyze my month": runs your receipt embeddings through Cloudflare Workers AI free tier to surface anomalies, overspend patterns, and one smart savings tip.',
    monetization: 'Pay-per-use token top-up (Pro coins) or monthly Pro subscription.',
    status: 'planned',
    buildCost: 'M',
  },
  {
    id: 'tax-export',
    title: 'Indonesian Tax Export (SPT-ready)',
    description:
      'One-click ZIP: PDF receipts + CSV journal + auto-flag invoices above IDR 5,000,000 needing e-Materai stamp. Partner integration with Mekari Sign e-Materai API.',
    monetization: 'Per-stamp markup via Mekari Sign + Pro export unlock.',
    status: 'planned',
    buildCost: 'M',
  },
  {
    id: 'sponsored-quests',
    title: 'Sponsored Brand Quests',
    description:
      'Use the existing HP/RP/streak engine to run sponsored quests (e.g. "scan 5 Indomaret receipts this week → bonus RP + voucher"). Brands pay to be featured; users get in-app rewards.',
    monetization: 'Sponsored quests (B2C brand pay-per-engagement).',
    status: 'planned',
    buildCost: 'M',
  },
  {
    id: 'budget-coach',
    title: 'AI Budget Coach',
    description:
      'Weekly Bahasa/English nudge via Cloudflare Workers AI, integrated into the existing streak system. Spots drift early, suggests a realistic weekly cap.',
    monetization: 'Pro subscription add-on.',
    status: 'planned',
    buildCost: 'M',
  },
  {
    id: 'receipt-data-b2b',
    title: 'Anonymized Spend Data API',
    description:
      'Aggregate category/region spend data (opt-in, fully anonymized) and sell aggregate insights to market-research firms and local brands.',
    monetization: 'B2B SaaS data licensing.',
    status: 'planned',
    buildCost: 'L',
  },
  {
    id: 'trakteer-tip',
    title: 'Trakteer / KaryaKarsa Tip Jar',
    description:
      'Trakteer.id donate button in the app footer. Supporters get a cosmetic theme unlock as a thank-you badge.',
    monetization: 'Donations (Trakteer / KaryaKarsa).',
    status: 'planned',
    buildCost: 'S',
  },
];
