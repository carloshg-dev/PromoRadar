import type { Config } from "tailwindcss";

/** Design System: "Radical Precision Dark" (Google Stitch). */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg:    { DEFAULT: "#0A0A0C", soft: "#131315", card: "#161618", over: "#1E1E20", input: "#0F0F11" },
        line:  "#26262b",
        brand: { DEFAULT: "#7C5DFF", 2: "#cabeff" },     // mauve (signal primário)
        cyan:  { DEFAULT: "#00dbe7", 2: "#74f5ff" },     // secondary
        neon:  { DEFAULT: "#22E06B", 2: "#7CF0A8" },     // verde da logo — acento de "oferta/economia"
        fit:   { DEFAULT: "#FF4D6D", 2: "#FF8FA3" },     // coral — vertical Mundo Fit (suplementos)
        eletro:{ DEFAULT: "#FFB020", 2: "#FFD37A" },     // âmbar — vertical Casa & Eletro
        tool:  { DEFAULT: "#2563EB", 2: "#7DA8FF" },     // azul industrial — vertical Ferramentas
        gadget:{ DEFAULT: "#14B8A6", 2: "#5EEAD4" },     // teal — vertical Gadgets
        parfum:{ DEFAULT: "#9333EA", 2: "#C99DF5" },     // violeta — vertical Perfumes
        ok:    "#22c55e",
        warn:  "#f59e0b",
        danger:"#ff5449",
        muted: "#938ea1",
        // "Signal accents" das lojas (DESIGN.md › Retail Integration)
        loja:  { kabum: "#FF6500", terabyte: "#00D35E", pichau: "#E3000F", mercadolivre: "#FFE600", amazon: "#FF9900" },
      },
      maxWidth: { page: "1760px" },
      borderRadius: { DEFAULT: "0.5rem", md: "0.75rem", lg: "1rem", xl: "1.5rem" },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: { tightest: "-0.04em" },
      keyframes: {
        "fade-up": { "0%": { opacity: "0", transform: "translateY(10px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "snow-fall": {
          "0%": { transform: "translateY(-3rem) translateX(0)", opacity: "0" },
          "10%": { opacity: "1" },
          "85%": { opacity: ".85" },
          "100%": { transform: "translateY(105vh) translateX(1.5rem)", opacity: "0" },
        },
        "lantern-float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
        "lantern-aura": {
          "0%, 100%": { opacity: ".58", transform: "scale(.96)" },
          "50%": { opacity: ".95", transform: "scale(1.08)" },
        },
      },
      animation: {
        "fade-up": "fade-up .5s cubic-bezier(.2,.7,.2,1) both",
        snow: "snow-fall 11s linear infinite",
        "lantern-float": "lantern-float 4.8s ease-in-out infinite",
        "lantern-aura": "lantern-aura 3.8s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
