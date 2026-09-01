import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaFloppyDisk, FaArrowLeft, FaLocationDot } from 'react-icons/fa6';
import { db, getSettings, saveSettings } from '../db';
import { runOcr } from './ocr';
import { parseReceipt } from './parse';
import { geocodeMerchant } from '../location/geocode';
import { notify } from '../ui/toast-bus';
import { say } from '../narrator/narrator';
import TerminalHeader from '../ui/TerminalHeader';
import { applySaveHook } from '../gamification/apply-save';
import type { Receipt, Settings } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

function toDateInput(ms: number | null): string {
  if (ms === null) return '';
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function patch(r: Receipt, p: Partial<Receipt>): Receipt {
  return { ...r, ...p, updatedAt: Date.now() };
}

export default function ReviewScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [r, setR] = useState<Receipt | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const row = await db.receipts.get(id);
      setR(row ?? null);
    })();
  }, [id]);

  useEffect(() => {
    if (!r?.imageBlob) return;
    urlRef.current = URL.createObjectURL(r.imageBlob);
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, [r?.imageBlob]);

  useEffect(() => {
    (async () => {
      if (!r || r.ocrRanAt !== null) return;
      const s = await getSettings();
      setSettings(s);
      try {
        const result = await runOcr(r.imageBlob, (p) => setProgress(p));
        const parsed = parseReceipt(result.text, result.confidence);
        setR((prev) =>
          prev
            ? {
                ...prev,
                ocrText: result.text,
                ocrConfidence: result.confidence,
                ocrRanAt: Date.now(),
                merchant: {
                  raw: parsed.merchantRaw ?? prev.merchant.raw,
                  normalized: parsed.merchantNormalized ?? prev.merchant.normalized,
                  geocoded: prev.merchant.geocoded,
                },
                purchaseAt: parsed.purchaseAt ?? prev.purchaseAt,
                currency: parsed.currency ?? prev.currency,
                total: parsed.total ?? prev.total,
                subtotal: parsed.subtotal ?? prev.subtotal,
                tax: parsed.tax ?? prev.tax,
                lineItems: parsed.lineItems.length ? parsed.lineItems : prev.lineItems,
                parseStatus: parsed.parseStatus,
                updatedAt: Date.now(),
              }
            : prev,
        );
        setProgress(null);
        const merchant = parsed.merchantNormalized ?? parsed.merchantRaw;
        if (merchant) {
          const geo = await geocodeMerchant(merchant);
          if (geo) {
            setR((prev) =>
              prev
                ? {
                    ...prev,
                    merchant: { ...prev.merchant, geocoded: geo },
                    updatedAt: Date.now(),
                  }
                : prev,
            );
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'OCR failed');
        setProgress(null);
      }
    })();
  }, [r, id]);

  if (!r) return <p className="p-6 text-muted-foreground">{say('loading', id)}</p>;

  const imgUrl = urlRef.current;

  function update(p: Partial<Receipt>) {
    setR(patch(r!, p));
  }

  async function save() {
    const next = patch(r!, { parseStatus: 'user_confirmed' });
    await db.receipts.put(next);
    await applySaveHook(next.id);
    notify('Receipt saved');
    navigate('/receipts');
  }

  return (
    <div className="p-4 max-w-md mx-auto flex flex-col gap-4 pb-24">
      <TerminalHeader route="REVIEW" />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Review</h1>
        <Button variant="ghost" size="sm" onClick={() => navigate('/receipts')}>
          <FaArrowLeft /> Cancel
        </Button>
      </div>

      {imgUrl && (
        <img
          src={imgUrl}
          alt="receipt"
          className="w-full border rounded object-contain max-h-64"
        />
      )}

      {progress !== null && (
        <Card>
          <CardContent className="pt-6 text-sm">
            <p>
              {say('loading', id)} {Math.round(progress * 100)}%
            </p>
            <div className="h-2 bg-muted border rounded mt-1 overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex flex-col gap-1">
        <Label htmlFor="merchant">Merchant</Label>
        <Input
          id="merchant"
          value={r.merchant.normalized ?? r.merchant.raw}
          onChange={(e) =>
            update({
              merchant: {
                ...r.merchant,
                normalized: e.target.value,
                raw: r.merchant.raw || e.target.value,
              },
            })
          }
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="purchaseAt">Date</Label>
        <Input
          id="purchaseAt"
          type="date"
          value={toDateInput(r.purchaseAt)}
          onChange={(e) =>
            update({
              purchaseAt: e.target.value
                ? new Date(e.target.value + 'T00:00:00').getTime()
                : null,
            })
          }
        />
      </div>

      <div className="flex gap-2">
        <div className="flex flex-col gap-1 flex-1">
          <Label htmlFor="currency">Currency</Label>
          <Input
            id="currency"
            className="uppercase"
            value={r.currency ?? ''}
            placeholder="USD"
            onChange={(e) =>
              update({ currency: e.target.value.toUpperCase() || null })
            }
          />
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <Label htmlFor="total">Total</Label>
          <Input
            id="total"
            type="number"
            step="0.01"
            value={r.total ?? ''}
            onChange={(e) =>
              update({ total: e.target.value === '' ? null : parseFloat(e.target.value) })
            }
          />
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex flex-col gap-1 flex-1">
          <Label htmlFor="subtotal">Subtotal</Label>
          <Input
            id="subtotal"
            type="number"
            step="0.01"
            value={r.subtotal ?? ''}
            onChange={(e) =>
              update({ subtotal: e.target.value === '' ? null : parseFloat(e.target.value) })
            }
          />
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <Label htmlFor="tax">Tax</Label>
          <Input
            id="tax"
            type="number"
            step="0.01"
            value={r.tax ?? ''}
            onChange={(e) =>
              update({ tax: e.target.value === '' ? null : parseFloat(e.target.value) })
            }
          />
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 text-sm flex flex-col gap-2">
          <Label>Location used for analytics</Label>
          <div className="flex gap-2">
            <Button
              variant={r.locationSource === 'user' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => update({ locationSource: 'user' })}
              disabled={!r.userLocation}
            >
              <FaLocationDot /> My GPS
            </Button>
            <Button
              variant={r.locationSource === 'merchant' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => update({ locationSource: 'merchant' })}
              disabled={!r.merchant.geocoded}
            >
              <FaLocationDot /> Merchant
            </Button>
          </div>
          {r.merchant.geocoded && (
            <p className="text-muted-foreground text-xs">
              {r.merchant.geocoded.displayName}
            </p>
          )}
          {settings && (
            <button
              className="text-muted-foreground text-xs underline self-start"
              onClick={() => {
                const next = r.locationSource === 'user' ? 'merchant' : 'user';
                update({ locationSource: next });
                void saveSettings({ activeLocationSource: next });
              }}
            >
              Set “{r.locationSource}” as default
            </button>
          )}
        </CardContent>
      </Card>

      <Button onClick={save} size="lg">
        <FaFloppyDisk /> Save receipt
      </Button>
    </div>
  );
}
