import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../db';
import { say } from '../narrator/narrator';
import { formatTotal } from '../format';
import TerminalHeader from './TerminalHeader';
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

  if (notFound) return <p className="p-6 text-[var(--wmg-fg-dim)]">Receipt not found.</p>;
  if (!r) return <p className="p-6 text-[var(--wmg-fg-dim)]">{say('loading', id)}</p>;

  const fmtNum = (n: number | null) => (n === null ? '—' : n.toFixed(2));

  return (
    <div className="max-w-md mx-auto p-4 flex flex-col gap-4 pb-24">
      <TerminalHeader route="DETAIL" />

      <div className="flex items-center justify-between">
        <button
          className="text-[var(--wmg-fg-dim)] text-sm"
          onClick={() => navigate('/receipts')}
        >
          [ ← BACK ]
        </button>
        <button
          className="text-[var(--wmg-accent)] text-sm"
          onClick={() => navigate(`/review/${r.id}`)}
        >
          [ EDIT ]
        </button>
      </div>

      {urlRef.current && (
        <img
          src={urlRef.current}
          alt="receipt"
          className="w-full border border-[var(--wmg-fg-dim)] object-contain max-h-80"
        />
      )}

      <h1 className="wmg-title">
        {r.merchant.normalized || r.merchant.raw || 'Untitled'}
      </h1>

      <dl className="grid grid-cols-2 gap-2 text-sm">
        <dt className="text-[var(--wmg-fg-dim)]">Date</dt>
        <dd>
          {r.purchaseAt ? new Date(r.purchaseAt).toLocaleDateString() : '—'}
        </dd>
        <dt className="text-[var(--wmg-fg-dim)]">Total</dt>
        <dd>{formatTotal(r.total, r.currency)}</dd>
        <dt className="text-[var(--wmg-fg-dim)]">Subtotal</dt>
        <dd>{fmtNum(r.subtotal)}</dd>
        <dt className="text-[var(--wmg-fg-dim)]">Tax</dt>
        <dd>{fmtNum(r.tax)}</dd>
        <dt className="text-[var(--wmg-fg-dim)]">Location</dt>
        <dd className="uppercase">{r.locationSource}</dd>
        {r.userLocation && (
          <>
            <dt className="text-[var(--wmg-fg-dim)]">My GPS</dt>
            <dd>
              {r.userLocation.lat.toFixed(4)}, {r.userLocation.lng.toFixed(4)}
            </dd>
          </>
        )}
        {r.merchant.geocoded && (
          <>
            <dt className="text-[var(--wmg-fg-dim)]">Merchant</dt>
            <dd>{r.merchant.geocoded.displayName}</dd>
          </>
        )}
      </dl>

      {r.lineItems.length > 0 && (
        <div>
          <h2 className="text-[var(--wmg-fg-dim)] text-sm mb-1">Items</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {r.lineItems.map((item, i) => (
              <li key={i} className="flex justify-between">
                <span>{item.description}</span>
                <span>{item.total !== null ? item.total.toFixed(2) : '—'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!confirmDelete ? (
        <button
          className="wmg-panel hover:opacity-80 font-medium py-3 border-[var(--wmg-danger)]"
          onClick={() => setConfirmDelete(true)}
        >
          [ DELETE RECEIPT ]
        </button>
      ) : (
        <div className="wmg-panel flex flex-col gap-2">
          <p className="text-sm">{say('delete_confirm', r.id)}</p>
          <div className="flex gap-2">
            <button
              className="flex-1 wmg-panel py-2 text-sm"
              onClick={() => setConfirmDelete(false)}
            >
              [ KEEP ]
            </button>
            <button
              className="flex-1 wmg-panel py-2 text-sm border-[var(--wmg-danger)]"
              onClick={onDelete}
            >
              [ DELETE ]
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
