"use client";
// A11Y-1/6: text size and high contrast for every screen. State lives in React memory only,
// never storage, so it dies with the tab (RULES: nothing persists beyond the tab).
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
    <header>
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-end gap-2 px-6 pt-4">
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
    </header>
  );
}
