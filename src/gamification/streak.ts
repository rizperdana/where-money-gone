import { dayKey } from './achievements';
import type { StreakState } from '../types';

function dayBefore(d: string): string {
  const [y, m, day] = d.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, day));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}

function isYesterdayOrToday(prev: string, now: string): boolean {
  return prev === now || prev === dayBefore(now);
}

export function nextStreak(prev: StreakState, now: Date = new Date()): StreakState {
  const today = dayKey(now.getTime());
  if (prev.lastLogDate === today) {
    return prev;
  }
  const current = isYesterdayOrToday(prev.lastLogDate ?? '', today) ? prev.current + 1 : 1;
  return {
    current,
    best: Math.max(prev.best, current),
    lastLogDate: today,
  };
}
