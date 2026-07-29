# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project does not yet follow a formal versioning scheme (no tagged
releases exist — entries are grouped under the current `package.json`
version).

## [Unreleased]

- Nothing yet.

## [0.1.0] - 2026-07-29

### Added

- Credentials-based auth (NextAuth v5) with role-based routing and
  middleware route protection for eight roles: patient, front desk, doctor,
  nurse, lab, pharmacy, billing, and admin.
- Patient registration, front-desk walk-in intake, duplicate-record
  merging, and allergy tracking.
- Appointment booking with recurring slots and waitlisting, plus
  front-desk queueing with token numbers.
- Doctor consultations with symptoms/diagnosis/notes, prescriptions with
  automatic allergy and drug-interaction warnings, and lab test ordering.
- Lab order lifecycle (ordered → sample collected → in progress →
  completed) with result entry and report file uploads.
- Pharmacy batch stock receiving, low-stock/expiring-soon alerts, and
  FEFO (first-expiry-first-out) dispensing.
- Ward/bed board with admission, bed transfers, and discharge.
- Operation theatre scheduling with double-booking prevention and a
  start/complete/cancel lifecycle.
- Billing module: bill generation from completed consultations
  (consultation fee + completed lab tests + dispensed medicines) and from
  discharged admissions (room/bed charges), manual line items, payments,
  and insurance claims through to settlement.
- Admin dashboard (patients, appointments, bed occupancy, low stock, staff
  by role) and staff account creation.
- Prisma/PostgreSQL schema, migrations, and a seed script with demo data
  and one login per role.
- Project documentation: `README.md`, `CONTRIBUTING.md`,
  `CODE_OF_CONDUCT.md`, `SECURITY.md`, and the MIT `LICENSE`.

[Unreleased]: https://github.com/meenusai838-cyber/HMS/compare/master...HEAD
