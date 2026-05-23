/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ppb: {
          background: "#06070B",
          subtle: "#11131A",
          surface: "#0D1420",
          surfaceStrong: "#171B25",
          border: "rgba(255,255,255,0.10)",
          borderStrong: "rgba(255,255,255,0.18)",
          primary: "#FF6A00",
          primaryHover: "#FF8C3A",
          primarySoft: "rgba(255,106,0,0.14)",
          primaryDeep: "#C74B00",
          accent: "#35C2FF",
          accentSoft: "rgba(53,194,255,0.14)",
          gold: "#F3B24F",
          goldSoft: "rgba(243,178,79,0.14)",
          danger: "#F87171",
          success: "#34D399",
          text: "#FFFFFF",
          textStrong: "#FFFFFF",
          muted: "rgba(255,255,255,0.62)",
          mutedSoft: "rgba(255,255,255,0.42)",
          dark: "#06070B",
          night: "#06070B",
          nightSoft: "#0B0E15",
          nightSurface: "#0D1420",
          nightSurfaceStrong: "#171B25"
        }
      },
      boxShadow: {
        "ppb-card": "0 1px 2px rgba(0,0,0,0.30), 0 12px 32px rgba(0,0,0,0.35)",
        "ppb-card-hover": "0 4px 12px rgba(0,0,0,0.40), 0 22px 60px rgba(0,0,0,0.45)",
        "ppb-glow": "0 1px 2px rgba(255,106,0,0.35), 0 16px 40px rgba(255,106,0,0.28)",
        "ppb-glow-strong": "0 24px 64px rgba(255,106,0,0.34)",
        "ppb-glow-cyan": "0 16px 44px rgba(53,194,255,0.28)",
        "ppb-panel-dark": "0 28px 90px rgba(0,0,0,0.50)"
      },
      backgroundImage: {
        "ppb-radial":
          "radial-gradient(circle at top left, rgba(255,106,0,0.18), transparent 32%), radial-gradient(circle at 82% 18%, rgba(53,194,255,0.12), transparent 24%), linear-gradient(180deg, #090A10 0%, #06070B 100%)",
        "ppb-dark-radial":
          "radial-gradient(circle at top left, rgba(255,106,0,0.22), transparent 30%), radial-gradient(circle at 85% 18%, rgba(53,194,255,0.14), transparent 24%), linear-gradient(180deg, #090A10 0%, #06070B 100%)",
        "ppb-arena":
          "radial-gradient(circle at top left, rgba(255,106,0,0.20), transparent 26%), radial-gradient(circle at 80% 14%, rgba(53,194,255,0.14), transparent 22%), linear-gradient(135deg, #0D1420 0%, #06070B 60%, #06070B 100%)"
      },
      fontFamily: {
        sans: ["Inter", "Segoe UI", "Arial", "sans-serif"],
        display: ["Orbitron", "Rajdhani", "Eurostile", "Inter", "sans-serif"]
      }
    }
  },
  plugins: [],
};
