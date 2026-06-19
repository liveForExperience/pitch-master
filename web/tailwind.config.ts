import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
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
      },
      fontSize: {
        tap: ['1.75rem', { lineHeight: '2.25rem', fontWeight: '600' }],
        score: ['4rem', { lineHeight: '1', fontWeight: '600' }],
        hero: ['3rem', { lineHeight: '1.05', fontWeight: '700' }],
        h1: ['1.875rem', { lineHeight: '2.25rem', fontWeight: '700' }],
        h2: ['1.25rem', { lineHeight: '1.75rem', fontWeight: '700' }],
        body: ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],
        caption: ['0.75rem', { lineHeight: '1rem', fontWeight: '400' }],
        eyebrow: [
          '0.6875rem',
          { lineHeight: '1rem', fontWeight: '500', letterSpacing: '0.14em' },
        ],
      },
      fontFamily: {
        sans: [
          '"Helvetica Neue"',
          'ui-sans-serif',
          'system-ui',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
        mono: ['"Geist Mono"', 'ui-monospace', '"SF Mono"', 'Menlo', 'monospace'],
        serif: ['Newsreader', 'ui-serif', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
