import { db, getGame, saveGame } from '../db';
import { nextStreak } from './streak';
import { findNewlyUnlocked, makeCtx } from './achievements';
import type { Achievement, GameState, Receipt } from '../types';

const BASE_RP = 10;
const CATEGORY_BONUS_RP = 5;
const HIGH_CONFIDENCE_BONUS_RP = 20;

export interface ApplySaveResult {
  game: GameState;
  newlyUnlocked: Achievement[];
}

// ponytail: pure RP reward function. Receipts with no merchant earn only the base.
export function rpForSave(receipt: Receipt): number {
  let rp = BASE_RP;
  if (receipt.merchant.normalized) rp += CATEGORY_BONUS_RP;
  if (receipt.ocrConfidence >= 80) rp += HIGH_CONFIDENCE_BONUS_RP;
  return rp;
}

// ponytail: pure function — caller awaits db writes. Returns patched state + new achievements.
export function buildGameUpdate(
  prev: GameState,
  receipt: Receipt,
  allReceipts: Receipt[],
): { next: GameState; newlyUnlocked: Achievement[] } {
  const streak = nextStreak(prev.streak, new Date(receipt.createdAt));
  const rp = prev.rp + rpForSave(receipt);
  const provisional: GameState = { ...prev, streak, rp };
  const ctx = makeCtx(allReceipts, provisional);
  const newly = findNewlyUnlocked(new Set(prev.achievements), ctx);
  const achievements = [...prev.achievements, ...newly.map((a) => a.id)];
  return { next: { ...provisional, achievements }, newlyUnlocked: newly };
}

// ponytail: single hook called from ReviewScreen.save() after db.receipts.put.
export async function applySaveHook(savedId: string): Promise<ApplySaveResult> {
  const allReceipts = await db.receipts.toArray();
  const saved = allReceipts.find((r) => r.id === savedId);
  if (!saved) return { game: await getGame(), newlyUnlocked: [] };
  const prev = await getGame();
  const { next, newlyUnlocked } = buildGameUpdate(prev, saved, allReceipts);
  const game = await saveGame(next);
  return { game, newlyUnlocked };
}
