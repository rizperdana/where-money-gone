import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { GameState, Receipt } from '../types';
import { db, getGame } from '../db';
import { computeHP } from '../gamification/hp';
import { ACHIEVEMENTS } from '../gamification/achievements';
import { formatTotal } from '../format';

export default function DashboardScreen() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [game, setGame] = useState<GameState | null>(null);

  useEffect(() => {
    (async () => {
      const [all, g] = await Promise.all([db.receipts.toArray(), getGame()]);
      setReceipts(all);
      setGame(g);
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
  const counts = new Map<string, { name: string; count: number; total: number; currency: string | null }>();
  for (const r of receipts) {
    const key = r.merchant.normalized ?? r.merchant.raw;
    if (!key) continue;
    const cur = counts.get(key) ?? { name: key, count: 0, total: 0, currency: r.currency };
    cur.count += 1;
    cur.total += r.total ?? 0;
    counts.set(key, cur);
  }
  const topMerchants = Array.from(counts.values()).sort((a, b) => b.count - a.count).slice(0, 5);

  const recent = [...receipts].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

  return (
    <div className="p-2 space-y-4 max-w-3xl mx-auto">
      <h1 className="wmg-pixel text-xl text-[var(--wmg-fg-bright)]">DASHBOARD</h1>

      <div className="wmg-panel p-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <Stat label="HP" value={`${hp}/100`} />
        <Stat label="RP" value={String(game.rp)} />
        <Stat label="STREAK" value={String(game.streak.current)} hint={`best ${game.streak.best}`} />
        <Stat label="ACHIEVEMENTS" value={`${game.achievements.length}/${ACHIEVEMENTS.length}`} />
      </div>

      <div className="wmg-panel p-3 text-sm">
        <div className="opacity-70">THIS MONTH</div>
        <div className="wmg-pixel text-2xl mt-1 text-[var(--wmg-fg-bright)]">
          {monthCurrency ? formatTotal(monthTotal, monthCurrency) : `${monthTotal.toFixed(2)}`}
        </div>
        <div className="opacity-70 text-xs">{thisMonth.length} receipts</div>
      </div>

      <div className="wmg-panel p-3 text-sm">
        <div className="opacity-70 mb-2">TOP MERCHANTS</div>
        {topMerchants.length === 0 && <div className="opacity-50">No data yet</div>}
        {topMerchants.map((m) => (
          <div key={m.name} className="flex justify-between border-b border-current/20 py-1 last:border-0">
            <span className="truncate">{m.name}</span>
            <span className="opacity-70">×{m.count}</span>
          </div>
        ))}
      </div>

      <div className="wmg-panel p-3 text-sm">
        <div className="opacity-70 mb-2">RECENT</div>
        {recent.length === 0 && <div className="opacity-50">No data yet</div>}
        {recent.map((r) => (
          <Link
            key={r.id}
            to={`/receipts/${r.id}`}
            className="flex justify-between border-b border-current/20 py-1 last:border-0 hover:text-[var(--wmg-accent)]"
          >
            <span className="truncate">{r.merchant.raw ?? '—'}</span>
            <span className="opacity-70">
              {r.currency ? formatTotal(r.total ?? 0, r.currency) : '—'}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <div className="opacity-70 text-xs">{label}</div>
      <div className="wmg-pixel text-xl">{value}</div>
      {hint && <div className="opacity-50 text-xs">{hint}</div>}
    </div>
  );
}
