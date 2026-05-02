# Silent Witness Roadmap

---

## Current MVP (v0.1)

Implemented and deployed at [silentwi.com](https://silentwi.com).

- [x] Local SHA-256 hashing via Web Crypto API — no file upload
- [x] Automatic policy-based publication — accepted or rejected immediately, no manual review
- [x] Retraction token — holder can remove public record
- [x] Verification page — compare local file against hash or manifest
- [x] Safe descriptor — limited metadata, no exact coordinates or names
- [x] Quality level enforcement — Quality D records rejected automatically
- [x] Server-side safety validation — rejects phone numbers, GPS patterns, violent language, PII in location fields
- [x] Rate limiting — 10 submissions/IP/hour; 5 retraction attempts/hash/15 min
- [x] Honeypot field — reduces automated spam
- [x] Proof package download — full private manifest with retraction token
- [x] Public copy sanitization — public summary excludes fileHashes, sizeBytes, privateNote, retractionToken
- [x] EXIF detection — GPS and EXIF presence flags (only if confidently detected)
- [x] Compression warning on verification mismatch
- [x] Protocol page and safety guide
- [x] Helmet security headers — X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security, Referrer-Policy

---

## Near Term

Security and operational hardening before wider use.

- [ ] Persistent rate limiting — replace in-memory rate limit map with DB-backed or Redis-backed storage
- [ ] External security review — independent audit of server-side validation and metadata handling
- [ ] CORS tightening — strict origin allowlist enforced in all deployment configurations
- [ ] Offline packaging improvement — clear offline-capable notice and Service Worker for create/verify flows
- [ ] Screenshot documentation — add real screenshots to README
- [ ] Localization infrastructure — Arabic and other languages for high-risk users

---

## Future

Longer-term features under consideration. Not committed.

- [ ] OpenTimestamps / Merkle root anchoring — optional cryptographic anchoring to a public blockchain for stronger timestamp proof (no blockchain in current MVP)
- [ ] Self-hosting package — Docker or single-binary deployment for organizations
- [ ] Public API documentation — OpenAPI spec published at `/api/docs`
- [ ] Perceptual hashing — fuzzy matching for compressed copies of the same media (research stage)
- [ ] Safe copy export — export a stripped copy of a file with sensitive EXIF removed
- [ ] Evidence expiry — optional TTL for records that should not remain indefinitely

---

## Not Planned

Features that will not be added to protect the privacy model.

- File upload (original evidence) — will never be added
- Telegram share button — removed in v0.1
- GPS map visualization — would reveal precise location patterns
- Email notifications — requires collecting contact information
- Public comments on records — would create a moderation burden and safety risk
- Social login — reduces anonymity
- Admin review dashboard — records are accepted or rejected by automatic policy only

---

## Notes

- The roadmap is subject to change based on security review findings.
- No feature will be added that requires storing original evidence files.
- No blockchain anchoring is present in the current MVP. If implemented in future, it will be clearly documented.
