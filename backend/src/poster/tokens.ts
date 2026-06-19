/**
 * Poster design tokens — must stay in sync with [web/src/lib/tokens.ts].
 * Notion-sports minimalist palette + Geist Mono numerals + Newsreader hero serif.
 */
export const colors = {
  surface: '#FFFFFF',
  elevated: '#FBFBFA',
  chipBg: '#F4F2EE',
  textPri: '#1F2328',
  textSec: '#6B6B6B',
  textInv: '#FFFFFF',
  border: '#EAEAEA',
  primary: '#2E7D5B',
  primaryDk: '#1E5A3F',
  primaryPale: '#EDF3EC',
  danger: '#9F2F2D',
  warning: '#9F7B26',
} as const;

export const fonts = {
  sans: 'NotoSC',
  mono: 'GeistMono',
  serif: 'Newsreader',
} as const;

// 4:5 IG/WeChat standard; activity poster may extend to 1620 (4:6 cap)
export const posterWidth = 1080;
export const posterHeight = 1350;
export const posterHeightTall = 1620;
export const gamePosterHeight = 1350;

export const cardPadding = 56;
export const cardGap = 32;
