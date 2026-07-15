/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#0A0E14",
        surface: "#131820",
        "surface-elevated": "#1B2230",
        border: "#232B3A",
        "text-primary": "#E7EAF0",
        "text-secondary": "#8892A6",
        accent: "#4FD1C5",
        "accent-dim": "#2C5F5A",
        safe: "#4ADE80",
        warning: "#FBBF24",
        critical: "#F87171",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Fira Code'", "monospace"],
      },
      borderRadius: {
        // Overrides Tailwind's default 'lg' (8px) globally - every
        // existing `rounded-lg` class across the app becomes a
        // consistent 12px without editing each component individually.
        lg: "12px",
        xl: "14px",
      },
      boxShadow: {
        // Soft, diffuse shadows rather than Tailwind's sharper defaults -
        // reads as "elevated surface" rather than "cut-out sticker."
        soft: "0 8px 30px -12px rgba(0, 0, 0, 0.55)",
        "soft-sm": "0 4px 16px -6px rgba(0, 0, 0, 0.4)",
      },
      keyframes: {
        "scan-sweep": {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "10%": { opacity: "1" },
          "100%": { transform: "translateX(100%)", opacity: "0" },
        },
      },
      animation: {
        "scan-sweep": "scan-sweep 2s ease-out 1",
      },
    },
  },
  plugins: [],
};
