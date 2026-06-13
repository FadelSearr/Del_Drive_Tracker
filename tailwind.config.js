/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'dr-bg': '#09090F',
        'dr-bg-2': '#0C0C18',
        'dr-card': '#111120',
        'dr-card-2': '#1A1A2C',
        'dr-text': '#FFFFFF',
        'dr-text-2': 'rgba(255,255,255,0.35)',
        'dr-text-3': 'rgba(255,255,255,0.3)',
        'dr-blue': '#4B7EFF',
        'dr-blue-2': '#3B82F6',
        'dr-green': '#22C55E',
        'dr-red': '#EF4444',
        'dr-orange': '#F97316',
        'dr-purple': '#A855F7',
        'dr-yellow': '#EAB308',
        'dr-border': 'rgba(255,255,255,0.06)',
      },
    },
  },
  plugins: [],
};
