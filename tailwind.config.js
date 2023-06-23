/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./public/index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        main: '#0B0E16',
        'btn-main': '#EA6559',
        'text-main': '#6E27D8'
      }
    },
  },
  plugins: [],
}

