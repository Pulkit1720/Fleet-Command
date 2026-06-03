# Fleet Command

> A full-stack field service management platform — dispatch technicians, track jobs in real time, and verify on-site work with location-proofed status updates.

Fleet Command is an end-to-end system I designed and built across **web, mobile, and backend**: admins assign and monitor jobs from a live dashboard, technicians action those jobs from a native mobile app, and every status change is verified against the job's physical location.

<!-- TODO: add hero screenshot / demo GIF here -->
<!-- ![Fleet Command dashboard](docs/screenshots/dashboard.png) -->

<p align="center">
  <em>🔗 Live demo: coming soon &nbsp;·&nbsp; 📱 Mobile build: coming soon</em>
</p>

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Backend** | Node.js, Express, Supabase (PostgreSQL) |
| **Web Admin** | Next.js 16 (App Router), React 18, Tailwind CSS, Mapbox GL |
| **Mobile** | React Native (Expo), Expo Router, React Native Maps |
| **Auth** | Supabase Auth — PKCE flow, invite-based onboarding |
| **Infra** | Google Cloud Run (`asia-south2`), EAS Build, Nodemailer (Gmail SMTP) |
| **Testing** | Vitest (backend + web), Jest (mobile) |

Architected as a monorepo with three independently deployable packages — `backend/`, `web-admin/`, and `mobile-app/` — sharing a single Supabase database.

---

## Highlights

### 🛰️ Truth Engine — location-verified job updates
The standout feature. Before a technician can mark a job *In Progress* or *Completed*, the backend confirms they are physically on-site. It computes the distance between the technician's GPS coordinates and the job address using the **Haversine formula**, enforces a **200-metre geofence**, and writes an immutable audit log of every action — recorded coordinates, distance from site, and whether it fell inside the geofence. The result: trustworthy proof-of-work, not just a tapped button.

### 🗺️ Live dispatch map
A Mapbox-powered dashboard plots every job by location with priority colour-coding, giving admins an at-a-glance view of the field.

### 📋 Full job lifecycle
Jobs flow through a clear state machine — `Pending → Assigned → In Progress → Completed` — with admins creating and assigning work and technicians actioning it from mobile.

### ✉️ Invite-based onboarding
Admins invite technicians by email; technicians set their own password via a secure link and sign in on the mobile app. Built on Supabase Auth's PKCE flow.

### 📍 Address autocomplete
Mapbox geocoding turns free-text addresses into precise coordinates at job-creation time — which is what makes the Truth Engine's geofencing possible.

<!-- TODO: add feature screenshots -->
<!-- | Live map | Job detail (mobile) | Truth Engine log | -->
<!-- |---|---|---| -->
<!-- | ![](docs/screenshots/map.png) | ![](docs/screenshots/job.png) | ![](docs/screenshots/truth.png) | -->

---

## How It Works

```
            ┌──────────────────┐         ┌──────────────────┐
            │   Web Admin       │         │   Mobile App      │
            │   (Next.js)       │         │   (React Native)  │
            │                   │         │                   │
            │ • Create & assign │         │ • View jobs       │
            │ • Live job map    │         │ • Update status   │
            │ • Invite techs    │         │ • GPS check-in    │
            └─────────┬─────────┘         └─────────┬─────────┘
                      │                             │
                      │           REST API          │
                      └──────────────┬──────────────┘
                                     │
                          ┌──────────▼──────────┐
                          │   Backend (Express)  │
                          │ • Auth middleware    │
                          │ • Truth Engine       │
                          │ • Geocoding          │
                          │ • Invite emails      │
                          └──────────┬───────────┘
                                     │
                          ┌──────────▼──────────┐
                          │  Supabase (Postgres) │
                          │  + Supabase Auth     │
                          └──────────────────────┘
```

### Roles

**Admin** — signs into the web dashboard to create and assign jobs, invite technicians, and monitor the live map and stats.

**Technician** — accepts an email invite, sets a password, then uses the mobile app to view assigned jobs and update their status. Location is captured and verified on every status change.

---

## Repository Layout

```
fleet-command/
├── backend/      Node.js + Express REST API
│   └── src/
│       ├── controllers/   Route handlers (jobs, technicians)
│       ├── middleware/    Auth, error handling
│       ├── routes/        Express routers
│       └── services/      Geocoding, Truth Engine, email
│
├── web-admin/    Next.js admin dashboard
│   └── src/
│       ├── app/           App Router pages (dashboard, auth, login)
│       ├── components/    UI components
│       └── lib/           API & Supabase clients
│
├── mobile-app/   Expo React Native technician app
│   ├── app/               Expo Router screens (tabs, job detail, auth)
│   ├── components/        Shared components
│   ├── context/           Auth context
│   └── lib/               API client, types
│
└── database/     Supabase SQL schema
```

---

## What I Learned / Built

- Designed a **three-surface product** (web, mobile, API) sharing one auth system and database.
- Implemented **geospatial verification** from scratch — Haversine distance + geofencing — to solve a real trust problem in field service.
- Built **invite-based, role-aware auth** on Supabase's PKCE flow spanning browser and native clients.
- Shipped a **deployable monorepo** with CI-friendly test suites (Vitest + Jest) across all three packages.

---

<p align="center"><sub>Built by Pulkit Bhatia · field service management, end to end.</sub></p>
