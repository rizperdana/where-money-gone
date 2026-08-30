import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, newId } from '../db';
import { downscaleImage } from '../util/image';
import TerminalHeader from '../ui/TerminalHeader';
import type { Receipt, UserLocation } from '../types';

function getGeolocation(): Promise<UserLocation | null> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          capturedAt: Date.now(),
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
}

export default function CaptureScreen() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const { blob, width, height } = await downscaleImage(file);
      const userLocation = await getGeolocation();
      const now = Date.now();
      const id = newId();
      const receipt: Receipt = {
        id,
        imageBlob: blob,
        imageWidth: width,
        imageHeight: height,
        ocrText: '',
        ocrConfidence: 0,
        ocrRanAt: null,
        merchant: { raw: '', normalized: null, geocoded: null },
        purchaseAt: null,
        currency: null,
        total: null,
        subtotal: null,
        tax: null,
        lineItems: [],
        userLocation,
        locationSource: 'none',
        parseStatus: 'pending',
        createdAt: now,
        updatedAt: now,
      };
      await db.receipts.add(receipt);
      navigate(`/review/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Capture failed');
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 gap-6">
      <TerminalHeader route="CAPTURE" />
      <h1 className="wmg-title">[ CAPTURE ]</h1>
      <p className="text-[var(--wmg-fg-dim)] text-center max-w-xs">
        Point camera at a receipt. OCR runs on-device. Nothing leaves this phone.
      </p>
      <button
        className="wmg-panel hover:opacity-80 w-full max-w-xs font-medium py-4 text-lg disabled:opacity-50"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
      >
        {busy ? '[ PROCESSING... ]' : '[ ADD RECEIPT ]'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFile}
      />
      {error && <p className="text-[var(--wmg-danger)] text-sm">{error}</p>}
    </div>
  );
}
