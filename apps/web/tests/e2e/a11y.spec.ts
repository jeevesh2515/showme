import { expect, test, type Page } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { stepDone, stepOk, stepOkSecond } from "./fixtures";
import { addNextScreenshot, continueToStep, mockApi, openReview, reachStep, IMAGE_FILE } from "./helpers";

/** Axe on the current screen. Returns every violation; the console line is the report. */
async function scan(page: Page, screen: string) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  const list = violations.map((v) => `${v.id} (${v.impact}, ${v.nodes.length} nodes)`);
  console.log(`A11Y-2 ${screen}: ${violations.length} violations${list.length ? `: ${list.join("; ")}` : ""}`);
  return violations;
}

async function expectClean(page: Page, screen: string) {
  const violations = await scan(page, screen);
  expect(violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id), screen).toEqual([]);
  expect(violations.map((v) => v.id), screen).toEqual([]);
}

/** Step view -> done -> share screen, all API mocked. */
async function reachShare(page: Page) {
  await mockApi(page, { steps: [stepOk(), stepDone()] });
  await openReview(page);
  await continueToStep(page);
  await page.getByTestId("next-btn").click();
  await addNextScreenshot(page);
  await continueToStep(page);
  await expect(page.getByTestId("done-screen")).toBeVisible();
  await page.getByTestId("share-btn").click();
  await expect(page.getByTestId("share-image-0")).toBeVisible();
}

test.describe("A11Y-2 axe", () => {
  test("A11Y-2 axe: landing", async ({ page }) => {
    await page.goto("/");
    await expectClean(page, "landing");
  });

  test("A11Y-2 axe: /app start", async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto("/app");
    await expectClean(page, "/app start");
  });

  test("A11Y-2 axe: review", async ({ page }) => {
    test.setTimeout(90_000);
    await openReview(page);
    await expectClean(page, "review");
  });

  test("A11Y-2 axe: step", async ({ page }) => {
    test.setTimeout(90_000);
    await reachStep(page);
    await expectClean(page, "step");
  });

  test("A11Y-2 axe: share", async ({ page }) => {
    test.setTimeout(90_000);
    await reachShare(page);
    await expectClean(page, "share");
  });

  test("A11Y-2 axe: unknown /g token gone page", async ({ page }) => {
    await page.goto("/g/unknown-token");
    await expect(page.getByRole("heading", { name: "This guide has gone" })).toBeVisible();
    await expectClean(page, "/g gone");
  });
});

test("A11Y-1 text size 150% grows the step instruction, 100% is the base", async ({ page }) => {
  test.setTimeout(90_000);
  await reachStep(page);
  const fontSize = () => page.getByTestId("step-instruction").evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  const at100 = await fontSize();
  await page.getByTestId("text-size-150").click();
  await expect(page.getByTestId("text-size-150")).toHaveAttribute("aria-pressed", "true");
  expect(await fontSize()).toBeGreaterThan(at100);
});

test("A11Y-3 keyboard only: Tab to goal, N next, R read aloud, Esc cancel", async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => {
    (window as unknown as { __spoken: string[] }).__spoken = [];
    const synth = window.speechSynthesis;
    if (synth) {
      synth.speak = ((utterance: SpeechSynthesisUtterance) => {
        (window as unknown as { __spoken: string[] }).__spoken.push(utterance.text);
      }) as typeof synth.speak;
      synth.cancel = (() => undefined) as typeof synth.cancel;
    }
  });
  const second = stepOkSecond();
  await mockApi(page, { steps: [stepOk(), second] });

  await page.goto("/app");
  for (let i = 0; i < 10; i++) {
    if ((await page.evaluate(() => document.activeElement?.getAttribute("data-testid"))) === "goal-input") break;
    await page.keyboard.press("Tab");
  }
  expect(await page.evaluate(() => document.activeElement?.getAttribute("data-testid"))).toBe("goal-input");
  await page.keyboard.type("cancel my subscription");
  await page.getByTestId("file-input").setInputFiles(IMAGE_FILE);
  await expect(page.getByTestId("review-image")).toBeVisible();
  await page.getByTestId("review-continue").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("step-instruction")).toBeVisible();

  // N = "I did it, next": back to start with the goal and history kept.
  await page.keyboard.press("n");
  await expect(page.getByTestId("goal-input")).toBeVisible();
  await expect(page.getByTestId("goal-input")).toHaveValue("cancel my subscription");

  // Second step, then R speaks and Esc cancels back to start without losing the goal.
  await page.getByTestId("file-input").setInputFiles(IMAGE_FILE);
  await expect(page.getByTestId("review-image")).toBeVisible();
  await page.getByTestId("review-continue").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("step-instruction")).toBeVisible();
  await page.keyboard.press("r");
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken), { timeout: 10_000 })
    .toContain(second.instruction);
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("goal-input")).toBeVisible();
  await expect(page.getByTestId("goal-input")).toHaveValue("cancel my subscription");
});

test("A11Y-4 step instruction card is aria-live polite", async ({ page }) => {
  test.setTimeout(90_000);
  await reachStep(page);
  await expect(page.locator('div[aria-live="polite"]').filter({ has: page.getByTestId("step-instruction") })).toBeVisible();
});

test.describe("A11Y-5 reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("A11Y-5 step view works with every transition off", async ({ page }) => {
    test.setTimeout(90_000);
    await reachStep(page);
    await expect(page.getByTestId("overlay-svg")).toBeVisible();
    expect(await page.evaluate(() => getComputedStyle(document.body).transitionDuration)).toBe("0s");
  });
});

test("A11Y-6 high contrast is tab-scoped and never stored", async ({ page }) => {
  await page.goto("/app");
  const mist = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--mist").trim().toLowerCase());
  expect(await mist()).toBe("#e9eef6");
  await page.getByTestId("contrast-toggle").click();
  await expect(page.getByTestId("contrast-toggle")).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => document.documentElement.dataset.contrast)).toBe("high");
  const after = await mist();
  expect(after).not.toBe("#e9eef6");
  expect(["#fff", "#ffffff"]).toContain(after);
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);

  await page.reload();
  expect(await page.evaluate(() => document.documentElement.dataset.contrast ?? null)).toBeNull();
  expect(await mist()).toBe("#e9eef6");
});

test("A11Y-7 buttons are at least 44 px tall on start and step", async ({ page }) => {
  test.setTimeout(90_000);
  const tooSmall = () =>
    page.locator("button:visible").evaluateAll((buttons) =>
      buttons
        .map((b) => ({ label: b.textContent?.trim(), height: b.getBoundingClientRect().height }))
        .filter((b) => b.height < 43),
    );
  await page.goto("/app");
  expect(await tooSmall()).toEqual([]);
  await reachStep(page);
  expect(await tooSmall()).toEqual([]);
});

test("A11Y-1 200% zoom: goal input visible, no horizontal overflow", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 640, height: 400 });
  await page.goto("/app");
  await expect(page.getByTestId("goal-input")).toBeVisible();
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
});
