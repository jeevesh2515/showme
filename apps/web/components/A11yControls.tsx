"use client";
// A11Y-1/6: text size and high contrast for every screen. State lives in React memory only,
// never storage, so it dies with the tab (RULES: nothing persists beyond the tab).
import Link from "next/link";
import { useState } from "react";

const SIZES = [100, 125, 150] as const;
// Shown as three growing "A"s (DESIGN §4.1 "Aa"); fixed px so the header stays one row at any text size.
const SIZE_UI: Record<(typeof SIZES)[number], { name: string; glyph: string }> = {
  100: { name: "Normal", glyph: "text-[18px]" },
  125: { name: "Large", glyph: "text-[22px]" },
  150: { name: "Largest", glyph: "text-[28px]" },
};
const CONTROL = "inline-flex min-h-12 min-w-12 items-center justify-center rounded-control border-2 border-ink font-bold leading-none aria-pressed:bg-ink aria-pressed:text-paper";
type Size = (typeof SIZES)[number];

export default function A11yControls() {
  const [size, setSize] = useState<Size>(100);
  const [contrast, setContrast] = useState(false);

  function setTextSize(next: Size) {
    setSize(next);
    document.documentElement.style.fontSize = `${next}%`;
  }

  function toggleContrast() {
    const next = !contrast;
    setContrast(next);
    if (next) document.documentElement.dataset.contrast = "high";
    else delete document.documentElement.dataset.contrast;
  }

  return (
    <header className="border-b border-mist">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-2 sm:px-6">
        <Link href="/" className="type-title inline-flex min-h-12 items-center font-extrabold">
          <span className="relative px-1">
            <span className="absolute inset-x-0 bottom-1 h-3 rounded-full bg-highlighter" aria-hidden="true" />
            <span className="relative">ShowMe</span>
          </span>
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="sr-only" id="text-size-label">Text size</span>
          <div role="group" aria-labelledby="text-size-label" className="flex gap-1.5 sm:gap-2">
            {SIZES.map((s) => (
              <button
                key={s}
                data-testid={`text-size-${s}`}
                aria-pressed={size === s}
                aria-label={SIZE_UI[s].name}
                onClick={() => setTextSize(s)}
                className={`${CONTROL} ${SIZE_UI[s].glyph}`}
              >
                A
              </button>
            ))}
          </div>
          <button
            data-testid="contrast-toggle"
            aria-pressed={contrast}
            onClick={toggleContrast}
            className={`${CONTROL} gap-2 text-[18px] sm:px-3`}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" /></svg>
            <span className="sr-only sm:not-sr-only">High contrast</span>
          </button>
        </div>
      </div>
    </header>
  );
}
