import Link from "next/link";
import BillingDemo from "../components/landing/BillingDemo";
import results from "../lib/results.generated.json";

// WEB-1 (DESIGN §6). Every number below comes from lib/results.generated.json,
// generated at build from eval/results/RESULTS.md + the latest E2E results.json.
const h = results.headline;
const gh = (p: string) =>
  `https://github.com/jeevesh2515/showme/blob/main/eval/results/${p}`;

const wrap = "mx-auto max-w-6xl px-4 sm:px-6";
const link = "inline-flex min-h-11 items-center underline";
const btn = "type-body inline-flex min-h-12 items-center rounded-control px-5 py-3 font-bold";

function Metric({ pct, label, children }: { pct: number; label: string; children: React.ReactNode }) {
  return (
    <li className="border-t-2 border-paper pt-6">
      <p className="type-display text-highlighter">{pct}%</p>
      <p className="type-small mt-2">{label}</p>
      <p className="type-small mt-2">{children}</p>
    </li>
  );
}

export default function Home() {
  return (
    <main>
      {/* Phones: headline, demo so the ring draws above the 659px fold (DESIGN §6), text, then buttons. Desktop: text left, demo right. */}
      <section className={`${wrap} grid grid-cols-[minmax(0,1fr)] pb-12 pt-6 lg:grid-cols-12 lg:grid-rows-[1fr_auto_auto_auto_1fr] lg:gap-x-12 lg:py-16`}>
        <h1 className="type-display lg:col-span-6 lg:row-start-2">Someone stuck on a screen? ShowMe points to <span className="mark">the next tap</span>.</h1>
        <div className="mt-6 lg:col-span-6 lg:col-start-7 lg:row-span-5 lg:row-start-1 lg:mt-0 lg:self-center">
          <BillingDemo />
        </div>
        <p className="type-body mt-6 lg:col-span-6 lg:row-start-3">
          Got a screenshot from someone you help? Turn it into a step-by-step guide they can follow.
          Private details are hidden on your device before anything is sent.
        </p>
        <p className="mt-6 flex flex-wrap gap-3 lg:col-span-6 lg:row-start-4">
          <Link href="/app" className={`${btn} bg-ink text-paper`}>Try it with an example screenshot</Link>
          <Link href="/eval" className={`${btn} border-2 border-ink text-ink`}>See how often it is right</Link>
        </p>
      </section>

      <section className={`${wrap} py-16 md:py-24`} aria-labelledby="how">
        <h2 id="how" className="type-title">How it works</h2>
        <ol className="mt-10 grid gap-10 md:grid-cols-3 md:gap-12">
          {["Add a screenshot and your goal.", "Check the hidden details.", "Follow one highlighted step at a time."].map((t, i) => (
            <li key={t}>
              <span className="type-instruction flex h-14 w-14 items-center justify-center rounded-full bg-highlighter font-extrabold text-ink" aria-hidden="true">{i + 1}</span>
              <p className="type-body mt-4">{t}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-sage py-16 md:py-24" aria-labelledby="privacy">
        <div className={wrap}>
          <h2 id="privacy" className="type-title">Private by design</h2>
          <ul className="mt-10 grid gap-8 md:grid-cols-3 md:gap-12">
            <li className="type-body"><strong>The raw picture never leaves your device.</strong> Private text is hidden in your browser, on this device, before anything is sent.</li>
            <li className="type-body"><strong>No accounts, no tracking cookies.</strong> Nothing is kept unless you share it.</li>
            <li className="type-body"><strong>Shared guide links stop working after 7 days.</strong> Their pictures are removed at the next daily clean-up. You can delete yours sooner.</li>
          </ul>
        </div>
      </section>

      <section className="bg-ink py-16 text-paper md:py-24" aria-labelledby="accuracy">
        <div className={wrap}>
          <h2 id="accuracy" className="type-title">How often it is right</h2>
          <p className="type-body mt-4">Measured on public benchmarks and real tasks, weakest number included. Every figure links to its raw output file.</p>
          <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {h.screenspotV2 && <Metric pct={h.screenspotV2.accuracyPct} label={`ScreenSpot-v2 held-out: point inside the right control (n=${h.screenspotV2.n}, prompt v${h.screenspotV2.promptVersion})`}><a href={gh(h.screenspotV2.predictions)} className={link}>Raw predictions</a></Metric>}
            {h.screenspotPro && <Metric pct={h.screenspotPro.accuracyPct} label={`ScreenSpot-Pro held-out (hard, high-resolution screens) (n=${h.screenspotPro.n}, prompt v${h.screenspotPro.promptVersion})`}><a href={gh(h.screenspotPro.predictions)} className={link}>Raw predictions</a></Metric>}
            {h.honesty && <Metric pct={h.honesty.absentPct} label={`Said "not visible" when the target was absent (${h.honesty.absentHits}/${h.honesty.absentN}, prompt v${h.honesty.promptVersion}). Most of the rest got a highlight anyway. Injection probes, counted apart: ${h.honesty.injectionHits}/${h.honesty.injectionN}; combined ${h.honesty.notVisibleHits}/${h.honesty.notVisibleN}.`}><a href={gh(h.honesty.predictions)} className={link}>Raw predictions</a></Metric>}
            {h.honesty && <Metric pct={h.honesty.refusePct} label={`Refused harmful goals on our own small probe set (${h.honesty.refuseHits}/${h.honesty.refuseN}, prompt v${h.honesty.promptVersion})`}><a href={gh(h.honesty.predictions)} className={link}>Raw predictions</a></Metric>}
            {h.e2e && <Metric pct={h.e2e.successPct} label={`Live-website tasks passed (${h.e2e.passed}/${h.e2e.tasksRun}, average ${h.e2e.avgSteps} steps, ${h.e2e.date}). Recorded run; these tasks were also used during development.`}><Link href="/eval" className={link}>Full results</Link></Metric>}
          </ul>
        </div>
      </section>

      <div className={`${wrap} grid gap-8 py-16 md:grid-cols-2 md:py-24`}>
        <section className="rounded-panel bg-sun p-8 md:p-10" aria-labelledby="families">
          <h2 id="families" className="type-title">For remote helpers</h2>
          <p className="type-body mt-4">When a relative or friend gets stuck, they send a screenshot. Turn it into a clean, expiring step-by-step guide. They open the link on their phone, follow each picture in their own app, and send the next screenshot when they need it.</p>
        </section>
        <section className="rounded-panel border-2 border-mist p-8 md:p-10" aria-labelledby="companies">
          <h2 id="companies" className="type-title">For digital inclusion</h2>
          <p className="type-body mt-4">For libraries, charities, and support teams helping people navigate confusing websites and forms. Private details you mark stay hidden from ShowMe and Meta. <a href="https://github.com/jeevesh2515/showme" className={link}>Get in touch on GitHub</a>.</p>
        </section>
      </div>

      <section className={`${wrap} pb-16 md:pb-24`} aria-labelledby="models">
        <h2 id="models" className="type-title">Built with Meta models</h2>
        <p className="type-body mt-4"><strong>muse-spark-1.3</strong> reads the screen and picks the one next step. <strong>sam-3.1</strong> draws an outline around it only when it agrees with that step; otherwise the box stays. Standard mode only.</p>
      </section>

      <footer className="border-t border-mist">
        <div className={`${wrap} type-small flex flex-wrap items-center gap-x-6 gap-y-1 py-8`}>
          <a href="https://github.com/jeevesh2515/showme" className="inline-flex min-h-11 items-center underline">GitHub</a>
          <Link href="/eval" className="inline-flex min-h-11 items-center underline">How often it is right</Link>
          <Link href="/app" className="inline-flex min-h-11 items-center underline">Open the app</Link>
          <span>Built for the Meta hackathon. Screenshots in examples are made up.</span>
        </div>
      </footer>
    </main>
  );
}
