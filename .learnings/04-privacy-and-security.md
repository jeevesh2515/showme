# 04 Privacy and security

Purpose: answer every privacy, security and threat-model question with the exact boundary of what is measured, what is designed and what is still open. Tags are explained in [README.md](README.md). Nothing here is built yet. The redaction spike is the only measured evidence.

### Q: What exactly is your privacy promise?

**Short answer:** [Decided] The raw screenshot never leaves the user's browser. Only a redacted, re-encoded image is sent, and only after the user has reviewed it on a screen that cannot be skipped.

**Detail:**
- "Private by construction, not by policy": the server has no code path that accepts an unredacted image (principle 1, PRIV-1).
- Nothing persists beyond the tab unless the user opts in to Share. No accounts.
- What I do not promise: that redaction catches everything, or that Meta does not receive the redacted image. Meta receives it per request in standard mode.
- The promise is a design today. It becomes evidence when the PRIV-1 Playwright test is green in CI (Day 4).

**Evidence:** [PRD.md section 4](../docs/PRD.md), [REQUIREMENTS.md PRIV-1 to PRIV-9](../docs/REQUIREMENTS.md), [RULES.md section 1](../docs/RULES.md)

### Q: How does redaction work?

**Short answer:** [Measured] OCR plus regex. tesseract.js finds words and boxes, regex patterns find emails, phones and card numbers (with a Luhn check), and matching regions are covered. In the spike this found 10/10 PII strings with 0 false positives on three synthetic fixtures.

**Detail:**
- Pipeline: decode into an `ImageBitmap`, OCR in a Web Worker (self-hosted English traineddata), regex patterns, review screen, render solid blocks on a canvas, downscale to at most 2560 px (D20), export JPEG q=0.85.
- Patterns in the design: email, phone (9 to 15 digits, separators allowed), card (13 to 19 digits plus Luhn), UK postcode, IBAN, and digit runs of 8 or more. Only email, phone and card were tested in the spike. Postcodes, IBANs and long digit runs are MVP additions, tested on Day 3 (FLOW-2).
- Speed in Node on an Apple M5: 154 to 375 ms per screenshot. Browser timing is UNVERIFIED and expected to be slower. Day 3 measures it on a laptop and a mid-range phone.
- Regions are hidden with a solid block, not a reversible blur. The docs say "blur" for the user action (tap-to-blur), but the output is a solid block.

**Evidence:** [SPIKES.md (d)](../docs/SPIKES.md), [ARCHITECTURE.md section 7](../docs/ARCHITECTURE.md), [../spikes/redaction/run.mjs](../spikes/redaction/run.mjs)

### Q: What does redaction miss? (the measured gaps)

**Short answer:** [Known limitation] Names, street addresses, CVC codes and any free text typed into a field are not caught by regex. My pixel heuristic for text inside input fields found 7/11 with 6 false positives and 0/3 in dark mode, so it is not reliable and I cut it to stretch.

**Detail:**
- The fixtures are synthetic and clean, so real-world recall will be lower than 10/10. I say that every time.
- Non-English text, tiny or stylised fonts and OCR errors are named risks (R3).
- Short digit strings such as six-digit codes do not match any of the listed patterns by my reading (phone starts at 9 digits, card at 13, long digit runs at 8). The review screen is the safeguard, which is why it is mandatory.
- Mitigation list: mandatory review with tap-to-blur and brush, a fixture corpus with hard cases (FLOW-2 requires at least 30 strings including dark mode and 3x density, recall 95% or more, false positives reported), and goal text also redacted.

**Evidence:** [SPIKES.md (d)](../docs/SPIKES.md), [RISKS.md R3](../docs/RISKS.md), [REQUIREMENTS.md FLOW-2](../docs/REQUIREMENTS.md), [../spikes/redaction/run_inputs.mjs](../spikes/redaction/run_inputs.mjs)

### Q: Why is the review screen mandatory, and can the user skip it?

**Short answer:** [Decided] Mandatory, no skip path, no flag, not disabled in production builds. Auto-redaction cannot be trusted alone, as the spike showed, so a human check is the last line of defence.

**Detail:**
- PRIV-2: a Playwright test must show the API call is impossible until "Continue" on the review screen.
- The review shows auto-hidden regions with a lock glyph. The user can tap any text line to hide it, use a brush, undo and zoom.
- Rule P2: test fixtures may call `redact()` directly; the UI may not skip it.
- Risk R3 pre-agrees a response if review is too slow: if a usability check with 3 people shows review takes more than 45 s on average, add a "Hide all text in boxes" one-tap option. Never remove the review.

**Evidence:** [REQUIREMENTS.md PRIV-2](../docs/REQUIREMENTS.md), [RULES.md P2](../docs/RULES.md), [DESIGN.md section 4.2](../docs/DESIGN.md), [RISKS.md R3](../docs/RISKS.md)

### Q: What is the `RedactedImage` brand type?

**Short answer:** [Decided] A TypeScript type that only `redact()` can produce. The API client functions `api.step()` and `api.refine()` accept only `RedactedImage`, so passing a raw image is a compile error.

**Detail:**
- Defined as an object with a data URL and metadata, plus a readonly brand marker.
- Rule P1 forbids any other constructor, cast or `as RedactedImage`.
- A compile-time guard is not enough, so there is also an E2E test asserting that no request body ever contains bytes or a hash of the original fixture image (PRIV-1).
- Server side, the request must include `redaction.pipeline` in the metadata. This is a sanity check, not a proof, because a malicious client could fake the field.

**Evidence:** [ARCHITECTURE.md sections 4 and 7](../docs/ARCHITECTURE.md), [REQUIREMENTS.md PRIV-1](../docs/REQUIREMENTS.md), [RULES.md P1](../docs/RULES.md)

### Q: Can the backend check that an image was really redacted?

**Short answer:** [Known limitation] No. The backend can validate type, size and dimensions, and that a `redaction.pipeline` field is present, but it cannot prove an image was redacted. The guarantee is that the honest client cannot send a raw image, not that the server can detect a dishonest one.

**Detail:**
- The privacy promise is about my client, so the user's protection comes from the user's own browser running my code.
- This is a deliberate trade-off: server-side detection would mean the server sees the private data first.
- If an interviewer asks about a modified client: that user is choosing to send their own data.

**Evidence:** [ARCHITECTURE.md section 4 validation](../docs/ARCHITECTURE.md), [REQUIREMENTS.md PRIV-1](../docs/REQUIREMENTS.md)

### Q: What does the backend log?

**Short answer:** [Decided] Metadata only: request id, route, status, latency, model, tokens, cost and the rate-limit decision. Never images, goal text, instructions, the `reason` field, or raw IPs.

**Detail:**
- Rule P3 and PRIV-3, to be verified by a pytest log-capture test on all routes plus a code review checklist.
- Goal text: only its length is logged.
- `reason` from the model is logged only in eval runs, never in production.
- No error trackers or analytics that capture content.
- Raw IPs are never stored (PRIV-3, rule P3). The only IP-derived data is a salted, daily-rotated hash in `usage_counters` for rate limiting, deleted after 48 hours. The claim to make is "no raw IPs are stored".

**Evidence:** [ARCHITECTURE.md sections 1 and 12](../docs/ARCHITECTURE.md), [REQUIREMENTS.md PRIV-3](../docs/REQUIREMENTS.md), [RULES.md P3](../docs/RULES.md)

### Q: What happens to the screenshot at Meta?

**Short answer:** [Known limitation] The redacted image goes to the Meta Model API for each request, in standard mode, where Meta says content is not used to train its models. The standard-mode retention period is not stated on the pricing page, so it is UNVERIFIED.

**Detail:**
- I never use contributor-mode models because they grant Meta permission to use content (rule P6, PRIV-6, validated by a settings test).
- Open question: the retention period (MEMORY Q11). The plan is to ask Meta (Discord or docs) and to state on the privacy page what I know and do not know.
- So "never leaves your device" is true only of the raw screenshot. The redacted image does leave, and the privacy copy has to say that.

**Evidence:** [SPIKES.md (a)](../docs/SPIKES.md), [MEMORY.md A6](../docs/MEMORY.md), [RISKS.md watch list](../docs/RISKS.md), [RULES.md P6](../docs/RULES.md)

### Q: What is contributor mode and why does it matter?

**Short answer:** [Decided] `muse-spark-1.3-contributor` is a cheaper variant ($0.10 / $0.20 per 1M tokens, 150 RPM) that gives Meta permission to use your content. I forbid it for any user screenshot.

**Detail:**
- Config validation will reject contributor model IDs (PRIV-6).
- The price is tempting for a free consumer app, which is exactly why the rule is written down.
- A change that weakens any P-rule needs an explicit founder decision recorded in MEMORY.md first.

**Evidence:** [SPIKES.md (a)](../docs/SPIKES.md), [REQUIREMENTS.md PRIV-6](../docs/REQUIREMENTS.md), [RULES.md section 1](../docs/RULES.md)

### Q: How do shared guides stay private?

**Short answer:** [Measured live 2026-10-31] Opt-in with a consent checkbox and a second review of every image. An unguessable link with a 128-bit token, only its SHA-256 stored, images in a private bucket served by 10-minute signed URLs, 7-day expiry, and a delete link. Live Supabase project `xmzalablytiigcmjfylu` (EU): create guide → get guide → signed image URL fetch → wrong-key 403 → delete 200 → 404 verified end-to-end against production.

**Detail:**
- Token: 22-character base62 (about 128 bits) from `secrets.token_urlsafe`. The database stores only the hash, so a database leak does not reveal live links. The delete key is also stored hashed.
- Row Level Security is enabled with no policies, so only the backend service role can read or write.
- GET returns 404 for unknown or expired tokens with no distinction, so tokens cannot be probed.
- Guide pages send `X-Robots-Tag: noindex, nofollow` and `Referrer-Policy: no-referrer`.
- Caveat: anyone with the link can see the pictures for 7 days. The consent text says so.
- Day 5 (2026-10-31): built and verified on the local stack (create → get → wrong-key 403 → delete → 404; Playwright second-review + consent gate). GET is deliberately not IP-rate-limited: the `/g` page fetches server-side, so one egress IP serves every viewer (review F1). Vercel Cron invokes purge with GET, so the route accepts GET and POST.
- Live verification 2026-10-31 (Day 5 close-out): Supabase project `xmzalablytiigcmjfylu` live in EU, `backend/migrations/001_guides.sql` executed (`guides` + `usage_counters`, RLS enabled, service-role only; `increment_counter` RPC revoked from public/anon; private `guides` bucket, `public: false`). Production API `https://showme-api-xi.vercel.app` (`/v1/healthz` ok, `lhr1`) + web CSP pinned to the project host. Live share verified end-to-end: create → get → 10-minute signed image URL fetch → wrong-key 403 → delete 200 → 404.

**Evidence:** [ARCHITECTURE.md section 8](../docs/ARCHITECTURE.md), [REQUIREMENTS.md PRIV-5](../docs/REQUIREMENTS.md), [DESIGN.md section 4.5](../docs/DESIGN.md)

### Q: How is the 7-day expiry enforced?

**Short answer:** [Measured locally 2026-10-31] Twice. Every read rejects a guide whose `expires_at` is in the past, and a daily Vercel Cron calls `/internal/purge` to delete expired rows and their storage objects.

**Detail:**
- The purge also deletes old `usage_counters` rows. `/internal/purge` requires the cron secret (`Authorization: Bearer` from Vercel Cron, or `X-Cron-Secret` manually); a wrong secret deletes nothing (API-9 tests, incl. the GET form Vercel actually sends).
- Tested Day 5: pytest expiry-on-read with a negative TTL, purge removes storage objects and keeps the row when an image delete fails (retry next run), delete key, quota charged before image decode.
- The daily cron doubles as a keepalive for the Supabase free tier, which pauses after 7 days of inactivity.

**Evidence:** [ARCHITECTURE.md section 8](../docs/ARCHITECTURE.md), [PHASES.md Day 5](../docs/PHASES.md), [REQUIREMENTS.md PRIV-5](../docs/REQUIREMENTS.md)

### Q: What is in your CSP and security headers?

**Short answer:** [Decided] A content security policy allowing only the app's own origin and the Supabase signed-URL host, `frame-ancestors 'none'`, HSTS, a strict referrer policy and a Permissions-Policy that allows the microphone only on /app when voice is used.

**Detail:**
- No third-party scripts that can read the page: no session replay, no ad pixels (PRIV-8, rule P7).
- OCR traineddata is self-hosted, so no CDN call. The font (Atkinson Hyperlegible Next) is self-hosted through `next/font`, so browsers make no runtime Google call. That is consistent with PRIV-8 and the CSP (own origin plus Supabase signed URLs only).
- To be verified by a CSP header test and a Playwright network log (security pass on Day 7).

**Evidence:** [ARCHITECTURE.md section 12](../docs/ARCHITECTURE.md), [REQUIREMENTS.md PRIV-8](../docs/REQUIREMENTS.md), [DESIGN.md section 2](../docs/DESIGN.md), [PHASES.md Day 7](../docs/PHASES.md)

### Q: How are secrets handled?

**Short answer:** [Decided] Secrets live in a local `.env` (never committed) and in Vercel and GitHub secrets. A gitleaks step in CI is planned to block committed keys, and I refer to key values only by name.

**Detail:**
- `MODEL_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (backend only, never exposed to the browser), `IP_HASH_SALT_SEED`, `CRON_SECRET`.
- `.env.example` lists names only. Rule P9: never print, log, commit or paste key values.
- Meta rate limits are per team, not per key, so a leaked key would burn the whole team's budget. The spend cap and key hygiene matter for that reason.

**Evidence:** [ARCHITECTURE.md sections 11 and 12](../docs/ARCHITECTURE.md), [RULES.md P9](../docs/RULES.md), [SPIKES.md (a)](../docs/SPIKES.md)

### Q: What about prompt injection from text on the screenshot?

**Short answer:** [Decided] The system prompt declares on-screen text to be content and never instructions, the output is schema-constrained, and ShowMe never executes actions, so injected text can at most produce a bad suggestion.

**Detail:**
- Limiting layers: the honesty UX (`unsure`, caution) and the instruction format (one sentence, max 25 words).
- Planned test: 5 injection screenshots added to the negatives suite. Not run yet.
- Residual risk: a bad suggestion on a payment or security screen. The caution field and the "I never click for you" design limit that, but do not eliminate it.

**Evidence:** [ARCHITECTURE.md sections 5.2 and 12](../docs/ARCHITECTURE.md), [RISKS.md watch list](../docs/RISKS.md)

### Q: What about harmful goals, such as stalkerware or bypassing parental controls?

**Short answer:** [Decided] The model is told to set `refuse` if the goal would harm the person or others or bypass security, payment or safety controls, and the UI shows a calm explanation with no highlight. A set of 10 refusal probes is planned for the eval.

**Detail:**
- Not yet tested. The refusal probes are on the watch list, not a Day 3 deliverable that I have verified.
- ShowMe only draws a highlight on an existing screenshot, which limits capability, but the refusal policy is still a content judgement the model makes. I would not claim it is robust.

**Evidence:** [ARCHITECTURE.md section 5.2](../docs/ARCHITECTURE.md), [RISKS.md watch list](../docs/RISKS.md), [REQUIREMENTS.md FLOW-9](../docs/REQUIREMENTS.md)

### Q: Do passwords, 2FA codes and card numbers ever get sent or suggested?

**Short answer:** [Decided] Never knowingly. Card numbers are auto-covered, the review screen catches the rest, and the model must never put passwords, codes or card numbers in `type_text`. Any `type_text` matching a PII pattern is emptied.

**Detail:**
- Prompt rule 11 and post-processing step 6; PRIV-7 says goal text and `type_text` are masked both before leaving the browser and before returning to the client.
- Rule P8: never ask the user to remove a blur or reveal a password, code or card number, in prompts, UI copy or instructions.
- The caution rule also covers steps involving sharing a code or password.
- Honest gap: a six-digit 2FA code is not matched by my patterns. The user has to hide it on the review screen.

**Evidence:** [ARCHITECTURE.md sections 5.2 and 5.4](../docs/ARCHITECTURE.md), [REQUIREMENTS.md PRIV-7](../docs/REQUIREMENTS.md), [RULES.md P8](../docs/RULES.md)

### Q: What data does the user's browser keep?

**Short answer:** [Decided] The raw screenshot, redacted screenshot, goal text and step history live in tab memory only. No cookies, no localStorage, sessionStorage or IndexedDB holding images or goals.

**Detail:**
- PRIV-4 is to be verified by a Playwright test that checks storage and cookies after a full flow.
- The text size and high-contrast preferences persist for the tab only (A11Y-6).
- Canvas re-encoding drops EXIF and GPS metadata (PRIV-9), tested with vitest on the encoded output.

**Evidence:** [REQUIREMENTS.md PRIV-4, PRIV-9, A11Y-6](../docs/REQUIREMENTS.md), [RULES.md P4](../docs/RULES.md)

### Q: How do you prevent the rate limiter from becoming a privacy problem?

**Short answer:** [Decided] Use a salted daily hash of the IP, store it only as a counter bucket, and delete it after 48 hours, so the limiter does not hold raw IPs or a long-term identifier.

**Detail:**
- Buckets are like `ip:<salted-hash>:<yyyy-mm-dd>` and `spend:<yyyy-mm-dd>`. The daily salt means the same person looks different each day.
- Raw IPs are never stored; only the salted, daily-rotated hash is. I describe it that way and do not oversell.
- A deeper legal view (UK or EU data law) is not in the docs. I should not say it is compliant.

**Evidence:** [ARCHITECTURE.md sections 1, 8 and 9](../docs/ARCHITECTURE.md), [REQUIREMENTS.md PRIV-3](../docs/REQUIREMENTS.md)

### Q: Give me your threat model in one table.

**Short answer:** [Decided] The threats I design against, with what is measured so far.

**Detail:**
- Raw screenshot leaves the device: compile-time brand type plus a network test (PRIV-1). Not built, not yet tested.
- Redaction misses private text: mandatory review, tap-to-blur, brush. Spike showed free text is not caught by regex.
- A relative or stranger finds a shared link: 128-bit token, hash at rest, signed URLs, noindex, 7-day expiry, delete key.
- Database leak: token and delete key only hashed; no raw IPs; RLS with no public policies.
- Prompt injection from screen text: declared as content, schema output, no action execution.
- Abuse of the public demo: per-IP limits and a global spend cap (see file 05).
- Leaked API key: secrets only in env stores, gitleaks in CI, spend cap.
- Third party reading the page: no third-party scripts, strict CSP.
- Meta retention of redacted images: UNVERIFIED, stated on the privacy page.

**Evidence:** [ARCHITECTURE.md sections 1, 8 and 12](../docs/ARCHITECTURE.md), [REQUIREMENTS.md PRIV table](../docs/REQUIREMENTS.md), [RISKS.md](../docs/RISKS.md)

### Q: Why should anyone trust your redaction?

**Short answer:** [Known limitation] They should trust the process, not the claim. The honest answer is that auto-redaction only covers patterned data and was tested on clean synthetic fixtures, so the review screen is mandatory and the user is the final check.

**Detail:**
- The measured result is 10/10 PII strings with 0 false positives on synthetic pages. That is a fixture, not a field study.
- Free text, names and addresses are not covered by the auto layer.
- Planned evidence: FLOW-2 corpus (at least 30 strings, recall at least 95%, false positives reported) and a 3-person usability check on review time.
- I will publish the redaction recall and its failures with the same prominence as the good numbers.

**Evidence:** [SPIKES.md (d)](../docs/SPIKES.md), [REQUIREMENTS.md FLOW-2](../docs/REQUIREMENTS.md), [RISKS.md R3](../docs/RISKS.md), [RULES.md section 2](../docs/RULES.md)

### Q: Is this GDPR or compliance ready?

**Short answer:** [Known limitation] I cannot claim compliance. The design points that help are the EU Supabase region, data minimisation, expiry and deletion, but no legal review is in the docs, and Meta's retention period is UNVERIFIED.

**Detail:**
- The Supabase project is planned in the EU, London if available, "for the GDPR story" (Q5).
- A DPA, SSO and data residency are listed as enterprise-plan features in the business hypothesis, not built.
- I would say "privacy by design" and not "GDPR compliant".

**Evidence:** [MEMORY.md Q5](../docs/MEMORY.md), [ARCHITECTURE.md section 8](../docs/ARCHITECTURE.md), [PRD.md section 8](../docs/PRD.md)
