/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#12141C',
          soft: '#1B1E29',
          line: '#2A2E3B',
        },
        paper: {
          DEFAULT: '#F7F4EC',
          dim: '#EDE8DA',
        },
        gold: {
          DEFAULT: '#E8A93B',
          soft: '#F2C773',
          deep: '#B8801F',
        },
        teal: {
          DEFAULT: '#1F5D57',
          soft: '#2E8377',
          pale: '#DCEEEA',
        },
        clay: {
          DEFAULT: '#B85C38',
          soft: '#D98A63',
        },
        muted: '#8A8F9C',
      },
      fontFamily: {
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        body: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        pot: '1.75rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(18,20,28,0.06), 0 8px 24px -12px rgba(18,20,28,0.18)',
      },
    },
  },
  plugins: [],
}
