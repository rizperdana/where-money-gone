import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db';
import type { Receipt } from '../types';

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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-100">Receipts</h1>
        <button
          className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-sm"
          onClick={() => navigate('/capture')}
        >
          + Add
        </button>
      </div>

      {loaded && rows.length === 0 && (
        <div className="flex flex-col gap-3 text-slate-400 text-sm border border-slate-800 rounded-lg p-4">
          <p>No receipts yet. Tap “Add” to snap your first one.</p>
          <p className="text-slate-500">
            Data is stored only on this device in your browser. Clearing site data or reinstalling
            the app deletes it — there is no cloud backup in v1.
          </p>
          <p className="text-slate-500">Tested on iOS Safari and Android Chrome.</p>
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {rows.map((r) => (
          <li key={r.id}>
            <button
              className="w-full flex items-center gap-3 bg-slate-800/60 border border-slate-700 rounded-lg p-3 text-left"
              onClick={() => navigate(`/receipts/${r.id}`)}
            >
              {thumbs[r.id] && (
                <img src={thumbs[r.id]} alt="" className="w-14 h-14 object-cover rounded" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-slate-100 font-medium truncate">
                  {r.merchant.normalized || r.merchant.raw || 'Untitled'}
                </p>
                <p className="text-slate-400 text-sm">
                  {r.purchaseAt ? new Date(r.purchaseAt).toLocaleDateString() : 'No date'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-100 font-semibold">
                  {r.total !== null ? `${r.currency ?? ''} ${r.total.toFixed(2)}` : '—'}
                </p>
                <p className="text-slate-500 text-xs uppercase">{r.locationSource}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
