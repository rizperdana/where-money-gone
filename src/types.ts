export type ParseStatus = 'pending' | 'parsed' | 'user_confirmed' | 'failed';
export type LocationSource = 'user' | 'merchant' | 'both' | 'none';

export interface GeocodedMerchant {
  lat: number;
  lng: number;
  displayName: string;
}

export interface Merchant {
  raw: string;
  normalized: string | null;
  geocoded: GeocodedMerchant | null;
}

export interface LineItem {
  description: string;
  qty: number | null;
  unitPrice: number | null;
  total: number | null;
}

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy: number;
  capturedAt: number;
}

export interface Receipt {
  id: string;
  imageBlob: Blob;
  imageWidth: number;
  imageHeight: number;
  ocrText: string;
  ocrConfidence: number;
  ocrRanAt: number | null;
  merchant: Merchant;
  purchaseAt: number | null;
  currency: string | null;
  total: number | null;
  subtotal: number | null;
  tax: number | null;
  lineItems: LineItem[];
  userLocation: UserLocation | null;
  locationSource: LocationSource;
  parseStatus: ParseStatus;
  createdAt: number;
  updatedAt: number;
}

export interface Settings {
  key: string;
  activeLocationSource: 'user' | 'merchant';
  defaultCurrency: string;
  theme?: string;
  bootedAt?: number;
}

export interface ParsedReceipt {
  merchantRaw: string | null;
  merchantNormalized: string | null;
  purchaseAt: number | null;
  currency: string | null;
  total: number | null;
  subtotal: number | null;
  tax: number | null;
  lineItems: LineItem[];
  parseStatus: ParseStatus;
}

export interface StreakState {
  current: number;
  best: number;
  lastLogDate: string | null; // YYYY-MM-DD in local time
}

// ponytail: HP is derived (computeHP), not stored. No stored hp field.
export interface GameState {
  key: 'app';
  streak: StreakState;
  rp: number;
  achievements: string[]; // unlocked ids
  monthlyBudget: number; // major units, per month
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  predicate: (ctx: AchievementCtx) => boolean;
}

export interface AchievementCtx {
  receipts: Receipt[];
  game: GameState;
  hp: number; // computed live, passed in by callers
}
