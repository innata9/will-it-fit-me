export const colors = {
  bg: '#F3F4F6',
  surface: '#FFFFFF',
  ink: '#18171C',
  ink2: '#34323C',
  muted: '#4A4855',
  subtle: '#5B5966',
  line: '#E2E1E6',
  lineSoft: '#ECEBEF',
  field: '#CFCDD6',
  accent: '#5B2A86',
  accentDark: '#3F1C5E',
  accentSoft: '#EEE7F5',
  good: '#1E7A46',
  goodBg: '#E6F4EC',
  warn: '#8A5300',
  warnBg: '#FDF0DC',
  risky: '#A3430B',
  riskyBg: '#FDE9DD',
  bad: '#A6261C',
  badBg: '#FBE7E5',
  stage: '#ECE9E4',
};

export const radius = { sm: 10, md: 14, lg: 20, pill: 999 };

export const type = {
  display: { fontSize: 24, fontWeight: '700' as const, lineHeight: 30, color: colors.ink },
  title: { fontSize: 20, fontWeight: '700' as const, lineHeight: 26, color: colors.ink },
  h2: { fontSize: 16, fontWeight: '700' as const, color: colors.ink },
  body: { fontSize: 14, lineHeight: 20, color: colors.ink2 },
  small: { fontSize: 13, lineHeight: 18, color: colors.muted },
  caption: { fontSize: 12, lineHeight: 16, color: colors.subtle },
};

export type VerdictKind = 'buy' | 'conditional' | 'risky' | 'no';

export const verdictStyle: Record<VerdictKind, { label: string; ink: string; bg: string }> = {
  buy: { label: 'Buy it', ink: colors.good, bg: colors.goodBg },
  conditional: { label: 'Conditional', ink: colors.warn, bg: colors.warnBg },
  risky: { label: 'Risky', ink: colors.risky, bg: colors.riskyBg },
  no: { label: 'Won’t fit', ink: colors.bad, bg: colors.badBg },
};

export const ratingStyle = {
  good: { label: 'Good', ink: colors.good, bg: colors.goodBg },
  watch: { label: 'Watch out', ink: colors.warn, bg: colors.warnBg },
  bad: { label: 'Problem', ink: colors.bad, bg: colors.badBg },
};
