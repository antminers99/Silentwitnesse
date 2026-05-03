# Silent Witness

Privacy-first evidence fingerprinting. Live at **[silentwi.com](https://silentwi.com)**.

## What it does

Silent Witness creates a cryptographic fingerprint (SHA-256) of a file, photo, video, or written testimony entirely inside the user's browser. The original file is never uploaded. Only the fingerprint and safe public metadata may be submitted to the public registry.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Wouter v3 |
| UI | shadcn/ui + Tailwind CSS |
| i18n | react-i18next (19 languages, RTL support) |
| SEO | react-helmet-async |
| QR codes | qrcode.react |
| Backend | Express 5 (artifacts/api-server) |
| Database | PostgreSQL + Drizzle ORM (lib/db) |
| Monorepo | pnpm workspaces |

## Languages

English · العربية · Français · Español · Deutsch · Türkçe · Русский · فارسی · Kurdî · Português · Українська · Italiano · עברית · اردو · हिन्दी · Indonesia · 中文 · 日本語 · 한국어

RTL languages (Arabic, Farsi, Kurdish, Hebrew, Urdu) automatically flip `document.dir` and layout.

## Pages

| Route | Description |
|-------|-------------|
| `/:lang/` | Home |
| `/:lang/create` | Create a witness record |
| `/:lang/verify` | Verify a file against a fingerprint |
| `/:lang/records` | Public registry browser |
| `/:lang/records/:hash` | Individual record detail |
| `/:lang/how-it-works` | Plain-language explanation |
| `/:lang/for-witnesses` | Guide for witnesses |
| `/:lang/for-journalists` | Guide for journalists |
| `/:lang/for-human-rights` | Guide for human rights groups |
| `/:lang/offline` | Offline use instructions |
| `/:lang/share` | QR code + printable poster |
| `/:lang/protocol` | Technical protocol |
| `/:lang/safety` | Safety guide |

Legacy routes (`/create`, `/verify`, etc.) redirect to `/:lang/` automatically.

## Local development

```bash
pnpm install
# Start frontend
pnpm --filter @workspace/silent-witness run dev
# Start API
pnpm --filter @workspace/api-server run dev
```

Or use the Replit workflows.

## SEO

Every page has `<title>`, `<meta name="description">`, Open Graph tags, canonical URLs, and `hreflang` alternate links for all 19 supported languages. `public/sitemap.xml` and `public/robots.txt` are included.

## Privacy model

- All hashing runs client-side in the browser (`SubtleCrypto` / `crypto.subtle`).
- No file bytes are ever sent to the server.
- The server only receives: package hash, event type, evidence type, broad location, quality level, safe descriptor, and retraction token hash.
- The registry stores fingerprints only — not verified truth.

## Reproducibility and verification

SHA-256 is deterministic. The same exact file always produces the same fingerprint. Any file change — including compression, re-encoding, or editing — produces a completely different fingerprint. Verification can be repeated by anyone with the original file.

The registry timestamp shows when the fingerprint was received by the registry server. The frontend cannot set or override this value.

**This proves a file match, not truth of the event.**

**Example:**

> A witness fingerprints `video.mp4` today.  
> The registry records the fingerprint.  
> A month later, the witness shares `video.mp4`.  
> A reviewer calculates the fingerprint again.  
> If it matches, the file is the same file that was fingerprinted earlier.

**Caution:** If the video was sent through WhatsApp, Telegram, Facebook, YouTube, or another platform, the file may be re-encoded and the exact fingerprint may not match. Always keep the original file or an exact safe copy created at the time of fingerprinting.

### Terminology

| Use | Avoid |
|-----|-------|
| "same exact file" | "proves the event" |
| "byte-for-byte match" | "authenticates the incident" |
| "fingerprint-only record" | "verified crime" |
| "not verified truth" | "legal proof" |
| "server-recorded registry timestamp" | "guaranteed authenticity" |
