import { z } from 'zod';

/* ---------- What the app sends ---------- */

export const Measurements = z.object({
  heightCm: z.number().positive().optional(),
  weightKg: z.number().positive().optional(),
  bustCm: z.number().positive().optional(),
  underbustCm: z.number().positive().optional(),
  waistCm: z.number().positive().optional(),
  hipsCm: z.number().positive().optional(),
  shouldersCm: z.number().positive().optional(),
  thighCm: z.number().positive().optional(),
  calfCm: z.number().positive().optional(),
  inseamCm: z.number().positive().optional(),
  armCm: z.number().positive().optional(),
  footCm: z.number().positive().optional(),
});
export type Measurements = z.infer<typeof Measurements>;

export const FitRecord = z.object({
  brand: z.string(),
  item: z.string(),
  size: z.string(),
  note: z.string(),
});

export const Profile = z.object({
  measurements: Measurements,
  bodyShape: z.string().optional(),
  heightCategory: z.string().optional(),
  notes: z.array(z.string()).default([]),
  fitPreference: z.string().optional(),
  region: z.string().optional(),
  currency: z.string().optional(),
  colorType: z
    .object({
      season: z.string(),
      undertone: z.string(),
      contrast: z.string(),
      best: z.array(z.object({ name: z.string(), hex: z.string() })),
      avoid: z.array(z.object({ name: z.string(), hex: z.string() })),
    })
    .optional(),
  fitHistory: z.array(FitRecord).default([]),
});
export type Profile = z.infer<typeof Profile>;

/* ---------- Color type (selfie analysis) ---------- */

const Swatch = z.object({ name: z.string(), hex: z.string().describe('#RRGGBB') });

export const ColorTypeResult = z.object({
  quality: z.object({
    ok: z.boolean().describe('false if the photo cannot be analysed reliably'),
    issues: z.array(z.string()).describe('Short, friendly fixes, e.g. "Turn toward the window — shadow on the left"'),
  }),
  season: z.string().describe('12-season name, e.g. "Warm Autumn"'),
  summary: z.string().describe('One sentence on what suits this person'),
  undertone: z.enum(['warm', 'cool', 'neutral', 'olive']),
  contrast: z.enum(['low', 'medium', 'high']),
  chroma: z.enum(['muted', 'medium', 'bright']),
  value: z.enum(['light', 'medium', 'deep']),
  skin: z.object({ hex: z.string(), label: z.string() }),
  hair: z.object({ hex: z.string(), label: z.string() }),
  eyes: z.object({ hex: z.string(), label: z.string() }),
  metals: z.array(z.string()),
  best: z.array(Swatch).describe('12 best colors'),
  neutrals: z.array(Swatch).describe('3–4 core neutrals'),
  avoid: z.array(Swatch).describe('4 colors to keep away from the face'),
  confidence: z.enum(['high', 'medium', 'low']),
  confidenceNote: z.string(),
  guide: z.object({
    combos: z.array(
      z.object({ name: z.string(), idea: z.string(), colors: z.array(z.string()).describe('exactly 3 hex colors') }),
    ),
    swaps: z.array(z.object({ from: z.string(), fromHex: z.string(), to: z.string(), toHex: z.string() })),
    metalsTip: z.string(),
    textures: z.array(z.string()),
    texturesTip: z.string(),
    beauty: z.array(z.object({ area: z.string(), tip: z.string(), colors: z.array(z.string()).describe('2 hex colors') })),
  }),
});
export type ColorTypeResult = z.infer<typeof ColorTypeResult>;

/* ---------- Item extraction (light model) ---------- */

const Range = z.object({ min: z.number().nullable(), max: z.number().nullable() });

export const SizeChartRow = z.object({
  size: z.string(),
  bust: Range.nullable(),
  waist: Range.nullable(),
  hips: Range.nullable(),
  inseam: Range.nullable(),
  footLength: Range.nullable(),
});
export type SizeChartRow = z.infer<typeof SizeChartRow>;

export const ExtractedItem = z.object({
  found: z.boolean().describe('false if this is not a single clothing/shoe/bag product'),
  name: z.string(),
  brand: z.string().nullable(),
  store: z.string().nullable(),
  price: z.string().nullable().describe('As shown, with currency'),
  oldPrice: z.string().nullable(),
  category: z.enum(['dress', 'top', 'bottom', 'outerwear', 'shoes', 'boots', 'bag', 'accessory', 'other']),
  colorName: z.string().nullable(),
  colorHex: z.string().nullable().describe('Best estimate of the main color as #RRGGBB'),
  availableSizes: z.array(z.string()),
  sizeChart: z
    .object({ unit: z.enum(['cm', 'in']), kind: z.enum(['body', 'garment']), rows: z.array(SizeChartRow) })
    .nullable()
    .describe('Only if a real size table is present in the source. Never invent.'),
  fabric: z.string().nullable(),
  stretch: z.enum(['none', 'some', 'high', 'unknown']),
  fit: z.string().nullable().describe('slim / regular / relaxed / oversize, as stated'),
  lengthNote: z.string().nullable().describe('Stated length, e.g. "knee length", "midi", "112 cm"'),
  modelHeightCm: z.number().nullable(),
  modelSize: z.string().nullable(),
  shaftCircumferenceCm: z.number().nullable().describe('Boots only'),
  reviewsAboutSize: z.string().nullable().describe('Short paraphrase of what reviews say about sizing, if shown'),
  returns: z.string().nullable(),
});
export type ExtractedItem = z.infer<typeof ExtractedItem>;

/* ---------- Verdict (main model) ---------- */

export const Rating = z.enum(['good', 'watch', 'bad']);

export const Verdict = z.object({
  verdict: z.enum(['buy', 'conditional', 'risky', 'no']),
  headline: z.string().describe('e.g. "Buy it — in size M"'),
  recommendedSize: z.string().nullable(),
  sizeReason: z.string(),
  confidence: z.enum(['high', 'medium', 'low']),
  confidenceReason: z.string(),
  axes: z.array(
    z.object({
      axis: z.enum(['size', 'cut', 'color', 'fabric']),
      rating: Rating,
      text: z.string(),
    }),
  ),
  risks: z.string(),
  howTo: z.string(),
  missing: z.array(z.string()).describe('Data that was not available and lowered confidence'),
});
export type Verdict = z.infer<typeof Verdict>;

/* ---------- Look check ---------- */

export const LookPiece = z.object({
  slot: z.string(),
  name: z.string(),
  colorHex: z.string(),
  source: z.enum(['wardrobe', 'wishlist', 'checked', 'shop']),
});

export const LookCheckRequest = z.object({
  pieces: z.array(LookPiece).min(1).max(8),
  occasion: z.string(),
  profile: Profile,
});

export const LookCheck = z.object({
  checks: z.array(
    z.object({
      title: z.enum(['Colors', 'Proportions', 'Occasion']),
      ok: z.boolean(),
      text: z.string(),
    }),
  ),
  tip: z.string(),
});
export type LookCheck = z.infer<typeof LookCheck>;
