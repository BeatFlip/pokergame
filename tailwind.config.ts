import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        felt: {
          green: "#1a472a",
          dark: "#0d2818",
          edge: "#0f3320",
          light: "#235c38",
        },
        card: {
          white: "#f5f0e8",
          red: "#c0392b",
          black: "#1a1a1a",
        },
        chip: {
          gold: "#c9a74a",
          red: "#c0392b",
          blue: "#2980b9",
          white: "#ecf0f1",
        },
        surface: {
          DEFAULT: "#111827",
          elevated: "#1f2937",
          overlay: "#374151",
        },
      },
      fontFamily: {
        display: ["var(--font-playfair)", "Georgia", "serif"],
        mono: ["var(--font-dm-mono)", "Menlo", "monospace"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      animation: {
        "card-flip": "cardFlip 0.4s ease-in-out",
        "card-deal": "cardDeal 0.3s ease-out",
        "chip-slide": "chipSlide 0.25s ease-out",
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "pulse-glow": "pulseGlow 1.5s ease-in-out infinite",
        "countdown": "countdown linear forwards",
      },
      keyframes: {
        cardFlip: {
          "0%": { transform: "rotateY(0deg)" },
          "50%": { transform: "rotateY(90deg)" },
          "100%": { transform: "rotateY(0deg)" },
        },
        cardDeal: {
          "0%": { transform: "translateY(-20px) scale(0.9)", opacity: "0" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
        chipSlide: {
          "0%": { transform: "translateX(-10px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 8px rgba(201, 167, 74, 0.4)" },
          "50%": { boxShadow: "0 0 20px rgba(201, 167, 74, 0.8)" },
        },
        countdown: {
          "0%": { strokeDashoffset: "0" },
          "100%": { strokeDashoffset: "220" },
        },
      },
      backgroundImage: {
        "felt-texture":
          "radial-gradient(ellipse at center, #235c38 0%, #1a472a 40%, #0f3320 100%)",
        "card-back":
          "repeating-linear-gradient(45deg, #1a1a2e, #1a1a2e 5px, #16213e 5px, #16213e 10px)",
      },
      boxShadow: {
        card: "0 2px 8px rgba(0,0,0,0.5), 0 0 1px rgba(0,0,0,0.3)",
        "card-hover": "0 4px 16px rgba(0,0,0,0.6)",
        chip: "0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
        table: "inset 0 0 60px rgba(0,0,0,0.4)",
        glow: "0 0 20px rgba(201, 167, 74, 0.5)",
        "glow-red": "0 0 20px rgba(192, 57, 43, 0.5)",
      },
    },
  },
  plugins: [],
};
export default config;
