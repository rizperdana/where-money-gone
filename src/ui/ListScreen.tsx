import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db';
import type { Receipt } from '../types';
import TerminalHeader from './TerminalHeader';
import StreakHeader from './StreakHeader';
import { say } from '../narrator/narrator';
import { formatTotal } from '../format';

export default function ListScreen() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Receipt[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const urls: string[] = [];
    db.receipts
      .orderBy('createdAt')
      .reverse()
      .toArray()
      .then((all) => {
        const map: Record<string, string> = {};
        for (const r of all) {
          try {
            map[r.id] = URL.createObjectURL(r.imageBlob);
            urls.push(map[r.id]);
          } catch {
            /* blob may be unusable; skip thumbnail */
          }
        }
        setRows(all);
        setThumbs(map);
        setLoaded(true);
      });
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  return (
    <div className="max-w-md mx-auto p-4 flex flex-col gap-4 min-h-screen">
      <TerminalHeader route="RECEIPTS" />

      <div className="flex items-center justify-between gap-2">
        <h1 className="wmg-title">[ RECEIPTS ]</h1>
        <div className="flex gap-2">
          <button
            className="wmg-panel hover:opacity-80 px-3 py-2 text-sm"
            onClick={() => navigate('/settings')}
            aria-label="Settings"
          >
            <span className="wmg-pixel">[ ⚙ ]</span>
          </button>
          <button
            className="wmg-panel hover:opacity-80 px-4 py-2 text-sm"
            onClick={() => navigate('/capture')}
          >
            [ + ADD ]
          </button>
        </div>
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

      <ul className="flex flex-col gap-2">
        {rows.map((r) => (
          <li key={r.id}>
            <button
              className="wmg-panel w-full flex items-center gap-3 text-left hover:opacity-80"
              onClick={() => navigate(`/receipts/${r.id}`)}
            >
              {thumbs[r.id] && (
                <img src={thumbs[r.id]} alt="" className="w-14 h-14 object-cover rounded" />
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
                <p className="text-[var(--wmg-fg-dim)] text-xs uppercase">{r.locationSource}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
