import type { Config } from "tailwindcss";

// Tokens mirror docs/DESIGN.md §2; values live as CSS variables in app/globals.css.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink)",
        paper: "var(--paper)",
        mist: "var(--mist)",
        highlighter: "var(--highlighter)",
        caution: "var(--caution)",
        done: "var(--done)",
        scrim: "var(--scrim)",
      },
      borderRadius: {
        control: "12px",
        panel: "16px",
      },
    },
  },
  plugins: [],
};

export default config;
