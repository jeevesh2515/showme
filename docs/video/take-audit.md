# Recording take audit

Audited November 3, 2026. Scope: read-only reconciliation of recording logs, saved responses/timelines and spend entries; no new recording, render, model call, deployment or live guide request.

**[Certain] The selected footage is the third main live recording, not the fifth.** Four main live recording launches are evidenced; the first three completed. The fourth obtained a model result and outline but failed during sharing. Mock rehearsals, exploratory grounding calls and absent-target recordings are separate counts.

## Main live recordings

| Attempt | Evidence | Outcome |
| --- | --- | --- |
| 1 | Launch November 2, 19:28:06 UTC; `OLD_MASK=1 node docs/video/film/capture.mjs`. Saved main timeline starts 19:28:07.596 UTC; response `st_3995c18318ee`, point (482,660). | Completed. Box fallback; misplaced point. This invocation also captured an absent-target segment. |
| 2 | Launch group 19:36:36 UTC; `BASE_URL=http://localhost:3100 ONLY=main node docs/video/film/capture.mjs`; completion output 19:37:34 UTC. Grounding cost $0.00349, refinement $0.0025. | Completed with outline. Its guide was deleted before attempt 3. |
| **3 — selected** | Launch group 19:40:19 UTC; main timeline starts **19:41:08.970 UTC**. Response **`st_f67060d6b07d`**, point (482,632); refinement mode `outline`. Completion output 19:41:46 UTC. | Completed. Current raw response, refinement, uploaded image and guide URL match archived `out/take3` byte-for-byte. |
| 4 | Launch group 19:52:55 UTC; response `st_f870ccad6b05`, point (482,632), outline. Failure output 19:54:38 UTC. | `guide-url` failed to appear within 25 seconds; no completed main timeline. The ledger's zero-cost `video-take-4` entry does not erase the later $0.0061 `video-take-4-failed-share` entry. |

**[Certain]** Local artifact evidence: [current main timeline](out/raw/main/timeline.json), [selected response](out/raw/main-step-response.json), [archived third response](out/take3/main-step-response.json), [later fourth response](out/take4/main-step-response.json), and [spend ledger](../../eval/results/spend.json) (recording entries around lines 138–190).

## Calls that are not main recording takes

**[Certain]** Seventeen exploratory grounding requests have printed results and matching ledger entries: three repeats, four goal/format variants, six mask variants, two layout tests and two crop tests. The counts refer to application grounding requests; underlying provider retries were not separately reconstructed.

**[Certain]** Two absent-target recordings are evidenced: the first invocation's absent segment (completion 19:29:17 UTC, cost $0.003676), and a separate `ONLY=absent` capture starting 19:42:47 UTC (completion 19:43:02 UTC, cost $0.00364). The final saved [absent response](out/raw/absent-step-response.json) is `st_8cf963ab6b6a`, status `not_visible`.

**[Certain]** Three `MOCK=1 ONLY=main` rehearsals are excluded. Phone-only guide navigation is also excluded: it does not regenerate the main model result.

## Original log provenance

**[Certain]** The targeted local source is `/Users/jeeveshsingale/.claude/projects/-Users-jeeveshsingale-dev-ShowMe/748e4bed-3912-4ad2-8686-c501cef64b19.jsonl`. Only recording commands/results were used; no credentials or unrelated conversation content are reproduced here. JSONL line ranges:

- Main attempts: **1573–1576**, **1774–1777**, **1868–1876**, **2118–2121**. Duplicate replay entries with no timestamp are not additional launches.
- Exploratory requests/results: **1641–1648**, **1656–1659**, **1671–1674**, **1686–1689**, **1701–1704**; scratch scripts `g.py` through `g5.py` define the request loops.
- Second absent recording: **1905–1908**.
- Mock rehearsals: **1509–1516**, **1727–1735**, **1754–1758**.
- Matching selected-guide phone capture: **2082–2085**.
- The export command at **2214** explicitly uses `TAKE=third CUT_WAIT=1 node docs/video/film/build.mjs all`.

**[Likely]** Use this disclosure: “Third main recording, selected after earlier attempts. Separate exploratory calls preceded recording; a later fourth attempt failed during sharing.” Do not describe the selected example as a first-attempt success or as general accuracy evidence.

## Phone, privacy and metric boundaries

**[Certain]** The current [phone timeline](out/raw/phone/timeline.json) starts November 2 at 19:50:52 UTC. Its logged capture opened the same guide URL as the selected third take. It remains Chromium emulation, not a physical-iPhone or recipient observation. The sampled frame displays November 9 expiry; current guide availability and current deployed UI parity were not rechecked. The recording predates later UI work, so retain the recorded-version label instead of implying a fresh November 3 device run.

**[Certain]** Earlier visual inspection of the selected uploaded synthetic image found its identifiers masked. This is evidence about that image only, not a guarantee of automatic detection or a new privacy audit. The original screen contains made-up details and must remain labelled synthetic.

**[Certain]** Existing raw artifacts support 1,054/1,172 = 89.9% grounding accuracy, 186/300 = 62.0% Pro accuracy, 151/200 = 75.5% absent-target `not_visible`, 44 highlighted absent-target misses and 12/20 live-web development tasks. The 1,172 grounding examples span 696 unique images: use “held-out examples,” not “1,172 screens.” Preserve the dev/reporting overlap disclosure and the qualification that E2E tasks were used during development.

**[Certain]** The approximately 2.8-second median and under-cent cost describe recorded grounding calls, not the complete browser review/upload/refinement workflow. Sharing a pure core with production does not mean the benchmark exercised the complete browser redaction/encoding pipeline.
