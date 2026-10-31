import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Guards the rule "no inline hex in components": the palette must live in one
// place and match docs/DESIGN.md §2.
const tokens = {
  ink: "#16264a",
  paper: "#ffffff",
  mist: "#e9eef6",
  highlighter: "#ffd43b",
  caution: "#b3261e",
  done: "#1d6b45",
  sun: "#fff4c2",
  sage: "#e3f1e8",
  blush: "#fbe9e7",
};

const css = readFileSync(
  new URL("../app/globals.css", import.meta.url),
  "utf8",
);

describe("design tokens", () => {
  it("defines every DESIGN.md §2 colour as a CSS variable", () => {
    for (const [name, hex] of Object.entries(tokens)) {
      expect(css).toContain(`--${name}: ${hex};`);
    }
  });
});
