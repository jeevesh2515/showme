import Link from "next/link";
import BillingDemo from "../components/landing/BillingDemo";
import results from "../lib/results.generated.json";

// WEB-1 (DESIGN §6). Every number below comes from lib/results.generated.json,
// generated at build from eval/results/RESULTS.md + the latest E2E results.json.
const h = results.headline;
const gh = (p: string) =>
  `https://github.com/jeevesh2515/showme/blob/main/eval/results/${p}`;

const wrap = "mx-auto max-w-6xl px-4 sm:px-6";
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
      <section className={`${wrap} grid items-center gap-10 py-12 lg:grid-cols-12 lg:gap-12 lg:py-16`}>
        <div className="lg:col-span-6">
          <h1 className="type-display">Stuck on a screen? ShowMe points to the next tap.</h1>
          <p className="type-body mt-6">
            Add a screenshot, say what you want to do, and see exactly where to press.
            Private details are hidden on your device before anything is sent.
          </p>
          <p className="mt-8 flex flex-wrap gap-3">
            <Link href="/app" className={`${btn} bg-ink text-paper`}>Try it with a screenshot</Link>
            <Link href="/eval" className={`${btn} border-2 border-ink text-ink`}>See how often it is right</Link>
          </p>
        </div>
        <div className="lg:col-span-6">
          <BillingDemo />
        </div>
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
            <li className="type-body"><strong>Shared guides delete themselves after 7 days.</strong> You can delete yours sooner.</li>
          </ul>
        </div>
      </section>

      <section className="bg-ink py-16 text-paper md:py-24" aria-labelledby="accuracy">
        <div className={wrap}>
          <h2 id="accuracy" className="type-title">How often it is right</h2>
          <p className="type-body mt-4">Measured on public benchmarks and real tasks, weakest number included. Every figure links to its raw output file.</p>
          <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {h.screenspotV2 && <Metric pct={h.screenspotV2.accuracyPct} label={`ScreenSpot-v2 held-out: point inside the right control (n=${h.screenspotV2.n})`}><a href={gh(h.screenspotV2.predictions)} className="underline">Raw predictions</a></Metric>}
            {h.screenspotPro && <Metric pct={h.screenspotPro.accuracyPct} label={`ScreenSpot-Pro held-out (hard, high-resolution screens) (n=${h.screenspotPro.n})`}><a href={gh(h.screenspotPro.predictions)} className="underline">Raw predictions</a></Metric>}
            {h.negatives && <Metric pct={h.negatives.accuracyPct} label={`Negatives: correctly said not visible, unsure, or refused (n=${h.negatives.n})`}><a href={gh(h.negatives.predictions)} className="underline">Raw predictions</a></Metric>}
            {h.e2e && <Metric pct={h.e2e.successPct} label={`E2E tasks completed (${h.e2e.passed}/${h.e2e.tasksRun}, average ${h.e2e.avgSteps} steps, ${h.e2e.date})`}><Link href="/eval" className="underline">Full results</Link></Metric>}
          </ul>
        </div>
      </section>

      <div className={`${wrap} grid gap-8 py-16 md:grid-cols-2 md:py-24`}>
        <section className="rounded-panel bg-sun p-8 md:p-10" aria-labelledby="families">
          <h2 id="families" className="type-title">For families</h2>
          <p className="type-body mt-4">When a relative gets stuck, solve it once and share the steps as a guide. They follow the same highlighted pictures, at their own pace.</p>
        </section>
        <section className="rounded-panel border-2 border-mist p-8 md:p-10" aria-labelledby="companies">
          <h2 id="companies" className="type-title">For companies</h2>
          <p className="type-body mt-4">ShowMe for your help centre: customers add a screenshot of your product and get pointed to the next tap, instead of opening a ticket. <a href="https://github.com/jeevesh2515/showme" className="underline">Contact us on GitHub</a>. There is no form, and we store no emails.</p>
        </section>
      </div>

      <section className={`${wrap} pb-16 md:pb-24`} aria-labelledby="models">
        <h2 id="models" className="type-title">Built with Meta models</h2>
        <p className="type-body mt-4"><strong>muse-spark-1.3</strong> reads the screen and picks the one next step. <strong>sam-3.1</strong> draws the precise outline around it when it agrees with that step. Standard mode only.</p>
      </section>

      <footer className="border-t border-mist">
        <div className={`${wrap} type-small flex flex-wrap gap-x-6 gap-y-3 py-8`}>
          <a href="https://github.com/jeevesh2515/showme" className="underline">GitHub</a>
          <Link href="/eval" className="underline">How often it is right</Link>
          <Link href="/app" className="underline">Open the app</Link>
          <span>Built for the Meta hackathon. Screenshots in examples are made up.</span>
        </div>
      </footer>
    </main>
  );
}
