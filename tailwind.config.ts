import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        border: "var(--border)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        brand: {
          indigo: "#6366F1",
          violet: "#A855F7",
          pink: "#EC4899",
        },
        gold: "#D4AF37",
        mint: "#00FFB3",
        error: "#FF4D6D",
        success: "#00FFB3",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(90deg, #6366F1 0%, #A855F7 50%, #EC4899 100%)",
        "brand-gradient-soft":
          "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(168,85,247,0.12) 50%, rgba(236,72,153,0.10) 100%)",
        "gold-tint":
          "linear-gradient(180deg, rgba(212,175,55,0.08) 0%, rgba(212,175,55,0.02) 100%)",
      },
      boxShadow: {
        glow: "0 0 24px rgba(168,85,247,0.25)",
        "glow-mint": "0 0 20px rgba(0,255,179,0.20)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 320ms cubic-bezier(0.22, 1, 0.36, 1) both",
        shimmer: "shimmer 1.8s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
