# ShowMe Judging Week Runbook (Nov 4 – Nov 8, 2026)

Operational procedures, health monitoring, rate limits, spend caps, log privacy, and rollback instructions for the judging period of the Meta Global AI Developer Hackathon.

---

## 1. Public Endpoints & Repositories

- **Live Web App**: [https://showme-web-delta.vercel.app](https://showme-web-delta.vercel.app)
- **Live API Health Check**: [https://showme-api-xi.vercel.app/v1/healthz](https://showme-api-xi.vercel.app/v1/healthz)
- **Evaluation Dashboard**: [https://showme-web-delta.vercel.app/eval](https://showme-web-delta.vercel.app/eval)
- **GitHub Repository**: [https://github.com/jeevesh2515/showme](https://github.com/jeevesh2515/showme)

---

## 2. 60-Second Health Smoke Check

Run this single command from any terminal to verify end-to-end service availability:

```bash
curl -s -o /dev/null -w "Web UI: %{http_code}\n" https://showme-web-delta.vercel.app
curl -s https://showme-api-xi.vercel.app/v1/healthz && echo " (API)"
curl -s -o /dev/null -w "Eval UI: %{http_code}\n" https://showme-web-delta.vercel.app/eval
curl -s -o /dev/null -w "GitHub: %{http_code}\n" https://github.com/jeevesh2515/showme
```

**Expected output:**
```text
Web UI: 200
{"status":"ok"} (API)
Eval UI: 200
GitHub: 200
```

---

## 3. Rate Limits & Spend Caps

To protect against runaway usage or adversarial scraping during judging while keeping the service free and responsive:

- **Client Rate Limiting**: 30 step requests per hour per connection (tracked via salted daily IP hash in Supabase, rotated every 24h, automatically deleted after 48h).
- **Daily Spend Cap**: Hard trip at \$5.00/day. Once tripped, the API responds with `spend_cap_reached` and the UI shows calm, honest resting copy ("ShowMe is resting until tomorrow so it stays free. Your screenshot was not sent.").
- **Model API Rate Limits**: Meta Model API team quota is 3,000 RPM. Automatic backoff + jitter retries handle transient 429 errors up to 3 times with exponential backoff.

---

## 4. Privacy & Log Auditing During Judging

Per `docs/SECURITY.md` and `docs/RULES.md`:

- **Zero Content Logging**: Backend logs in Vercel and local containers never log raw screenshots, redacted images, goal strings, instructions, or raw IP addresses. Logs contain only metadata: `request_id`, status code, latency (ms), token counts, and cost ($).
- **Ephemeral State**: Guides persist in Supabase EU only when a user explicitly clicks "Share guide" and completes the second privacy confirmation.
- **7-Day TTL**: Guides expire after 7 days. Stored images and records are permanently removed by the daily purge cron.

---

## 5. Daily Maintenance Cron

The Supabase cleanup cron runs daily via Vercel Cron against:
```http
POST /internal/purge
X-Cron-Secret: <PLATFORM_CRON_SECRET>
```

To trigger a manual purge run if needed:
```bash
curl -X POST https://showme-api-xi.vercel.app/internal/purge \
  -H "X-Cron-Secret: $CRON_SECRET"
```

---

## 6. Incident Response & Rollback Procedures

### Scenario A: Meta API Outage or 502/504 Errors
- The client UI handles model timeouts and 5xx errors gracefully with an unalarming notification and a "Try again" prompt.
- Check Meta Model API status. No code change is necessary.

### Scenario B: Web or API Regression During Judging
If an unexpected edge case arises:
1. Identify the last known good commit (e.g. `v1.0.0` release tag).
2. Roll back Vercel deployment:
   - Navigate to the Vercel dashboard for `showme-web` or `showme-api`.
   - Promote the previous production deployment for tag `v1.0.0` with Instant Rollback.
3. Locally:
   ```bash
   git checkout v1.0.0
   make test
   ```

### Scenario C: Vercel Serverless Function Outage
If Vercel Python Functions experience platform degradation:
- The backend has a zero-dependency Dockerfile ready (`backend/Dockerfile`).
- Deploy immediately to Railway or Cloud Run:
  ```bash
  docker build -t showme-backend backend/
  docker run -p 8000:8000 --env-file .env showme-backend
  ```
