# ShowMe: finish, GitHub, X and submission

## Release progress update

The film is now hosted at [YouTube](https://youtu.be/RzdqrBMuqQ0), with the correct readable MP4 filename, HD processing complete, Unlisted visibility, title/description saved and general-software audience classification. The [native X video](https://x.com/jeevesh2515/status/2118097660968128812) and [project-links reply](https://x.com/jeevesh2515/status/2118097775460061242) are live. Both actual links are entered in the existing submission form; personal surveys, promotion consent and final Submit remain with the founder. Opening and near-end playback worked from another viewer account, and the founder confirmed both videos play in normal incognito browsing. These facts supersede the historical “nothing posted/uploaded” notes below.

PR #3 already exists on `feat/video-readable-highlights`; do not recreate it or repeat its original staging/commit commands below. Both Vercel projects were inspected live: no Git repository link and Git deployments disabled. No deployment is authorized or performed by this release pass. Current-source private-guide scan and independent builder review found no merge blocker; README candidate wording was synchronized to readable mode.

Current files are linked in [READABLE-DELIVERY.md](redesign/READABLE-DELIVERY.md). The authenticated participant guide and submission form were re-read on4November. Nothing was posted, uploaded, submitted or pushed by this finish.

## 1. Final viewing and video hosting

1. Play `Downloads/ShowMe-Hackathon-180s-20261104-Readable.mp4` completely with headphones. Check the opening, privacy review, phone, numbers, captions and ending. Play the44.6s X file once muted on your physical phone.
2. Confirm the synthetic example, iPhone16 self-demo, AI narration and take/hold disclosures are acceptable. The real privacy masks should remain dark; only editorial text covers were removed. No independent recipient success or cancellation is demonstrated.
3. Upload the180s film to your chosen video host. An unlisted link is acceptable only if judges can actually access it without an account or permission request. Wait for HD processing. Open the exact shared URL signed out and test playback, including the ending.
4. Replace `https://youtu.be/PENDING_SUBMISSION_URL` in both root `README.md` and `docs/SUBMISSION.md` with that actual tested URL. Do not paste a local file path or the44.6s X clip into the three-minute field.

## 2. Finish one scoped GitHub PR

Verified current branch state: public default `main` at`d012d5c`; live remote refs matched local refs. Every historical day/release/fix branch is already contained in main. No old branch needs merging and no branch needs deleting. A new local branch, `feat/video-readable-highlights`, now holds the existing working changes; no commit or push has occurred.

1. Stay on this branch. Review `git status --short` and the exact staging list in `RELEASE-STAGING-PATHS.txt` before using it. It includes the dependencies for all builder modes, not just readable mode. Raw movies, phone originals, voice/cache files and judging scratch remain local/ignored.
2. Keep unrelated `docs/RUNBOOK.md` and `.learnings/daily/2026-11-03.md` edits out of this PR. Never run `git add .` for this mixed worktree.
3. After inserting the real hosted URL, use the prepared path list:

```sh
git branch --show-current
git add --pathspec-from-file=docs/video/RELEASE-STAGING-PATHS.txt
git diff --cached --stat
git diff --cached --check
make lint test
node --test docs/video/redesign/readable/*.test.mjs docs/video/film/audio-plan.test.mjs docs/video/film/phone-plan.test.mjs
```

4. Inspect the staged diff. Apply the repository's Ponytail review: remove unused code/imports, use native operations, avoid speculative abstractions, and preserve privacy/auth/data-loss safeguards. Scan for secrets and literal private guide URLs; inspect values privately, do not paste them into public review logs. Re-run affected checks if you change code.
5. Commit the reviewed change:

```sh
git commit -m "feat(video): keep demo text readable with light emphasis" -m "Refs: WEB-1, ENG-4, EVAL-7"
```

6. Check Vercel's Git integration settings before pushing. GitHub CI is verified to run on pushes/PRs and contains no deploy job; Vercel auto-deploy behavior was not verified. The earlier instruction against deployment still requires reconciling any automatic deployment before a push/merge triggers it. Do not disable or change deployment settings blindly.
7. When ready for that external release step:

```sh
git push -u origin feat/video-readable-highlights
gh pr create --base main --head feat/video-readable-highlights --title "Keep ShowMe demo text readable and finish release materials" --body-file docs/video/RELEASE-PR-DRAFT.md
```

8. Wait for CI on the **new commit**, including `ci` and `web`. The older green run at`d012d5c` does not validate this PR. Review the public diff and README video link.
9. Merge only this PR into main once reviewed and green. Preserve the historical branches and existing release tag; no force push, tag movement or branch deletion is necessary. Confirm the expected files and video link are visible on public main afterward. Deployment/product verification remains a separate gate.

Privacy preparation: three local video handoff documents had literal guide URLs. Current copies now use a redacted placeholder and private originals are backed up only under ignored `out/`. One guide URL already exists in the tracked file's older Git history; changing the current text does not erase that history or revoke that old synthetic-demo guide. No history rewrite or guide deletion was performed.

## 3. Publish the short film on X

The existing signed-in profile is `https://x.com/jeevesh2515`. It still showed0posts on inspection. Profile polish is useful, but do not let it delay the submission deadline. Banner already prepared: `Downloads/jeevesh-x-banner.png`.

1. Open Post and attach `Downloads/ShowMe-X-44.6s-20261104-Readable.mp4` as a native video. Wait for processing and inspect the preview. Upload the short film here; the submission form separately needs the hosted180s film.
2. Suggested post, ready to edit in your voice:

```text
Someone sends you a screenshot: "Where do I press?"

I built ShowMe to send back one clear visual step, with a privacy review before upload.

Built for the Meta Global AI Developer Hackathon.

What would you want help finding on your screen?
```

3. Post it yourself after viewing the preview. Copy the actual status link from that published post, not the profile URL. Check that the video plays signed out. Pin the post if you want it to lead your coding profile.
4. Suggested first reply:

```text
Try it: https://showme-web-delta.vercel.app
Code and evals: https://github.com/jeevesh2515/showme

Muse Spark finds the control. SAM can refine the outline when the agreement checks pass. It still makes mistakes; the results and failures are public.
```

No X post was created by this task. No engagement outcome is promised.

## 4. Submit through Cerebral Valley

Open [the actual form](https://cerebralvalley.ai/e/meta-ai-developer-hackathon/hackathon/submit). Copy-ready answers are in [SUBMISSION-ANSWERS-2026-11-04.md](../SUBMISSION-ANSWERS-2026-11-04.md).

1. Team: ShowMe; accurate solo membership; Indie Developer Track; Build for Your World. The latter two were already selected on the inspected form.
2. Paste your **actual published X status URL** in the Most Viral field if entering that prize. The official guide requires the demo post and its link; do not assume you can add it after submitting.
3. Paste the project description, public GitHub repo URL, tested hosted180s film URL and truthful Meta/model/tool answers. Use the live app URL in the description; the form exposes no separate live-app field.
4. Answer experience surveys yourself, reflecting your actual MuseCode/Meta experience. Review the promotion-permission checkbox and declarations yourself. No ratings or consents were selected by this task.
5. Recheck all links, then submit yourself. Keep the confirmation screen, time and final project link. A saved form or a clickable Submit button is not proof of completed submission.

Official deadline: **Wednesday4November,21:00EST = Thursday5November,02:00London**. The [participant guide](https://cerebralvalley.ai/e/meta-ai-developer-hackathon/details) says late submissions are not considered. It lists viral-prize likes/reposts/comments through November8EOD; the EOD timezone is unspecified there. Finish the main submission before its deadline even if later promotion continues.
