/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./js/**/*.{js,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        forest:      '#1A3A2B',
        'forest-lt': '#2D5A42',
        terracotta:  '#D96B43',
        sage:        '#F4F6F4',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
