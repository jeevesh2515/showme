import Link from "next/link";
import results from "../lib/results.generated.json";

// WEB-1 (DESIGN §6). Every number below comes from lib/results.generated.json,
// generated at build from eval/results/RESULTS.md + the latest E2E results.json.
const h = results.headline;
const gh = (p: string) =>
  `https://github.com/jeevesh2515/showme/blob/main/eval/results/${p}`;

function Metric({ label, pct, n, href }: { label: string; pct: number; n: number; href: string }) {
  return (
    <li className="rounded-panel bg-mist p-5">
      <p className="type-display">{pct}%</p>
      <p className="type-small mt-2">{label} (n={n})</p>
      <p className="type-small mt-2">
        <a href={href} className="underline">Raw predictions</a>
      </p>
    </li>
  );
}

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="type-display max-w-[16ch]">Stuck on a screen? ShowMe points to the next tap.</h1>
      <p className="type-body mt-6">
        Add a screenshot, say what you want to do, and see exactly where to press.
        Private details are hidden on your device before anything is sent.
      </p>

      {/* Hero moment: synthetic billing screen, ring draws onto the target (DESIGN §6.1). */}
      <div className="mt-10 rounded-panel bg-mist p-5" aria-label="Example: ShowMe highlighting Cancel subscription on a made-up billing screen">
        <p className="type-small font-bold">Example billing screen (made-up data)</p>
        <div className="relative mt-4 rounded-control bg-paper p-5">
          <p className="type-body font-bold">Your plan</p>
          <p className="type-small mt-2">Example Stream Co — £9.99 a month</p>
          <p className="type-small">Card ending 0000 · renews 12 November</p>
          <div className="relative mt-5 inline-block">
            <span className="type-body inline-flex min-h-12 items-center rounded-control bg-ink px-5 py-2 font-bold text-paper">Cancel subscription</span>
            <svg className="pointer-events-none absolute -inset-2 h-[calc(100%+16px)] w-[calc(100%+16px)]" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <rect className="hero-ring" x="3" y="3" width="94" height="94" rx="10" fill="none" stroke="var(--highlighter)" strokeWidth="5" pathLength={100} />
              <rect x="1" y="1" width="98" height="98" rx="11" fill="none" stroke="var(--ink)" strokeWidth="1.5" pathLength={100} opacity="0.35" />
            </svg>
            <span className="type-small absolute -left-4 -top-4 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--highlighter)] font-extrabold text-ink" aria-hidden="true">1</span>
          </div>
        </div>
        <p className="type-instruction mt-5">Step 1: Tap &ldquo;Cancel subscription&rdquo;, the dark button under your card details.</p>
      </div>

      <p className="mt-8 flex flex-wrap gap-4">
        <Link href="/app" className="type-body inline-flex min-h-12 items-center rounded-control bg-ink px-6 py-3 font-bold text-paper">Try it with a screenshot</Link>
        <Link href="/eval" className="type-body inline-flex min-h-12 items-center rounded-control bg-mist px-6 py-3 font-bold text-ink">See how often it is right</Link>
      </p>

      <section className="mt-16" aria-labelledby="how">
        <h2 id="how" className="type-title">How it works</h2>
        <ol className="type-body mt-4 list-decimal space-y-2 pl-6">
          <li>Add a screenshot and your goal.</li>
          <li>Check the hidden details.</li>
          <li>Follow one highlighted step at a time.</li>
        </ol>
      </section>

      <section className="mt-16" aria-labelledby="privacy">
        <h2 id="privacy" className="type-title">Private by design</h2>
        <ul className="type-body mt-4 list-disc space-y-2 pl-6">
          <li>The raw picture never leaves your device. Private text is hidden in your browser, on this device, before anything is sent.</li>
          <li>No accounts, no tracking cookies. Nothing is kept unless you share it.</li>
          <li>Shared guides delete themselves after 7 days, and you can delete yours sooner.</li>
        </ul>
      </section>

      <section className="mt-16" aria-labelledby="accuracy">
        <h2 id="accuracy" className="type-title">How often it is right</h2>
        <p className="type-body mt-4">Measured on public benchmarks and real tasks, weakest number included. Every figure links to its raw output file.</p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {h.screenspotV2 && <Metric label="ScreenSpot-v2 held-out: point inside the right control" pct={h.screenspotV2.accuracyPct} n={h.screenspotV2.n} href={gh(h.screenspotV2.predictions)} />}
          {h.screenspotPro && <Metric label="ScreenSpot-Pro held-out (hard, high-resolution screens)" pct={h.screenspotPro.accuracyPct} n={h.screenspotPro.n} href={gh(h.screenspotPro.predictions)} />}
          {h.negatives && <Metric label="Negatives: correctly said not visible, unsure, or refused" pct={h.negatives.accuracyPct} n={h.negatives.n} href={gh(h.negatives.predictions)} />}
          {h.e2e && (
            <li className="rounded-panel bg-mist p-5">
              <p className="type-display">{h.e2e.successPct}%</p>
              <p className="type-small mt-2">E2E tasks completed ({h.e2e.passed}/{h.e2e.tasksRun}, average {h.e2e.avgSteps} steps, {h.e2e.date})</p>
              <p className="type-small mt-2"><Link href="/eval" className="underline">Full results</Link></p>
            </li>
          )}
        </ul>
      </section>

      <section className="mt-16" aria-labelledby="families">
        <h2 id="families" className="type-title">For families</h2>
        <p className="type-body mt-4">When a relative gets stuck, solve it once and share the steps as a guide. They follow the same highlighted pictures, at their own pace.</p>
      </section>

      <section className="mt-16" aria-labelledby="companies">
        <h2 id="companies" className="type-title">For companies</h2>
        <p className="type-body mt-4">ShowMe for your help centre: customers add a screenshot of your product and get pointed to the next tap, instead of opening a ticket. <a href="https://github.com/jeevesh2515/showme" className="underline">Contact us on GitHub</a> — no form, no stored emails.</p>
      </section>

      <section className="mt-16" aria-labelledby="models">
        <h2 id="models" className="type-title">Built with Meta models</h2>
        <p className="type-body mt-4"><strong>muse-spark-1.3</strong> reads the screen and picks the one next step. <strong>sam-3.1</strong> draws the precise outline around it when it agrees with that step. Standard mode only.</p>
      </section>

      <footer className="type-small mt-16 flex flex-wrap gap-6 border-t border-mist pt-6">
        <a href="https://github.com/jeevesh2515/showme" className="underline">GitHub</a>
        <Link href="/eval" className="underline">How often it is right</Link>
        <Link href="/app" className="underline">Open the app</Link>
        <span>Built for the Meta hackathon. Screenshots in examples are made up.</span>
      </footer>
    </main>
  );
}
