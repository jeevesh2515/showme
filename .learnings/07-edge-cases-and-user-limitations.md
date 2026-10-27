# 07 Edge cases and user limitations

Purpose: answer "what happens when..." and "who does this not work for". Tags are explained in [README.md](README.md). Many edge cases are not covered by any doc or spike. Where that is true the answer says so, explains what follows from the design, and treats it as a limitation to test, not as a solved problem.

### Q: What if the target is not on the screen?

**Short answer:** [Decided] ShowMe says so. The status is `not_visible`, there is no highlight and no dimming, and the user sees the model's hint plus a scroll arrow in the right direction if scrolling would reveal it.

**Detail:**
- Example copy: "It is probably further down. Scroll down, then take a new screenshot."
- Measured precursor: 5/5 honest answers on 5 absent-target probes, using the spike's own prompt and schema. The 200-sample negatives suite on Day 3 is the real test.
- The design relies on the user taking a new screenshot after scrolling. ShowMe never scrolls for them.

**Evidence:** [DESIGN.md section 3](../docs/DESIGN.md), [REQUIREMENTS.md FLOW-6](../docs/REQUIREMENTS.md), [SPIKES.md (b)](../docs/SPIKES.md)

### Q: What about pages that need scrolling, long pages and menus?

**Short answer:** [Known limitation] ShowMe sees only the one screenshot it is given. A long page means the user scrolls and adds another screenshot. There is no stitching or full-page capture.

**Detail:**
- `scroll_direction` (none, up, down, left, right) and the `scroll` action exist in the schema, so the model can tell the user to scroll.
- Each new screenshot goes through the redaction review again, which adds friction on long tasks.
- The E2E driver does scroll as an action, but real users have to do it themselves. The usability cost has not been measured.

**Evidence:** [ARCHITECTURE.md sections 4 and 5.3](../docs/ARCHITECTURE.md), [DESIGN.md section 4.2](../docs/DESIGN.md), [REQUIREMENTS.md PRIV-2](../docs/REQUIREMENTS.md)

### Q: What about tiny icons and dense screens?

**Short answer:** [Known limitation] Small targets are the hardest case. The design adds a 2.5x magnifier inset for targets under 32 px per side, and a stretch crop-and-re-ground pass. Accuracy on tiny targets has not been measured yet.

**Detail:**
- ScreenSpot-Pro is the benchmark chosen partly because it has headroom, with stratification by group and ui_type. The Pro target is only at least 40% and the kill threshold is 25%.
- The 1920 px downscale makes small targets smaller on large screens. Its effect is assumption A7 and is tested on the dev split on Day 2.
- A degenerate box (area under 16 px squared) on an `ok` step is downgraded to `unsure`.
- Local SAM and API SAM both did worse on a borderless text link (IoU 0.77 locally and 0.60 with the API for a centre click).

**Evidence:** [DESIGN.md section 3](../docs/DESIGN.md), [PRD.md section 5.2](../docs/PRD.md), [MEMORY.md A7](../docs/MEMORY.md), [SPIKES.md (c)](../docs/SPIKES.md), [RISKS.md R1](../docs/RISKS.md)

### Q: What about dark mode?

**Short answer:** [Measured] Redaction regex worked on a dark-mode 2x fixture (part of the 10/10), but my pixel heuristic for text in input fields scored 0/3 in dark mode. The highlight ring is a dual-stroke design for light and dark backgrounds.

**Detail:**
- Ring: 2 px paper hairline, 6 px highlighter stroke, 2 px ink outer stroke, so it reads on either.
- The FLOW-2 corpus must include dark mode. A11Y-2 requires a ring contrast of at least 3:1 against both light and dark screenshots, checked with axe and manually.
- Grounding on dark-mode screens: the smoke test did not separate dark mode. The synthetic set included dark variants for SAM, but I do not have a dark-mode grounding number.

**Evidence:** [SPIKES.md (c) and (d)](../docs/SPIKES.md), [DESIGN.md section 3](../docs/DESIGN.md), [REQUIREMENTS.md FLOW-2, A11Y-2](../docs/REQUIREMENTS.md)

### Q: What about high-DPI and very large screenshots?

**Short answer:** [Known limitation] They are downscaled to at most 1920 px on the long side before upload, so a 1170x2532 phone screenshot or a 2560x1440 monitor screenshot loses resolution. The effect on accuracy is untested until Day 2.

**Detail:**
- My redaction fixtures include 1170x2532 (3x) and 2560x1440 (2x) and the regex found all PII on them. That tested redaction, not grounding.
- Fallback if latency is poor: 1280 px after checking dev-split accuracy.
- The API accepts max side 2048 px and a decoded size of 3 MB, so anything the client does not shrink is rejected with a typed error.

**Evidence:** [ARCHITECTURE.md sections 4 and 7](../docs/ARCHITECTURE.md), [SPIKES.md (d)](../docs/SPIKES.md), [MEMORY.md A7, D11](../docs/MEMORY.md)

### Q: What about non-English screens and users?

**Short answer:** [Known limitation] MVP is UK English only (proposed). The OCR for redaction is English, so redaction recall on other languages is a named risk, and grounding on non-English interfaces is untested.

**Detail:**
- More OCR languages loaded on demand are stretch S5.
- The request carries a `locale` field (example `en-GB`), but the docs do not say how it changes the instruction language, and I have not tested other locales.
- Because a missed redaction is the worst failure, non-English users would rely more on the manual review.

**Evidence:** [MEMORY.md Q9](../docs/MEMORY.md), [RISKS.md R3](../docs/RISKS.md), [PRD.md section 5.2](../docs/PRD.md)

### Q: What about modals, pop-ups and cookie banners?

**Short answer:** [Known limitation] No doc or spike covers them specifically. The prompt tells the model to pick the single next action that is visible and obvious, so a modal on screen would normally be what it sees, but I have not tested that.

**Detail:**
- If a blocking element hides the target, the target may be `not_visible`, and the user is told where it probably is.
- E2E tasks on public sites will probably hit cookie banners; failures there will show up as failure categories on Day 5 and 6.
- I would say this plainly instead of guessing at behaviour.

**Evidence:** [ARCHITECTURE.md section 5.2](../docs/ARCHITECTURE.md), [PHASES.md Days 5 and 6](../docs/PHASES.md)

### Q: What about CAPTCHAs?

**Short answer:** [Known limitation] Not covered by any doc. ShowMe never acts for the user, so a person has to solve a CAPTCHA, and I have not designed or tested how the step text handles one.

**Detail:**
- Because ShowMe is guidance only, there is no automation to be blocked by a CAPTCHA.
- Whether the model recognises a CAPTCHA and gives a sensible instruction is unknown. The E2E driver on public sites may reveal it.
- The `refuse` state is for harmful or security-bypassing goals, not for CAPTCHAs themselves.

**Evidence:** [PRD.md section 5.3](../docs/PRD.md), [ARCHITECTURE.md section 5.2](../docs/ARCHITECTURE.md)

### Q: What about passwords and 2FA codes on screen?

**Short answer:** [Decided] The model must never suggest typing a password, code or card number, any `type_text` matching a PII pattern is emptied, and the caution banner covers steps about sharing a code. Auto-redaction does not reliably catch six-digit codes, so the user hides them on the review screen.

**Detail:**
- My reading of the patterns: phone starts at 9 digits, card at 13, long digit runs at 8, so a short code is not matched.
- Rule P8: never ask the user to reveal anything hidden.
- The review screen is mandatory partly for this reason.

**Evidence:** [ARCHITECTURE.md sections 5.2, 5.4 and 7](../docs/ARCHITECTURE.md), [RULES.md P8](../docs/RULES.md)

### Q: What about scams and suspicious screens?

**Short answer:** [Decided] The prompt adds a short caution if the step involves paying, sharing a code or password, installing remote-access apps, gift cards, or a message that looks like a scam. The UI shows the caution above the instruction with an icon and the word "Careful".

**Detail:**
- Example copy: "Careful: this page asks for a gift card. Real companies do not ask for gift cards."
- The caution is not by colour alone (FLOW-10, to be axe-tested).
- Untested: how reliably the model flags real scam pages. No scam set is in the eval plan beyond the planned injection and refusal probes.
- Target users, like the 77-year-old persona, are exactly the group scams target, so this matters; but I have not measured it.

**Evidence:** [ARCHITECTURE.md section 5.2](../docs/ARCHITECTURE.md), [DESIGN.md section 4.4](../docs/DESIGN.md), [REQUIREMENTS.md FLOW-10](../docs/REQUIREMENTS.md), [RISKS.md watch list](../docs/RISKS.md)

### Q: What about multiple monitors, windows and partial screenshots?

**Short answer:** [Known limitation] No doc covers them. ShowMe only sees the image it is given, so the user decides what to capture. A very wide multi-monitor screenshot would be downscaled to 1920 px on the long side, which would shrink targets (my inference).

**Detail:**
- The privacy benefit: the user can crop to the window they need, and the review screen shows exactly what leaves the device.
- Browser chrome, other windows and notifications in a full-screen capture may contain private text. The OCR pass and review screen are the control.

**Evidence:** [ARCHITECTURE.md section 7](../docs/ARCHITECTURE.md), [DESIGN.md section 4.2](../docs/DESIGN.md)

### Q: What if a step is wrong, or "that didn't work"?

**Short answer:** [Decided] The user taps "That didn't work". The next request carries the previous step with `result: "failed"` in the text history, and ShowMe tries again. On an `unsure` step there is also "Try another way".

**Detail:**
- History is text only, so the model does not see the failed screen again unless the user adds a new screenshot.
- Stretch S2 adds a "try harder" button that re-runs with Muse Wonder on an `unsure` step.
- Unmeasured: how often a second attempt succeeds. The E2E suite records average steps and honesty events.
- If a step is wrong with high certainty (the calibration gap), the user may follow it. That is why the product frames every step as something the user checks.

**Evidence:** [REQUIREMENTS.md FLOW-12, FLOW-15](../docs/REQUIREMENTS.md), [DESIGN.md sections 3 and 4.4](../docs/DESIGN.md), [PRD.md section 5.2](../docs/PRD.md)

### Q: What if the user has a slow network or a slow phone?

**Short answer:** [Known limitation] Each image is about 300 KB after compression and is sent twice per step. The progress screen shows live status, and says "This is taking longer than usual" after 10 seconds. Phone performance for OCR is untested.

**Detail:**
- Timeouts: ground 15 s, SAM 4 s, whole request 25 s.
- OCR was 154 to 375 ms in Node on an M5. In-browser timing and mid-range Android timing are UNVERIFIED. Day 3 measures it, target at most 2 s.
- The outline is progressive: the box appears first, SAM is optional.
- Low-bandwidth retry behaviour and offline handling are not specified.

**Evidence:** [ARCHITECTURE.md sections 3 and 9](../docs/ARCHITECTURE.md), [DESIGN.md section 4.3](../docs/DESIGN.md), [MEMORY.md A4](../docs/MEMORY.md)

### Q: Is it usable by older or less confident people?

**Short answer:** [Hypothesis] It is designed for them, with large type, plain words and one action at a time, but I have not tested it with any older user. A 3-person usability check is the planned minimum.

**Detail:**
- Design choices: Atkinson Hyperlegible Next, base size 18 px, instruction 28 px (24 px on mobile), high-contrast mode, text size control at 100, 125 and 150%, touch targets at least 48 px, no jargon, no hover-only controls, an explicit "How do I take a screenshot?" help.
- Copy rules: one action per instruction, max 25 words, starts with a verb, names the button by its visible label and position.
- Friction I know about: the user must take a screenshot, switch to ShowMe and add it, and review the privacy screen. That is a lot for a nervous user.
- The 3-person usability check is also the trigger for the review-time rule (more than 45 s on average).

**Evidence:** [DESIGN.md sections 1, 2, 5 and 8](../docs/DESIGN.md), [REQUIREMENTS.md A11Y-1 to A11Y-7](../docs/REQUIREMENTS.md), [RISKS.md R3](../docs/RISKS.md)

### Q: What about screen-reader users?

**Short answer:** [Decided] ShowMe's own UI supports screen readers, but describing arbitrary third-party UIs non-visually is explicitly out of scope. It is a different product.

**Detail:**
- Instruction card is `aria-live="polite"`. The screenshot has descriptive alt text ("Your screenshot. Step 2 target: Cancel subscription button, lower left of the page."). The overlay SVG is `aria-hidden`.
- Testing with axe, a keyboard-only run, and a VoiceOver smoke test is planned in the Day 5 accessibility pass. Not done.
- A person who cannot see the screenshot cannot meaningfully review the redaction. I should be honest that the privacy review is visual.

**Evidence:** [PRD.md section 3](../docs/PRD.md), [DESIGN.md section 5](../docs/DESIGN.md), [REQUIREMENTS.md A11Y-4](../docs/REQUIREMENTS.md), [PHASES.md Day 5](../docs/PHASES.md)

### Q: What about users who are colour-blind or have motion sensitivity?

**Short answer:** [Decided] Nothing depends on colour alone, and motion is minimal and respects the reduced-motion setting.

**Detail:**
- Caution has an icon and the word "Careful". The unsure state also uses a dashed line and a "?" badge, not only colour.
- One entrance animation per step (ring draws in 300 ms, badge pops in 150 ms) and a 200 ms crossfade for the outline swap. No looping pulse. With `prefers-reduced-motion`, everything is instant.
- Contrast was calculated with the WCAG formula on 2026-10-27, for example ink on paper 14.9:1, and is to be re-verified with axe.

**Evidence:** [DESIGN.md sections 2, 3 and 5](../docs/DESIGN.md), [REQUIREMENTS.md A11Y-5](../docs/REQUIREMENTS.md)

### Q: What if two elements look alike, or the model picks the wrong one?

**Short answer:** [Known limitation] It can happen and the model's confidence will not warn about it. The mitigations are the verifier pass if AUROC is low, the `unsure` dashed ring, the "check before you tap" framing, and a second-candidate option in the fallback design.

**Detail:**
- The 15/16 smoke result had one miss: "update my payment method" on the synthetic billing page.
- SAM will outline whichever element it is given, correct or not.
- Real error rates come from Day 3 and the E2E suite.

**Evidence:** [SPIKES.md (b) and (c)](../docs/SPIKES.md), [ARCHITECTURE.md section 5.5](../docs/ARCHITECTURE.md), [RISKS.md R2](../docs/RISKS.md)

### Q: What if the app or website changes?

**Short answer:** [Decided] This is exactly why ShowMe reads the actual screen rather than relying on stored help text. It cannot go out of date in the way an article does.

**Detail:**
- Flip side: the E2E suite runs on live public sites that can change during the project, so I record the run date and keep the redacted screenshot trail.
- The model can also change. I pin `muse-spark-1.3` and log the model in every result.

**Evidence:** [PRD.md section 2](../docs/PRD.md), [RISKS.md watch list](../docs/RISKS.md)

### Q: What if the user is on a phone and has to switch apps?

**Short answer:** [Known limitation] The web app works on mobile browsers, but ShowMe never watches the screen, so the user captures, switches to the browser, uploads, reads the step, switches back and repeats. I have not tested this workflow.

**Detail:**
- Native mobile apps and an automatic capture extension are cut.
- The step view on mobile docks the instruction card at the bottom and scrolls the ring into the upper 60% of the screen. The screenshot supports pinch-zoom.
- Touch targets are at least 48 px.

**Evidence:** [PRD.md section 5.3](../docs/PRD.md), [DESIGN.md sections 4.1 and 4.4](../docs/DESIGN.md)

### Q: What if OCR finds no text?

**Short answer:** [Decided] The user sees a message: "We could not find any text to hide automatically. Check the picture and hide anything private." The review screen is still mandatory.

**Detail:**
- This also covers screenshots that are mostly icons or photos.
- The brush and tap-to-blur remain available.
- OCR quality on stylised or tiny fonts is a named redaction risk.

**Evidence:** [DESIGN.md section 4.7](../docs/DESIGN.md), [RISKS.md R3](../docs/RISKS.md)

### Q: What will ShowMe not do?

**Short answer:** [Decided] It will not click or type for you, capture your screen automatically, watch live video, keep an account or history, run as a native app, or guide you through harmful or security-bypassing goals.

**Detail:**
- Cut for the hackathon: browser extension or desktop capture, live screen sharing, taking actions, accounts and payment, native mobile apps, self-hosting open-weights models.
- Never asks the user to remove a blur or reveal a password, code or card number.
- Will not guide enterprise IT admin work or non-visual navigation of arbitrary apps (out of scope users).
- Refusals: `refuse` status with a calm explanation.

**Evidence:** [PRD.md sections 3 and 5.3](../docs/PRD.md), [RULES.md P8](../docs/RULES.md), [REQUIREMENTS.md FLOW-9](../docs/REQUIREMENTS.md)

### Q: What happens if the page or goal is in a field where the user must type something private?

**Short answer:** [Decided] ShowMe tells the user which field to use, but never suggests the private value. `type_text` is only suggested when it is not private, and any PII-pattern match is emptied.

**Detail:**
- The goal text is also masked for PII patterns before leaving the browser, so a user who types their email into the goal box has it masked.
- Free-text private data in a goal, such as a name, is not caught by the regex layer.

**Evidence:** [ARCHITECTURE.md sections 5.2, 5.4 and 7](../docs/ARCHITECTURE.md), [REQUIREMENTS.md PRIV-7](../docs/REQUIREMENTS.md)

### Q: What is the biggest limitation of ShowMe today?

**Short answer:** [Known limitation] I do not yet have an accuracy number worth trusting, and the model's confidence is uninformative, so a wrong step can look certain. That is why Day 3 evaluation and the honesty UX are the centre of the plan.

**Detail:**
- Second: redaction covers patterned data but not free text, so the user must review each screenshot.
- Third: friction. Capture, review and upload for every step.
- These three will be in the README Limitations section, which is never cut.

**Evidence:** [SPIKES.md summary](../docs/SPIKES.md), [PHASES.md cut list](../docs/PHASES.md), [RISKS.md R1 to R3](../docs/RISKS.md)
