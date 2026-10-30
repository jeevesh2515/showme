# Manual real-use-case runs, live site, 2026-10-30

Site: https://showme-web-delta.vercel.app/app · Runner: run.mjs (Playwright, public pages, no accounts) · Trail: trail/<id>-{source,review,step}.png

| # | Goal (start) | Step returned | Verdict |
|---|---|---|---|
| 1 | Reject all cookies (bbc.co.uk) | "Tap the blue Reject additional cookies button at the bottom." | Right |
| 2 | Renew my passport (gov.uk) | "Tap the Reject additional cookies button at the top." | Honest blocker step: cookie banner must be cleared first; passport step not yet shown (single-step run) |
| 3 | Find a GP near me (nhs.uk) | "Tap the green Reject analytics cookies button at the top." | Honest blocker step, as above |
| 4 | Track a parcel (royalmail.com) | "Royal Mail page says Access Denied, so go back and try again later." | Honest-unsure: source page is bot-blocked; model described that instead of guessing |
| 5 | Cancel a subscription from Apple (support.apple.com) | "Tap Change a subscription in the bottom middle card." | Plausible/right first step |

Notes: repeated runs from one IP tripped the 30/hour rate limit (API-6); the app showed "You have used ShowMe a lot this hour. Try again later." and returned to the review screen with the screenshot intact (trail/5-apple-cancel-error.png). First-pass OCR on dense pages can stall; the app falls back after 15 s to a review with 0 auto-blocks.
