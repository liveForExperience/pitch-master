export type PosterThemeKey = 'night' | 'sunny';

export interface PosterThemeTokens {
  bg: string;
  bgCanvas: string;
  card: string;
  cardStrong: string;
  border: string;
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  gold: string;
  goldBg: string;
  goldBorder: string;
  divider: string;
  watermark: string;
}

export interface PosterThemeMeta {
  key: PosterThemeKey;
  label: string;
  desc: string;
  previewBg: string;
  previewAccent: string;
  tokens: PosterThemeTokens;
}

export const POSTER_THEMES: Record<PosterThemeKey, PosterThemeMeta> = {
  night: {
    key: 'night',
    label: '深夜竞技',
    desc: '暗黑科技感，高对比荧光绿',
    previewBg: '#0a0a0a',
    previewAccent: '#1DB954',
    tokens: {
      bg: '#0a0a0a',
      bgCanvas: '#0a0a0a',
      card: 'rgba(255,255,255,0.04)',
      cardStrong: 'rgba(255,255,255,0.07)',
      border: 'rgba(255,255,255,0.08)',
      borderStrong: 'rgba(255,255,255,0.15)',
      textPrimary: '#ffffff',
      textSecondary: '#a3a3a3',
      textMuted: '#525252',
      accent: '#1DB954',
      accentBg: 'rgba(29,185,84,0.12)',
      accentBorder: 'rgba(29,185,84,0.28)',
      accentText: '#1DB954',
      gold: '#fbbf24',
      goldBg: 'rgba(251,191,36,0.12)',
      goldBorder: 'rgba(251,191,36,0.28)',
      divider: 'rgba(255,255,255,0.08)',
      watermark: 'rgba(255,255,255,0.04)',
    },
  },
  sunny: {
    key: 'sunny',
    label: '阳光草坪',
    desc: '清新亮色，户外运动感',
    previewBg: '#f0fdf4',
    previewAccent: '#16a34a',
    tokens: {
      bg: '#f0fdf4',
      bgCanvas: '#f0fdf4',
      card: '#ffffff',
      cardStrong: '#dcfce7',
      border: '#bbf7d0',
      borderStrong: '#86efac',
      textPrimary: '#14532d',
      textSecondary: '#166534',
      textMuted: '#6b7280',
      accent: '#16a34a',
      accentBg: '#dcfce7',
      accentBorder: '#86efac',
      accentText: '#15803d',
      gold: '#d97706',
      goldBg: '#fef3c7',
      goldBorder: '#fcd34d',
      divider: '#bbf7d0',
      watermark: 'rgba(22,163,74,0.06)',
    },
  },
};
