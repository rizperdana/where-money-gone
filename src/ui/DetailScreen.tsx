import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaPenToSquare, FaTrash, FaTriangleExclamation } from 'react-icons/fa6';
import { db } from '../db';
import { say } from '../narrator/narrator';
import { formatTotal } from '../format';
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
  const [imgUrl, setImgUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    db.receipts.get(id).then((row) => {
      if (!row) setNotFound(true);
      else setR(row);
    });
  }, [id]);

  useEffect(() => {
    if (!r?.imageBlob) return;
    const url = URL.createObjectURL(r.imageBlob);
    setImgUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [r?.imageBlob]);

  async function onDelete() {
    if (!id) return;
    await db.receipts.delete(id);
    navigate('/receipts');
  }

  if (notFound)
    return <p className="p-6 text-muted-foreground">Receipt not found.</p>;
  if (!r)
    return <p className="p-6 text-muted-foreground">{say('loading', id)}</p>;

  const fmtNum = (n: number | null) => (n === null ? '—' : n.toFixed(2));

  return (
    <div className="max-w-md mx-auto p-4 flex flex-col gap-4 pb-24">
      {/* Header */}
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

      {/* Image */}
      {imgUrl && (
        <img
          src={imgUrl}
          alt="receipt"
          className="w-full border rounded object-contain max-h-80"
        />
      )}

      {/* Merchant + date */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {r.merchant.normalized || r.merchant.raw || 'Untitled'}
        </h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
          <span>
            {r.purchaseAt
              ? new Date(r.purchaseAt).toLocaleDateString()
              : '—'}
          </span>
          {r.currency && (
            <span className="px-1.5 py-0.5 bg-muted rounded text-xs uppercase font-medium">
              {r.currency}
            </span>
          )}
        </div>
      </div>

      {/* Amount block */}
      <div className="border rounded-lg p-4 bg-card">
        <div className="text-3xl font-semibold tabular-nums">
          {formatTotal(r.total, r.currency)}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
          <span>Subtotal: {fmtNum(r.subtotal)}</span>
          <span>Tax: {fmtNum(r.tax)}</span>
        </div>
      </div>

      {/* Location */}
      {(r.merchant.geocoded || r.userLocation) && (
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            {r.merchant.geocoded && (
              <p>{r.merchant.geocoded.displayName}</p>
            )}
            {r.userLocation && (
              <p className="text-muted-foreground tabular-nums">
                GPS: {r.userLocation.lat.toFixed(4)},{' '}
                {r.userLocation.lng.toFixed(4)}
                {r.userLocation.accuracy != null && (
                  <span className="ml-1 text-xs">
                    (±{r.userLocation.accuracy.toFixed(0)}m)
                  </span>
                )}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Line items */}
      {r.lineItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-1 text-sm">
              {r.lineItems.map((item, i) => (
                <li key={i} className="flex justify-between">
                  <span className="truncate mr-2">{item.description}</span>
                  <span className="tabular-nums shrink-0">
                    {item.qty != null && <span className="text-muted-foreground mr-2">{item.qty}×</span>}
                    {item.total !== null ? item.total.toFixed(2) : '—'}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <div className="text-xs text-muted-foreground space-y-0.5">
        {r.ocrConfidence != null && (
          <p>OCR confidence: {(r.ocrConfidence * 100).toFixed(0)}%</p>
        )}
        <p>Parse status: {r.parseStatus ?? '—'}</p>
        {r.createdAt && (
          <p>Created: {new Date(r.createdAt).toLocaleDateString()}</p>
        )}
      </div>

      {/* Delete */}
      <Dialog>
        <DialogTrigger
          render={
            <Button variant="destructive" size="lg">
              <FaTrash /> Delete receipt
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
            <DialogClose render={<Button variant="outline">Keep</Button>} />
            <Button variant="destructive" onClick={onDelete}>
              <FaTrash /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
