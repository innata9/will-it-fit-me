import type { Category, Measurements, Slot } from '../types';

export interface MeasureStep {
  key: keyof Measurements;
  title: string;
  unit: 'cm' | 'kg';
  required: boolean;
  how: string;
  why: string;
  min: number;
  max: number;
}

/** Order and copy follow the "How to measure" guide in the prototype. */
export const MEASURE_STEPS: MeasureStep[] = [
  { key: 'heightCm', title: 'Height', unit: 'cm', required: true, min: 120, max: 220,
    how: 'Stand barefoot with your back and heels against a wall. Lay a book flat on your head, mark the wall under it, and measure from the floor to the mark.',
    why: 'Used to work out where hems and lengths will land on you.' },
  { key: 'bustCm', title: 'Bust', unit: 'cm', required: true, min: 60, max: 180,
    how: 'Wrap the tape around the fullest part of your bust, level across your back. Wear a non-padded bra.',
    why: 'Key for tops, dresses and jackets.' },
  { key: 'waistCm', title: 'Waist', unit: 'cm', required: true, min: 45, max: 180,
    how: 'Find the narrowest part of your torso, usually 2–3 cm above the navel. Breathe out normally — don’t hold your stomach in.',
    why: 'Key for skirts, trousers and belted dresses.' },
  { key: 'hipsCm', title: 'Hips', unit: 'cm', required: true, min: 60, max: 190,
    how: 'Stand with feet together and measure around the fullest part of your seat. Check in a mirror that the tape stays level.',
    why: 'Often the measurement that decides the size of trousers and dresses.' },
  { key: 'underbustCm', title: 'Underbust', unit: 'cm', required: false, min: 55, max: 160,
    how: 'Measure directly under your bust, snug against the ribcage.',
    why: 'Needed for bras, swimwear and fitted bodices.' },
  { key: 'shouldersCm', title: 'Shoulders', unit: 'cm', required: false, min: 25, max: 60,
    how: 'Measure across your back from one shoulder bone to the other. This one is easier with a helper.',
    why: 'Shows whether jackets and shirts will sit right on the shoulder.' },
  { key: 'thighCm', title: 'Thigh', unit: 'cm', required: false, min: 35, max: 100,
    how: 'Measure around the fullest part of your upper thigh, just below the crotch.',
    why: 'Helps with slim and straight-leg jeans.' },
  { key: 'calfCm', title: 'Calf', unit: 'cm', required: false, min: 25, max: 70,
    how: 'Stand with weight on both feet and measure around the widest part of your calf.',
    why: 'Compared with the boot shaft, so you know if boots will zip up.' },
  { key: 'inseamCm', title: 'Inseam', unit: 'cm', required: false, min: 55, max: 100,
    how: 'Barefoot, measure from the crotch down the inside of the leg to the floor. Or measure the inside seam of trousers that are the right length.',
    why: 'Tells you whether trousers will need shortening.' },
  { key: 'armCm', title: 'Arm length', unit: 'cm', required: false, min: 40, max: 80,
    how: 'With your arm slightly bent, measure from the shoulder bone over the elbow to the wrist bone.',
    why: 'Shows whether sleeves will be too short or too long.' },
  { key: 'footCm', title: 'Foot length', unit: 'cm', required: false, min: 18, max: 32,
    how: 'Stand on paper with your heel against a wall and trace your foot. Measure from the heel to the longest toe. Do both feet in the evening and use the longer one.',
    why: 'Matched to each brand’s shoe size chart.' },
  { key: 'weightKg', title: 'Weight', unit: 'kg', required: false, min: 30, max: 250,
    how: 'Optional. Weigh yourself in the morning on the same scale.',
    why: 'Only used to read size charts that list weight. Never shown or commented on.' },
];

export function bodyShape(m: Measurements): string | undefined {
  const { bustCm: b, waistCm: w, hipsCm: h } = m;
  if (!b || !w || !h) return undefined;
  if (h - b >= 5 && h - w >= 18) return 'pear';
  if (b - h >= 5 && b - w >= 18) return 'inverted triangle';
  if (Math.abs(b - h) < 5 && (b - w >= 18 || h - w >= 18)) return 'hourglass';
  if (w >= b && w >= h) return 'apple';
  return 'rectangle';
}

export function heightCategory(heightCm?: number): string | undefined {
  if (!heightCm) return undefined;
  if (heightCm < 160) return 'petite';
  if (heightCm >= 175) return 'tall';
  return 'regular';
}

export function completeness(m: Measurements): number {
  const filled = MEASURE_STEPS.filter((s) => m[s.key] != null).length;
  return Math.round((filled / MEASURE_STEPS.length) * 100);
}

export function hasMinimumProfile(m: Measurements): boolean {
  return MEASURE_STEPS.filter((s) => s.required).every((s) => m[s.key] != null);
}

export function categoryToSlot(c: Category): Slot {
  if (c === 'boots') return 'shoes';
  if (c === 'other') return 'accessory';
  return c;
}

export const SLOT_LABEL: Record<Slot, string> = {
  dress: 'Dress',
  top: 'Top',
  bottom: 'Bottom',
  outerwear: 'Outerwear',
  shoes: 'Shoes',
  bag: 'Bag',
  accessory: 'Accessory',
};
