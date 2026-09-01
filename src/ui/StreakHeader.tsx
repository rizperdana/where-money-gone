import { useEffect, useState } from 'react';
import { db, getGame } from '../db';
import { currentHP } from '../gamification/hp';
import type { GameState, Receipt } from '../types';
import { Card, CardContent } from '@/components/ui/card';

function hpColor(hp: number): string {
  if (hp >= 80) return 'var(--color-success, #16a34a)';
  if (hp >= 50) return 'var(--color-warning, #f59e0b)';
  return 'var(--color-danger, #dc2626)';
}

export default function StreakHeader() {
  const [game, setGame] = useState<GameState | null>(null);
  const [hp, setHp] = useState(100);
  const [receiptCount, setReceiptCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const g = await getGame();
      const all: Receipt[] = await db.receipts.toArray();
      if (cancelled) return;
      setGame(g);
      setReceiptCount(all.length);
      setHp(currentHP(all, g));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!game) return null;
  const barWidth = `${hp}%`;

  return (
    <Card>
      <CardContent className="pt-6 flex flex-col gap-1 text-sm">
        <div className="flex items-center justify-between">
          <span>Streak: {game.streak.current} days</span>
          <span className="text-muted-foreground">Best: {game.streak.best}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>RP: {game.rp.toLocaleString()}</span>
          <span className="text-muted-foreground">
            Rank: {Math.floor(game.rp / 500) + 1}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Wallet health</span>
            <span style={{ color: hpColor(hp) }}>{hp}%</span>
          </div>
          <div className="h-2 bg-muted border rounded overflow-hidden">
            <div
              className="h-full"
              style={{ width: barWidth, background: hpColor(hp) }}
            />
          </div>
        </div>
        <div className="text-muted-foreground text-xs">
          {receiptCount} receipt{receiptCount === 1 ? '' : 's'} logged ·{' '}
          {game.achievements.length}/15 achievements
        </div>
      </CardContent>
    </Card>
  );
}
