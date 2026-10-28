# 02 Architecture and decisions

Purpose: answer every "why X and not Y" about the design. Tags are explained in [README.md](README.md). Most decisions are logged as "Proposed" in MEMORY.md until I approve the plan. Nothing here is built yet; numbers are from the Day 1 spikes.

### Q: Give me the architecture in 30 seconds.

**Short answer:** [Decided] A Next.js app does redaction in the browser. A thin, stateless FastAPI backend calls Muse Spark 1.3 for the step and SAM 3.1 for the outline. Supabase holds data only for opt-in shared guides and rate-limit counters.

**Detail:**
- Browser: OCR plus regex redaction in a web worker, mandatory review screen, canvas re-encode (max 2560 px (D20)), step client, overlay renderer, step history in tab memory only.
- Backend routes: `/v1/step`, `/v1/refine`, `/v1/guides`, `/v1/healthz`, `/internal/purge`, plus `/v1/transcribe` as stretch.
- Meta Model API at `api.meta.ai/v1`: `muse-spark-1.3`, `sam-3.1`, optional `muse-wonder-1.0` and Muse Voice Transcribe.
- Daily Vercel Cron purges expired guides.

**Evidence:** [ARCHITECTURE.md sections 1 to 4](../docs/ARCHITECTURE.md)

### Q: Why Muse Spark as the default grounding model and not Muse Wonder?

**Short answer:** [Measured] Both got 10/10 on the smoke test, but Wonder cost about $0.0157 per call against about $0.0051 for Spark at minimal effort, so Spark is the default and Wonder is an escalation and an eval comparison.

**Detail:**
- At minimal effort Spark p50 was 2,809 ms and Wonder p50 was 3,069 ms. Absent-target honesty was 5/5 for both.
- The smoke set is too easy to separate them (decision D2), so the real comparison is ScreenSpot-Pro (stratified 300) with both models on Day 3.
- Wonder is in preview (`muse-wonder-1.0`). Pricing is $4.00 / $20.00 per 1M tokens against $1.25 / $4.25 for Spark.
- Pivot rule: if v2 held-out is below 75% or Pro below 25% at the Day 3 checkpoint, switch the default to Wonder if it is at least 10 points better and p95 is 8 s or less.

**Evidence:** [SPIKES.md (a) and (b)](../docs/SPIKES.md), [MEMORY.md D2](../docs/MEMORY.md), [RISKS.md R1](../docs/RISKS.md), [../spikes/grounding/smoke.py](../spikes/grounding/smoke.py)

### Q: Why `reasoning_effort: minimal`?

**Short answer:** [Measured] It gave the same 10/10 as the default effort at roughly half the latency and lower cost: p50 2,809 ms against 5,485 ms, and about $0.0051 against about $0.0069.

**Detail:**
- Low effort was in between: p50 4,282 ms, about $0.0057.
- Reasoning tokens are billed as output tokens. At minimal, output was 195 tokens (142 reasoning) against 615 at default.
- Caveat: n = 10 on an easy dataset. Effort level is re-checked on the dev split on Day 2 and at the Day 3 checkpoint. The honest absent-target test at default effort was not run.
- Setting `none` returns a 400, so minimal is the lowest valid value.

**Evidence:** [SPIKES.md (b)](../docs/SPIKES.md), [MEMORY.md D1](../docs/MEMORY.md), [../spikes/grounding/smoke.py](../spikes/grounding/smoke.py)

### Q: Why use SAM through the Meta API instead of self-hosting it?

**Short answer:** [Decided] The API serves SAM 3.1 at $2.50 per 1,000 images with a p50 of 1,338 ms, while the open weights are gated and the official code assumes CUDA, so self-hosting would cost me time for no benefit.

**Detail:**
- SAM 3 and 3.1 weights on Hugging Face (`facebook/sam3`, `facebook/sam3.1`) are gated. My machine is an Apple M5 with 16 GB, no CUDA.
- It is a required Meta model for the project, and the API removes hosting from a solo plan with a hosting budget of zero.
- Fallback if the SAM API is unavailable for a whole event: local SAM 2.1 tiny (Apache-2.0, 209 ms on MPS measured) for eval only. Production would show model boxes.
- Self-hosting open-weights models is explicitly cut from the hackathon scope.

**Evidence:** [SPIKES.md (a) and (c)](../docs/SPIKES.md), [MEMORY.md D3](../docs/MEMORY.md), [ARCHITECTURE.md section 6](../docs/ARCHITECTURE.md), [.learnings/00-step-log.md S1](00-step-log.md)

### Q: Why prompt SAM with a box instead of a point?

**Short answer:** [Measured] Box prompts gave a better highlight: mean IoU 0.51 against 0.41 for point prompts on 16 targets (IoU >= 0.5 on 7/16 against 6/16).

**Detail:**
- The model's own box scored 0.57 (9/16), higher than either SAM prompt on ScreenSpot-style targets. That is why the outline is shown only when SAM agrees with the model box.
- Point prompts are fragile: a grounding model rarely clicks the exact centre, and off-centre clicks give a whole-element mask 73% of the time (22/30) with the SAM API.
- Caveat: ScreenSpot ground-truth boxes are often loose regions, which penalises a tight mask. On the synthetic screenshots, where the box is the true edge, the SAM box-prompt highlight beat the model box on 3 of 5 hits and was within 0.01 IoU on the other 2. n is tiny.

**Evidence:** [SPIKES.md (c)](../docs/SPIKES.md), [../spikes/sam/pipeline_preview.py](../spikes/sam/pipeline_preview.py), [../spikes/sam/api_sam.py](../spikes/sam/api_sam.py)

### Q: Why two calls (`/v1/step` then `/v1/refine`) instead of one?

**Short answer:** [Decided] So the user sees the box as soon as grounding returns, then the outline swaps in, instead of waiting for both.

**Detail:**
- Ground p50 is about 2.8 s and SAM p50 about 1.3 s, measured separately. The box appears after the grounding call (about 2.8 s p50) instead of also waiting for SAM (about 1.3 s more), which is D5's "about 1.3 s sooner".
- Cost of the design: the image is sent twice (about 300 KB each after compression), because there is no server-side session.
- SAM failure never fails a step: any error or a 4 s timeout returns `{"mode": "box"}`.
- The spike pipeline preview made two SAM calls (point and box) so it could compare them. Production makes one SAM call, with the box prompt.

**Evidence:** [ARCHITECTURE.md section 3](../docs/ARCHITECTURE.md), [MEMORY.md D5](../docs/MEMORY.md), [RISKS.md R4](../docs/RISKS.md), [SPIKES.md (b) and (c)](../docs/SPIKES.md)

### Q: Why a stateless backend?

**Short answer:** [Decided] Because anything the server remembers is something it can leak. With no session, there is no screenshot, goal or instruction to protect on the server, and it also scales and restarts trivially.

**Detail:**
- Backend memory holds the redacted image and goal only during the request. Backend disk and logs hold none of them (only metadata).
- The browser holds history in tab memory and sends it as text on each request.
- Trade-off: the image is uploaded twice per step (step then refine), and history is re-sent every call.

**Evidence:** [ARCHITECTURE.md section 1 table](../docs/ARCHITECTURE.md), [REQUIREMENTS.md PRIV-3](../docs/REQUIREMENTS.md)

### Q: Why a Vercel Python function for the backend and not a container host?

**Short answer:** [Decided] Free container hosts sleep, and a 30 to 60 second cold start would hit judges. A Vercel Python function is free, has no sleeping instance and keeps one origin so there is no CORS.

**Detail:**
- This is a deliberate change from the default stack (D8).
- The backend is a second Vercel project reached through Next.js rewrites at `/api/*`.
- Fallback: the same Docker image on Render free or Google Cloud Run. Docker stays for local dev, CI and the fallback.
- UNVERIFIED: Vercel functions cap request bodies at 4.5 MB, which the 2560 px JPEG keeps well under, but I have not checked the current Vercel limits or duration limits. That is a Day 4 test (A5, R7). If it fails, I deploy the Docker image elsewhere the same day.

**Evidence:** [ARCHITECTURE.md section 10](../docs/ARCHITECTURE.md), [MEMORY.md D8 and A5](../docs/MEMORY.md), [RISKS.md R7](../docs/RISKS.md)

### Q: Why use Supabase only for sharing and counters?

**Short answer:** [Decided] The core flow stores nothing, so the only things that need persistence are opt-in guides and rate-limit counters. That keeps the data footprint minimal.

**Detail:**
- `guides` table stores a SHA-256 token hash, a delete-key hash, the goal, steps and expiry. `usage_counters` stores per-IP and spend buckets. Row Level Security is enabled with no policies, so only the backend service role can read or write.
- Images live in a private bucket and are served by 10-minute signed URLs.
- EU project (London if available) for the GDPR story.
- Known constraint: the free tier pauses after 7 days of inactivity. The daily purge cron keeps it active.
- Fallback: Vercel Blob plus KV on free tiers.

**Evidence:** [ARCHITECTURE.md sections 8 and 10](../docs/ARCHITECTURE.md), [MEMORY.md Q5](../docs/MEMORY.md)

### Q: Why send history as text only, never earlier images?

**Short answer:** [Decided] For privacy and tokens. Earlier screenshots would mean re-sending more of the user's screen, and images are the main token cost.

**Detail:**
- Measured: input was 3,422 tokens per call for one image, so adding images would multiply the largest cost component.
- Each history item is the instruction, action, target label and result (`done` or `failed`), up to 20 items.
- Trade-off: the model cannot see what the previous screen looked like, only what it told the user to do. "That didn't work" gives it the failed result.

**Evidence:** [MEMORY.md D7](../docs/MEMORY.md), [ARCHITECTURE.md sections 4 and 5.1](../docs/ARCHITECTURE.md), [SPIKES.md (b)](../docs/SPIKES.md)

### Q: Why downscale to 2560 px (D20)?

**Short answer:** [Decided] Body-size limits, token cost and latency. The same downscale runs in the eval so the benchmark matches production.

**Detail:**
- Client pipeline: downscale so the long side is at most 2560 px (D20), export JPEG at quality 0.85 (WebP if smaller). Canvas re-encode also strips EXIF and GPS.
- The server accepts max side 2048 px and a decoded size of 3 MB.
- Untested: the accuracy impact. A7 says to compare native, 1920 and 1280 on the dev split on Day 2. If step p95 is above 8 s, the fallback is 1280 px after checking dev-split accuracy.
- My spike fixtures include 1170x2532 and 2560x1440 images, so real inputs will often be downscaled.

**Evidence:** [ARCHITECTURE.md sections 4, 7 and 13](../docs/ARCHITECTURE.md), [MEMORY.md D11 and A7](../docs/MEMORY.md), [RISKS.md R4](../docs/RISKS.md)

### Q: Why Next.js and FastAPI?

**Short answer:** [Decided] Next.js gives the web app, landing page and static pages on Vercel natively. FastAPI gives typed Pydantic boundaries and an OpenAPI schema from which the TypeScript client is generated, and the same Python core is imported by the eval harness.

**Detail:**
- Next.js 14 App Router, TypeScript strict. Redaction needs canvas, workers and media, so client components where required.
- Python 3.11 with uv, Pydantic v2, httpx async with explicit timeouts, mypy strict on `showme/core`.
- The TypeScript client is generated from `/openapi.json` in CI and drift fails CI (API-8).
- Docs list the stack as the default; I do not have a measured comparison against other stacks.

**Evidence:** [ARCHITECTURE.md sections 2 and 4](../docs/ARCHITECTURE.md), [RULES.md section 3](../docs/RULES.md), [REQUIREMENTS.md API-8](../docs/REQUIREMENTS.md)

### Q: Why is `showme/core` separate and pure?

**Short answer:** [Decided] So the eval harness runs exactly the production prompt, schema, post-processing and preprocessing. If eval used different code, the numbers would not describe the product.

**Detail:**
- `showme/core` has no FastAPI imports, no env reads and no global state. Settings are passed in.
- Requirement EVAL-2 and RULES section 5: eval imports `showme.core`, with an import check test.
- Prompt and schema are versioned constants (`PROMPT_VERSION = "v1"`). Any change bumps the version and needs an eval run on the dev split.

**Evidence:** [ARCHITECTURE.md section 2](../docs/ARCHITECTURE.md), [RULES.md sections 3 and 5](../docs/RULES.md), [REQUIREMENTS.md EVAL-2](../docs/REQUIREMENTS.md)

### Q: Why do redaction in the browser instead of on the server?

**Short answer:** [Decided] If the raw screenshot never leaves the device, there is nothing for the server, the logs or Meta to leak. Redaction on the server would already have received the private data.

**Detail:**
- OCR runs in a Web Worker with tesseract.js; the English traineddata is self-hosted so there is no CDN call.
- Measured in Node on the M5: 154 to 375 ms per screenshot. Browser timing is UNVERIFIED and expected to be slower. Day 3 measures it on a laptop and a mid-range Android phone (target 2 s or less).
- The `RedactedImage` brand type means only `redact()` output can reach the API client.

**Evidence:** [ARCHITECTURE.md section 7](../docs/ARCHITECTURE.md), [SPIKES.md (d)](../docs/SPIKES.md), [MEMORY.md A4](../docs/MEMORY.md), [../spikes/redaction/run.mjs](../spikes/redaction/run.mjs)

### Q: Why a strict JSON schema with the model's output?

**Short answer:** [Decided] It constrains the output to a fixed set of states and fields, so the post-processing can be a pure, table-testable function and a free-text surprise cannot reach the UI.

**Detail:**
- `response_format` JSON schema with `strict: true`, so every object has `additionalProperties: false` and all properties are required.
- Non-conforming or unparsable output is retried once, then returns 502 `model_error`.
- `status` is an enum (`ok`, `unsure`, `not_visible`, `done`, `refuse`), so the UI has a closed set of states.
- Important caveat: the spike used a smaller schema (`target_visible`, `point`, `bbox`, `confidence`). The production schema and prompt v1 are not yet measured; the Day 2 dev-split run is their first test (ARCHITECTURE section 5.5).

**Evidence:** [ARCHITECTURE.md section 5.3](../docs/ARCHITECTURE.md), [SPIKES.md (a)](../docs/SPIKES.md), [../spikes/grounding/smoke.py](../spikes/grounding/smoke.py)

### Q: Why generate the TypeScript client from OpenAPI?

**Short answer:** [Decided] So front end and back end can never silently disagree, and a hand-written type cannot widen what the API accepts.

**Detail:**
- Pydantic v2 models define the contracts. The client is generated from `/openapi.json` in CI.
- Rule: API types come only from the generated client. Drift fails CI (API-8).
- Same logic as the `RedactedImage` brand: make the wrong thing impossible to compile.

**Evidence:** [ARCHITECTURE.md section 4](../docs/ARCHITECTURE.md), [REQUIREMENTS.md API-8](../docs/REQUIREMENTS.md), [RULES.md section 3](../docs/RULES.md)

### Q: Why not use the browser's Web Speech API for spoken goals?

**Short answer:** [Decided] Chrome's Web Speech API sends audio to a third-party server, which would break the privacy story. The stretch plan uses Muse Voice Transcribe instead.

**Detail:**
- Voice is stretch S1. It is not tested yet; Muse Voice Transcribe is priced at $0.18 per audio hour.
- Max 60 seconds, typed input always visible, audio forwarded and never stored.
- Read-aloud of instructions uses on-device `speechSynthesis`, so no audio leaves the device.

**Evidence:** [MEMORY.md D13](../docs/MEMORY.md), [PRD.md section 5.2](../docs/PRD.md), [REQUIREMENTS.md FLOW-13 and FLOW-14](../docs/REQUIREMENTS.md), [DESIGN.md section 5](../docs/DESIGN.md)

### Q: Why forbid the contributor-mode model?

**Short answer:** [Decided] `muse-spark-1.3-contributor` is cheaper ($0.10 / $0.20 per 1M tokens) but gives Meta permission to use the content, which is incompatible with a privacy-first product.

**Detail:**
- Rule P6 and requirement PRIV-6: standard mode only; contributor model IDs are rejected by a settings validator test.
- Standard mode states "your content is not used to train Meta models". The standard-mode retention period is not stated on the pricing page: UNVERIFIED, an open question for Meta.
- Contributor mode has a lower limit too (150 RPM).
- Retention is tracked as MEMORY Q11.

**Evidence:** [SPIKES.md (a)](../docs/SPIKES.md), [RULES.md P6](../docs/RULES.md), [MEMORY.md D9 and A6](../docs/MEMORY.md)

### Q: What breaks if the Meta API changes or goes down?

**Short answer:** [Decided] SAM failure degrades gracefully to the model box. A grounding failure returns a typed error after retries. I pin the model ID, but I have no second provider.

**Detail:**
- Pin `muse-spark-1.3` and log the model in every result (watch list).
- 429 handling: exponential backoff with jitter from 500 ms, honouring `Retry-After`, max 3 tries. Failures return 502 `model_error` or 504 `model_timeout`.
- Wonder is the in-family fallback for grounding. SAM 2.1 tiny is the offline fallback for eval only.
- I have not designed for a multi-vendor failover and I would say so.

**Evidence:** [ARCHITECTURE.md sections 4, 6 and 9](../docs/ARCHITECTURE.md), [RISKS.md watch list](../docs/RISKS.md)

### Q: Where does each piece of data live? (the storage table)

**Short answer:** [Decided] The raw screenshot lives only in the browser's memory. The redacted image reaches the backend's memory per request and Meta per request. Nothing is written to backend disk or logs, and Supabase gets data only if the user shares.

**Detail:**
- Goal text: browser, backend memory during the request, Meta per request; never in logs (only its length); Supabase only if shared.
- IP address: backend memory during the request; a salted daily hash for rate limiting in Supabase, deleted after 48 hours. The raw IP is never logged.
- Request metrics logged: latency, tokens, status, model, cost. Daily spend counter in Supabase.
- Meta receives the redacted image per request in standard mode (not used for training; retention period UNVERIFIED).

**Evidence:** [ARCHITECTURE.md section 1 table](../docs/ARCHITECTURE.md), [REQUIREMENTS.md PRIV-3](../docs/REQUIREMENTS.md)
