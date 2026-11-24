/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        institution: {
          50: '#f0f5fa',
          100: '#e1ebf4',
          200: '#c3d8e9',
          500: '#1d5e9b',
          600: '#16487a',
          700: '#11355b',
          800: '#0d2642',
          900: '#071626',
        },
        tealbrand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
        }
      }
    },
  },
  plugins: [],
}
