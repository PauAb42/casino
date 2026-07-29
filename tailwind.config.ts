import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#0A0D12",
        felt: "#0E3B2E",
        "felt-light": "#154F3D",
        gold: "#C9A227",
        alert: "#E14B4B",
        trust: "#45D0B5",
        paper: "#F2EEE1",
      },
      fontFamily: {
        marquee: ["var(--font-marquee)"],
        serif: ["var(--font-serif)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      boxShadow: {
        chip: "0 0 0 3px rgba(201,162,39,0.25), 0 8px 20px rgba(0,0,0,0.45)",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(69,208,181,0.35)" },
          "50%": { boxShadow: "0 0 0 10px rgba(69,208,181,0)" },
        },
      },
      animation: {
        pulseGlow: "pulseGlow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
