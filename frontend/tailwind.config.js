/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F0EEE6',
        surface: '#FAF9F5',
        ink: {
          DEFAULT: '#141413',
          soft: '#3D3D3A',
        },
        'text-muted': '#5E5D59',
        hairline: '#D1CFC5',
        oat: '#E3DACC',
        manilla: '#F5E3C7',
        clay: {
          DEFAULT: '#D97757',
          deep: '#A6482D',
        },
        sage: '#B7C0AD',
        cloud: {
          DEFAULT: '#B0AEA5',
          dark: '#87867F',
        },
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        'control': '0.625rem', // 10px
        'card': '1.25rem',     // 20px
      },
      maxWidth: {
        'content': '80rem',    // 1280px
        'reading': '45rem',    // 720px
      },
      transitionTimingFunction: {
        'editorial': 'cubic-bezier(.2, .7, .2, 1)',
      }
    },
  },
  plugins: [],
}
