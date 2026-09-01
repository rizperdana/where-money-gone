import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaPenToSquare, FaTrash, FaTriangleExclamation } from 'react-icons/fa6';
import { db } from '../db';
import { say } from '../narrator/narrator';
import { formatTotal } from '../format';
import TerminalHeader from './TerminalHeader';
import type { Receipt } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';

export default function DetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [r, setR] = useState<Receipt | null>(null);
  const [notFound, setNotFound] = useState(false);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!id) return;
    db.receipts.get(id).then((row) => {
      if (!row) setNotFound(true);
      else setR(row);
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
        <Button variant="ghost" size="sm" onClick={() => navigate('/receipts')}>
          <FaArrowLeft /> Back
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/review/${r.id}`)}
        >
          <FaPenToSquare /> Edit
        </Button>
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

      <Card>
        <CardHeader>
          <CardTitle className="opacity-70 text-sm">DETAILS</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {r.lineItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="opacity-70 text-sm">ITEMS</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-1 text-sm">
              {r.lineItems.map((item, i) => (
                <li key={i} className="flex justify-between">
                  <span>{item.description}</span>
                  <span>{item.total !== null ? item.total.toFixed(2) : '—'}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Dialog>
        <DialogTrigger
          render={
            <Button variant="destructive" size="lg">
              <FaTrash /> Delete Receipt
            </Button>
          }
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FaTriangleExclamation /> Confirm delete
            </DialogTitle>
            <DialogDescription>{say('delete_confirm', r.id)}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <DialogClose
              render={<Button variant="outline">Keep</Button>}
            />
            <Button variant="destructive" onClick={onDelete}>
              <FaTrash /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
