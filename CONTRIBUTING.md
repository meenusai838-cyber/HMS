# Contributing

Thanks for considering a contribution to HMS. This is a small project, so the process is lightweight — just keep it consistent with what's already here.

## Getting set up

Follow the [README](./README.md#getting-started) to get a local instance running against Docker Postgres with seeded demo data before making changes.

## Before opening a PR

There's no CI configured yet, so please run these locally and make sure they're clean:

```bash
npx tsc --noEmit
npm run lint
```

There's no automated test suite. If you're changing behavior in `src/lib/*`, manually exercise the affected flow through the UI (or a throwaway script) with the seeded demo accounts before submitting.

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
