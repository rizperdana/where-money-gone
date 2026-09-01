import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { GameState, Receipt } from '../types';
import { db, getGame } from '../db';
import { computeHP } from '../gamification/hp';
import { ACHIEVEMENTS } from '../gamification/achievements';
import { formatTotal } from '../format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardScreen() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [game, setGame] = useState<GameState | null>(null);

  useEffect(() => {
    (async () => {
      setGame(await getGame());
      setReceipts(await db.receipts.toArray());
    })();
  }, []);

  if (!game) return <div className="p-4">Loading...</div>;

  const hp = computeHP(receipts, game.monthlyBudget);
  const now = new Date();
  const thisMonth = receipts.filter((r) => {
    const d = new Date(r.createdAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const monthTotal = thisMonth.reduce((s, r) => s + (r.total ?? 0), 0);
  const monthCurrency = thisMonth.find((r) => r.currency)?.currency ?? null;

  // ponytail: top merchants by frequency, not by spend — surfacing habit > total.
  const counts = new Map<
    string,
    { name: string; count: number; total: number; currency: string | null }
  >();
  for (const r of receipts) {
    const key = r.merchant.normalized ?? r.merchant.raw;
    if (!key) continue;
    const cur = counts.get(key) ?? {
      name: key,
      count: 0,
      total: 0,
      currency: r.currency,
    };
    cur.count += 1;
    cur.total += r.total ?? 0;
    counts.set(key, cur);
  }
  const topMerchants = Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const recent = [...receipts]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  return (
    <div className="p-2 space-y-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

      <Card>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 text-sm">
          <Stat label="HP" value={`${hp}/100`} />
          <Stat label="RP" value={String(game.rp)} />
          <Stat
            label="Streak"
            value={String(game.streak.current)}
            hint={`best ${game.streak.best}`}
          />
          <Stat
            label="Achievements"
            value={`${game.achievements.length}/${ACHIEVEMENTS.length}`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>This month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">
            {monthCurrency
              ? formatTotal(monthTotal, monthCurrency)
              : `${monthTotal.toFixed(2)}`}
          </div>
          <div className="text-xs text-muted-foreground">
            {thisMonth.length} receipts
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top merchants</CardTitle>
        </CardHeader>
        <CardContent>
          {topMerchants.length === 0 && (
            <div className="text-muted-foreground">No data yet</div>
          )}
          {topMerchants.map((m) => (
            <div
              key={m.name}
              className="flex justify-between border-b last:border-0 py-1"
            >
              <span className="truncate">{m.name}</span>
              <span className="text-muted-foreground">×{m.count}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 && (
            <div className="text-muted-foreground">No data yet</div>
          )}
          {recent.map((r) => (
            <Link
              key={r.id}
              to={`/receipts/${r.id}`}
              className="flex justify-between border-b last:border-0 py-1 hover:underline"
            >
              <span className="truncate">{r.merchant.raw ?? '—'}</span>
              <span className="text-muted-foreground">
                {r.currency ? formatTotal(r.total ?? 0, r.currency) : '—'}
              </span>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
