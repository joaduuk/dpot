/** @type {import('tailwindcss').Config} */
// ── Single source of truth for the theme ────────────────────────────────
// Every component references these token names (bg-ink, text-teal, etc.),
// never raw hex values — so re-theming DailyPot in the future means
// editing the values below, nothing else.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#12141A',
          soft: '#1B1E28',
          line: '#262A35',
        },
        paper: {
          DEFAULT: '#F6F6F3',
          dim: '#ECEBE6',
        },
        gold: {
          DEFAULT: '#A8834A',
          soft: '#C7A876',
          deep: '#7C5F30',
        },
        teal: {
          DEFAULT: '#1B4D46',
          soft: '#2C6B62',
          pale: '#E1EAE8',
        },
        clay: {
          DEFAULT: '#9C5B42',
          soft: '#C08868',
        },
        muted: '#6B7280',
      },
      fontFamily: {
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        body: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        pot: '1rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(18,20,26,0.05), 0 6px 20px -10px rgba(18,20,26,0.16)',
      },
    },
  },
  plugins: [],
}
