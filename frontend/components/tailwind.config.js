/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./workspaces/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        geopulse: {
          bg: "#020617",
          surface: "#0f172a",
          surfaceAlt: "#111827",
          surfaceActive: "#1e293b",
          border: "#1e293b",
          borderStrong: "#334155",
          text: "#ffffff",
          textSoft: "#e2e8f0",
          textMuted: "#94a3b8",
          accent: "#22d3ee",
        },
      },
      boxShadow: {
        geopulse: "0 8px 24px rgba(0,0,0,0.2)",
        "geopulse-lg": "0 16px 40px rgba(15,23,42,0.28)",
      },
      borderRadius: {
        geopulse: "1rem",
        "geopulse-lg": "1.5rem",
      },
    },
  },
  plugins: [],
};