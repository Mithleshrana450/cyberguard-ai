/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Placeholder palette - we'll design the real token system
        // deliberately in Module 2 (Dashboard) using the frontend-design
        // process rather than picking defaults now.
        background: "#0B0F14",
        surface: "#121821",
        accent: "#3FB68B",
      },
    },
  },
  plugins: [],
};
