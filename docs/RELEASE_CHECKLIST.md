# Release Checklist

Use this checklist before every public release or deployment.

---

## Privacy and Safety — Blocking

- [ ] No endpoint accepts multipart/form-data or base64-encoded file content
- [ ] JSON body limit is enforced (currently 100 kb)
- [ ] `rejected_by_policy`, `retracted_by_holder` records return 404 on the public `/records/:hash` endpoint
- [ ] Quality D records are rejected with a 400 error at POST `/records`
- [ ] `status` field is set server-only — not accepted from client
- [ ] `publicationStatus` is set server-only — always `accepted_public` for records that pass policy checks
- [ ] `qualityLevel` is computed server-only — not accepted from client
- [ ] `serverReceivedAtUtc` is set server-only — not accepted from client
- [ ] Public copy sanitization is correct — `fileHashes`, exact `sizeBytes`, `nameHash`, `privateNote`, `retractionToken`, and raw manifest internals are excluded from the copy-public output
- [ ] EXIF uncertain fields are omitted — `gpsMetadataDetected` and `exifMetadataDetected` are only stored if confirmed
- [ ] Resolution stored as bucket (`low`/`medium`/`high`), not exact dimensions
- [ ] Server-side validation rejects phone numbers, GPS coordinate patterns, URLs, email addresses, street addresses, vehicle plates, and violent language in location fields
- [ ] Retraction token is never stored server-side (only its SHA-256 is stored)
- [ ] Retraction uses `crypto.timingSafeEqual` for token comparison
- [ ] Retraction attempts are rate-limited (5 per package hash per 15 minutes)
- [ ] Private note is never sent to server (stays in local proof package only)
- [ ] No Telegram, WhatsApp, or other direct-share integration
- [ ] No blockchain claims unless OpenTimestamps is actually implemented

---

## Security — Blocking

- [ ] `SESSION_SECRET` is set as a secret
- [ ] CORS is restricted to `PUBLIC_APP_ORIGIN` allowlist in production
- [ ] `PUBLIC_APP_ORIGIN` is set for the production deployment
- [ ] HTTPS is enforced in production
- [ ] `.env` files are not committed to the repository (check `.gitignore`)
- [ ] `helmet` security headers are applied to all API responses
- [ ] Global error handler is in place (no stack traces leak to clients)
- [ ] Rate limiting is active on POST `/records` (10/IP/hour)

---

## Documentation — Blocking

- [ ] `SECURITY.md` is present and up to date
- [ ] `.env.example` is present with all required variables
- [ ] `README.md` includes the critical disclaimer
- [ ] Threat model reflects current implementation
- [ ] Any new environment variables are documented in `.env.example` and `README.md`

---

## Operational — Blocking

- [ ] `pnpm run typecheck` passes with no errors
- [ ] `pnpm run build` completes successfully
- [ ] Database schema is up to date in production
- [ ] All required environment secrets are configured in the production environment

---

## Pre-Launch Recommended (Not Blocking for MVP)

- [ ] External security review completed
- [ ] Rate limiting is persistent (not in-memory only)
- [ ] Screenshots in README are up to date
- [ ] Demo records are marked `isDemo: true` and documented as fictional

---

## After Release

- [ ] Monitor deployment logs for unexpected errors
- [ ] Submit one test record and verify it appears immediately in the registry
- [ ] Verify retraction flow works end-to-end
- [ ] Verify verification page shows compression warning on a mismatched file
- [ ] Confirm rejected_by_policy response for a Quality D submission
