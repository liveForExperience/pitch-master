/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1DB954", // 足球场绿
        dark: "#121212",    // 深背景色
      }
    },
  },
  plugins: [],
}
