/** Mirrors server/src/schemas.ts — keep in sync. */

export interface Measurements {
  heightCm?: number;
  weightKg?: number;
  bustCm?: number;
  underbustCm?: number;
  waistCm?: number;
  hipsCm?: number;
  shouldersCm?: number;
  thighCm?: number;
  calfCm?: number;
  inseamCm?: number;
  armCm?: number;
  footCm?: number;
}

export interface Swatch {
  name: string;
  hex: string;
}

export interface ColorTypeResult {
  quality: { ok: boolean; issues: string[] };
  season: string;
  summary: string;
  undertone: 'warm' | 'cool' | 'neutral' | 'olive';
  contrast: 'low' | 'medium' | 'high';
  chroma: 'muted' | 'medium' | 'bright';
  value: 'light' | 'medium' | 'deep';
  skin: { hex: string; label: string };
  hair: { hex: string; label: string };
  eyes: { hex: string; label: string };
  metals: string[];
  best: Swatch[];
  neutrals: Swatch[];
  avoid: Swatch[];
  confidence: 'high' | 'medium' | 'low';
  confidenceNote: string;
  guide: {
    combos: { name: string; idea: string; colors: string[] }[];
    swaps: { from: string; fromHex: string; to: string; toHex: string }[];
    metalsTip: string;
    textures: string[];
    texturesTip: string;
    beauty: { area: string; tip: string; colors: string[] }[];
  };
}

export type Category = 'dress' | 'top' | 'bottom' | 'outerwear' | 'shoes' | 'boots' | 'bag' | 'accessory' | 'other';

export interface ExtractedItem {
  name: string;
  brand: string | null;
  store: string | null;
  price: string | null;
  oldPrice: string | null;
  category: Category;
  colorName: string | null;
  colorHex: string | null;
  availableSizes: string[];
  fabric: string | null;
  stretch: 'none' | 'some' | 'high' | 'unknown';
  fit: string | null;
  lengthNote: string | null;
  modelHeightCm: number | null;
  modelSize: string | null;
  returns: string | null;
  url: string | null;
  imageUrl: string | null;
}

export interface SizeMatch {
  recommended: string | null;
  borderline: { size: string; measure: string; overCm: number } | null;
}

export interface Verdict {
  verdict: 'buy' | 'conditional' | 'risky' | 'no';
  headline: string;
  recommendedSize: string | null;
  sizeReason: string;
  confidence: 'high' | 'medium' | 'low';
  confidenceReason: string;
  axes: { axis: 'size' | 'cut' | 'color' | 'fabric'; rating: 'good' | 'watch' | 'bad'; text: string }[];
  risks: string;
  howTo: string;
  missing: string[];
}

export interface CheckResponse {
  item: ExtractedItem;
  sizeMatch: SizeMatch | null;
  verdict: Verdict;
}

export interface LookCheck {
  checks: { title: 'Colors' | 'Proportions' | 'Occasion'; ok: boolean; text: string }[];
  tip: string;
}

/* ---------- App-only ---------- */

export type Slot = 'dress' | 'top' | 'bottom' | 'outerwear' | 'shoes' | 'bag' | 'accessory';

export interface Piece {
  slot: Slot;
  name: string;
  colorHex: string;
  source: 'wardrobe' | 'wishlist' | 'checked' | 'shop';
  refId?: string;
}

export interface WardrobeItem {
  id: string;
  name: string;
  slot: Slot;
  colorHex: string;
}

export interface Check {
  id: string;
  createdAt: number;
  status: 'pending' | 'done' | 'error';
  url?: string;
  /** Kept in memory only while the check runs; never persisted. */
  screenshot?: { base64: string; mediaType: string };
  error?: string;
  result?: CheckResponse;
  wished: boolean;
  helpful?: boolean;
}

export interface Look {
  id: string;
  name: string;
  folder: string;
  occasion: string;
  pieces: Piece[];
  review?: LookCheck;
  createdAt: number;
}

export interface FitEntry {
  id: string;
  checkId?: string;
  brand: string;
  item: string;
  size: string;
  zones: Record<'bust' | 'waist' | 'hips' | 'length', 'tight' | 'right' | 'loose'>;
  kept: boolean;
  note: string;
  createdAt: number;
}
