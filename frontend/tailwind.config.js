/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4ff',
          100: '#e0e8ff',
          200: '#c7d4f8',
          300: '#a3b4ef',
          400: '#7b8fe3',
          500: '#5a6dd4',
          600: '#4455c4',
          700: '#3744ab',
          800: '#1e2a6e',
          900: '#0f1640',
          950: '#080d28',
        }
      }
    }
  },
  plugins: [],
}
