import { expect, test } from "@playwright/test";
import { stepOk } from "./fixtures";
import { reachStep } from "./helpers";

test.describe("FLOW-13 read it to me", () => {
  test("FLOW-13 read-aloud speaks the instruction through on-device speech synthesis", async ({ page }) => {
    test.setTimeout(90_000);
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

    const step = stepOk();
    await reachStep(page, { steps: [step] });

    const button = page.getByTestId("read-aloud");
    await expect(button).toBeVisible();
    await button.click();

    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken), { timeout: 10_000 })
      .toContain(step.instruction);
  });
});
