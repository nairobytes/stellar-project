/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0B1120",
          deep: "#0A1128",
          card: "#111827",
        },
        stellar: {
          DEFAULT: "#2B7CB8",
          dark: "#1E5A8A",
          light: "#66C2FF",
          muted: "rgba(43, 124, 184, 0.65)",
        },
        cream: "#F9F7F2",
      },
      fontFamily: {
        sans: ["Montserrat", "system-ui", "sans-serif"],
        serif: ["Playfair Display", "Georgia", "serif"],
        display: ["Space Grotesk", "system-ui", "sans-serif"],
      },
      animation: {
        "spin-slow": "spin 2s linear infinite",
        "fade-up": "fadeUp 0.8s ease-out forwards",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
