// Landing hero demo: made-up billing screen, ring draws onto the target (DESIGN §3, §6.1).
// Ring layers from outside in: ink edge, highlighter, paper hairline.
export default function BillingDemo() {
  return (
    <div className="rounded-panel bg-sun p-6 sm:p-10" role="group" aria-label="Example: ShowMe highlighting Cancel subscription on a made-up billing screen">
      <p className="type-small font-bold">Example billing screen (made-up data)</p>
      <div className="mt-4 rounded-control border border-ink bg-paper p-6">
        <p className="type-body font-bold">Your plan</p>
        <p className="type-small mt-2">Example Stream Co, £9.99 a month</p>
        <p className="type-small">Card ending 0000 · renews 12 November</p>
        <div className="relative mt-8 inline-block">
          <span className="type-body inline-flex min-h-12 items-center rounded-control bg-ink px-5 py-2 font-bold text-paper">Cancel subscription</span>
          <svg className="pointer-events-none absolute -inset-2 h-[calc(100%+16px)] w-[calc(100%+16px)]" viewBox="0 0 270 64" preserveAspectRatio="none" aria-hidden="true">
            <rect x="1.25" y="1.25" width="267.5" height="61.5" rx="16" fill="none" stroke="var(--ink)" strokeWidth="2.5" />
            <rect className="hero-ring" x="4.5" y="4.5" width="261" height="55" rx="13" fill="none" stroke="var(--highlighter)" strokeWidth="4" pathLength={100} />
            <rect x="7.5" y="7.5" width="255" height="49" rx="10" fill="none" stroke="var(--paper)" strokeWidth="1.5" />
          </svg>
          <span className="type-small absolute -left-5 -top-5 flex h-9 w-9 items-center justify-center rounded-full bg-highlighter font-extrabold text-ink" aria-hidden="true">1</span>
        </div>
      </div>
      <p className="type-instruction mt-6">Step 1: Tap &ldquo;Cancel subscription&rdquo;, the dark button under your card details.</p>
    </div>
  );
}
