/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1a1a2e',
          medium: '#16213e',
          accent: '#0f3460',
        },
        gold: {
          DEFAULT: '#d4a574',
          light: '#e8c9a0',
        },
        star: '#FFD700',
      },
    },
  },
  plugins: [],
}
