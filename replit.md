# Silent Witness

## Overview

Silent Witness is a privacy-first evidence fingerprinting tool. It allows users to create cryptographic fingerprints (SHA-256 hashes) for files, videos, audio, documents, and written testimony — entirely in the browser, without ever uploading original files to any server.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS (artifacts/silent-witness)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Crypto**: Web Crypto API (SHA-256, browser-side only)
- **EXIF reading**: `exifr` (browser-side, no upload)

## Privacy Model

**What is NEVER stored:**
- Original files (images, videos, audio, documents)
- Raw filenames (only SHA-256 of filename is stored)
- GPS coordinates
- Exact locations (street level)
- Victim/witness/suspect names
- Phone numbers
- Any personally identifying information

**What IS stored (only if user explicitly submits):**
- SHA-256 fingerprint (package hash)
- Event type (kidnapping, detention, etc.)
- Evidence type (video, image, etc.)
- Country / region / city (broad location only)
- Safe descriptor metadata (file size bucket, duration bucket, GPS presence flag — not coordinates)
- Timestamp (UTC)
- Quality level (A/B/C)

## Architecture

```
artifacts/
  api-server/        — Express 5 backend, serves /api routes
  silent-witness/    — React + Vite frontend, serves /
lib/
  api-spec/          — OpenAPI spec + orval codegen config
  api-client-react/  — Generated React Query hooks
  api-zod/           — Generated Zod validation schemas
  db/                — Drizzle ORM schema + client
```

## Pages

- `/` — Home: explanation of how the tool works, primary action buttons
- `/create` — Create Witness Record: 3-step flow (type selection → safe context → generate record)
- `/verify` — Verify Evidence: compare local file hash against published fingerprint or manifest JSON
- `/records` — Public Registry: table of submitted public fingerprints with filters
- `/protocol` — Protocol paper: full explanation of what the tool does and does not prove
- `/safety` — Safety guide: field-safety advice for witnesses and journalists

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## API Endpoints

- `GET /api/healthz` — health check
- `GET /api/records` — list public records (filterable by country, region, eventType, etc.)
- `POST /api/records` — submit a new public fingerprint (safe metadata only)
- `GET /api/records/stats` — aggregate stats for the registry
- `GET /api/records/:packageHash` — fetch a specific record by hash

## Safety & Spam Controls

- Honeypot field on submission form (blocks simple bots)
- Rate limiting: 10 submissions per IP per hour
- Server-side validation: rejects phone numbers, GPS coords, violent language in public notes
- Duplicate hash detection: same packageHash cannot be submitted twice
- Quality D records are hidden by default from the public registry

## Database Tables

- `witness_records` — public fingerprint records
- `rate_limit` — IP-based rate limiting (in-memory for MVP)

## Demo Records

Three demo records are seeded, clearly marked with `is_demo: true` and public warnings reading "DEMO RECORD — NOT REAL." They cannot be mistaken for real records.

## Limitations

- Fingerprints cannot recover deleted files — the original must be kept by the holder
- This MVP does not anchor to OpenTimestamps or any blockchain
- The tool does not prove guilt, truth, or that an event occurred
- GPS metadata presence is detected but coordinates are never displayed or stored

## Future Work

- Daily Merkle root anchoring to OpenTimestamps
- Encrypted local proof package export
- Multi-language UI
- Verified status via submitted and independently verified evidence
