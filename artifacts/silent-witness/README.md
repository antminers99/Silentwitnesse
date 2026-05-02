# Silent Witness

Privacy-first evidence fingerprinting. Live at **[silentwi.com](https://silentwi.com)**.

## What it does

Silent Witness creates a cryptographic fingerprint (SHA-256) of a file, photo, video, or written testimony entirely inside the user's browser. The original file is never uploaded. Only the fingerprint and safe public metadata may be submitted to the public registry.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Wouter v3 |
| UI | shadcn/ui + Tailwind CSS |
| i18n | react-i18next (11 languages, RTL support) |
| SEO | react-helmet-async |
| QR codes | qrcode.react |
| Backend | Express 5 (artifacts/api-server) |
| Database | PostgreSQL + Drizzle ORM (lib/db) |
| Monorepo | pnpm workspaces |

## Languages

English · العربية · Français · Español · Deutsch · Türkçe · Русский · فارسی · Kurdî · Português · Українська

RTL languages (Arabic, Farsi, Kurdish) automatically flip `document.dir` and layout.

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

Every page has `<title>`, `<meta name="description">`, Open Graph tags, canonical URLs, and `hreflang` alternate links for all 11 supported languages. `public/sitemap.xml` and `public/robots.txt` are included.

## Privacy model

- All hashing runs client-side in the browser (`SubtleCrypto` / `crypto.subtle`).
- No file bytes are ever sent to the server.
- The server only receives: package hash, event type, evidence type, broad location, quality level, safe descriptor, and retraction token hash.
- The registry stores fingerprints only — not verified truth.
