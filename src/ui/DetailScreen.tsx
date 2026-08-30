import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../db';
import type { Receipt } from '../types';

export default function DetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [r, setR] = useState<Receipt | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!id) return;
    db.receipts.get(id).then((row) => {
      if (!row) {
        setNotFound(true);
        return;
      }
      try {
        urlRef.current = URL.createObjectURL(row.imageBlob);
      } catch {
        urlRef.current = null;
      }
      setR(row);
    });
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, [id]);

  async function onDelete() {
    if (!id) return;
    await db.receipts.delete(id);
    navigate('/receipts');
  }

  if (notFound) return <p className="p-6 text-slate-400">Receipt not found.</p>;
  if (!r) return <p className="p-6 text-slate-400">Loading…</p>;

  const fmt = (n: number | null) => (n === null ? '—' : n.toFixed(2));

  return (
    <div className="max-w-md mx-auto p-4 flex flex-col gap-4 pb-24">
      <div className="flex items-center justify-between">
        <button className="text-slate-400 text-sm" onClick={() => navigate('/receipts')}>
          ← Back
        </button>
        <button className="text-sky-300 text-sm" onClick={() => navigate(`/review/${r.id}`)}>
          Edit
        </button>
      </div>

      {urlRef.current && (
        <img
          src={urlRef.current}
          alt="receipt"
          className="w-full rounded-lg border border-slate-700 object-contain max-h-80"
        />
      )}

      <h1 className="text-2xl font-semibold text-slate-100">
        {r.merchant.normalized || r.merchant.raw || 'Untitled'}
      </h1>

      <dl className="grid grid-cols-2 gap-2 text-sm">
        <dt className="text-slate-400">Date</dt>
        <dd className="text-slate-100">
          {r.purchaseAt ? new Date(r.purchaseAt).toLocaleDateString() : '—'}
        </dd>
        <dt className="text-slate-400">Total</dt>
        <dd className="text-slate-100">
          {r.currency ?? ''} {fmt(r.total)}
        </dd>
        <dt className="text-slate-400">Subtotal</dt>
        <dd className="text-slate-100">{fmt(r.subtotal)}</dd>
        <dt className="text-slate-400">Tax</dt>
        <dd className="text-slate-100">{fmt(r.tax)}</dd>
        <dt className="text-slate-400">Location</dt>
        <dd className="text-slate-100 uppercase">{r.locationSource}</dd>
        {r.userLocation && (
          <>
            <dt className="text-slate-400">My GPS</dt>
            <dd className="text-slate-100">
              {r.userLocation.lat.toFixed(4)}, {r.userLocation.lng.toFixed(4)}
            </dd>
          </>
        )}
        {r.merchant.geocoded && (
          <>
            <dt className="text-slate-400">Merchant</dt>
            <dd className="text-slate-100">{r.merchant.geocoded.displayName}</dd>
          </>
        )}
      </dl>

      {r.lineItems.length > 0 && (
        <div>
          <h2 className="text-slate-400 text-sm mb-1">Items</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {r.lineItems.map((item, i) => (
              <li key={i} className="flex justify-between text-slate-200">
                <span>{item.description}</span>
                <span>{item.total !== null ? item.total.toFixed(2) : '—'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!confirmDelete ? (
        <button
          className="fixed bottom-0 left-0 right-0 max-w-md mx-auto m-4 bg-rose-700 hover:bg-rose-600 text-white font-medium py-3 rounded-xl"
          onClick={() => setConfirmDelete(true)}
        >
          Delete receipt
        </button>
      ) : (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto m-4 flex gap-2">
          <button
            className="flex-1 bg-slate-700 text-white py-3 rounded-xl"
            onClick={() => setConfirmDelete(false)}
          >
            Cancel
          </button>
          <button
            className="flex-1 bg-rose-700 hover:bg-rose-600 text-white py-3 rounded-xl"
            onClick={onDelete}
          >
            Confirm delete
          </button>
        </div>
      )}
    </div>
  );
}
