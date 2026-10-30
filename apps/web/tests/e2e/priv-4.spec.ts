import { expect, test } from "@playwright/test";
import { stepDone, stepOk } from "./fixtures";
import { addNextScreenshot, continueToStep, mockApi, openReview } from "./helpers";

const GOAL_MARK = "cancel my subscription quietly-9f3";

test.describe("PRIV-4 nothing persists beyond the tab", () => {
  test("PRIV-4 cookies and web storage hold no goal, instruction or image after a full flow", async ({ page, context }) => {
    test.setTimeout(120_000);
    await mockApi(page, { steps: [stepOk(), stepDone()] });
    await openReview(page, GOAL_MARK);
    await continueToStep(page);
    await page.getByTestId("next-btn").click();
    await addNextScreenshot(page);
    await continueToStep(page);
    await expect(page.getByTestId("done-screen")).toBeVisible();

    const storage = await page.evaluate(() => ({
      cookie: document.cookie,
      local: JSON.stringify({ ...localStorage }),
      session: JSON.stringify({ ...sessionStorage }),
    }));
    const cookies = (await context.cookies()).map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
    const dump = [storage.cookie, storage.local, storage.session, cookies].join("\n");

    expect(dump).not.toContain(GOAL_MARK);
    expect(dump).not.toContain(stepOk().instruction);
    expect(dump).not.toContain("data:image");
    expect(dump).not.toContain("base64");
  });
});
