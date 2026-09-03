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
        background: '#09090b',
        zinc: {
          750: '#333338', // between zinc-700 (#3f3f46) and zinc-800 (#27272a)
          850: '#19191c', // between zinc-800 (#27272a) and zinc-900 (#18181b)
        },
        surface: {
          50: '#27272a',
          100: '#1d1d20',
          200: '#18181b',
          300: '#121214',
        },
        // Muted steel / slate-blue accent — desaturated, low-saturation blue-gray.
        // Mid-tones anchored near #5B6E8C, scaled to a coherent 11-step ramp.
        brand: {
          50: '#f4f6f9',
          100: '#e6eaf0',
          200: '#cdd6e2',
          300: '#aab8cb',
          400: '#8395ae',
          500: '#647896',
          600: '#4f617d',
          700: '#425067',
          800: '#384355',
          900: '#313a48',
          950: '#1f2530',
        },
        call: {
          success: '#10b981',
          danger: '#ef4444',
          warning: '#f59e0b',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ripple': 'ripple 1.5s cubic-bezier(0, 0.2, 0.8, 1) infinite',
        'wave': 'wave 1.2s ease-in-out infinite',
      },
      keyframes: {
        ripple: {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        wave: {
          '0%, 100%': { height: '8px' },
          '50%': { height: '32px' },
        }
      }
    },
  },
  plugins: [],
}
