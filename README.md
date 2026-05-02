# Silent Witness

**Preserve evidence fingerprints without uploading original files.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Open Source](https://img.shields.io/badge/Open%20Source-%E2%9C%93-brightgreen)](https://github.com)
[![Privacy First](https://img.shields.io/badge/Privacy-First-darkblue)](docs/THREAT_MODEL.md)
[![No File Upload](https://img.shields.io/badge/No%20File%20Upload-%E2%9C%93-green)](docs/PROTOCOL.md)

---

Silent Witness helps witnesses, journalists, local observers, and documentation teams create timestamped fingerprints of evidence when publishing or uploading the original file may be unsafe.

> **Website:** [https://silentwi.com](https://silentwi.com)

---

> **⚠ Critical disclaimer**
>
> Silent Witness **does not prove** that an event happened. It **does not identify** a perpetrator. It **does not guarantee** legal admissibility. It only records a cryptographic fingerprint that can later be compared with an original file to establish that the file existed before a recorded time.

---

## Why This Exists

In conflict zones and high-risk environments, uploading evidence directly to a public platform can endanger witnesses, compromise ongoing investigations, or trigger removal by platforms. Silent Witness allows a person to create a verifiable timestamp of a file's existence without publishing the file itself.

## How It Works

1. **Choose a file** — image, video, audio, document, or written testimony. It stays on your device.
2. **Browser computes SHA-256** — all cryptographic operations happen locally in your browser using the Web Crypto API. Nothing is uploaded.
3. **Submit the fingerprint** — only the hash and safe public metadata are sent to the server. The original never leaves your device.
4. **Reviewer approval** — a reviewer checks that the metadata is safe before the record appears in the public registry.
5. **Verification** — anyone with the original file can later compute its hash and compare it against the registry.

## What It Proves

- That a file with this exact SHA-256 fingerprint existed and was submitted to the registry before `serverReceivedAtUtc`.
- That the fingerprint was not altered after that timestamp.

## What It Does Not Prove

- That an event actually occurred.
- That the file content is authentic or unedited.
- The identity or location of the person who submitted it.
- Legal admissibility in any jurisdiction.
- Anything about a file that was compressed or re-encoded after the original was fingerprinted (see [Exact Hash Limitation](#exact-hash-limitation-and-compression-warning)).

---

## Main Features

- **Local hashing only** — SHA-256 computed in the browser using Web Crypto API. No file upload.
- **Public fingerprint registry** — timestamped, reviewer-approved records.
- **Safe descriptor** — limited metadata (file size bucket, duration bucket, resolution bucket) with no exact coordinates, names, or identifying info.
- **Retraction token** — holders can remove their public record using a token saved in their local proof package.
- **Verification page** — compare a local file against a hash or a manifest.
- **Review dashboard** — admin interface to approve, reject, or hide records before they appear publicly.

---

## Privacy Model

| What is NEVER stored | Notes |
|---|---|
| Original files | Never sent to server |
| Raw filenames | Only SHA-256 of filename is stored |
| Exact GPS coordinates | Only a presence flag ("yes/no") if clearly detected |
| Street addresses | Rejected by server-side validation |
| Names, phone numbers | Rejected by server-side validation |
| IP addresses | Only a truncated salted hash for rate limiting, never linked to records |
| Private notes | Stay in local proof package only |
| Raw retraction token | Only its SHA-256 is stored server-side |

| What IS stored (if user submits) | Notes |
|---|---|
| `packageHash` | SHA-256 of the canonical manifest |
| `originalHash` | SHA-256 of the original file (optional) |
| `eventType` | e.g. killing, detention, displacement |
| `evidenceType` | e.g. video, image, document |
| Country / region / city | Broad location, user-provided |
| Safe descriptor | Size bucket, duration bucket, resolution bucket |
| `createdAtLocal` | Browser clock — unverified, displayed with warning |
| `serverReceivedAtUtc` | Server clock — authoritative timestamp |
| `retractionTokenHash` | SHA-256 of the retraction token |

---

## Threat Model

See [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md) for the full model.

**What the tool protects against:**
- Evidence being retroactively claimed as fabricated after the fact
- Platform compression breaking hash verification (by storing the hash before upload)
- Accidental publication of identifying metadata (server-side validation rejects unsafe content)

**What the tool does NOT protect against:**
- A compromised server disclosing pending record metadata
- A coerced or malicious reviewer exposing submissions
- Network-level interception of the submission request
- A user submitting dangerous metadata themselves

---

## Public Registry Workflow

```
User (browser)                     Server
──────────────                     ──────
1. Select file                     
2. Compute SHA-256 locally         
3. Build manifest                  
4. Submit fingerprint ──────────▶  Sets pending_review
                                   Stores fingerprint + safe metadata
5. Download proof package          
   (includes retraction token)     
                                   Reviewer approves ──▶ public_timestamped_record
                                   Reviewer rejects  ──▶ rejected_for_public_registry
6. Public registry shows           
   only approved records           
```

### Publication Status Vocabulary

| Status | Public? | Meaning |
|---|---|---|
| `pending_review` | No | Submitted, awaiting reviewer |
| `public_timestamped_record` | Yes | Approved — visible in registry |
| `rejected_for_public_registry` | No | Rejected or hidden by reviewer |
| `retracted_by_holder` | No | Holder used retraction token |
| `exact_match_published` | Yes | Later file verified as identical |

---

## Reviewer / Admin Workflow

- Route: `/admin/review`
- Authentication: `ADMIN_REVIEW_PASSWORD` environment variable
- Actions: Approve, Reject (reason required), Hide
- All actions are logged to the `review_actions` table
- Reviewers see only fingerprints and safe metadata — no original files exist

Reviewer approval is a **safety review**, not a truth or authenticity verification.

---

## Verification Workflow

1. Go to `/verify`
2. Select a local file and enter the hash or upload a manifest
3. The browser recomputes the SHA-256 and compares it locally
4. If the hash matches a registry entry, the record metadata is shown
5. If no match is found, a compression warning is displayed

---

## Exact Hash Limitation and Compression Warning

Exact SHA-256 matching only works if the compared file is **byte-for-byte identical** to the original.

Files sent through **WhatsApp, Telegram, Facebook, YouTube**, or other platforms are often compressed or re-encoded, which changes their SHA-256. A non-matching hash does not mean the file is fake — it may have been processed by a platform.

Exact verification requires the unmodified original file.

---

## Deleted Evidence Warning

A SHA-256 hash cannot reconstruct the original file. If the original evidence is deleted, lost, or seized, the hash alone cannot be used to recover it. The proof package must be kept safe.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| API | Express 5 |
| Database | PostgreSQL + Drizzle ORM |
| Validation | Zod (v4) |
| API codegen | Orval (from OpenAPI spec) |
| Crypto | Web Crypto API (browser-side SHA-256) |
| EXIF reading | `exifr` (browser-side, no upload) |
| Monorepo | pnpm workspaces |
| Language | TypeScript 5.9 |

---

## Repository Structure

```
artifacts/
  api-server/        Express 5 backend — serves /api routes
  silent-witness/    React + Vite frontend — serves /
lib/
  api-spec/          OpenAPI spec + Orval codegen config
  api-client-react/  Generated React Query hooks
  api-zod/           Generated Zod validation schemas
  db/                Drizzle ORM schema and client
docs/
  PROTOCOL.md        Full protocol specification
  THREAT_MODEL.md    Threat model
  ROADMAP.md         Planned work
  RELEASE_CHECKLIST.md  Pre-release safety checklist
scripts/             Utility scripts
```

---

## Local Development

**Requirements:** Node.js 20+, pnpm 9+, PostgreSQL

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
# Fill in DATABASE_URL and ADMIN_REVIEW_PASSWORD

# Push database schema
pnpm --filter @workspace/db run push

# Start frontend (port from env)
pnpm --filter @workspace/silent-witness run dev

# Start API server (port from env)
pnpm --filter @workspace/api-server run dev

# Typecheck all packages
pnpm run typecheck

# Regenerate API hooks and Zod schemas from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen
```

---

## Environment Variables

See [.env.example](.env.example) for all variables with comments.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `ADMIN_REVIEW_PASSWORD` | Yes | Password for `/admin/review` dashboard |
| `PUBLIC_APP_ORIGIN` | Prod | Allowed CORS origins (comma-separated) |
| `SESSION_SECRET` | Yes | Session signing secret |
| `PORT` | Yes | API server port |
| `NODE_ENV` | Yes | `development` or `production` |

---

## Database Setup

```bash
# Push schema to development database
pnpm --filter @workspace/db run push

# For production: schema migrations are applied automatically on publish (Replit)
# or run push manually against your production DATABASE_URL
```

---

## Screenshots

| Page | Preview |
|---|---|
| Home | *(screenshot placeholder)* |
| Create Witness Record | *(screenshot placeholder)* |
| Public Registry | *(screenshot placeholder)* |
| Verify Evidence | *(screenshot placeholder)* |
| Review Dashboard | *(screenshot placeholder)* |

---

## Demo Data

The public registry may contain demo records with `isDemo: true`. These records are **fictional** and must not be interpreted as real events.

---

## Deployment Notes

- Deployed on Replit Autoscale
- Production domain: [https://silentwi.com](https://silentwi.com)
- Schema migrations are applied automatically at publish time
- Rate limiting is currently in-memory (resets on restart) — use persistent storage for production at scale
- Set `PUBLIC_APP_ORIGIN` to your production domain in environment variables

---

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md).

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Security

See [SECURITY.md](SECURITY.md).

To report a vulnerability privately, follow the instructions in SECURITY.md. **Do not open a public issue for security vulnerabilities.**

---

## License

[MIT](LICENSE) — Copyright (c) 2026 Silent Witness contributors
