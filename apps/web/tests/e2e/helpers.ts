import { expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import {
  GOAL,
  refineBox,
  stepOk,
  type RefineResponse,
  type StepResponse,
} from "./fixtures";

export const IMAGE_PATH = path.join(__dirname, "assets", "screenshot.png");
export const IMAGE_BYTES = fs.readFileSync(IMAGE_PATH);
export const IMAGE_B64 = IMAGE_BYTES.toString("base64");
export const IMAGE_FILE = { name: "screenshot.png", mimeType: "image/png", buffer: IMAGE_BYTES };

export type MockedApi = {
  stepBodies: Record<string, unknown>[];
  refineBodies: Record<string, unknown>[];
  /** Every request body that went to /api/, for PRIV-1 style assertions. */
  allBodies: { url: string; body: string }[];
};

export type MockOptions = {
  /** One fixture per expected POST /api/v1/step, in order. Extra calls get a 500. */
  steps?: StepResponse[];
  /** Delay before the step response, so the "Looking" state is observable. */
  delayMs?: number;
  refine?: RefineResponse;
  refineDelayMs?: number;
};

/** Intercept /api/v1/step and /api/v1/refine. No network leaves the test process. */
export async function mockApi(page: Page, options: MockOptions = {}): Promise<MockedApi> {
  const queue = [...(options.steps ?? [stepOk()])];
  const api: MockedApi = { stepBodies: [], refineBodies: [], allBodies: [] };

  await page.route("**/api/v1/step*", async (route) => {
    const body = route.request().postData() ?? "";
    api.allBodies.push({ url: route.request().url(), body });
    api.stepBodies.push(safeJson(body));
    if (options.delayMs) await page.waitForTimeout(options.delayMs);
    const next = queue.shift();
    if (!next) {
      await route.fulfill({
        status: 500,
        json: { error: { code: "test_no_fixture", message: "unscripted /v1/step call" } },
      });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(next) });
  });

  await page.route("**/api/v1/refine*", async (route) => {
    const body = route.request().postData() ?? "";
    api.allBodies.push({ url: route.request().url(), body });
    api.refineBodies.push(safeJson(body));
    if (options.refineDelayMs) await page.waitForTimeout(options.refineDelayMs);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(options.refine ?? refineBox()),
    });
  });

  return api;
}

function safeJson(body: string): Record<string, unknown> {
  try {
    return JSON.parse(body) as Record<string, unknown>;
  } catch {
    return { raw: body };
  }
}

/** /app: type the goal, add the screenshot, wait for the mandatory privacy review (PRIV-2). */
export async function openReview(page: Page, goal = GOAL): Promise<void> {
  await page.goto("/app");
  await page.getByTestId("goal-input").fill(goal);
  await page.getByTestId("file-input").setInputFiles(IMAGE_FILE);
  await expect(page.getByTestId("review-image")).toBeVisible();
}

/** Review -> step view: the only way the API is ever called. */
export async function continueToStep(page: Page): Promise<void> {
  await page.getByTestId("review-continue").click();
  await expect(page.getByTestId("step-instruction")).toBeVisible();
}

/** Full path used by most specs: /app -> review -> one mocked step. */
export async function reachStep(page: Page, options: MockOptions = {}): Promise<MockedApi> {
  const api = await mockApi(page, options);
  await openReview(page);
  await continueToStep(page);
  return api;
}

/** Step view -> add another screenshot -> review, for the FLOW-11/12 loop.
 *  The app may keep the step view (next-screenshot-input) or return to /app's drop
 *  zone after "I did it"; both are valid, so use whichever is on screen. */
export async function addNextScreenshot(page: Page): Promise<void> {
  await expect
    .poll(
      async () =>
        (await page.getByTestId("next-screenshot-input").count()) + (await page.getByTestId("drop-zone").count()),
      { timeout: 15_000 },
    )
    .toBeGreaterThan(0);
  const next = page.getByTestId("next-screenshot-input");
  await ((await next.count()) > 0 ? next : page.getByTestId("file-input")).setInputFiles(IMAGE_FILE);
  await expect(page.getByTestId("review-image")).toBeVisible();
}

/** FLOW-4/6/9: no ring means no SVG element carrying a visible stroke. */
export async function ringCount(page: Page): Promise<number> {
  const svg = page.getByTestId("overlay-svg");
  if ((await svg.count()) === 0) return 0;
  return svg.locator('[stroke]:not([stroke="none"])').count();
}

/** Fire a real ClipboardEvent with a PNG file, as a user pasting would.
 *  Dispatched on <main> so React's bubble-phase onPaste handler sees it. */
export async function pasteScreenshot(page: Page): Promise<void> {
  await page.evaluate((bytes: number[]) => {
    const data = new DataTransfer();
    data.items.add(new File([new Uint8Array(bytes)], "pasted.png", { type: "image/png" }));
    const main = document.querySelector("main");
    if (!main) throw new Error("main not found");
    main.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
  }, Array.from(IMAGE_BYTES));
}

/** Drag a PNG onto the drop zone with a real DragEvent. */
export async function dragScreenshotOntoDropZone(page: Page): Promise<void> {
  await page.evaluate((bytes: number[]) => {
    const data = new DataTransfer();
    data.items.add(new File([new Uint8Array(bytes)], "dragged.png", { type: "image/png" }));
    const zone = document.querySelector('[data-testid="drop-zone"]');
    if (!zone) throw new Error("drop-zone not found");
    for (const type of ["dragenter", "dragover", "drop"]) {
      zone.dispatchEvent(new DragEvent(type, { dataTransfer: data, bubbles: true, cancelable: true }));
    }
  }, Array.from(IMAGE_BYTES));
}
