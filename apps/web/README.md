# ShowMe web

Next.js 14 App Router frontend for ShowMe with TypeScript strict mode, client-side WASM OCR redaction, and WCAG 2.2 AA accessibility.

```bash
pnpm install
pnpm dev        # Starts web dev server at http://localhost:3000
pnpm build      # Builds Next.js production application
pnpm lint       # Runs next lint (ESLint)
pnpm test       # Runs Vitest unit and redaction pattern tests
pnpm test:e2e   # Runs Playwright E2E and accessibility test suite
pnpm sim        # Opens interactive Playwright iPhone 16 emulator against http://localhost:3000
pnpm typecheck  # TypeScript check (tsc --noEmit)
pnpm format     # Prettier formatting
```

## Structure & Routes

- `/`: Landing page with responsive hero card, animated highlighter ring demo, and helper-first narrative (`app/page.tsx`).
- `/app`: Main visual guidance loop: screenshot upload/paste/drag, client-side redaction review, step guidance with docked instruction card, and early guide sharing (`app/app/page.tsx`).
- `/g/[token]`: Shared guide viewer for relatives/recipients. Pictures only, with step navigation, preserved caution banners, 7-day expiration, and `noindex`/`no-referrer` security headers (`app/g/[token]/page.tsx`).
- `/eval`: Public evaluation dashboard displaying held-out benchmarks (ScreenSpot-v2, ScreenSpot-Pro, Negatives, E2E live tasks) generated from `eval/results/` (`app/eval/page.tsx`).

## Privacy & Redaction Pipeline (`lib/redaction/`)

- `worker.ts`: Self-hosted Tesseract.js Web Worker (served locally from `/public/tesseract/`) to perform on-device OCR without external network requests (PRIV-8).
- `patterns.ts`: Strict regex patterns for payment cards (with Luhn validation), emails, phone numbers, UK postcodes, and IBANs.
- `redact.ts`: Produces the compile-time branded `RedactedImage` symbol required by the API client. Strips metadata and downscales images to $\le 2560\text{px}$.
- `page.tsx`: Mandatory privacy review screen featuring automatic PII masking with lock glyphs, manual brush tool, and 44px touch targets on text lines.

## Design & Accessibility

- **Colours**: Semantic CSS tokens in `app/globals.css` mapped to Tailwind (`bg-ink`, `text-paper`, `bg-sun`, `bg-sage`, `bg-blush`).
- **Typography**: Self-hosted Atkinson Hyperlegible Next in variable Latin subset (`fonts/`). Text size scaler (100%, 125%, 150%) adjusts root rem size.
- **Accessibility**: Zero axe violations across all routes (A11Y-2), touch targets $\ge 44\text{px}$ (A11Y-7), high contrast toggle, keyboard navigation shortcuts (`N` for next, `R` for read-aloud, `Esc` to cancel), and reduced-motion support.
