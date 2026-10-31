"use client";
// A11Y-1/6: text size and high contrast for every screen. State lives in React memory only,
// never storage, so it dies with the tab (RULES: nothing persists beyond the tab).
import Link from "next/link";
import { useState } from "react";

const SIZES = [100, 125, 150] as const;
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
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2 sm:px-6">
        <Link href="/" className="type-title relative inline-block px-1 font-extrabold">
          <span className="absolute inset-x-0 bottom-1 h-3 rounded-full bg-highlighter" aria-hidden="true" />
          <span className="relative">ShowMe</span>
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <span className="type-small" id="text-size-label">Text size</span>
          <div role="group" aria-labelledby="text-size-label" className="flex gap-2">
            {SIZES.map((s) => (
              <button
                key={s}
                data-testid={`text-size-${s}`}
                aria-pressed={size === s}
                onClick={() => setTextSize(s)}
                className="type-small min-h-12 min-w-12 rounded-control border-2 border-ink px-3 aria-pressed:bg-ink aria-pressed:text-paper"
              >
                {s}%
              </button>
            ))}
          </div>
          <button
            data-testid="contrast-toggle"
            aria-pressed={contrast}
            onClick={toggleContrast}
            className="type-small min-h-12 min-w-12 rounded-control border-2 border-ink px-3 aria-pressed:bg-ink aria-pressed:text-paper"
          >
            High contrast
          </button>
        </div>
      </div>
    </header>
  );
}
