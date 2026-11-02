"use client";
// DESIGN §4.6: read-only stepper over shared steps; reuses the same Overlay ring.
import { useEffect, useRef, useState } from "react";
import Overlay from "./Overlay";
import type { GetGuideResponse, StepResponse } from "../lib/api/client";

export default function GuideStepper({ guide }: { guide: GetGuideResponse }) {
  const [index, setIndex] = useState(0);
  const stickyRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLElement>(null);
  // Phones: a ring below the fold on a tall screenshot is scrolled into view; the instruction stays pinned above it.
  useEffect(() => {
    if (!window.matchMedia("(max-width: 767px)").matches) return;
    const badge = rootRef.current?.querySelector('[data-testid="step-badge"]');
    const img = badge?.closest("div")?.querySelector("img");
    if (!badge || !img) return;
    const go = () => {
      const { top, bottom } = badge.getBoundingClientRect();
      if (top >= (stickyRef.current?.getBoundingClientRect().bottom ?? 0) && bottom <= window.innerHeight) return;
      window.scrollTo({ top: Math.max(0, top + window.scrollY - window.innerHeight * 0.6), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    };
    if (img.complete && img.naturalHeight > 0) go();
    else img.addEventListener("load", go, { once: true });
    return () => img.removeEventListener("load", go);
  }, [index]);
  const step = guide.steps[index];
  if (!step) return <p className="type-body">This guide has no steps.</p>;
  const shim: StepResponse = {
    step_id: "shared",
    status: step.status as StepResponse["status"],
    action: "tap",
    instruction: step.instruction,
    target: step.target ?? null,
    scroll_direction: "none",
    type_text: "",
    caution: step.caution ?? "",
    confidence: 0,
    goal_complete: false,
    model: "",
    timings_ms: {},
    cost_usd: 0,
  };
  return (
    <section ref={rootRef}>
      <p data-testid="guide-picture-note" className="type-body mb-4 rounded-panel bg-sun p-4">This is a picture of the screen, not your live screen. Tapping it does nothing. Find the same button on your own screen and tap it there.</p>
      <div ref={stickyRef} aria-live="polite" className="sticky top-0 z-20 bg-paper py-2 md:static">
        <p className="type-small font-bold">Step {step.n} of {guide.steps.length}</p>
        {shim.caution && <p data-testid="guide-caution" className="type-body mt-3 rounded-panel bg-blush p-3 text-caution"><strong>Careful:</strong> {shim.caution.replace(/^careful:\s*/i, "")}</p>}
        {shim.status === "unsure" && <p className="type-body mt-3 rounded-panel bg-sun p-3">I think it is this one. Check before you tap.</p>}
        <p data-testid="guide-instruction" className="type-instruction mt-3">{step.instruction}</p>
      </div>
      <div className="mt-6">
        {step.target ? (
          <Overlay imageUrl={step.image_url} width={step.width} height={step.height} step={shim} refinement={step.svg_path ? { mode: "outline", svg_path: step.svg_path, origin: step.svg_origin ?? null, box: step.target.box, timings_ms: {}, cost_usd: 0 } : null} stepNumber={step.n} />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={step.image_url} alt={`Step ${step.n}. ${step.instruction}`} className="w-full rounded-panel border-2 border-mist" />
        )}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <button data-testid="guide-prev" disabled={index === 0} onClick={() => setIndex((i) => Math.max(0, i - 1))} className="type-body min-h-12 flex-1 rounded-control border-2 border-ink bg-paper px-3 py-3 font-bold text-ink disabled:opacity-50">Previous step</button>
        <button data-testid="guide-next" disabled={index >= guide.steps.length - 1} onClick={() => setIndex((i) => Math.min(guide.steps.length - 1, i + 1))} className="type-body min-h-12 flex-1 rounded-control bg-ink px-3 py-3 font-bold text-paper disabled:opacity-50">Next step</button>
      </div>
      <p data-testid="guide-next-screenshot" className="type-body mt-6 rounded-panel bg-mist p-4">Stuck on the next screen? Take a new screenshot and send it to the person who shared this.</p>
      <nav aria-label="All steps in this guide" className="mt-10">
        <h2 className="type-body font-bold">Your path, {guide.steps.length === 1 ? "1 step" : `all ${guide.steps.length} steps`}</h2>
        <ol className="type-body mt-3 space-y-2">
          {guide.steps.map((s, i) => (
            <li key={s.n}>
              <button data-testid={`guide-jump-${s.n}`} aria-current={i === index ? "step" : undefined} onClick={() => setIndex(i)} className={`min-h-12 w-full rounded-control px-4 py-2 text-left ${i === index ? "bg-highlighter font-bold text-ink" : "bg-mist text-ink"}`}>
                Step {s.n}. {s.instruction}
              </button>
            </li>
          ))}
        </ol>
      </nav>
    </section>
  );
}
