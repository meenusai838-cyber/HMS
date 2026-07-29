# Security Policy

## Project status

This is a demo/learning project (a hospital management system built for
exploring Next.js, Prisma, and NextAuth) and is not deployed as a production
service. There are no supported release branches — security fixes are made
against `master`.

## Reporting a vulnerability

If you find a security issue, please **do not open a public GitHub issue**.
Instead, email **meenusai838@gmail.com** with:

- A description of the issue and its potential impact
- Steps to reproduce, or a proof of concept if you have one
- Any suggested fix, if you have one

You should get an initial response within a few days. There's no formal SLA
given this is a personal project, but reports will be taken seriously and
fixed promptly.

## Scope

Given the nature of the project, the most relevant classes of issue are:

- Authentication/authorization bypass (e.g. reaching a role's routes or
  Server Actions without `requireRole` catching it)
- Data exposure across patients/roles that shouldn't be able to see each
  other's records
- Injection issues in any raw query paths
- Vulnerabilities in direct dependencies (`npm audit`)

## Before deploying this anywhere real

This repo ships with development conveniences that are **not safe for a real
deployment**:

- `prisma/seed.ts` creates demo accounts (patients, every staff role) with the
  password `password123` — change or remove these before using real data.
- `.env.example` uses a placeholder `AUTH_SECRET` and a trivial local
  Postgres password — generate a real secret and credentials for any
  non-local environment (see the [README](./README.md#getting-started)).
- There is no rate limiting on login or other endpoints.

Treat this as a starting point to harden, not a production-ready system.
