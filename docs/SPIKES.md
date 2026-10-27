# Step 1: Verification spikes

Date: 2026-10-27. Every number here was produced by a script in `spikes/` or comes from an official page linked inline. Nothing below is estimated unless it is labelled **estimate** or **UNVERIFIED**. Reproduction logs: `spikes/results/2026-10-27-grounding-spark-minimal.txt` (re-run 2026-10-27 evening: 10/10, 5/5, p50 3,172 ms vs 2,809 ms in the first run - run-to-run latency variance, accuracy unchanged) and `spikes/results/2026-10-27-redaction.txt`. SAM spike stdout from the first run was not archived; re-running `spikes/sam/api_sam.py` is its reproduction path. From Day 2 the eval harness writes `predictions.jsonl` for every run.

Spike code is throwaway and never imported by the product. To re-run anything: `set -a; . ./.env; set +a`, then the command shown.

## Summary

| Spike | Verdict | Headline evidence | Fallback if it breaks later |
| --- | --- | --- | --- |
| (a) Meta models + API | **GO** | Muse Spark 1.3 takes images, supports JSON-schema output and reasoning effort. SAM 3.1 is served by the same API. 3,000 RPM per team. | Muse Wonder for grounding; SAM 2.1 tiny (Apache-2.0, local test passed) for masks |
| (b) Coordinates from the model | **GO, with a calibration gap** | Muse Spark 1.3 10/10 point-in-box on ScreenSpot; 5/5 honest "not visible" answers on absent targets; p50 2.8 s at `minimal` effort; about $0.005 per call | Muse Wonder (also 10/10); crop-and-re-ground second pass |
| (c) SAM 3.1 point → mask | **GO for the highlight, NO-GO as an accuracy booster** | SAM 3.1 API: 73% whole-element masks from off-centre clicks, p50 1.3 s. Refinement does not fix a wrong click (raw 10/30, refined 11/30). On ScreenSpot boxes the model's own box scored higher IoU than SAM. | Draw the model's box; SAM outline only when it agrees with the model box |
| (d) Client-side redaction | **GO for patterned PII, gap for free text** | tesseract.js + regex: 10/10 PII strings, 0 false positives, 154 to 375 ms per screenshot | Mandatory review screen with blur brush and tap-to-blur field |

The two findings that change the brief:

1. **The model's confidence number is not informative.** Every hit came back at 0.95 to 0.98. It cannot gate "say so honestly" on its own. The model's `target_visible` flag did work (5/5). Calibration is a Day 3 eval task with a planned verifier pass (see ARCHITECTURE.md §5.5).
2. **SAM does not raise click accuracy.** If the click lands on the wrong element, SAM returns a clean mask of the wrong element. The ablation in the brief ("model alone vs model + SAM") is therefore reported on two axes: click accuracy (SAM cannot change it by design) and highlight quality (where SAM may or may not help, measured honestly).

---

## (a) Meta models available through the API

Sources: [docs home](https://dev.meta.ai/docs/), [quickstart](https://dev.meta.ai/docs/quickstart), [models](https://dev.meta.ai/docs/models), [pricing and rate limits](https://dev.meta.ai/docs/pricing-rate-limits), [image understanding](https://dev.meta.ai/docs/image-understanding), [structured output](https://dev.meta.ai/docs/structured-output), [reasoning](https://dev.meta.ai/docs/reasoning), [SAM segmenting](https://dev.meta.ai/docs/sam/segmenting), [SAM reading output](https://dev.meta.ai/docs/sam/reading-segmentation), [SAM client libraries](https://dev.meta.ai/docs/sam/client-libraries), [hackathon page](https://dev.meta.ai/events/global-hackathon), [Cerebral Valley page](https://cerebralvalley.ai/e/meta-ai-developer-hackathon).

- Base URL `https://api.meta.ai/v1`, bearer auth with `MODEL_API_KEY`. Protocols: Responses, Chat Completions, Messages. OpenAI SDK compatible.
- Rate limits are **per team, not per key**. 429 with optional `Retry-After`; docs recommend exponential backoff with jitter from about 500 ms.

| Model | Image in | Use in ShowMe | Price | Limits |
| --- | --- | --- | --- | --- |
| `muse-spark-1.3` | yes | Default grounding model | $1.25 / $4.25 per 1M tokens in/out | 3,000 RPM, 4M TPM |
| `muse-wonder-1.0` (preview) | yes | Escalation for hard screens; eval comparison | $4.00 / $20.00 | 3,000 RPM, 4M TPM |
| `sam-3.1` | yes | Element outline from point or box prompt | $2.50 per 1,000 images | 3,000 RPM |
| Muse Voice Transcribe | audio | Spoken goal (not yet tested) | $0.18 per audio hour | 256 concurrent streams |
| `muse-image-1.0` | text+image → image | Not in core loop (landing art at most) | $0.01 per image | 150 RPM |
| `muse-spark-1.3-contributor` | yes | **Forbidden** (see below) | $0.10 / $0.20 | 150 RPM |

- Open weights: **Muse Spark Open** (816B MoE, 42B active, Muse Model License, `meta-models/Muse-Spark-Open-816B-A42B`) is hosted by Together, Fireworks, Groq, Baseten, Modal and others ([source](https://dev.meta.ai/docs/muse-spark-open)). Self-hosting needs roughly 0.5 to 1.6 TB of weights, so it is not a hackathon option; it is the enterprise "run it in your own cloud" story only. Its grounding quality vs the hosted model is **UNVERIFIED**.
- **Contributor mode gives Meta permission to use your content.** ShowMe must never use it for user screenshots. Standard mode: "your content is not used to train Meta models". Standard-mode retention period is not stated on the pricing page: **UNVERIFIED**, open question in MEMORY.md.
- Structured output: `response_format: {type: "json_schema", json_schema: {name, schema, strict}}`. With `strict: true`, every object needs `additionalProperties: false` and all properties required. Output is constrained to the schema either way.
- Reasoning: `reasoning_effort` in Chat Completions, values `minimal` to `max` (`none` returns 400). Reasoning tokens are billed as output tokens.
- Coordinates: Muse Spark reports positions on a **0 to 1000 normalised grid**; values can slightly exceed 1000, so clamp.
- SAM 3.1 on the API: prompts are text tokens such as `<0f>1<|point;x=479;y=632;w=1280;h=800|>` (pixels, `w`/`h` must equal image size). Box prompts `<|box;x1;y1;x2;y2;w;h|>`. Up to 16 objects per request. Output: one box token and one base85 mask token per object. Python helper `meta-sam-parser` (`build_object_prompt`, `decode_mask_to_svg_path`).
- SAM 3 / 3.1 open weights on Hugging Face are **gated** (`facebook/sam3`, `facebook/sam3.1`) and the official repo assumes CUDA. Not needed: the API serves SAM 3.1.
- Credits: founder confirmed $150 Model API credit on the account. Partner credits (Baseten $100, Modal $100, Fireworks $25) are for selected participants only and are not needed by this plan.
- Hackathon: Indie and Startup tracks; Startup is judged on "technical execution and production readiness". Submission format (video length, repo, URL) is not published on either page: **UNVERIFIED**, question for founder.

## (b) Can the model return reliable coordinates?

Script: `spikes/grounding/smoke.py`. Data: 10 ScreenSpot v1 samples fetched by `spikes/grounding/fetch_samples.py` (Apache-2.0, ungated), stratified 4 mobile / 3 desktop / 3 web, text and icon targets. Prompt asks for point + box on the 0 to 1000 grid, JSON-schema constrained, temperature 0. Five absent-target probes ask for things that are not on the screen ("cancel my Netflix subscription" on an iOS home screen).

| Model | Effort | Point-in-box | Absent-target honesty | Latency p50 / max | Tokens in / out (reasoning) | Cost per call |
| --- | --- | --- | --- | --- | --- | --- |
| muse-spark-1.3 | default | 10/10 | not run | 5,485 / 12,814 ms | 3,422 / 615 | ~$0.0069 |
| muse-spark-1.3 | low | 10/10 | 5/5 | 4,282 / 5,362 ms | 3,422 / 347 (296) | ~$0.0057 |
| muse-spark-1.3 | **minimal** | **10/10** | **5/5** | **2,809 / 3,555 ms** | 3,422 / 195 (142) | **~$0.0051** |
| muse-wonder-1.0 | minimal | 10/10 | 5/5 | 3,069 / 5,069 ms | 3,422 / 101 (48) | ~$0.0157 |

Cost per call = tokens × list price; it is arithmetic on reported usage, not a billing statement.

Also from `spikes/sam/pipeline_preview.py`: 15/16 point-in-box over the 10 ScreenSpot samples plus 6 synthetic UI targets. The miss: "update my payment method" on the synthetic billing page.

**What this does and does not show.** It shows the API returns usable grounding with honest "not visible" answers at interactive latency. It does not show real-world accuracy: n = 10, and ScreenSpot v1 is near-saturated by modern models. ScreenSpot-v2 (full) and ScreenSpot-Pro (stratified) on Day 2 to 3 are the real test. Confidence was 0.95 to 0.98 on every hit, so it carries no signal yet.

## Benchmarks (input to the eval design)

From the dataset cards and Hugging Face API (research subagent, sources listed):

| Benchmark | HF id | Licence | Size | Box format | Notes |
| --- | --- | --- | --- | --- | --- |
| ScreenSpot v1 | `bevaya/ScreenSpot` (was `rootsautomation/ScreenSpot`) | Apache-2.0 | 1,272 samples, one `test` split | normalised xyxy | Used for the smoke test. Fields `data_type` (text/icon), `data_source` (ios, android, macos, windows, gitlab, shop, forum, tool) |
| ScreenSpot-v2 | `OS-Copilot/ScreenSpot-v2` | Apache-2.0 | sample count **UNVERIFIED** (re-annotated v1, expected ~1,272); images in one zip | absolute xywh (inferred from values) | Headline benchmark: fixes v1 label errors |
| ScreenSpot-Pro | `likaixin/ScreenSpot-Pro` | MIT | 1,581 samples, 3.38 GB, per-app annotation JSON | absolute xyxy | Hard, high-res professional apps; fields `group`, `ui_type`, `platform` for stratification |

Sources: [ScreenSpot card](https://huggingface.co/datasets/rootsautomation/ScreenSpot), [v2 card](https://huggingface.co/datasets/OS-Copilot/ScreenSpot-v2), [Pro card](https://huggingface.co/datasets/likaixin/ScreenSpot-Pro), [Pro paper](https://arxiv.org/html/2504.07981v1). All three are ungated. Box formats for v2 and Pro are inferred from example values, so the Day 2 loaders include unit tests that draw a few boxes and check them visually.

## (c) SAM point prompt → mask

Scripts: `spikes/sam/run.py`, `jitter.py`, `policies.py`, `screenspot_sam.py` (local SAM 2.1 tiny, Apache-2.0, as a stand-in while SAM 3 weights are gated), `api_sam.py` and `pipeline_preview.py` (SAM 3.1 through the Meta API). Inputs: 6 UI elements on the synthetic screenshots (buttons, an input, a borderless text link; light, dark, 1x, 2x) and the 10 ScreenSpot screenshots.

| Test | Local SAM 2.1 tiny (M5, MPS) | SAM 3.1 via Meta API |
| --- | --- | --- |
| Centre click, mask box IoU vs element | 0.93 to 0.99 for buttons/input; 0.77 for the text link | 0.92 to 0.97 for buttons/input; 0.60 for the text link |
| Centre + off-centre clicks, whole-element rate (IoU ≥ 0.7) | 88% with single-mask output (42/48; ceiling 90% if the best of SAM's 3 candidates were always picked); 17% with a bad "largest candidate" policy | 73% (22/30, centre clicks included in the 30) |
| Near-miss clicks on ScreenSpot: point-in-box raw → refined | 38% → 34% (helped 0, hurt 4) | 33% → 37% (10/30 → 11/30, helped 1, hurt 0) |
| Latency per call | 209 ms warm (CPU 480 ms) | p50 1,338 ms, p95 2,454 ms (60 calls) |

Highlight quality in the full pipeline (`pipeline_preview.py`, 16 targets, Muse Spark at minimal effort):

| Highlight strategy | Mean IoU vs ground-truth box | IoU ≥ 0.5 |
| --- | --- | --- |
| Model's own bbox | **0.57** | 9/16 |
| SAM 3.1, box prompt from model bbox | 0.51 | 7/16 |
| SAM 3.1, point prompt from model point | 0.41 | 6/16 |

Sequential step latency in that run (grounding + two SAM calls, one point prompt and one box prompt): p50 5,319 ms, max 7,677 ms. Production makes one SAM call per step (box prompt) and shows the box before it returns.

Caveat: ScreenSpot ground-truth boxes are often loose regions (for example a 1400x232 tile for "play the solitaire collection"), which penalises a tight mask. On the synthetic screenshots, where the box is the true element edge, the SAM box-prompt highlight beat the model box on 3 of 5 hits and was within 0.01 IoU on the other 2. IoU against ScreenSpot boxes is therefore a weak proxy for "is the highlight right", so the eval adds a human-rated highlight check on the 20 end-to-end tasks.

Mask format verified: the mask is cropped to its box (a 168x41 button mask, 92% fill), one-bit, base85. `decode_mask_to_svg_path` returns an SVG path in box-local coordinates, which the overlay translates by the box origin. The payload includes its leading `!` marker.

Decisions: SAM 3.1 via the API (no hosting, a required Meta model); prompt it with the model's **box**, not its point; never move the click based on SAM; show SAM's outline only when it agrees with the model box (ARCHITECTURE.md §6).

## (d) Client-side redaction

Scripts: `spikes/redaction/run.mjs` and `run_inputs.mjs`. Fixtures: three pages with known fake PII, rendered by headless Chrome: light desktop billing 1280x800, mobile login 1170x2532 (3x), dark settings 2560x1440 (2x).

| Layer | Result |
| --- | --- |
| OCR (tesseract.js 5.1.1, same WASM engine as the browser) | 154 to 375 ms per screenshot in Node on the M5 (**browser timing UNVERIFIED**, expect slower) |
| Regex: email, phone (9 to 15 digits), card (13 to 19 digits + Luhn) | 10/10 PII strings found, 0 false positives, including dark mode and a `+` email |
| Pixel heuristic for "text inside an input field" | 7/11 recall, 6 false positives (field labels), 0/3 in dark mode. **Not reliable.** |

Not caught by regex: names, street addresses, CVC, any free text typed into a field. Fixtures are synthetic and clean, so real recall will be lower.

Decision: MVP redaction = OCR + regex auto-blur, then a **mandatory** review screen with a blur brush and tap-to-blur on any detected text line. The image is re-encoded from a canvas (which also strips EXIF). Pixel input-field detection is cut to stretch.

## Cost per guided step (estimate from measured usage)

One grounding call (~$0.0051) + one SAM call ($0.0025) ≈ **$0.0076 per step**. A 5-step task ≈ $0.04. The $150 credit covers ~19,700 steps before eval spend. Planned eval spend: about $27 (ARCHITECTURE.md §9).
