import type { GameState, Receipt } from '../types';
import { dayKey } from './achievements';

// ponytail: dailyBudget = monthlyBudget / 30. Per-locale `startDayOfMonth` is Tier 2.5.
// HP 0-100 based on today's spend vs daily budget. Pure function — never stored.
export function computeHP(receipts: Receipt[], monthlyBudget: number): number {
  if (monthlyBudget <= 0) return 100;
  const today = dayKey(Date.now());
  const todaysSpend = receipts
    .filter((r) => r.currency && r.total !== null && dayKey(r.createdAt) === today)
    .reduce((sum, r) => sum + (r.total ?? 0), 0);
  const dailyBudget = monthlyBudget / 30;
  const ratio = todaysSpend / dailyBudget;
  if (ratio < 0.8) return 100;
  if (ratio < 1.0) return 80;
  if (ratio < 1.2) return 50;
  return 20;
}

// ponytail: convenience selector over a GameState (for UI components).
export function currentHP(receipts: Receipt[], game: GameState): number {
  return computeHP(receipts, game.monthlyBudget);
}
