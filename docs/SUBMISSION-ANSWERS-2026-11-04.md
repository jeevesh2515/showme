# ShowMe submission worksheet · 4 November 2026

[Certain] Inspected the actual signed-in submission modal and participant guide in the founder's existing Chrome tabs on4November. No form values, ratings, consents or external profiles were changed; nothing was posted or submitted. These are copy-ready drafts for the founder to review, not proof of submission. References: WEB-1, ENG-4, EVAL-7.

Sources:
- Form: https://cerebralvalley.ai/e/meta-ai-developer-hackathon/hackathon/submit
- Participant guide: https://cerebralvalley.ai/e/meta-ai-developer-hackathon/details
- Public code: https://github.com/jeevesh2515/showme
- Live product: https://showme-web-delta.vercel.app
- Results: https://showme-web-delta.vercel.app/eval

## Verified requirements and current state

- [Certain] Deadline: Wednesday4November at21:00EST = Thursday5November at02:00London. The guide says late submissions are not considered. Recommended personal target:18:00London on4November; that is a buffer, not the organizer's deadline.
- [Certain] Public repository, accessible three-minute demo, clear event-period original contributions and one representative/team submission are required. The form has no separate Live App field; include the live URL in Project Description.
- [Certain] Indie Developer Track and Build for Your World are already selected. Founder Jeevesh Singale / jeevesh039 is already listed as team member. Team Name and text/link fields are blank in the inspected form. Leave the actual membership accurate; AI coding tools are not invented human teammates.
- [Certain] The form exposes no HTML maxlength for the inspected text fields; this does not prove the server has no limits. Only track/problem and two opinion questions visibly state required in their labels; final validation was not exercised.
- [Certain] Viral award: publish the project demo on X and submit the specific post URL. Guide lists likes, reposts and comments through November8EOD, not views alone. It does not specify the EOD timezone there; confirm with organizers if necessary. Do not assume post-submission editing or adding a viral URL later is permitted.
- [Certain] Main rubric: Impact30%, Meta tooling25%, technical execution20%, demo25%. The guide warns against generic simple image analyzers. Present the actual reviewed-image → actionable step → consented guide handoff and engineering; a polished description does not itself establish eligibility.
- [Certain] Founder confirms using Muse Code, its model/API and Meta Model API while building/testing, reports a positive API experience, and prioritizes AI Engineer roles. This is founder-reported tool use; no claim is made about which files a tool authored. The shipped grounding/refinement roles remain muse-spark-1.3 and sam-3.1.

## Form answers, in on-screen order

### 1. Team Name

```text
ShowMe
```

### 2. Team Members

[Certain] Jeevesh Singale / jeevesh039 is already present. Keep solo membership if that is accurate; add actual human collaborators only if they worked on the entry.

### 3. Track / 4. Problem statement

```text
Indie Developer Track
Build for Your World
```

[Certain] Both are already selected in the inspected modal.

### 5. Most Viral Track X post link

```text
https://x.com/jeevesh2515/status/2118097660968128812
```

[Certain] The native short video and its project-links reply are published. This actual status URL is entered in the prepared submission form. Signed-in playback works; a separate browser could read the public post/reply but reported a media playback error, so a normal signed-out playback check remains.

### 6. Project Description

```text
I built ShowMe for the moment someone sends you a screenshot and asks, “Where do I press?”

You add the screenshot and their goal. ShowMe gives you one plain instruction and highlights the next control. Before anything is uploaded, it detects some private details in the browser, then makes you review the image and hide anything it missed.

You can review it again and share a guide that expires after seven days. The person following it opens the picture on their phone and finds the same control in their own app. It does not remotely control their device.

I built the web app, API, privacy-review flow and evaluation harness during the hackathon. The demo uses a made-up billing screen and my own iPhone. I have published the results and failures; it still makes mistakes, and independent recipient testing is not complete.

Try it: https://showme-web-delta.vercel.app
Results and limitations: https://showme-web-delta.vercel.app/eval
```

### 7. Public GitHub Repository

```text
https://github.com/jeevesh2515/showme
```

### 8. 3-Minute Demo Video

```text
https://youtu.be/RzdqrBMuqQ0
```

[Certain] The founder supplied this uploaded film URL. YouTube Studio confirms the correct readable MP4 filename, HD complete and Unlisted visibility. The agent saved the prepared title/description and corrected its audience to not made for kids. Opening and closing playback worked from another viewer account; anonymous embedded playback hit YouTube Error153, so normal incognito playback remains a human check. The actual link is entered in the prepared form; this is not a submission confirmation.

### 9. Describe your use of Meta products to build the submitted project

```text
ShowMe uses Meta Model API for two different jobs.

Muse Spark 1.3 reads the reviewed, redacted screenshot and the goal. It returns one action, a plain-language instruction, and a point and box for the target in a strict JSON schema.

SAM 3.1 then tries to refine that box into an outline. I only keep it when its box agrees with Spark’s, contains the original click point and stays within the area limit. Otherwise the box remains. SAM never moves the click point.

I also used Muse Code and its model/API during development and testing. I evaluated the grounding through the same core code used by the API and published the raw results, including failures.
```

### 10. Why are Meta's models important to your solution?

```text
A text answer like “the button near the bottom” is not enough for this problem. I need the instruction to point to the actual control in the screenshot, even when I cannot inspect the original app’s DOM.

Muse Spark provides that visual grounding and a structured action I can render. SAM gives me a second, optional way to outline the control. I did not treat its outline as proof that the answer is correct, which is why I added the agreement gate and kept the box fallback.

The models make the visual step possible. The browser privacy review, sharing flow and evaluation are what turn it into something I can demonstrate and inspect honestly.
```

### 11. Partner-technology feedback

[Certain] The field's placeholder names Fireworks, Modal and Baseten. Founder confirmed Muse Code/Meta API use, but has not confirmed using these inference partners. Do not invent partner experience.

If none were used:

```text
I used Meta Model API directly for ShowMe and Muse Code during development and testing. I did not use Fireworks, Modal or Baseten for this build, so I do not have first-hand feedback on those services.
```

If one was used, replace the last sentence with the actual service, what you did with it and one first-hand observation. Positive Meta feedback can be stated as “Meta Model API worked well for me during the build.” Do not add invented setup problems or comparative claims to make feedback sound sophisticated.

## Nine survey questions

[Likely] These are suggested choices grounded in the founder's reported positive experience and the documented build. They are personal answers: review them, especially the recommendation scores, before selecting anything. No ratings were set by the agent.

| Exact question | Suggested answer / how to choose |
| --- | --- |
| How likely are you to build with Meta Model API? | **Very likely**, if that matches the stated positive experience and actual intent. |
| How would you describe your overall opinion of Meta Model API? | **Very favorable**, consistent with the founder's report that it worked well. |
| How likely are you to recommend the Meta Model API to another developer or engineering team building with LLMs? | Scale is **0–5**, not0–10. Suggested **5** if the founder would strongly recommend it; choose4 if that is more accurate. |
| How likely are you to recommend Muse Code to another developer or engineering team? | Also **0–5**. Founder used it; suggested **5 only if** the same strong positive recommendation applies to Muse Code. Do not infer satisfaction with it solely from satisfaction with the API. |
| What was the biggest obstacle your team hit while building this project? | Suggested **Something else (please specify)** if the hardest part was engineering the reviewed-image/phone experience. If an explanation appears: “Making the privacy review and phone highlights reliable and readable, then checking the full flow instead of trusting a nice-looking demo.” Select an API/model issue only if it was actually the biggest obstacle. |
| Compared with other AI models your team has used for the same kind of work, how did Meta’s models perform on this project? | If no non-Meta model was used for comparable grounding: **We haven't used other models for this kind of work**. If other models were used without a fair comparison: **We've used other models but couldn't make a clear comparison**. The existing Spark/Wonder comparison is between Meta models; it does not establish superiority over other providers. |
| When your team chooses an AI model or coding tool, what matters most? | Suggested **Quality of the answers and code**. Choose privacy or another option instead if that is the founder's actual top criterion. |
| What makes it hardest for your team to switch to a different AI model or coding tool? | Suggested **Our product is tuned to our current model's behavior and prompts**, given the versioned prompts/schema/gates/evaluation. If re-evaluation effort is the actual main issue, choose **Testing a new model takes too long**. |
| If your team took this project to production, what would most likely stop you from using Meta’s models? | A positive API experience does not answer the production-readiness question. For unattended use, documented grounding/absent-target errors support **Model quality isn't good enough yet for our use case**. For a supervised pilot, select the actual biggest remaining constraint instead; this is a proposed judgment, not an assertion of the founder's preference. |

## Promotion permission and Submit

[Certain] The checkbox gives Meta/Cerebral Valley permission to use and promote submitted materials. Read the full current wording yourself and decide whether to accept. Ensure you have rights to the submitted code, video, screen examples and narration. The agent did not check it, accept terms or click Submit.

## Exact completion order

1. Finish and personally approve the three-minute and X cuts. Do not let indefinite polish consume the submission window.
2. Complete X profile basics, prepare the launch copy and test the live app/repo access while the video is being finished.
3. Upload the approved three-minute video to a host accepted by the form. The field example is YouTube, not proof that every host is accepted. Wait for HD; check full playback without your login.
4. If entering Most Viral, upload the approved44.6s cut natively to X, review and publish it yourself, then copy its actual post link. The account does not need a paid subscription for that short file under the currently documented limits.
5. Return to the already-open submission modal. Set team name, keep accurate membership/track/theme, paste the four text answers and real links, review the surveys, then review the promotion consent.
6. Check every link from a signed-out browser. Check video length, correct project, original contribution statement and readable disclosures. Update public README/SUBMISSION video placeholders only with the actual URL; no deployment is implied by a documentation change.
7. Submit before the official deadline and save the real confirmation page/email/identifier. Verify that the submitted entry displays the correct links if the platform offers a view page.
8. Do not assume edits are possible after submission. If the optional X field threatens the deadline, prioritize a valid main entry and ask organizers about later viral-link eligibility instead of guessing.

## Remaining personal choices

- Final video approval and actual hosted URL.
- Actual X launch-post URL if competing for that award.
- Partner-use confirmation, Muse Code recommendation score, comparison history and the personal survey judgments.
- Rights/promotion consent and actual submission.

[Certain] X/account/career copy and the longer visibility plan are saved privately in `/Users/jeeveshsingale/ai-job-search/documents/launch/showme-x-career-plan-2026-11-04.md`.
