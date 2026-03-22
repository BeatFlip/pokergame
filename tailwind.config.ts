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
        // Dark professional palette
        bg: {
          primary: "#09090b",    // zinc-950 — main background
          secondary: "#18181b",  // zinc-900 — cards/panels
          tertiary: "#27272a",   // zinc-800 — elevated surfaces
          hover: "#3f3f46",      // zinc-700 — hover states
        },
        border: {
          DEFAULT: "#27272a",    // zinc-800
          subtle: "#3f3f46",     // zinc-700
        },
        accent: {
          gold: "#f59e0b",       // amber-500 — primary accent
          "gold-light": "#fbbf24", // amber-400
          "gold-dark": "#d97706", // amber-600
          red: "#ef4444",        // red-500
          green: "#22c55e",      // green-500
          blue: "#3b82f6",       // blue-500
        },
        text: {
          primary: "#fafafa",    // zinc-50
          secondary: "#a1a1aa",  // zinc-400
          muted: "#71717a",      // zinc-500
        },
        card: {
          red: "#ef4444",
          black: "#18181b",
        },
        // Keep some legacy names for existing components
        chip: {
          gold: "#f59e0b",
          red: "#ef4444",
          blue: "#3b82f6",
          white: "#fafafa",
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
        countdown: "countdown linear forwards",
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
          "0%, 100%": { boxShadow: "0 0 8px rgba(245, 158, 11, 0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(245, 158, 11, 0.6)" },
        },
        countdown: {
          "0%": { strokeDashoffset: "0" },
          "100%": { strokeDashoffset: "220" },
        },
      },
      backgroundImage: {
        "card-back":
          "repeating-linear-gradient(45deg, #27272a, #27272a 5px, #18181b 5px, #18181b 10px)",
      },
      boxShadow: {
        card: "0 2px 8px rgba(0,0,0,0.5), 0 0 1px rgba(0,0,0,0.3)",
        "card-hover": "0 4px 16px rgba(0,0,0,0.6)",
        chip: "0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
        glow: "0 0 20px rgba(245, 158, 11, 0.4)",
        "glow-red": "0 0 20px rgba(239, 68, 68, 0.4)",
      },
    },
  },
  plugins: [],
};
export default config;
