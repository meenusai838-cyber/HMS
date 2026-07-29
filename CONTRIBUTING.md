# Contributing

Thanks for considering a contribution to HMS. This is a small project, so the process is lightweight — just keep it consistent with what's already here.

## Getting set up

Follow the [README](./README.md#getting-started) to get a local instance running against Docker Postgres with seeded demo data before making changes.

## Badges

The badges at the top of the [README](./README.md) are all live and mean:

| Badge | What it shows |
| --- | --- |
| CI | Pass/fail of the [`ci.yml`](./.github/workflows/ci.yml) workflow's most recent run on `master` — lint, typecheck, tests, and a full build against a real Postgres database. |
| Open Issues | Current count of open issues. |
| Open Pull Requests | Current count of open PRs. |
| Stars / Forks | GitHub's live star/fork counts for the repo. |
| Top Language | GitHub's language-detection badge (dominant language by bytes, i.e. TypeScript). |
| License | Links to [`LICENSE`](./LICENSE) (MIT). |

There's currently no coverage badge — Codecov isn't connected yet (see the CI workflow's `codecov-action` step, which no-ops without a token). Feel free to wire it up (see [Codecov](https://app.codecov.io)) if you want to pursue that.

## Before opening a PR

CI (`.github/workflows/ci.yml`) runs lint, typecheck, and tests on every push/PR to `master`, plus a full build against a real Postgres database. Run the same checks locally before pushing:

```bash
npx tsc --noEmit
npm run lint
npm test
```

If you're changing behavior in `src/lib/*`, add or update a test in the corresponding `*.test.ts` file where practical (see the existing `roles.test.ts`, `validation.test.ts`, and `billing.test.ts` for the pattern — pure logic only, no live database in tests yet). For anything that does need a database, manually exercise the affected flow through the UI with the seeded demo accounts before submitting.

## Code conventions

The codebase follows one consistent pattern per feature — please match it rather than introducing a new one:

- **`src/lib/<domain>.ts`** — server-only business logic and Prisma queries for a domain (e.g. `billing.ts`, `pharmacy.ts`, `ward.ts`). Custom error classes (e.g. `BillClosedError`) are thrown here and caught in the action layer.
- **`src/app/<role>/.../actions.ts`** — `"use server"` Server Actions. They call `requireRole(...)` first, validate input with a Zod schema from `src/lib/validation.ts`, call into `src/lib/<domain>.ts`, then `revalidatePath(...)`.
- **`src/app/<role>/.../page.tsx`** — server component that calls `requireRole(...)`, loads data, and renders inside `<RoleShell>`.
- **Client forms** are small, colocated components (e.g. `payment-form.tsx`) using `useActionState` against the action above.

Other conventions worth keeping:

- Money and other numeric inputs from forms are validated with `z.coerce.number()` in `validation.ts`, not parsed by hand in actions.
- Role checks always go through `requireRole`/`requireSession` in `src/lib/dal.ts` — never check `session.user.role` inline.
- Add new nav links to `src/app/_nav.ts` rather than hardcoding them in a page.
- If a change adds new demo-able data (a new module, a new status an existing record can reach), add corresponding rows to `prisma/seed.ts` so the feature has something to show out of the box, following the existing "skip if already exists" pattern in that file.

## Database changes

Schema changes go through Prisma migrations, not manual SQL:

```bash
npx prisma migrate dev --name <short-description>
```

Commit the generated `prisma/migrations/**` folder along with your schema change.

## Commit messages

Write them in the imperative mood and explain *why*, not just *what* (the diff already shows what changed):

```
Add insurance claim approval workflow to billing

Claims were stuck at SUBMITTED with no way to record the payer's
decision, so bills couldn't be reconciled after a claim was resolved.
```

## Opening a PR

Keep PRs scoped to one feature or fix. Describe what changed and, if it's not obvious, why — and note any manual testing you did, since there's no test suite to point to.
