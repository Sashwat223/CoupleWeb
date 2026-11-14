/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        midnight: {
          DEFAULT: '#0B1E4A',
          deep: '#071436',
          light: '#122A6B',
        },
        burgundy: {
          DEFAULT: '#5C0F2B',
          deep: '#6B0F2B',
        },
        blossom: {
          DEFAULT: '#FF6FA5',
          dusty: '#C67B8A',
          soft: '#F7C8D3',
        },
        gold: {
          DEFAULT: '#D4A95C',
          muted: '#C9A86A',
          bright: '#E8C87E',
        },
        cream: {
          DEFAULT: '#FFF8F0',
          soft: '#FDF6EE',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        script: ['"Great Vibes"', 'cursive'],
        sans: ['"Manrope"', '"Inter"', 'system-ui', 'sans-serif'],
      },
      transitionTimingFunction: {
        luxury: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
