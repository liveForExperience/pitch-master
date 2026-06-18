import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
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
      },
      fontSize: {
        tap: ['1.75rem', { lineHeight: '2.25rem', fontWeight: '700' }],
        score: ['4rem', { lineHeight: '1', fontWeight: '800' }],
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
