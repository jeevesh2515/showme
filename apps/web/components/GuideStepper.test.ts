import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import GuideStepper from "./GuideStepper";
import type { GetGuideResponse } from "../lib/api/client";

const target = { label: "Cancel", point: { x: 50, y: 50 }, box: { x1: 40, y1: 40, x2: 60, y2: 60 } };
const step = (over: Partial<GetGuideResponse["steps"][number]>): GetGuideResponse["steps"][number] => ({ n: 1, instruction: "Tap Cancel", target, svg_path: null, svg_origin: null, width: 100, height: 100, image_url: "https://x/1.jpg", status: "ok", caution: "", ...over });
const render = (s: GetGuideResponse["steps"][number]) =>
  renderToStaticMarkup(createElement(GuideStepper, { guide: { goal: "g", expires_at: "2026-11-09T00:00:00Z", steps: [s] } as GetGuideResponse }));

describe("GuideStepper", () => {
  it("flow-7: an unsure SAM outline stays dashed for the recipient", () => {
    const html = render(step({ status: "unsure", svg_path: "M0 0L1 1", svg_origin: { x: 0, y: 0 } }));
    expect(html).toContain("I think it is this one");
    expect((html.match(/<path[^>]*stroke-dasharray/g) ?? []).length).toBe(3);
  });

  it("flow-7: a targetless unsure step keeps its uncertainty banner", () => {
    expect(render(step({ status: "unsure", target: null }))).toContain("I think it is this one");
  });

  it("web: a one-step guide does not say 'all 1 steps'", () => {
    const html = render(step({}));
    expect(html).toContain("Your path, 1 step");
    expect(html).not.toContain("all 1 steps");
  });

  it("flow-5: the outline is masked out inside the control, so it cannot cover the button label", () => {
    const html = render(step({ svg_path: "M0 0L9 0L9 9L0 9ZM3 3L6 3L6 6L3 6Z", svg_origin: { x: 1, y: 2 } }));
    const id = /<mask id="([^"]+)"/.exec(html)?.[1];
    expect(id).toBeTruthy();
    expect(html).toContain(`mask="url(#${id})"`);
    // Every contour is filled, so a hole in the SAM mask cannot let a stroke back in over the label.
    expect(html.match(/<mask.*?<\/mask>/)?.[0].match(/fill="black"/g)).toHaveLength(2);
  });

  it("flow-10: a caution reaches the recipient", () => {
    expect(render(step({ caution: "This ends your plan." }))).toContain("This ends your plan.");
  });

  it("web: tells the recipient the picture is not their live screen and how to get the next step", () => {
    const html = render(step({}));
    expect(html).toContain("Tapping it does nothing");
    expect(html).toContain("Take a new screenshot");
  });
});
