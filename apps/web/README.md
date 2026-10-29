# ShowMe web

Next.js 14 App Router + TypeScript strict + Tailwind. Skeleton only: routes are
stubs, there is no API client and no redaction code yet.

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build
pnpm lint
pnpm test       # vitest
pnpm typecheck
pnpm format
```

- Routes: `/` (landing placeholder), `/app` (start), `/g/[token]` (shared guide,
  `noindex`), `/eval` (results; prints no numbers until `eval/results/` exists).
- Colours: `docs/DESIGN.md` §2 tokens are CSS variables in `app/globals.css`,
  exposed to Tailwind as `bg-ink`, `text-paper`, `border-mist`, … Components use
  the token names, never hex.
- Type: `app/globals.css` `@layer components` holds the `type-*` scale from
  DESIGN.md §2 in `rem`, so the 100/125/150 % text-size control only needs a root
  font size.
- Font: Atkinson Hyperlegible Next (variable, latin subset) in `fonts/`, loaded
  with `next/font/local`. Self-hosted, so no request reaches Google at runtime
  (PRIV-8). Licence: `fonts/OFL.txt`.
- Tests: `tests/` for vitest; Playwright is installed but has no suite or config
  yet (E2E tasks arrive Day 5).
