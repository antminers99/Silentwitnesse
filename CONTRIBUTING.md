# Contributing to Silent Witness

Thank you for your interest in contributing. Silent Witness is used by people in high-risk situations. Every change must be evaluated for safety, not just functionality.

---

## Safety-First Rules

Before proposing any change, verify it does not:

- Add any endpoint that accepts or stores original evidence files
- Expose `rejected_by_policy`, `retracted_by_holder`, or any non-public record publicly
- Store exact GPS coordinates, street addresses, full names, phone numbers, or vehicle plates
- Weaken or remove safety warnings shown to users
- Add claims that records prove events, identity, or legal admissibility
- Add tracking, analytics, or any user-behavior telemetry
- Add Telegram, WhatsApp, or other sharing integrations without explicit safety review

If your change touches any of these areas, describe the safety rationale in detail in your pull request.

---

## Setting Up the Repository

**Requirements:** Node.js 20+, pnpm 9+, PostgreSQL

```bash
# Clone and install
git clone <repository-url>
cd silent-witness
pnpm install

# Configure environment
cp .env.example .env
# Fill in DATABASE_URL and SESSION_SECRET

# Push database schema
pnpm --filter @workspace/db run push
```

---

## Running the App

```bash
# Frontend (React + Vite)
pnpm --filter @workspace/silent-witness run dev

# API server (Express 5)
pnpm --filter @workspace/api-server run dev
```

---

## Running Checks

```bash
# Typecheck all packages
pnpm run typecheck

# Build all packages
pnpm run build

# Regenerate API types and Zod schemas after OpenAPI changes
pnpm --filter @workspace/api-spec run codegen
```

---

## Repository Structure

```
artifacts/silent-witness/   React + Vite frontend
artifacts/api-server/       Express 5 API
lib/api-spec/               OpenAPI specification (source of truth)
lib/api-client-react/       Generated React Query hooks (do not edit manually)
lib/api-zod/                Generated Zod schemas (do not edit manually)
lib/db/                     Drizzle ORM schema and client
docs/                       Protocol, threat model, roadmap, release checklist
```

---

## Proposing Changes

1. Fork the repository and create a feature branch.
2. Make your change with tests or verification steps where possible.
3. Run `pnpm run typecheck` and confirm it passes.
4. Fill out the pull request checklist in full.
5. Describe the safety impact of your change.

For larger changes, open an issue first to discuss the approach before writing code.

---

## What We Welcome

- Bug fixes with clear reproduction steps
- Documentation improvements
- Accessibility improvements
- Performance improvements that do not change privacy behavior
- Translations (with careful review of safety-critical text)
- Security hardening

---

## What We Will Not Merge

- Any feature that uploads, stores, or transmits original evidence files
- Any change that weakens safety warnings or removes disclaimers
- Analytics or tracking of any kind
- Claims of legal proof or authenticity guarantees
- Changes that expose non-public records via any endpoint or UI

---

## Code Style

- TypeScript everywhere — no `any` without justification
- Zod for all server-side input validation
- Drizzle ORM for all database access
- Server logs must not include request bodies, user content, or IP addresses in plain form
- No `console.log` in server code — use the `req.log` or `logger` singleton

---

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
