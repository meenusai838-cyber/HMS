# HMS — Hospital Management System

[![CI](https://github.com/meenusai838-cyber/HMS/actions/workflows/ci.yml/badge.svg)](https://github.com/meenusai838-cyber/HMS/actions/workflows/ci.yml)
[![Open Issues](https://img.shields.io/github/issues/meenusai838-cyber/HMS)](https://github.com/meenusai838-cyber/HMS/issues)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

A full-stack hospital management system built with Next.js (App Router), Prisma, PostgreSQL, and NextAuth. It covers the day-to-day workflow of a small hospital across eight role-based portals: patient, front desk, doctor, nurse, lab, pharmacy, billing, and admin.

## Features

- **Auth & roles** — credentials-based login (NextAuth v5) with per-role routing and route protection via middleware.
- **Patients** — self-registration, front-desk walk-in intake, duplicate-record merging, allergy tracking.
- **Appointments** — booking with recurring slots, waitlisting, emergency/walk-in flags, front-desk queueing with token numbers.
- **Consultations** — symptoms/diagnosis/notes, prescriptions with automatic allergy and drug-interaction warnings, lab test ordering.
- **Lab** — order lifecycle (ordered → sample collected → in progress → completed), result entry, report file uploads.
- **Pharmacy** — batch stock receiving, low-stock/expiring-soon alerts, FEFO (first-expiry-first-out) dispensing.
- **Wards** — bed board, admission, bed transfers, discharge.
- **Operation theatre** — surgery scheduling with double-booking prevention, start/complete/cancel lifecycle.
- **Billing** — bill generation from completed consultations (consultation fee + completed lab tests + dispensed medicines) and from discharged admissions (room/bed charges), manual line items, payments, and insurance claims through to settlement.
- **Admin** — hospital-wide dashboard (patients, appointments, bed occupancy, low stock, staff by role) and staff account creation.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, Server Actions, Turbopack)
- [Prisma](https://www.prisma.io) + PostgreSQL
- [NextAuth v5](https://authjs.dev) (credentials provider)
- Tailwind CSS + [Base UI](https://base-ui.com) components (shadcn-style)
- Zod for validation

## Prerequisites

- Node.js 20+
- Docker (for the local PostgreSQL database), or a PostgreSQL 16 instance of your own

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   Copy the example file and fill in the values:

   ```bash
   cp .env.example .env
   ```

   Generate a real `AUTH_SECRET` and paste it in:

   ```bash
   openssl rand -base64 32
   # or, without openssl:
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

3. **Start PostgreSQL**

   A ready-to-use Postgres container is defined in `docker-compose.yml`:

   ```bash
   docker compose up -d
   ```

   This starts Postgres on `localhost:5432` with the credentials already matching `.env.example` (`hms` / `hms`, database `hms`). If you're pointing at your own database instead, update `DATABASE_URL` accordingly.

4. **Apply the schema**

   ```bash
   npx prisma migrate deploy
   ```

   (Use `npx prisma migrate dev` instead if you plan to make schema changes locally.)

5. **Seed demo data**

   ```bash
   npm run db:seed
   ```

   This creates one login per role plus sample patients, medicines, lab tests, wards, and a couple of in-progress records (an admitted patient, a billed consultation) so every screen has data to show.

6. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Demo accounts

All seeded accounts use the password `password123`.

| Role | Email |
| --- | --- |
| Admin | `admin@hms.dev` |
| Front desk | `frontdesk@hms.dev` |
| Doctor | `dr.patel@hms.dev`, `dr.kim@hms.dev`, `dr.garcia@hms.dev` |
| Nurse | `nurse@hms.dev` |
| Lab | `lab@hms.dev` |
| Pharmacy | `pharmacy@hms.dev` |
| Billing | `billing@hms.dev` |
| Patient | `john.doe@hms.dev`, `jane.smith@hms.dev` |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | Lint the codebase |
| `npm run db:seed` | Seed the database with demo data |
| `npx prisma studio` | Browse the database in Prisma's GUI |
| `npx prisma migrate dev` | Create/apply a migration during development |

## Project structure

```
prisma/            Schema, migrations, seed script
src/app/           Routes, grouped by role (admin, doctor, nurse, lab, pharmacy, billing, front-desk, patient)
src/components/    Shared UI (shadcn/Base UI components) and layout shell
src/lib/           Server-only business logic per domain (patients, appointments, consultations, lab, pharmacy, ward, theatre, billing, auth)
```

Each route directory follows the same pattern: a server-rendered `page.tsx` that loads data and calls into `src/lib/*`, an `actions.ts` with the route's Server Actions, and small client components for interactive forms.
