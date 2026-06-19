/**
 * Design tokens shared by App UI, H5 report, and satori posters.
 *
 * Visual language: Notion-sports minimalist.
 *   - Warm-white page, near-black ink, single pitch-green accent.
 *   - One hairline border, zero static shadow.
 *   - Geist Mono for numerals, Newsreader Italic for hero verdict.
 */
export const colors = {
  // Surfaces
  surface: '#FFFFFF',
  elevated: '#FBFBFA',
  chipBg: '#F4F2EE',
  // Ink
  textPri: '#1F2328',
  textSec: '#6B6B6B',
  textInv: '#FFFFFF',
  // Hairline (used everywhere a divider was previously a Card)
  border: '#EAEAEA',
  // Brand: pitch-green, calmer than Tailwind emerald
  primary: '#2E7D5B',
  primaryDk: '#1E5A3F',
  primaryPale: '#EDF3EC',
  // Semantic accents (used sparingly)
  danger: '#9F2F2D',
  warning: '#9F7B26',
} as const;

export const typography = {
  hero: { fontSize: '3.5rem', lineHeight: '1.05', fontWeight: 700 },
  h1: { fontSize: '1.875rem', lineHeight: '2.25rem', fontWeight: 700 },
  h2: { fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: 700 },
  body: { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: 400 },
  caption: { fontSize: '0.75rem', lineHeight: '1rem', fontWeight: 400 },
  score: { fontSize: '4rem', lineHeight: '1', fontWeight: 600 },
  eyebrow: {
    fontSize: '0.6875rem',
    lineHeight: '1rem',
    fontWeight: 500,
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
  },
} as const;

export const spacing = {
  cardGap: 16,
  cardPadding: 24,
  rowGap: 8,
} as const;

export const radius = {
  row: 8,
  card: 12,
  pill: 9999,
} as const;

export const shadow = {
  none: 'none',
  hover: '0 2px 8px rgba(0,0,0,0.04)',
} as const;

/**
 * Team color palette. Calibrated so all 8 read on warm-white surface
 * without clashing with the pitch-green brand accent.
 */
export const teamPalette = [
  '#C44536', // brick
  '#D98E2B', // amber
  '#C4A03F', // ochre
  '#3E8E5A', // sage (distinct from brand primary)
  '#2C8AA1', // teal
  '#3964B0', // cobalt
  '#6B4C9A', // plum
  '#B65A82', // rose
] as const;
