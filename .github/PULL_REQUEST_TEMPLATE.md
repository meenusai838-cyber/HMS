## What & why

<!-- What does this PR change, and why? Link any related issue. -->

## How was this tested?

<!-- There's no automated test suite yet (see CONTRIBUTING.md), so describe
     the manual steps you took — which role(s)/screen(s) you exercised,
     and with which seeded demo account. -->

## Checklist

- [ ] `npx tsc --noEmit` passes
- [ ] `npm run lint` passes
- [ ] If the Prisma schema changed, a migration is included under `prisma/migrations/`
- [ ] If this adds a new state/record a role should see, `prisma/seed.ts` was updated so it's demo-able out of the box
- [ ] Follows the existing `lib/` → `actions.ts` → `page.tsx` pattern described in [CONTRIBUTING.md](../CONTRIBUTING.md#code-conventions)
