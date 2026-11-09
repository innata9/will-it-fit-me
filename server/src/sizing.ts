import type { Measurements, SizeChartRow } from './schemas.js';

export type MeasureKey = 'bust' | 'waist' | 'hips' | 'inseam' | 'footLength';
export type FitStatus = 'fits' | 'tight' | 'loose';

export interface MeasureFit {
  measure: MeasureKey;
  bodyCm: number;
  min: number | null;
  max: number | null;
  status: FitStatus;
  /** cm over the max (tight) or under the min (loose); 0 when it fits */
  diffCm: number;
}

export interface SizeMatch {
  recommended: string | null;
  rows: { size: string; fits: MeasureFit[] }[];
  /** The next size down is close — only one measurement slightly over */
  borderline: { size: string; measure: MeasureKey; overCm: number } | null;
  usedMeasures: MeasureKey[];
}

const BODY: Record<MeasureKey, keyof Measurements> = {
  bust: 'bustCm',
  waist: 'waistCm',
  hips: 'hipsCm',
  inseam: 'inseamCm',
  footLength: 'footCm',
};

const IN_TO_CM = 2.54;

/**
 * Deterministic size match against a brand's body-measurement chart.
 * Picks the smallest size where no measurement is over its max by more than
 * the allowed tolerance (more tolerance for stretchy fabric).
 * Numbers are computed here, never by the model.
 */
export function matchSize(
  chart: { unit: 'cm' | 'in'; rows: SizeChartRow[] },
  body: Measurements,
  stretch: 'none' | 'some' | 'high' | 'unknown',
): SizeMatch {
  const factor = chart.unit === 'in' ? IN_TO_CM : 1;
  const tolerance = stretch === 'high' ? 3 : stretch === 'some' ? 1.5 : 0;

  const usedMeasures = (Object.keys(BODY) as MeasureKey[]).filter(
    (m) => body[BODY[m]] != null && chart.rows.some((r) => r[m] != null),
  );

  const rows = chart.rows.map((row) => {
    const fits: MeasureFit[] = [];
    for (const m of usedMeasures) {
      const range = row[m];
      const bodyCm = body[BODY[m]];
      if (!range || bodyCm == null) continue;
      const min = range.min != null ? round1(range.min * factor) : null;
      const max = range.max != null ? round1(range.max * factor) : null;
      let status: FitStatus = 'fits';
      let diffCm = 0;
      if (max != null && bodyCm > max) {
        status = 'tight';
        diffCm = round1(bodyCm - max);
      } else if (min != null && bodyCm < min) {
        status = 'loose';
        diffCm = round1(min - bodyCm);
      }
      fits.push({ measure: m, bodyCm, min, max, status, diffCm });
    }
    return { size: row.size, fits };
  });

  const ok = (r: (typeof rows)[number]) =>
    r.fits.length > 0 && r.fits.every((f) => f.status !== 'tight' || f.diffCm <= tolerance);

  const idx = rows.findIndex(ok);
  let recommended: string | null = null;
  if (idx >= 0) recommended = rows[idx].size;
  else if (rows.length > 0 && rows.some((r) => r.fits.length > 0)) recommended = rows[rows.length - 1].size;

  let borderline: SizeMatch['borderline'] = null;
  if (idx > 0) {
    const below = rows[idx - 1];
    const tight = below.fits.filter((f) => f.status === 'tight');
    if (tight.length === 1 && tight[0].diffCm <= 2) {
      borderline = { size: below.size, measure: tight[0].measure, overCm: tight[0].diffCm };
    }
  }

  return { recommended, rows, borderline, usedMeasures };
}

/** Where a hem lands on the user, given where it lands on the model. */
export function lengthShiftCm(modelHeightCm: number | null, userHeightCm: number | undefined): number | null {
  if (!modelHeightCm || !userHeightCm) return null;
  // Leg length is roughly 47% of height; a hem sits lower on a shorter person by about that share.
  return round1((modelHeightCm - userHeightCm) * 0.47);
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
