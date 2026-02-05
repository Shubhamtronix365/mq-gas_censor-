/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FBFBFB", // Off-white
        surface: "#ffffff",
        primary: "#171123", // Deep Dark Purple/Black
        secondary: "#636e72", // Muted gray (Keeping for neutrality)
        accent: "#6F2DBD", // Brand Purple
        highlight: "#A663CC", // Lavender
        warning: "#fdcb6e",
        danger: "#ff7675",
        safe: "#55efc4",
        border: "#e0e0e0", // Slightly darker for contrast on FBFBFB
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'premium': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',
      }
    },
  },
  plugins: [],
}
