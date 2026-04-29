/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Barlow Condensed"', 'sans-serif'],
        body: ['"Barlow"', 'sans-serif'],
      },
      colors: {
        base: '#0a0a0a',
        surface: '#141414',
        surface2: '#1e1e1e',
        border: '#2a2a2a',
        accent: '#c8ff00',
        orange: '#ff6b35',
        muted: '#666',
        text: '#f0f0f0',
      },
    },
  },
  plugins: [],
}
