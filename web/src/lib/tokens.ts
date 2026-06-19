/** Design tokens shared by App, H5 report, and future satori posters (ARCH §8.3). */
export const colors = {
  primary: '#10b981',
  primaryDk: '#059669',
  danger: '#ef4444',
  warning: '#f59e0b',
  surface: '#ffffff',
  elevated: '#f8fafc',
  border: '#e2e8f0',
  textPri: '#0f172a',
  textSec: '#64748b',
  textInv: '#ffffff',
  chipBg: '#f1f5f9',
} as const;

export const typography = {
  h1: { fontSize: '1.875rem', lineHeight: '2.25rem', fontWeight: 700 },
  h2: { fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: 700 },
  body: { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: 400 },
  caption: { fontSize: '0.75rem', lineHeight: '1rem', fontWeight: 400 },
  score: { fontSize: '4rem', lineHeight: '1', fontWeight: 800 },
} as const;

export const spacing = {
  cardGap: 16,
  cardPadding: 24,
  rowGap: 8,
} as const;

export const radius = {
  card: 16,
  pill: 9999,
} as const;

export const shadow = {
  card: '0 1px 3px rgba(15,23,42,.04), 0 1px 2px rgba(15,23,42,.06)',
} as const;

export const teamPalette = [
  '#ef4444',
  '#f59e0b',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
] as const;
