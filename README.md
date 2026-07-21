# Fleet Coordinate

Live Link: fleetcd.com


Full-stack field service management platform to dispatch technicians, track jobs in real time, and verify on-site updates with location checks.

Fleet Coordinate includes:
- `web-admin/`: admin dashboard for job creation, assignment, dispatch map, and technician management.
- `mobile-app/`: technician app to view assigned jobs and update status from the field.
- `backend/`: Express API with auth, business rules, geofencing checks, and email invites.

## Key Features

- Truth Engine geofencing: validates technician coordinates before allowing `In Progress` or `Completed` updates.
- Full job lifecycle: `Pending -> Assigned -> In Progress -> Completed`.
- Live dispatch map: Mapbox-powered admin view of job locations and priorities.
- Invite-based onboarding: admin can invite technicians and trigger secure password setup links.
- Shared Supabase backend: PostgreSQL + Auth used across web, mobile, and API.

## Tech Stack

- Backend: Node.js, Express, Supabase, Nodemailer
- Web Admin: Next.js (App Router), React, Tailwind, Mapbox GL
- Mobile: React Native (Expo), Expo Router, React Native Maps
- Auth: Supabase Auth with invite-based flow
- Testing: Vitest (backend + web), Jest (mobile)

## Architecture

```
Web Admin (Next.js) ----\
                         >---- Backend API (Express) ---- Supabase (Postgres + Auth)
Mobile App (Expo) -----/
```

Admins work from the web dashboard, technicians use the mobile app, and all state changes are enforced by backend rules before being written to Supabase.

## Prerequisites

- Node.js `>= 22`
- npm
- A Supabase project (URL, anon key, service role key)
- Mapbox access token
- SMTP credentials for invite emails
- Expo tooling (Expo Go app or Android/iOS emulator) for mobile testing

## Local Setup

1) Clone and install dependencies:

```bash
git clone https://github.com/Pulkit1720/Fleet-Command.git
cd Fleet-Command
npm install
npm --prefix backend install
npm --prefix web-admin install
npm --prefix mobile-app install
```

2) Configure environment variables:

- Create root `.env` for mobile app values:

```env
EXPO_PUBLIC_API_URL=http://localhost:4000
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

- Create `backend/.env`:

```env
PORT=4000
CORS_ORIGINS=http://localhost:3000,http://localhost:8081
SUPABASE_URL=your-supabase-url
SUPABASE_SECRET_KEY=your-supabase-service-role-key
SUPABASE_ANON_KEY=your-supabase-anon-key
MAPBOX_ACCESS_TOKEN=your-mapbox-token
WEB_ADMIN_URL=http://localhost:3000
SMTP_HOST=your-smtp-host
SMTP_PORT=465
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
INVITE_FROM_ADDRESS=your-from-address@example.com
```

3) Initialize database schema in Supabase using:
- `database/schema.sql`
- `database/update.sql` (if applicable)

## Running the Project

From the repository root:

```bash
# web-admin (http://localhost:3000)
npm run dev:web

# backend (http://localhost:4000)
npm run dev:backend

# mobile (Expo dev server)
npm run dev:mobile
```

You can also run `npm run dev` to start web-admin only.

## Testing

From root:

```bash
npm test
npm run test:coverage
```

Per package:

```bash
npm --prefix backend run test
npm --prefix web-admin run test
npm --prefix mobile-app run test
```

## Repository Layout

```
Fleet-Command/
├── backend/
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── routes/
│       ├── services/
│       └── utils/
├── web-admin/
│   └── src/
│       ├── app/
│       ├── components/
│       ├── layout/
│       └── lib/
├── mobile-app/
│   ├── app/
│   ├── components/
│   ├── context/
│   └── lib/
└── database/
```

## Build Artifacts

- Latest Android build artifact is currently tracked at `mobile-app/builds/fleet-coordinate.apk`.

## Author

Built by Pulkit Bhatia.
