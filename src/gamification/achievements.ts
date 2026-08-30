import { computeHP } from './hp';
import type { Achievement, AchievementCtx, GameState, Receipt } from '../types';

function dayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function uniqueCurrencies(receipts: Receipt[]): Set<string> {
  return new Set(receipts.map((r) => r.currency).filter((c): c is string => !!c));
}

function getOrZero(receipts: Receipt[], pred: (r: Receipt) => boolean): number {
  return receipts.filter(pred).length;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_receipt',
    name: 'FIRST FOLLOWER',
    description: 'Your journey into financial awareness begins.',
    predicate: (ctx) => ctx.receipts.length >= 1,
  },
  {
    id: 'week_warrior',
    name: 'WEEKEND WARRIOR',
    description: 'Logging receipts on weekends. You are either very responsible or very broke.',
    predicate: (ctx) =>
      getOrZero(ctx.receipts, (r) => {
        const day = new Date(r.createdAt).getDay();
        return day === 0 || day === 6;
      }) >= 3,
  },
  {
    id: 'streak_7',
    name: 'COMMITTED',
    description: '7 days in a row. Your wallet is filing a restraining order.',
    predicate: (ctx) => ctx.game.streak.best >= 7,
  },
  {
    id: 'streak_30',
    name: 'LOYALTY CARD',
    description: '30 days. At this point, just marry the app.',
    predicate: (ctx) => ctx.game.streak.best >= 30,
  },
  {
    id: 'big_spender',
    name: 'BIG SPENDER',
    description: 'One receipt over 500. We are not judging. We are, but we are not saying it.',
    predicate: (ctx) => ctx.receipts.some((r) => (r.total ?? 0) >= 500),
  },
  {
    id: 'world_tourist',
    name: 'WORLD TOURIST',
    description: 'Receipts from 5+ countries. Your passport and your wallet are both exhausted.',
    predicate: (ctx) => uniqueCurrencies(ctx.receipts).size >= 5,
  },
  {
    id: 'tax_ninja',
    name: 'TAX NINJA',
    description: 'Every tax line parsed correctly. The IRS would be proud.',
    predicate: (ctx) => ctx.receipts.filter((r) => r.tax !== null).length >= 10,
  },
  {
    id: 'budget_survivor',
    name: 'BUDGET SURVIVOR',
    description: 'Wallet health stayed full. Suspicious.',
    predicate: (ctx) => ctx.hp === 100 && ctx.receipts.length >= 1,
  },
  {
    id: 'ghost_mode',
    name: 'GHOST MODE',
    description: 'No receipts for 14 days. We are filing a missing person report.',
    predicate: (ctx) => {
      if (ctx.receipts.length === 0) return false;
      const last = Math.max(...ctx.receipts.map((r) => r.createdAt));
      return Date.now() - last >= 14 * 24 * 60 * 60 * 1000;
    },
  },
  {
    id: 'penny_pincher',
    name: 'PENNY PINCHER',
    description: '10 receipts, none over 20. Did you survive the month on snacks?',
    predicate: (ctx) => ctx.receipts.length >= 10 && ctx.receipts.every((r) => (r.total ?? 0) < 20),
  },
  {
    id: 'regular',
    name: 'REGULAR',
    description: 'Same merchant 5 times. They have a drink ready.',
    predicate: (ctx) => {
      const counts = new Map<string, number>();
      for (const r of ctx.receipts) {
        const m = r.merchant.normalized ?? r.merchant.raw;
        if (!m) continue;
        counts.set(m, (counts.get(m) ?? 0) + 1);
      }
      return [...counts.values()].some((c) => c >= 5);
    },
  },
  {
    id: 'midnight_snack',
    name: 'MIDNIGHT SNACK',
    description: 'Logged a receipt between midnight and 5am. The regrets are real.',
    predicate: (ctx) =>
      ctx.receipts.some((r) => {
        const h = new Date(r.createdAt).getHours();
        return h >= 0 && h < 5;
      }),
  },
  {
    id: 'rp_100',
    name: 'CENTURY',
    description: '100 regret points earned. The meter is barely calibrated.',
    predicate: (ctx) => ctx.game.rp >= 100,
  },
  {
    id: 'rp_1000',
    name: 'ESTABLISHED',
    description: '1,000 regret points. The trophy case is filling up.',
    predicate: (ctx) => ctx.game.rp >= 1000,
  },
  {
    id: 'rp_5000',
    name: 'HOARDER',
    description: '5,000 regret points. At this point, you are funding the system.',
    predicate: (ctx) => ctx.game.rp >= 5000,
  },
];

// ponytail: linear scan is fine — 15 entries.
export function findNewlyUnlocked(prev: Set<string>, ctx: AchievementCtx): Achievement[] {
  return ACHIEVEMENTS.filter((a) => !prev.has(a.id) && a.predicate(ctx));
}

export function achievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

// ponytail: build the AchievementCtx for current state, with live HP.
export function makeCtx(receipts: Receipt[], game: GameState): AchievementCtx {
  return {
    receipts,
    game,
    hp: computeHP(receipts, game.monthlyBudget),
  };
}

export { dayKey };
