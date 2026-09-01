import { useEffect, useState } from 'react';
import { db, getGame } from '../db';
import type { GameState, Receipt } from '../types';
import { FaFire } from 'react-icons/fa6';

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function paceLabel(
  monthSpend: number,
  monthlyBudget: number,
  dayOfMonth: number,
  daysInMo: number,
): { label: string; color: string } {
  if (monthlyBudget <= 0 || monthSpend === 0 || dayOfMonth === 0) {
    return { label: '—', color: 'text-muted-foreground' };
  }
  const dailyTarget = monthlyBudget / daysInMo;
  const currentPace = monthSpend / dayOfMonth;
  const diff = currentPace - dailyTarget;
  if (Math.abs(diff) < dailyTarget * 0.05)
    return { label: 'On pace', color: 'text-green-600 dark:text-green-400' };
  if (diff > 0)
    return {
      label: 'Over pace',
      color: 'text-red-600 dark:text-red-400',
    };
  return {
    label: 'Under pace',
    color: 'text-green-600 dark:text-green-400',
  };
}

export default function BudgetBar() {
  const [game, setGame] = useState<GameState | null>(null);
  const [monthSpend, setMonthSpend] = useState(0);
  const [currency, setCurrency] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const g = await getGame();
      const all: Receipt[] = await db.receipts.toArray();
      if (cancelled) return;
      setGame(g);

      const now = new Date();
      const thisMonth = all.filter(
        (r) =>
          new Date(r.createdAt).getFullYear() === now.getFullYear() &&
          new Date(r.createdAt).getMonth() === now.getMonth(),
      );
      const spend = thisMonth.reduce((s, r) => s + (r.total ?? 0), 0);
      setMonthSpend(spend);
      const first = thisMonth.find((r) => r.currency);
      setCurrency(first?.currency ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!game) return null;

  const monthlyBudget = game.monthlyBudget;
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMo = daysInMonth(now.getFullYear(), now.getMonth());
  const daysLeft = daysInMo - dayOfMonth;
  const pace = paceLabel(monthSpend, monthlyBudget, dayOfMonth, daysInMo);

  const fmt = (n: number) =>
    currency
      ? new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency,
        }).format(n)
      : n.toFixed(2);

  return (
    <div className="border rounded-lg p-4 space-y-3 text-sm bg-card">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {game.streak.current > 0 && (
            <span className="flex items-center gap-1 text-orange-500">
              <FaFire /> {game.streak.current}d streak
            </span>
          )}
          <span className="text-muted-foreground">
            {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
          </span>
        </div>
        <span className={`text-xs font-medium ${pace.color}`}>
          {pace.label}
        </span>
      </div>

      {/* Spend vs budget */}
      <div>
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-xs text-muted-foreground">This month</span>
          {monthlyBudget > 0 && (
            <span className="text-xs text-muted-foreground">
              of {fmt(monthlyBudget)}
            </span>
          )}
        </div>
        <div className="text-2xl font-semibold tabular-nums">
          {fmt(monthSpend)}
        </div>
      </div>

      {/* Budget bar */}
      {monthlyBudget > 0 ? (
        (() => {
          const pct = Math.min(100, (monthSpend / monthlyBudget) * 100);
          const barColor =
            pct > 90
              ? 'bg-red-500'
              : pct > 70
                ? 'bg-amber-500'
                : 'bg-green-500';
          return (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground tabular-nums w-12 text-right">
                {pct.toFixed(0)}%
              </span>
            </div>
          );
        })()
      ) : (
        <p className="text-xs text-muted-foreground">
          Set a monthly budget in Settings to track progress.
        </p>
      )}
    </div>
  );
}
