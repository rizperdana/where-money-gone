import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Receipt } from '../types';
import { db } from '../db';
import { formatTotal } from '../format';
import BudgetBar from './StreakHeader';

function sameMonth(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
}

export default function DashboardScreen() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  useEffect(() => {
    db.receipts.toArray().then(setReceipts);
  }, []);

  const now = new Date();
  const thisMonth = receipts.filter((r) => sameMonth(new Date(r.createdAt), now));
  const monthTotal = thisMonth.reduce((s, r) => s + (r.total ?? 0), 0);
  const monthCurrency =
    thisMonth.find((r) => r.currency)?.currency ?? null;

  const dayOfMonth = now.getDate();
  const avgDaily = dayOfMonth > 0 ? monthTotal / dayOfMonth : 0;

  // Merchants by total spend (not frequency)
  const merchantMap = new Map<
    string,
    { name: string; total: number; count: number; currency: string | null }
  >();
  for (const r of thisMonth) {
    const key = r.merchant.normalized ?? r.merchant.raw;
    if (!key) continue;
    const entry = merchantMap.get(key) ?? {
      name: key,
      total: 0,
      count: 0,
      currency: r.currency,
    };
    entry.total += r.total ?? 0;
    entry.count += 1;
    merchantMap.set(key, entry);
  }
  const topMerchants = Array.from(merchantMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Recent receipts
  const recent = [...receipts]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  // Month-over-month
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthReceipts = receipts.filter((r) =>
    sameMonth(new Date(r.createdAt), prevMonth),
  );
  const prevMonthTotal = prevMonthReceipts.reduce(
    (s, r) => s + (r.total ?? 0),
    0,
  );
  const hasMoM = prevMonthReceipts.length > 0;
  const momPct =
    prevMonthTotal > 0
      ? ((monthTotal - prevMonthTotal) / prevMonthTotal) * 100
      : null;

  const fmt = (n: number) =>
    monthCurrency ? formatTotal(n, monthCurrency) : n.toFixed(2);

  return (
    <div className="container-app space-y-4 py-4">
      <BudgetBar />

      {/* 2×2 summary grid */}
      <div className="grid grid-cols-2 gap-px bg-border rounded-lg overflow-hidden">
        <SummaryCell label="This month" value={fmt(monthTotal)} />
        <SummaryCell label="Avg daily" value={fmt(avgDaily)} />
        <SummaryCell
          label="Top merchant"
          value={topMerchants.length > 0 ? topMerchants[0].name : '—'}
          small
        />
        <SummaryCell label="Receipts" value={String(thisMonth.length)} />
      </div>

      {/* Top merchants by spend */}
      {topMerchants.length > 0 && (
        <div className="border rounded-lg p-4 space-y-2 bg-card">
          <h2 className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            Top merchants this month
          </h2>
          <ul className="space-y-1">
            {topMerchants.map((m, i) => (
              <li
                key={m.name}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span className="text-muted-foreground text-xs tabular-nums w-4">
                    {i + 1}.
                  </span>
                  <span className="truncate">{m.name}</span>
                  <span className="text-xs text-muted-foreground">×{m.count}</span>
                </span>
                <span className="tabular-nums font-medium shrink-0">
                  {formatTotal(m.total, m.currency)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent receipts */}
      {recent.length > 0 && (
        <div className="border rounded-lg p-4 space-y-2 bg-card">
          <h2 className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            Recent
          </h2>
          <ul className="space-y-1">
            {recent.map((r) => (
              <li key={r.id}>
                <Link
                  to={`/receipts/${r.id}`}
                  className="flex items-center justify-between text-sm hover:underline"
                >
                  <span className="truncate">{r.merchant.raw ?? 'Untitled'}</span>
                  <span className="text-muted-foreground tabular-nums shrink-0 ml-2">
                    {r.purchaseAt
                      ? new Date(r.purchaseAt).toLocaleDateString()
                      : '—'}
                  </span>
                  <span className="tabular-nums font-medium shrink-0 ml-2">
                    {formatTotal(r.total, r.currency)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Month-over-month */}
      {hasMoM && (
        <div className="border rounded-lg p-4 bg-card">
          <h2 className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">
            vs last month
          </h2>
          <p className="text-sm">
            <span className="tabular-nums font-medium">{fmt(monthTotal)}</span>
            <span className="text-muted-foreground"> vs </span>
            <span className="tabular-nums">{fmt(prevMonthTotal)}</span>
            {momPct !== null && (
              <span
                className={`ml-2 text-xs font-medium ${
                  momPct > 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-green-600 dark:text-green-400'
                }`}
              >
                {momPct > 0 ? '+' : ''}
                {momPct.toFixed(0)}%
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

function SummaryCell({
  label,
  value,
  small = false,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="bg-card px-4 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={
          small
            ? 'text-sm font-medium truncate mt-0.5'
            : 'text-lg font-semibold tabular-nums mt-0.5'
        }
      >
        {value}
      </div>
    </div>
  );
}
