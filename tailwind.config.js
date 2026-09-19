/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          light: '#fbf9f4',
          DEFAULT: '#f3f1eb',
          card: '#faf8f5',
          border: '#dcd8ce',
          dark: '#e5e1d5'
        }
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', '"Playfair Display"', 'serif'],
        display: ['"Cinzel"', '"Italiana"', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif']
      }
    },
  },
  plugins: [],
}
