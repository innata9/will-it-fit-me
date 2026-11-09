import type { ColorTypeResult } from '../types';

function rgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Perceptual-ish distance (weighted RGB, "redmean"). */
export function colorDistance(a: string, b: string): number {
  const x = rgb(a);
  const y = rgb(b);
  if (!x || !y) return Infinity;
  const rm = (x[0] + y[0]) / 2;
  const dr = x[0] - y[0];
  const dg = x[1] - y[1];
  const db = x[2] - y[2];
  return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db);
}

export type PaletteFit = 'in' | 'neutral' | 'avoid' | 'unknown';

/** Is this color in the person's palette, a neutral, or one to keep away from the face? */
export function paletteFit(hex: string | null | undefined, ct: ColorTypeResult | null): PaletteFit {
  if (!hex || !ct) return 'unknown';
  const near = (list: { hex: string }[]) => Math.min(...list.map((s) => colorDistance(hex, s.hex)));
  const best = near(ct.best);
  const neutral = near(ct.neutrals);
  const avoid = near(ct.avoid);
  if (avoid < Math.min(best, neutral) && avoid < 120) return 'avoid';
  if (best < 150) return 'in';
  if (neutral < 150) return 'neutral';
  return avoid < 200 ? 'avoid' : 'unknown';
}

export const ITEM_COLORS: { name: string; hex: string }[] = [
  { name: 'Black', hex: '#1E1D22' },
  { name: 'White', hex: '#FAFAF7' },
  { name: 'Cream', hex: '#F1E6D2' },
  { name: 'Beige', hex: '#C8A27A' },
  { name: 'Camel', hex: '#B88A5A' },
  { name: 'Brown', hex: '#5A3A28' },
  { name: 'Grey', hex: '#9A9CA3' },
  { name: 'Navy', hex: '#1F2A4A' },
  { name: 'Blue', hex: '#5C6F8A' },
  { name: 'Teal', hex: '#2F7D74' },
  { name: 'Olive', hex: '#6E6B2F' },
  { name: 'Green', hex: '#3E7A4A' },
  { name: 'Mustard', hex: '#C9962B' },
  { name: 'Rust', hex: '#9C4A25' },
  { name: 'Terracotta', hex: '#B5603F' },
  { name: 'Red', hex: '#B3261E' },
  { name: 'Pink', hex: '#E7A6BF' },
  { name: 'Purple', hex: '#6B3F8F' },
];
