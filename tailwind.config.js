/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#111111',
          gold: '#C9A96E',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
      },
    },
  },
  plugins: [],
};
