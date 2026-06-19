import type { Config } from 'tailwindcss';

const rgb = (cssVar: string) => `rgb(var(${cssVar}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: rgb('--color-surface'),
        elevated: rgb('--color-elevated'),
        chipBg: rgb('--color-chip-bg'),
        textPri: rgb('--color-text-pri'),
        textSec: rgb('--color-text-sec'),
        textInv: rgb('--color-text-inv'),
        border: rgb('--color-border'),
        primary: rgb('--color-primary'),
        primaryDk: rgb('--color-primary-dk'),
        primaryPale: rgb('--color-primary-pale'),
        danger: rgb('--color-danger'),
        warning: rgb('--color-warning'),
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
