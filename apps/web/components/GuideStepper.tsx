"use client";
// DESIGN §4.6: read-only stepper over shared steps; reuses the same Overlay ring.
import { useState } from "react";
import Overlay from "./Overlay";
import type { GetGuideResponse, StepResponse } from "../lib/api/client";

export default function GuideStepper({ guide }: { guide: GetGuideResponse }) {
  const [index, setIndex] = useState(0);
  const step = guide.steps[index];
  if (!step) return <p className="type-body">This guide has no steps.</p>;
  const shim: StepResponse = {
    step_id: "shared",
    status: step.target ? "ok" : "done",
    action: "tap",
    instruction: step.instruction,
    target: step.target ?? null,
    scroll_direction: "none",
    type_text: "",
    caution: "",
    confidence: 0,
    goal_complete: false,
    model: "",
    timings_ms: {},
    cost_usd: 0,
  };
  return (
    <section>
      <div aria-live="polite">
        <p className="type-small">Step {step.n} of {guide.steps.length}</p>
        <p data-testid="guide-instruction" className="type-instruction mt-3">{step.instruction}</p>
      </div>
      <div className="mt-4">
        {step.target ? (
          <Overlay imageUrl={step.image_url} width={step.width} height={step.height} step={shim} refinement={step.svg_path ? { mode: "outline", svg_path: step.svg_path, origin: step.svg_origin ?? null, box: step.target.box, timings_ms: {}, cost_usd: 0 } : null} stepNumber={step.n} />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={step.image_url} alt={`Step ${step.n}. ${step.instruction}`} className="w-full" />
        )}
      </div>
      <div className="mt-6 flex gap-3">
        <button data-testid="guide-prev" disabled={index === 0} onClick={() => setIndex((i) => Math.max(0, i - 1))} className="type-body min-h-12 rounded-control bg-mist px-6 py-3 disabled:opacity-50">Previous step</button>
        <button data-testid="guide-next" disabled={index >= guide.steps.length - 1} onClick={() => setIndex((i) => Math.min(guide.steps.length - 1, i + 1))} className="type-body min-h-12 rounded-control bg-ink px-6 py-3 font-bold text-paper disabled:opacity-50">Next step</button>
      </div>
    </section>
  );
}
