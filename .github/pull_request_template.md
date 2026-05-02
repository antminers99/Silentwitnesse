## Summary

Describe what this pull request changes and why.

---

## Safety and Privacy Checklist

All items must be confirmed before this PR can be merged.

- [ ] Does not add any endpoint that accepts or stores original evidence files
- [ ] Does not expose `pending_review`, `rejected_for_public_registry`, or `retracted_by_holder` records publicly
- [ ] Does not store exact GPS coordinates, full names, phone numbers, vehicle plates, or precise locations
- [ ] Does not weaken or remove safety warnings shown to users
- [ ] Does not add claims that records prove events, identity, or legal admissibility
- [ ] Does not add tracking, analytics, or user-behavior telemetry
- [ ] Does not add Telegram, WhatsApp, or other direct-share integrations without safety review

---

## Code Quality Checklist

- [ ] `pnpm run typecheck` passes
- [ ] `pnpm run build` passes
- [ ] If OpenAPI spec was changed: `pnpm --filter @workspace/api-spec run codegen` was run and generated files are committed
- [ ] If database schema was changed: migration or schema push is documented
- [ ] Docs updated if behavior changed (`docs/` or `replit.md`)

---

## Test Coverage

- [ ] Tested create flow end-to-end (file → hash → submit)
- [ ] Tested verify flow (matching and non-matching file)
- [ ] Tested public registry (only approved records shown)
- [ ] Tested admin review dashboard (approve / reject / hide)
- [ ] Tested retraction flow if relevant

---

## Notes for Reviewer

Any additional context, screenshots (no real evidence), or areas to focus on during review.
