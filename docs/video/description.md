# Video description and source links

Status: **VIDEO_URL_PENDING — review cut exported; founder voice, physical-iPhone footage and final publication pending**.
Do not paste a pending placeholder into the hackathon submission.

## Description to publish with the completed film

ShowMe turns a screenshot and a goal into one reviewed visual next step that can be shared as an expiring guide.

This video uses an illustrative synthetic billing screen. It demonstrates guidance and sharing; no subscription is cancelled. The recipient is viewing a picture, not remote-controlling another app. A later state needs another screenshot.

The selected recording shows the intended control with an accepted SAM outline. It was selected after earlier attempts, including one with a misplaced box; it is not a claimed first-take result. The product highlight is unchanged in editing. Playback is slowed or held for narration; waits are not shortened. The exact number of prior exploratory attempts must be reconciled before publication.

Meta models: muse-spark-1.3 selects the next control; sam-3.1 can refine the outline when agreement checks pass. Refinement never moves the click point.

- Live app: https://showme-web-delta.vercel.app
- Public code: https://github.com/jeevesh2515/showme
- Recorded evaluation index: https://github.com/jeevesh2515/showme/blob/main/eval/results/RESULTS.md

Recorded prompt-v3 results dated November 2, 2026:
- ScreenSpot-v2: 1,054/1,172 held-out grounding examples = 89.9% target-point accuracy, SAM off.
- ScreenSpot-Pro: 186/300 = 62.0% target-point accuracy, SAM off.
- Absent targets: said “not visible” on 151/200 = 75.5%. Of the other 49, 44 still got a highlight. Injection probes counted apart: 10/10 (combined 161/210 = 76.7%).
- Live-web development tasks: 12/20 completed in the recorded run; the task set was used during development and is not unseen.

Grounding counts refer to annotated examples, not unique screenshots. A development/reporting image-goal overlap is disclosed in the audit. These recorded measurements are not a claim of independently clean held-out honesty, universal task completion or general safety. Human superiority of SAM outlines has not been established.

Sources:
- ScreenSpot-v2: https://github.com/jeevesh2515/showme/blob/main/eval/results/2026-11-02-screenspot-v2-heldout-n1172-99e1c829-muse-spark-1.3-minimal-samoff-max2560-pvv3-0707568a/predictions.jsonl
- ScreenSpot-Pro: https://github.com/jeevesh2515/showme/blob/main/eval/results/2026-11-02-screenspot-pro-heldout-n300-e08c4fce-muse-spark-1.3-minimal-samoff-max2560-pvv3-aa484597/predictions.jsonl
- Expected-not-visible probe suite: https://github.com/jeevesh2515/showme/blob/main/eval/results/2026-11-02-negatives-heldout-n222-977dad4c-muse-spark-1.3-minimal-samoff-max2560-pvv3-e2f82896/predictions.jsonl
- E2E run: https://github.com/jeevesh2515/showme/blob/main/eval/results/2026-11-02-e2e-bb543ba-04574992c7/report.md
- Evidence limitations: https://github.com/jeevesh2515/showme/blob/main/docs/REVIEW-2026-11-02.md

## Add only after inspecting the finished edit

- [ ] Actual VIDEO_URL replaces VIDEO_URL_PENDING in the submission.
- [ ] Add “Waiting shortened” only where waits were shortened.
- [ ] Add the actual “Selected from N attempts” statement if material take selection occurred; never invent N.
- [ ] Identify staged/coached behaviour accurately; do not claim a participant study.
- [ ] Verify the raw-result links and final video are accessible while logged out.
