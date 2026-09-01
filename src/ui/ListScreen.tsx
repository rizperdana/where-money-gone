import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFileImport, FaFileExport, FaPlus } from 'react-icons/fa6';
import { db } from '../db';
import type { Receipt } from '../types';
import { say } from '../narrator/narrator';
import { formatTotal } from '../format';
import { exportCsv, exportJson } from '../io/export';
import { importJson } from '../io/import';
import { notify } from './toast-bus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type DateRange = 'all' | 'today' | 'week' | 'month';
function inRange(createdAt: number, range: DateRange): boolean {
  if (range === 'all') return true;
  const now = new Date();
  const d = new Date(createdAt);
  if (range === 'today') {
    return d.toDateString() === now.toDateString();
  }
  if (range === 'week') {
    const day = 24 * 60 * 60 * 1000;
    return now.getTime() - d.getTime() <= 7 * day;
  }
  if (range === 'month') {
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }
  return true;
}

type SortMode = 'date' | 'amount';

export default function ListScreen() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Receipt[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [range, setRange] = useState<DateRange>('all');
  const [sort, setSort] = useState<SortMode>('date');
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const urls: string[] = [];
    db.receipts
      .orderBy('createdAt')
      .reverse()
      .toArray()
      .then((all) => {
        const map: Record<string, string> = {};
        for (const r of all) {
          if (r.imageBlob && r.imageBlob.size > 0) {
            const u = URL.createObjectURL(r.imageBlob);
            urls.push(u);
            map[r.id] = u;
          }
        }
        setRows(all);
        setThumbs(map);
        setLoaded(true);
      });
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = rows.filter((r) => {
      if (!inRange(r.createdAt, range)) return false;
      if (q) {
        const m = (r.merchant.normalized ?? r.merchant.raw ?? '').toLowerCase();
        if (!m.includes(q)) return false;
      }
      return true;
    });
    if (sort === 'amount') {
      result.sort((a, b) => (b.total ?? 0) - (a.total ?? 0));
    }
    return result;
  }, [rows, search, range, sort]);

  const filteredTotal = filtered.reduce((s, r) => s + (r.total ?? 0), 0);
  const filteredCurrency =
    filtered.find((r) => r.currency)?.currency ?? null;

  async function handleExportJson() {
    await exportJson(filtered);
    notify('Exported JSON');
  }

  function handleExportCsv() {
    exportCsv(filtered);
    notify('Exported CSV');
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importJson(file);
      await db.transaction('rw', db.receipts, async () => {
        await db.receipts.bulkPut(imported);
      });
      notify(`Imported ${imported.length} receipts`);
      const all = await db.receipts.toArray();
      setRows(all);
    } catch (err) {
      notify(`Import failed: ${(err as Error).message}`);
    } finally {
      e.target.value = '';
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 flex flex-col gap-4 min-h-screen">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-semibold tracking-tight">Receipts</h1>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => importRef.current?.click()}>
            <FaFileImport /> Import
          </Button>
          <input
            ref={importRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImportFile}
          />
          <Button variant="outline" onClick={handleExportJson}>
            <FaFileExport /> JSON
          </Button>
          <Button variant="outline" onClick={handleExportCsv}>
            <FaFileExport /> CSV
          </Button>
          <Button onClick={() => navigate('/capture')}>
            <FaPlus /> Add
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 flex flex-col gap-3 text-sm">
          <Input
            type="text"
            placeholder="Search merchant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <div className="flex gap-2">
            <Select value={range} onValueChange={(v) => setRange(v as DateRange)}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This week</SelectItem>
                <SelectItem value="month">This month</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setSort(v as SortMode)}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Sort by date</SelectItem>
                <SelectItem value="amount">Sort by amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loaded && rows.length === 0 && (
        <Card>
          <CardContent className="pt-6 flex flex-col gap-2 text-sm">
            <p>{say('empty_receipts', 'list')}</p>
            <p className="text-muted-foreground">
              Data storage: local-only. No cloud. No backup. You are the backup.
            </p>
          </CardContent>
        </Card>
      )}

      {loaded && rows.length > 0 && filtered.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No receipts match your filter.
          </CardContent>
        </Card>
      )}

      {/* Summary row */}
      {loaded && filtered.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {filtered.length} receipt{filtered.length !== 1 ? 's' : ''} ·{' '}
          <span className="tabular-nums font-medium text-foreground">
            {filteredCurrency
              ? formatTotal(filteredTotal, filteredCurrency)
              : filteredTotal.toFixed(2)}
          </span>
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {filtered.map((r) => (
          <li key={r.id}>
            <Card
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => navigate(`/receipts/${r.id}`)}
            >
              <CardContent className="pt-6 flex items-center gap-3">
                {thumbs[r.id] && (
                  <img
                    src={thumbs[r.id]}
                    alt=""
                    className="w-14 h-14 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {r.merchant.normalized || r.merchant.raw || 'Untitled'}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {r.purchaseAt
                      ? new Date(r.purchaseAt).toLocaleDateString()
                      : 'No date'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums">
                    {formatTotal(r.total, r.currency)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
