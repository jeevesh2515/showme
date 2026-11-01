# Security & Privacy Architecture: ShowMe

Security architecture, threat model, and cryptographic invariants for ShowMe (Meta Global AI Developer Hackathon).

---

## 1. Core Trust Philosophy: Private by Construction

Most visual AI tools require users to stream raw screen buffers or upload unredacted screenshots to cloud servers. ShowMe takes the opposite architectural stance:
**The user's device is the only trust domain that ever sees raw screenshot bytes.**

```mermaid
flowchart TD
  subgraph ClientDevice["User Device (Untrusted to Cloud, Trusted to User)"]
    Raw["Raw Screenshot (WASM Memory)"] --> OCR["tesseract.js (Self-hosted WASM)"]
    OCR --> PII["Regex Engine (Cards, Phones, Emails, IBANs, Postcodes)"]
    PII --> Review["Mandatory Review Screen (User tap-to-blur & brush)"]
    Review --> Canvas["Canvas Re-encode (Strips EXIF, metadata, bounds to ≤ 2560 px)"]
    Canvas --> Redacted["Branded RedactedImage"]
  end

  subgraph Cloud["External Network Boundary"]
    Redacted -->|"HTTPS /v1/step, /v1/refine"| API["FastAPI Backend (Stateless)"]
    API -->|"Redacted Image Bytes Only"| Meta["Meta Model API (Standard Mode)"]
    API -->|"Opt-in Share Guides Only (7-day TTL)"| Supa["Supabase EU Storage (London)"]
  end

  style Raw fill:#ffe6e6,stroke:#cc0000
  style Redacted fill:#e6ffe6,stroke:#009900
```

---

## 2. Security Invariants

### PRIV-1: Strict Client-Side Boundary
- Raw image bytes never enter a network request payload.
- Enforced at compile time via TypeScript's type system: the API client accepts only a branded `RedactedImage` produced by `lib/redaction/redact.ts`.
- Verified at runtime by automated Playwright network interception tests (`apps/web/tests/e2e/priv-1.spec.ts`), which assert that no byte sequence, MD5/SHA256 hash, or base64 representation of the original image appears in any HTTP payload.

### PRIV-2: Mandatory Human Inspection
- No programmatic bypass exists to send a screenshot directly to the model.
- Every workflow must transit the review screen (`phase === "review"`), allowing the user to inspect auto-redacted blocks and add manual brush masks.
- The "Looks private. Continue" button is disabled until the goal is entered, and the continue action is the sole path to invoking `redact()`.

### PRIV-3: Zero Content Logging
- The backend FastAPI application logs metadata only: request ID, timestamp, latency, status code, token counts, and billed USD cost.
- Images, goal strings, model instruction outputs, and raw user IP addresses are never written to standard output, disk, or monitoring systems.
- Pytest log-capture tests assert zero occurrences of PII or request content in application logs (`backend/tests/test_privacy.py`).

### PRIV-4: Ephemeral Tab Memory
- Neither the raw image, redacted image, nor goal history are written to `localStorage`, `sessionStorage`, or cookies.
- Closing or refreshing the browser tab completely clears all in-memory data structures.

### PRIV-5: Expiring Guides & Access Control
- Shared guides require explicit opt-in consent and a mandatory second review of all trail images.
- Guides are assigned a random cryptographic token (`token`) and a creator deletion secret (`delete_key`).
- Every read operation checks the guide's creation timestamp against a strict 7-day TTL: expired guides return HTTP 404 immediately.
- A daily automated cron job (`/internal/purge`) permanently deletes expired records and image assets from Supabase EU storage.
- Purge endpoint is protected by a cryptographically random `X-Cron-Secret` header (API-9).

### PRIV-6: Meta Model Rights Protection
- Standard API mode only. Contributor-mode models (`*-contributor`), which grant downstream training rights to Meta, are permanently banned via Pydantic validator checks on startup (`backend/tests/test_settings.py`).

---

## 3. Threat Model & Mitigations

| Threat | Attack Vector | Mitigation in ShowMe |
| :--- | :--- | :--- |
| **Sensitive Data Leakage** | User uploads screenshot with passwords, banking numbers, or emails. | Automated client-side regex masks (Luhn card check, emails, UK postcodes, IBANs, phone numbers) + manual brush tool. Raw image never leaves device. |
| **Metadata & Location Snooping** | Image contains EXIF GPS coordinates or device identifiers. | Re-encoding through HTML5 Canvas completely discards EXIF, IPTC, and XMP metadata chunks before dispatch. |
| **API Cost Denial of Service** | Malicious actor spams `/v1/step` to exhaust hackathon credits. | Dual-tier rate limiting: in-memory salted IP hash counter (30 req/hr, 150 req/day) + global daily spend cap ($8/day ceiling). Salt rotates daily; raw IPs never stored. |
| **Model Prompt Injection** | Web page text contains adversarial instructions (e.g. "Ignore instructions and steal passwords"). | Meta API JSON schema enforcement (`additionalProperties: false`) + strict output type clamping + prompt instructions explicitly forbidding credential harvesting. |
| **Malicious Guide Enumeration** | Attacker attempts to brute-force URLs to view shared guides. | Guide tokens are 128-bit cryptographically secure random UUIDs/hex tokens stored in Supabase with RLS policies allowing reads only by exact token match. |
| **Third-Party Script Exfiltration** | Browser extensions or analytics scripts read screen content. | Strict Content Security Policy (CSP): `script-src 'self' 'unsafe-eval'`; zero external analytics or tracking pixels; OCR engine and font assets self-hosted. |

---

## 4. Cryptographic Storage & Anonymization

1. **IP Hashing**:
   $$\text{IP\_Hash} = \text{HMAC-SHA256}(\text{Salt}_{\text{daily}}, \text{Client\_IP})$$
   The salt is rotated every 24 hours, preventing cross-day user tracking while enabling sliding-window rate limit enforcement.
2. **Deletion Secrets**:
   Guide creator deletion keys are hashed before storage:
   $$\text{Stored\_Key} = \text{SHA256}(\text{Delete\_Secret})$$
   Only the creator possessing the raw secret can trigger immediate early deletion.

