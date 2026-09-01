import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFileImport, FaFileExport, FaPlus } from 'react-icons/fa6';
import { db } from '../db';
import type { Receipt } from '../types';
import TerminalHeader from './TerminalHeader';
import StreakHeader from './StreakHeader';
import { say } from '../narrator/narrator';
import { formatTotal } from '../format';
import { exportCsv, exportJson } from '../io/export';
import { importJson } from '../io/import';
import { notify } from './toast-bus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export default function ListScreen() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Receipt[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [range, setRange] = useState<DateRange>('all');
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
    return rows.filter((r) => {
      if (!inRange(r.createdAt, range)) return false;
      if (q) {
        const m = (r.merchant.normalized ?? r.merchant.raw ?? '').toLowerCase();
        if (!m.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, range]);

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
      <TerminalHeader route="RECEIPTS" />

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="wmg-title">[ RECEIPTS ]</h1>
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

      <div className="wmg-panel p-2 flex flex-col md:flex-row gap-2 text-sm">
        <Input
          type="text"
          placeholder="Search merchant..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Select value={range} onValueChange={(v) => setRange(v as DateRange)}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This week</SelectItem>
            <SelectItem value="month">This month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <StreakHeader />

      {loaded && rows.length === 0 && (
        <div className="wmg-panel flex flex-col gap-3 text-sm">
          <p className="wmg-cursor">{say('empty_receipts', 'list')}</p>
          <p className="text-[var(--wmg-fg-dim)]">
            DATA STORAGE: local-only. No cloud. No backup. You are the backup.
          </p>
        </div>
      )}

      {loaded && rows.length > 0 && filtered.length === 0 && (
        <div className="wmg-panel text-sm opacity-70 p-3">
          No receipts match your filter.
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {filtered.map((r) => (
          <li key={r.id}>
            <button
              className="wmg-panel w-full flex items-center gap-3 text-left hover:opacity-80"
              onClick={() => navigate(`/receipts/${r.id}`)}
            >
              {thumbs[r.id] && (
                <img
                  src={thumbs[r.id]}
                  alt=""
                  className="w-14 h-14 object-cover"
                  style={{ imageRendering: 'pixelated' }}
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {r.merchant.normalized || r.merchant.raw || 'Untitled'}
                </p>
                <p className="text-[var(--wmg-fg-dim)] text-sm">
                  {r.purchaseAt ? new Date(r.purchaseAt).toLocaleDateString() : 'No date'}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatTotal(r.total, r.currency)}</p>
                <p className="text-[var(--wmg-fg-dim)] text-xs uppercase">
                  {r.locationSource}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
