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
        brand: {
          blue: '#1e40af', // blue-800
          lightBlue: '#2563eb', // blue-600
          orange: '#f97316', // orange-500
        }
      }
    },
  },
  plugins: [],
}
