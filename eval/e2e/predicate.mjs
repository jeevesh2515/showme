export const PREDICATE_TYPES = new Set(["url_regex", "text_visible", "text_gone", "selector", "cookie"]);

// selector: DOM state, not page text. `selector` is a CSS selector list (commas = any-of). A match counts only
// if it is an active toggle (aria-pressed="true"; player controls auto-hide, so visibility is not required) or
// is visible with non-blank text. Mere presence never counts: hidden or empty caption containers exist when off.
async function selectorHolds(page, selector) {
  for (const el of await page.locator(selector).all()) {
    if ((await el.getAttribute("aria-pressed")) === "true") return true;
    if ((await el.isVisible()) && (await el.innerText()).trim() !== "") return true;
  }
  return false;
}

export async function predicateHolds(page, predicate) {
  if (predicate.type === "url_regex") return new RegExp(predicate.pattern, "i").test(page.url());
  if (predicate.type === "selector") return selectorHolds(page, predicate.selector);
  // cookie: consent state the site stores, e.g. BBC ckns_policy=000 only after "Reject additional cookies" (probed 2026-11-01).
  if (predicate.type === "cookie") {
    const re = new RegExp(predicate.pattern);
    return (await page.context().cookies()).some((c) => c.name === predicate.name && re.test(c.value));
  }
  let text = "";
  try {
    text = await page.locator("body").innerText({ timeout: 5000 });
  } catch {
    // shortcut: body unreadable mid-navigation counts as no text; upgrade if text_gone yields false passes.
  }
  const hit = new RegExp(predicate.pattern, "i").test(text);
  return predicate.type === "text_visible" ? hit : !hit;
}
