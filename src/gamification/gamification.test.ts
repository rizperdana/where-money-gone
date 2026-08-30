import { describe, it, expect } from 'vitest';
import { nextStreak } from './streak';
import { computeHP } from './hp';
import { buildGameUpdate } from './apply-save';
import { ACHIEVEMENTS, findNewlyUnlocked, makeCtx } from './achievements';
import type { GameState, Receipt, StreakState } from '../types';

function isoDay(s: string): Date {
  return new Date(s + 'T12:00:00');
}

function stubReceipt(overrides: Partial<Receipt> = {}): Receipt {
  return {
    id: 'r1',
    imageBlob: new Blob(),
    imageWidth: 100,
    imageHeight: 100,
    ocrText: '',
    ocrConfidence: 85,
    ocrRanAt: null,
    merchant: { raw: 'Starbucks', normalized: 'Starbucks', geocoded: null },
    purchaseAt: null,
    currency: 'USD',
    total: 5.5,
    subtotal: null,
    tax: null,
    lineItems: [],
    userLocation: null,
    locationSource: 'none',
    parseStatus: 'user_confirmed',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

function emptyGame(): GameState {
  return { key: 'app', streak: { current: 0, best: 0, lastLogDate: null }, rp: 0, achievements: [], monthlyBudget: 0 };
}

describe('streak', () => {
  it('starts at 1 on first log', () => {
    const next = nextStreak(emptyGame().streak, isoDay('2026-08-30'));
    expect(next.current).toBe(1);
    expect(next.lastLogDate).toBe('2026-08-30');
  });

  it('continues when same day logged twice', () => {
    const prev: StreakState = { current: 3, best: 3, lastLogDate: '2026-08-30' };
    const next = nextStreak(prev, isoDay('2026-08-30'));
    expect(next.current).toBe(3);
  });

  it('continues when logged the next day', () => {
    const prev: StreakState = { current: 3, best: 3, lastLogDate: '2026-08-30' };
    const next = nextStreak(prev, isoDay('2026-08-31'));
    expect(next.current).toBe(4);
  });

  it('resets to 1 after a gap', () => {
    const prev: StreakState = { current: 7, best: 7, lastLogDate: '2026-08-25' };
    const next = nextStreak(prev, isoDay('2026-08-30'));
    expect(next.current).toBe(1);
    expect(next.best).toBe(7);
  });
});

describe('HP', () => {
  it('returns 100 with no budget set', () => {
    expect(computeHP([], 0)).toBe(100);
  });
  it('returns 100 when today spend under 80% daily', () => {
    const r = stubReceipt({ total: 10, createdAt: Date.now() });
    expect(computeHP([r], 600)).toBe(100); // daily = 20, 10/20 = 50%
  });
  it('returns 50 when today spend between 100-120% daily', () => {
    const r = stubReceipt({ total: 22, createdAt: Date.now() });
    expect(computeHP([r], 600)).toBe(50); // daily = 20, 22/20 = 110%
  });
  it('returns 20 when today spend >120% daily', () => {
    const r = stubReceipt({ total: 30, createdAt: Date.now() });
    expect(computeHP([r], 600)).toBe(20); // daily = 20, 30/20 = 150%
  });
});

describe('achievements', () => {
  it('unlocks first_receipt on first save', () => {
    const r = stubReceipt();
    const game = emptyGame();
    const ctx = makeCtx([r], { ...game, rp: 10 });
    const newly = findNewlyUnlocked(new Set(), ctx);
    expect(newly.map((a) => a.id)).toContain('first_receipt');
  });

  it('does not re-unlock already-unlocked', () => {
    const r = stubReceipt();
    const ctx = makeCtx([r], { ...emptyGame(), achievements: ['first_receipt'], rp: 10 });
    const newly = findNewlyUnlocked(new Set(['first_receipt']), ctx);
    expect(newly.map((a) => a.id)).not.toContain('first_receipt');
  });

  it('15 achievements defined', () => {
    expect(ACHIEVEMENTS.length).toBe(15);
  });
});

describe('buildGameUpdate', () => {
  it('awards base RP and streak on a clean save', () => {
    const r = stubReceipt();
    const prev = emptyGame();
    const { next, newlyUnlocked } = buildGameUpdate(prev, r, [r]);
    expect(next.rp).toBe(35); // 10 base + 5 category (has merchant) + 20 high confidence
    expect(next.streak.current).toBe(1);
    expect(next.achievements).toContain('first_receipt');
    expect(newlyUnlocked.find((a) => a.id === 'first_receipt')).toBeDefined();
  });
});
