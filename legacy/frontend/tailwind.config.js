import path from 'path';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1DB954",
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-out': { from: { opacity: '1' }, to: { opacity: '0' } },
        'zoom-in-95': { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        'zoom-out-95': { from: { opacity: '1', transform: 'scale(1)' }, to: { opacity: '0', transform: 'scale(0.95)' } },
        'slide-in-from-top': { from: { transform: 'translateY(-8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        'slide-out-to-top': { from: { transform: 'translateY(0)', opacity: '1' }, to: { transform: 'translateY(-8px)', opacity: '0' } },
      },
      animation: {
        'in': 'fade-in 0.15s ease-out',
        'out': 'fade-out 0.1s ease-in',
        'zoom-in': 'zoom-in-95 0.2s ease-out',
        'zoom-out': 'zoom-out-95 0.15s ease-in',
        'slide-in': 'slide-in-from-top 0.2s ease-out',
        'slide-out': 'slide-out-to-top 0.15s ease-in',
      },
    },
  },
  plugins: [],
}
