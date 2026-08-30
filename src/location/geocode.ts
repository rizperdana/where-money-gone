import type { GeocodedMerchant } from '../types';

// ponytail: in-memory cache keyed by merchant name; respects Nominatim's 1 req/sec public limit.
const cache = new Map<string, GeocodedMerchant | null>();
let lastRequestAt = 0;

const MIN_INTERVAL_MS = 1000;

async function throttle(): Promise<void> {
  const now = Date.now();
  const wait = MIN_INTERVAL_MS - (now - lastRequestAt);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();
}

export async function geocodeMerchant(
  merchant: string,
): Promise<GeocodedMerchant | null> {
  const key = merchant.trim().toLowerCase();
  if (!key) return null;
  if (cache.has(key)) return cache.get(key) ?? null;

  await throttle();
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      merchant,
    )}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'where-money-gone/0.1 (local dev)' },
    });
    if (!res.ok) {
      cache.set(key, null);
      return null;
    }
    const data = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
    }>;
    if (data.length === 0) {
      cache.set(key, null);
      return null;
    }
    const result: GeocodedMerchant = {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      displayName: data[0].display_name,
    };
    cache.set(key, result);
    return result;
  } catch {
    // ponytail: network/offline -> no geocode, but don't poison the cache permanently.
    return null;
  }
}
