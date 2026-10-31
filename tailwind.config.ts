import type { Config } from "tailwindcss";

/** Identidade clara; cores das verticais orientam a navegação do catálogo. */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: "rgb(var(--page-rgb) / <alpha-value>)", soft: "rgb(var(--soft-rgb) / <alpha-value>)", card: "#ffffff", over: "#e5ecdf", input: "#ffffff" },
        ink: "rgb(var(--ink-rgb) / <alpha-value>)", line: "rgb(var(--line-rgb) / <alpha-value>)",
        brand: { DEFAULT: "rgb(var(--brand-rgb) / <alpha-value>)", 2: "rgb(var(--brand-deep-rgb) / <alpha-value>)" }, lime: "rgb(var(--accent-rgb) / <alpha-value>)",
        cyan: { DEFAULT: "#216678", 2: "#216678" },
        neon: { DEFAULT: "#1a7045", 2: "#1a7045" },
        fit: { DEFAULT: "#a64350", 2: "#a64350" },
        eletro: { DEFAULT: "#825917", 2: "#825917" },
        tool: { DEFAULT: "#285d96", 2: "#285d96" },
        gadget: { DEFAULT: "#28685f", 2: "#28685f" },
        parfum: { DEFAULT: "#7a4a78", 2: "#7a4a78" },
        ok: "#1a7045", warn: "#865b13", danger: "#b33c3c", muted: "rgb(var(--muted-rgb) / <alpha-value>)",
        // "Signal accents" das lojas (DESIGN.md › Retail Integration)
        loja:  { kabum: "#FF6500", terabyte: "#00D35E", pichau: "#E3000F", mercadolivre: "#FFE600", amazon: "#FF9900" },
      },
      maxWidth: { page: "1400px" },
      borderRadius: { DEFAULT: "0.5rem", md: "0.625rem", lg: "0.75rem", xl: "0.875rem", "2xl": "1rem", "3xl": "1rem" },
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
