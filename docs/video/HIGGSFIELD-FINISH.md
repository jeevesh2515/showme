# ShowMe candidate finishing · November 3, 2026

References: WEB-1, ENG-4, EVAL-7. The user designated `film/build.mjs`, `narration.txt` (7 paragraphs) and `x-narration.txt` (6 paragraphs) as authoritative. Do not use `assemble.py` or `film/review-narration.txt` for these candidates. Existing exports and alternative work must remain intact. No deployment, publishing, submission, replacement product footage or new Meta call is authorized here.

## Higgsfield account and spend

- [Certain] Added exactly one missing MCP server at `https://mcp.higgsfield.ai/mcp` and completed OAuth. A fresh read-only Codex MCP session actually called balance, list_workspaces, models_explore and list_voices; it verified 10 credits and Inworld/Callum availability. Configuration alone was not treated as success.
- [Certain] MCP `generate_audio` with `get_cost:true` was rejected by host policy: `MCP tool call requires approval, but approval policy is never`. No generation occurred through MCP. The existing CLI fallback was authenticated and selected to the same private workspace as MCP; the previous 2-credit CLI workspace belonged to a different account. No tokens/credentials were printed or copied.
- [Certain] Intended account now verified: wanderlustalchemy7@gmail.com; starting balance 10. Exact-text Inworld `Callum (en)` quotes: test 2, complete film 2, complete X 2. User approved the voice after listening and approved only the X wording change “held-out screens” → “held-out examples”. No other approved words or numbers were changed.
- [Certain] Hard cumulative ceiling 10; initial target 6, leaving 4 credits. Never retry a paid job automatically, run paid jobs in parallel, or pay merely for splitting/aligning speech.
- [Certain] Receipts, exact submitted text, raw downloaded audio and transactions are under `out/voice/higgsfield/`. The short test completed, cost 2 credits, and is 13.4 seconds. Consult current `*-request.json`, `*-result.json`, `*-receipt.json` and transactions for subsequent jobs. Request files are written before submission to prevent duplicate paid jobs.

## Local integration and checks

- Split the complete film and X tracks locally into 7 and 6 segments, keeping raw downloads unchanged. Local whisper-cli and its existing `ggml-small.en.bin` model are available; no new tooling or paid alignment is needed. Actual-speech cues must match the exact approved transcript. Recognition differences need review, not invented timestamps.
- Film durations: 20, 28, 30, 34, 21, 34, 13 seconds; total 180.
- X durations: 7.4, 8.4, 8.2, 5.2, 10.8, 4.6 seconds; total 44.6.
- `build.mjs` checks every segment before rendering, rejects transcript changes, invalid cues, speech overruns and overlaps, and never silently accelerates or truncates speech. Trim only verified silence; propose an approved script correction if spoken content still does not fit.
- Replacement manifest schema: version 1, segments keyed film-0…film-6 and x-0…x-5. Each entry supplies kind, file, exact transcript, offset, and measured cues `{start,end,text}`. Higgsfield entries stay under `out/voice/higgsfield/` with kind `higgsfield`; they must never move to founder storage.
- Disclosure is based on all segments. AI speech is labelled **AI-generated narration**. A genuine founder recording requires explicit provenance, not merely a file named film-0. Replacement captions retain measured cue times instead of proportional estimates.
- Preflight: `node docs/video/film/build.mjs all --check` (with VOICE_MANIFEST once supplied). Unit checks: `node --test docs/video/film/audio-plan.test.mjs`.
- Rendering writes unique candidate filenames and isolated work directories. Set TAKE to the audited description and CANDIDATE_TAG to a new tag. Existing exports are never overwritten. Verify both completed candidates with ffprobe, full decoding, actual speech/caption review, masks, every published number and disclosures.

## Take and recipient gates

- [Certain] [Take audit](take-audit.md): selected footage is the third main live recording. Four main launches are evidenced, first three completed, fourth failed at sharing. Seventeen exploratory grounding requests and two absent-target recordings are separate; mock and phone-only captures are excluded. Never label this “fifth” or first-attempt success.
- [Certain] Provide genuine physical-iPhone/recipient footage at `out/raw/recipient.mov`, preserving actual actions. Report consent, coaching and whether the intended control was identified. Do not synthesize recipient actions. The existing phone clip is emulation, has an obscured button label and stale “all 1 steps” copy; keep it labelled and do not certify those checks as complete.
- [Certain] Production previously served the old example. Deployment/source parity and real-device verification are separate gates; no deployment or paid Meta call is allowed by this finishing request.
- [Certain] Metrics: 1054/1172=89.9% grounding examples (696 unique images), 186/300=62.0%, absent-target not_visible151/200=75.5%, 44 highlighted misses, live-web development tasks12/20. Preserve overlap/development qualifications. The 2.8s/under-cent narration concerns grounding, not the full browser workflow.
- Candidates remain candidates while actual recipient footage, speech alignment/playback acceptance or deployment parity is unresolved.

## If direct MCP tools require a new chat

The currently running desktop chat did not dynamically acquire new Higgsfield tools. A fresh read-only Codex process did discover and call them. No fresh chat is needed for the verified CLI fallback. To resume with direct MCP tools, start a new chat in `/Users/jeeveshsingale/dev/ShowMe` and paste:

> Resume ShowMe finishing from docs/video/HIGGSFIELD-FINISH.md. Use only film/build.mjs and the two authoritative narration files. Inspect existing Higgsfield request/result/receipt files before any action; poll existing job IDs, never resubmit them. The user approved Callum and the X phrase “held-out examples.” Hard cumulative ceiling10, target6 including the test, reserve4. Discover actual MCP audio/quote tools and live balance. Preserve exports and alternative work; no deploy/publish/submit, no replacement product footage or Meta calls. Align and split locally. Genuine recipient footage belongs at out/raw/recipient.mov. Render new candidate filenames and report unresolved checks.

## Provider limit discovered after the failed film job

- [Certain] The complete film request failed; Higgsfield gave no reason, produced no audio and refunded two credits. The separately authorized complete X job succeeded. Current receipts show gross charges6, refund2, net spend4, balance6. No automatic paid retry occurred.
- [Certain] The underlying FAL endpoint documents a 2,000-character maximum (https://fal.ai/models/fal-ai/inworld-tts/api); Inworld's own synchronous API docs confirm it. The approved film has2,210 characters. Higgsfield's exposed schema and successful2-credit quote omitted this constraint. [Likely] This explains the failure, but the provider did not explicitly confirm its cause.
- [Certain] No same-text retry is appropriate under that documented limit. A1,983-character proposal under out/voice/higgsfield/film-under2000-proposal.txt removes five explanatory sentences/clauses while retaining seven paragraphs and every numerical claim; it quotes2credits. Alternatively the exact approved text can be split into two requests (1,005/1,202chars), quoted2credits each. The user must approve the script change or the two-request/reserve exception before generation.
- [Certain] X's first long-prompt local ASR omitted middle paragraphs and safely failed exact matching. A free local rerun using a short vocabulary prompt recovered all paragraphs. Its measured timing/overrun checks still gate candidate rendering; no audio is inferred from the caption text.

## Measured X timing decision pending

- [Certain] The successful X track is44.98s raw, and its locally recognized words match the approved text. Safe paragraph-edge trims still leave slot overruns of0.430s(scene1),0.313s(scene2),0.392s(scene4),1.020s(scene5), including the0.15s scene offset. The aligner stopped before writing a manifest or cutting speech.
- [Likely] A no-regeneration solution removes0.743062s of verified inter-word silence from scenes1/2 and reallocates the X slots to7.4,8.4,8.2,5.6,11.82,3.18, retaining44.6s total. Alternatively use46.02s total to retain the4.6s end hold. The user must approve the timing change; no such change has yet been applied.
- [Certain] The earlier same-text film-retry question is superseded by the documented provider limit. Do not resubmit the original2,210-character script even if an earlier retry approval arrives; resolve the shorter-text/two-request exception with the user.

## v2 candidates (November 3, 2026)

- [Certain] `callum-20261103-v2` re-edits local shots only; no credits or model calls. Slides follow measured speech, the unspoken call line moved onto the opening card, and captions stay off the phone. v1 and earlier exports are untouched.
- [Certain] Direct Higgsfield MCP was available in Claude Code; MCP and CLI show the same account and 4 credits. The narrow allow rules are in `.claude/settings.local.json`.
- [Certain] The phone outline strokes scale to about 37 image pixels on a 40-pixel button (`Overlay.tsx`), so a recording of the deployed product obscures the label. `Overlay.tsx` now masks the stroke out inside the path; record the iPhone footage only after that is deployed.
