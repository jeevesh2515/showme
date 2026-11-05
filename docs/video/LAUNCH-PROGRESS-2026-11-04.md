# Launch and submission progress — 4 November 2026

This is a progress record, not a submission confirmation.

## Current state — hosting resolved; exact-head CI running

Final-review update: founder explicitly confirmed both YouTube and X play perfectly in normal incognito browsing. Provenance-only pinch-window correction landed in `ce5f4dd3eb99ebdd54411a9a5848411e9c493975` (continuity/readable metadata16.4–18.7s; footage unchanged),54affected tests pass. Public study citation now uses the primary publisher and distinguishes online2025/issue2026. Concurrent Day9 docs commit `f9b6baf` was reviewed/preserved; it also committed the latest journal/phase updates. User's new cached smoke/eval outputs are unrelated worktree changes and must remain unstaged. Exact-head CI for ce5f4dd is running; CodeRabbit already neutral and security check passed. No movie rerender is required or performed.

- Founder supplied the uploaded film URL: https://youtu.be/RzdqrBMuqQ0. Do not repeat file-permission troubleshooting or create another upload.
- Agent verified the exact readable source filename and HD complete in Studio, then saved title “ShowMe — Where do I press? | Meta AI Hackathon Demo”, the prepared factual description, **Unlisted** visibility and **not made for kids** classification (initial upload was Public/made for kids).
- Opening and near-end playback work from another viewer account. Player transcode reports180.021s; local source remains exactly180.000s. Anonymous embedded-player test hit YouTube153; a normal incognito playback check of both YouTube and X is pending the founder's report. Do not call the other signed-in viewer account an anonymous test.
- Existing Cerebral Valley form now contains the actual YouTube and X URLs, team/tracks and factual answers. Personal survey choices, promotion permission and final Submit remain untouched. No organizer confirmation observed.
- Studio proof: `/Users/jeeveshsingale/Downloads/ShowMe-YouTube-unlisted-20261104.png`; form proof: `/Users/jeeveshsingale/Downloads/ShowMe-submission-links-ready-20261104.png`.
- Vercel web/API projects were inspected live: no linked Git repository, Git deployments disabled. GitHub workflow runs CI only. No deployment is authorized/performed.
- Independent pre-merge review found no blocker; one stale candidate pointer in film README was corrected. Main-agent make lint/test passes169backend/33eval/99web plus scripts;42selected video tests pass. Agent review additionally ran77offline tests and all-mode builder preflights successfully.
- Scoped 10-file documentation/link follow-up committed and pushed: `962f6b2bcee225f237d0c25cd8d5fb20f5d8fb5f` on `feat/video-readable-highlights`. PR #3 body updated. Exact-head GitHub CI now running; wait for all required checks and merge only this PR, preserving alternatives/branches and unrelated worktree changes.
- Public URL placeholders replaced in README.md and docs/SUBMISSION.md. No new movies, audio, model calls or credits spent.

## Current blocker clarified by the user

Latest: the user reports the file-URL toggle is **On**. An actual attachment attempt still returned the same permission rejection. The CUA runtime was reset and the existing Chrome connection/uploader rebound; a second actual attachment attempt again returned that rejection. No upload started. Do not ask the user to check the same toggle again or claim success from configuration alone. Native macOS alternatives did not yield a usable YouTube chooser (coordinate control reported no window; Dock lookup timed out). No dedicated YouTube upload connector was available. The remaining practical handoff is for the user to drag the exact MP4 from Finder/Downloads into YouTube's upload box; then the agent can finish Details/Unlisted and verification. Current CUA bindings after reset: `browser` (Chrome 3), `uploadTab` (1051477611), `submissionTab` (1051477490). Both upload/submission tabs were preserved for handoff.

The user explicitly clarified: **they have not uploaded the YouTube film; the agent must do it**. Earlier short button replies were not evidence of completed uploads. Do not ask for an existing watch URL or assume a Details screen exists based on those replies.

The existing correct long MP4 is present in Downloads (10,957,492 bytes, SHA-256 `c63eb1b3808c4650e3d49581f1311bbe79aae91240d54839973d7ab079babe0b`). Existing-channel/unlisted upload and the displayed YouTube terms acknowledgment remain explicitly authorized. No need to request those approvals again.

Both the original and a fresh upload dialog were inspected; neither has begun uploading. A fresh channel Content view contained only two old uploads and no ShowMe draft. No duplicate ShowMe upload was created. The fresh uploader is Chrome tab `1051477611` and is waiting at Select files.

The extension chooser reports that local-file access is disabled. Native picker worked for X but has not opened successfully for YouTube. A fresh-target/foreground attempt did not resolve it. The browser's security policy blocks opening `chrome://extensions`; do not bypass that through another surface. A free-text question now asks the user to inspect the actual “Allow access to file URLs” toggle for the **ChatGPT** Chrome extension (On / Off / not present) and enable it if Off. Wait for the actual setting report, then use the documented filechooser API to attach the long MP4. Do not keep repeating requests for the user to upload it manually.

## Latest update — X published; YouTube awaiting manual file selection

- User authorized uploading the long film to their existing YouTube channel as unlisted, and separately confirmed YouTube's displayed Terms/Community Guidelines acknowledgment.
- Correct short MP4 was attached via the native macOS picker after the extension chooser rejected local-file access. The launch post is now live: https://x.com/jeevesh2515/status/2118097660968128812 (displayed 21:46, 4 November 2026). The agent observed it published without issuing a separate Post click; do not duplicate it.
- Agent published and verified the project-links reply: https://x.com/jeevesh2515/status/2118097775460061242.
- The actual root-post status URL is entered in the prepared submission form's Most Viral field.
- Signed-in Chrome shows the 45-second rounded-duration player and playback. A separate signed-out browser shows the public post and reply, but reports “Unable to play media”; signed-out video playback remains a check, not a verified pass.
- Published-post proof: `/Users/jeeveshsingale/Downloads/ShowMe-X-published-20261104.png`.
- YouTube Studio is open on Jeevesh Singale's existing channel with the Upload videos dialog. Its chooser still rejects local-file access despite the user's report that the setting was enabled. Browser security policy blocked opening `chrome://extensions`; do not work around that URL restriction.
- Asked user to click Select files in YouTube Studio and choose `Downloads/ShowMe-Hackathon-180s-20261104-Readable.mp4`. Awaiting selection. No YouTube upload/link exists yet.
- Once the Details screen appears, finish a factual title/description, select unlisted visibility, wait for processing, and verify actual watch URL signed out before putting it into the submission form and README.
- Personal survey choices, promotion consent and final submission remain untouched. No commit, push, merge, deployment or paid generation in this pass.

## Earlier preparation record

- Re-read the earlier freeze/audit chat and the live Cerebral Valley submission form.
- Filled the existing signed-in form with ShowMe team name, project description, public GitHub URL, Meta integration, model rationale and confirmed API/Muse Code feedback. Indie Developer / Build for Your World remain selected. These entries are visible in the browser; persistence across refresh is not verified. Do not reload the form.
- Left all personal survey choices and the promotion-permission checkbox untouched. Final Submit remains the founder's action under `docs/prompts/day-9-nov-04-buffer.md`.
- Prepared the X launch text in the signed-in `jeevesh2515` composer. No post has been published and no video attachment succeeded. Chrome's ChatGPT extension currently blocks local-file uploads until the user enables “Allow access to file URLs” in its extension Details page, or attaches the file manually.
- Asked whether to upload the 180-second film to the user's YouTube channel as unlisted, or use a hosted URL supplied by the user. No hosting choice or URL received yet; nothing uploaded to YouTube.
- Correct short file: `/Users/jeeveshsingale/Downloads/ShowMe-X-44.6s-20261104-Readable.mp4`.
- Correct long file: `/Users/jeeveshsingale/Downloads/ShowMe-Hackathon-180s-20261104-Readable.mp4`.
- Public landing page opened without authentication. This did not run the paid model flow or verify the phone workflow again.
- Git was already advanced by another actor: `feat/video-readable-highlights` at `f27bc4b893a08feecb8e0a5b685ce2c9f714ef13`, public PR https://github.com/jeevesh2515/showme/pull/3, latest CI successful. Main remains `d012d5c38e4b3ffe948ccf77f99f3859456a6024`. No commit, push, merge or deployment was performed by this publishing pass.
- README and `docs/SUBMISSION.md` still require the genuine hosted three-minute video URL. Resolve that before finishing PR #3. Do not merge historical branches or delete alternatives.
- Form screenshot: `/Users/jeeveshsingale/Downloads/ShowMe-submission-prepared-20261104.png`.

Resume: inspect current composer/form first to avoid duplicate posting; attach and verify the short video; publish the authorized launch post and capture its actual status URL; host and test the long film after the user's hosting choice; fill both actual URLs; hand personal surveys, promotion consent and final Submit to the founder. Record the real confirmation and time only after observed.

Copy-ready factual answers: `docs/SUBMISSION-ANSWERS-2026-11-04.md`. Release sequence and X copy: `docs/video/FINAL-RELEASE-CHECKLIST-2026-11-04.md`. Earlier checklist statements that no commit/push occurred describe the video-finish pass and predate PR #3.
