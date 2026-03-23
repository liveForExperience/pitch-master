import path from 'path';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "/Users/chenyue/develop/my_own_work/oldboy-club-manager/frontend/index.html",
    "/Users/chenyue/develop/my_own_work/oldboy-club-manager/frontend/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1DB954", // 足球场绿
      }
    },
  },
  plugins: [],
}
