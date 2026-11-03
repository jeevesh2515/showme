# Final interview drill — 25 rapid questions

One-sentence answer + source. [Measured] only where a file proves it.

1. What is ShowMe? Screenshot + goal → one highlighted next step, private details masked in the browser before upload. Source: README.md.
2. Who is it for? The helper (Priya) turning a relative's screenshots into an expiring guide; not the least-confident person alone. Source: docs/SUBMISSION.md §2.
3. Does the guide tap the recipient's phone? No — it is a picture; they tap the same control in their own app. Source: GuideStepper.tsx guide-picture-note.
4. What never leaves the browser? The raw screenshot; only `RedactedImage` from `redact()` reaches the network (PRIV-1). Source: redact.ts.
5. Can review be skipped? No (PRIV-2); Playwright proves no API call before Continue. Source: priv-2.spec.ts.
6. What does auto-redaction miss? Names, addresses, passwords, faces, OCR-missed text — manual brush is the net. Source: MEMORY D59.
7. Which models? `muse-spark-1.3` grounding, `sam-3.1` outline; no contributor models (P6). Source: ARCHITECTURE §5–6.
8. Why two calls? Box in ~2.8s p50 first, SAM outline ~1.3s later; SAM failure never fails the step. Source: ARCHITECTURE §3.
9. Does SAM move the click? Never; agreement gate only decides outline vs box. Source: ARCHITECTURE §6.
10. Does SAM beat the box? Not on IoU (0.514 vs 0.556, v1 ablation); human ratings not run, no quality claim. Source: SUBMISSION §5.
11. Why does an outline become a box? Gate disagreement, SAM failure, or fragmented contour (D59). Source: sam.py.
12. ScreenSpot-v2? 89.9% held-out n=1,172, prompt v3. [Measured] Source: RESULTS.md.
13. ScreenSpot-Pro? 62.0% n=300, prompt v3; dense desktop screens are the weakness. [Measured]
14. Honesty on absent targets? 75.5% (151/200) say not_visible; 44 of the other 49 still highlight. Source: negatives report.
15. Refusals? 12/12 on safety probes, small synthetic-inclusive set. Source: negatives summary.json.
16. Confidence shown? No — AUROC 0.622, uncalibrated; removed from UI (D23).
17. E2E? 12/20 live public-web tasks, prompt v3, avg 4.45 steps; no unseen task set. Source: 2026-11-02 E2E report.
18. How do long flows work? One screenshot per step, act in the real app, add next screenshot; up to 15 steps share as one path. Source: app/page.tsx, guides cap.
19. Spotify/Uber/Netflix claim? Untested logged-in flows; post-hackathon plan in MEMORY D60, not a claim.
20. What is stored? Nothing beyond the tab unless opt-in Share; guides expire in 7 days, token hashed. Source: ARCHITECTURE §8.
21. Rate limits? 30 steps/hour per connection, $5/day public cap. Source: ARCHITECTURE §9.
22. Total eval spend? $36.4092 recorded + ~$3.32 historical estimate, under the $40 ceiling. Source: spend.json, D50.
23. Biggest limitation? One screenshot is one step; the recipient cannot continue inside the same guide yet. Source: D60.
24. What was built in the event? Everything in the public git history, 26 Oct–4 Nov. Source: github.com/jeevesh2515/showme.
25. Why should this win Indie? It is the helper tool that never sees the raw screen and publishes when it is wrong. Source: SUBMISSION §4.
