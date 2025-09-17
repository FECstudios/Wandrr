/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#10B981',
        secondary: '#3B82F6',
      },
      animation: {
        'indeterminate-progress': 'indeterminate-progress 1.5s infinite',
      },
      keyframes: {
        'indeterminate-progress': {
          '0%': { left: '-35%', right: '100%' },
          '60%': { left: '100%', right: '-90%' },
          '100%': { left: '100%', right: '-90%' },
        },
      },
    },
  },
  plugins: [],
}