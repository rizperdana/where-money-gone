import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, getSettings, saveSettings } from '../db';
import { runOcr } from './ocr';
import { parseReceipt } from './parse';
import { geocodeMerchant } from '../location/geocode';
import { notify } from '../ui/toast-bus';
import { say } from '../narrator/narrator';
import TerminalHeader from '../ui/TerminalHeader';
import { applySaveHook } from '../gamification/apply-save';
import type { ParseStatus, Receipt, Settings } from '../types';

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
    if (!id) return;
    getSettings().then(setSettings);
    db.receipts.get(id).then((row) => setR(row ?? null));
  }, [id]);

  useEffect(() => {
    if (!r || !r.imageBlob) return;
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = URL.createObjectURL(r.imageBlob);
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r?.imageBlob]);

  useEffect(() => {
    if (!r || !id) return;
    if (r.parseStatus !== 'pending' || r.ocrText) return;
    let cancelled = false;
    (async () => {
      try {
        const { text, confidence } = await runOcr(r.imageBlob, setProgress);
        if (cancelled) return;
        const parsed = parseReceipt(text, confidence);
        const geocoded = parsed.merchantRaw
          ? await geocodeMerchant(parsed.merchantRaw)
          : null;
        if (cancelled) return;
        const updated = patch(r, {
          ocrText: text,
          ocrConfidence: confidence,
          ocrRanAt: Date.now(),
          ocrLocale: parsed.locale,
          merchant: {
            raw: parsed.merchantRaw ?? '',
            normalized: parsed.merchantNormalized,
            geocoded: geocoded ?? null,
          },
          purchaseAt: parsed.purchaseAt,
          currency: parsed.currency,
          total: parsed.total,
          subtotal: parsed.subtotal,
          tax: parsed.tax,
          lineItems: parsed.lineItems,
          locationSource: geocoded ? 'both' : r.userLocation ? 'user' : 'none',
          parseStatus: parsed.parseStatus === 'pending' ? 'pending' : 'parsed',
        });
        await db.receipts.put(updated);
        setR(updated);
      } catch {
        if (cancelled) return;
        const failed = patch(r, { parseStatus: 'failed' as ParseStatus });
        await db.receipts.put(failed);
        setR(failed);
        setError('OCR failed — enter manually');
      } finally {
        if (!cancelled) setProgress(null);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r, id]);

  if (!r) return <p className="p-6 text-[var(--wmg-fg-dim)]">{say('loading', id)}</p>;

  const imgUrl = urlRef.current;

  function update(p: Partial<Receipt>) {
    setR(patch(r!, p));
  }

  async function save() {
    if (!r) return;
    const merchantName = (r.merchant.normalized ?? r.merchant.raw).trim();
    if (!merchantName || r.total === null || !r.currency) {
      setError('Merchant name, total and currency are required');
      return;
    }
    const updated = patch(r, {
      merchant: {
        raw: r.merchant.raw || merchantName,
        normalized: merchantName,
        geocoded: r.merchant.geocoded,
      },
      parseStatus: 'user_confirmed' as ParseStatus,
    });
    await db.receipts.put(updated);
    // Tier 0.8: gamification hook fires on user-confirmed save only.
    const { newlyUnlocked } = await applySaveHook(r.id);
    notify(say('save_success', r.id));
    for (const a of newlyUnlocked) {
      notify(`[${a.name}] ${a.description}`);
    }
    navigate(`/receipts/${r.id}`);
  }

  return (
    <div className="p-4 max-w-md mx-auto flex flex-col gap-4 pb-24">
      <TerminalHeader route="REVIEW" />

      <div className="flex items-center justify-between">
        <h1 className="wmg-title">[ REVIEW ]</h1>
        <button className="text-[var(--wmg-fg-dim)] text-sm" onClick={() => navigate('/receipts')}>
          [ CANCEL ]
        </button>
      </div>

      {imgUrl && (
        <img
          src={imgUrl}
          alt="receipt"
          className="w-full rounded-lg border border-[var(--wmg-fg-dim)] object-contain max-h-64"
        />
      )}

      {progress !== null && (
        <div className="flex flex-col gap-1">
          <p className="text-[var(--wmg-fg-bright)] text-sm">
            {say('loading', id)} {Math.round(progress * 100)}%
          </p>
          <div className="h-2 bg-[var(--wmg-surface)] border border-[var(--wmg-fg-dim)]">
            <div
              className="h-full bg-[var(--wmg-accent)]"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      )}

      {error && <p className="text-[var(--wmg-danger)] text-sm">{error}</p>}

      <label className="flex flex-col gap-1">
        <span className="text-[var(--wmg-fg-dim)] text-sm">Merchant</span>
        <input
          className="wmg-panel text-[var(--wmg-fg)]"
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
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[var(--wmg-fg-dim)] text-sm">Date</span>
        <input
          type="date"
          className="wmg-panel text-[var(--wmg-fg)]"
          value={toDateInput(r.purchaseAt)}
          onChange={(e) =>
            update({
              purchaseAt: e.target.value
                ? new Date(e.target.value + 'T00:00:00').getTime()
                : null,
            })
          }
        />
      </label>

      <div className="flex gap-2">
        <label className="flex flex-col gap-1 flex-1">
          <span className="text-[var(--wmg-fg-dim)] text-sm">Currency</span>
          <input
            className="wmg-panel text-[var(--wmg-fg)] uppercase"
            value={r.currency ?? ''}
            placeholder="USD"
            onChange={(e) => update({ currency: e.target.value.toUpperCase() || null })}
          />
        </label>
        <label className="flex flex-col gap-1 flex-1">
          <span className="text-[var(--wmg-fg-dim)] text-sm">Total</span>
          <input
            type="number"
            step="0.01"
            className="wmg-panel text-[var(--wmg-fg)]"
            value={r.total ?? ''}
            onChange={(e) =>
              update({ total: e.target.value === '' ? null : parseFloat(e.target.value) })
            }
          />
        </label>
      </div>

      <div className="flex gap-2">
        <label className="flex flex-col gap-1 flex-1">
          <span className="text-[var(--wmg-fg-dim)] text-sm">Subtotal</span>
          <input
            type="number"
            step="0.01"
            className="wmg-panel text-[var(--wmg-fg)]"
            value={r.subtotal ?? ''}
            onChange={(e) =>
              update({ subtotal: e.target.value === '' ? null : parseFloat(e.target.value) })
            }
          />
        </label>
        <label className="flex flex-col gap-1 flex-1">
          <span className="text-[var(--wmg-fg-dim)] text-sm">Tax</span>
          <input
            type="number"
            step="0.01"
            className="wmg-panel text-[var(--wmg-fg)]"
            value={r.tax ?? ''}
            onChange={(e) =>
              update({ tax: e.target.value === '' ? null : parseFloat(e.target.value) })
            }
          />
        </label>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[var(--wmg-fg-dim)] text-sm">Location used for analytics</span>
        <div className="flex gap-2">
          <button
            className={`flex-1 py-2 border ${
              r.locationSource === 'user'
                ? 'border-[var(--wmg-accent)] text-[var(--wmg-accent)]'
                : 'border-[var(--wmg-fg-dim)] text-[var(--wmg-fg-dim)]'
            }`}
            onClick={() => update({ locationSource: 'user' })}
            disabled={!r.userLocation}
          >
            My GPS
          </button>
          <button
            className={`flex-1 py-2 border ${
              r.locationSource === 'merchant'
                ? 'border-[var(--wmg-accent)] text-[var(--wmg-accent)]'
                : 'border-[var(--wmg-fg-dim)] text-[var(--wmg-fg-dim)]'
            }`}
            onClick={() => update({ locationSource: 'merchant' })}
            disabled={!r.merchant.geocoded}
          >
            Merchant
          </button>
        </div>
        {r.merchant.geocoded && (
          <p className="text-[var(--wmg-fg-dim)] text-xs">{r.merchant.geocoded.displayName}</p>
        )}
      </div>

      {settings && (
        <button
          className="text-[var(--wmg-fg-dim)] text-xs underline self-start"
          onClick={() => {
            const next = r.locationSource === 'user' ? 'merchant' : 'user';
            update({ locationSource: next });
            void saveSettings({ activeLocationSource: next });
          }}
        >
          Set “{r.locationSource}” as default
        </button>
      )}

      <button
        className="wmg-panel hover:opacity-80 font-medium py-3"
        onClick={save}
      >
        [ SAVE RECEIPT ]
      </button>
    </div>
  );
}
