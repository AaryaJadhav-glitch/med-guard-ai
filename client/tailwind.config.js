/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        clinical: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e'
        },
        risk: {
          critical: {
            bg: '#fef2f2',
            border: '#f87171',
            badge: '#ef4444',
            text: '#991b1b',
            darkBg: 'rgba(153, 27, 27, 0.2)'
          },
          high: {
            bg: '#fff7ed',
            border: '#fb923c',
            badge: '#f97316',
            text: '#9a3412',
            darkBg: 'rgba(154, 52, 18, 0.2)'
          },
          moderate: {
            bg: '#fffbeb',
            border: '#facc15',
            badge: '#eab308',
            text: '#854d0e',
            darkBg: 'rgba(133, 77, 14, 0.2)'
          },
          low: {
            bg: '#f0fdf4',
            border: '#4ade80',
            badge: '#22c55e',
            text: '#166534',
            darkBg: 'rgba(22, 101, 52, 0.2)'
          },
          informational: {
            bg: '#f0f9ff',
            border: '#38bdf8',
            badge: '#0ea5e9',
            text: '#075985',
            darkBg: 'rgba(7, 89, 133, 0.2)'
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
      }
    },
  },
  plugins: [],
}
