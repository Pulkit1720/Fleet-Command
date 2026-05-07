# Fleet Command

A field service management platform for dispatching technicians and tracking jobs in real time. Built as a monorepo with three packages:

| Package | Stack | Purpose |
|---|---|---|
| `backend/` | Node.js + Express | REST API |
| `web-admin/` | Next.js 14 + Tailwind | Admin dashboard |
| `mobile-app/` | Expo (React Native) | Technician mobile app |

---

## Architecture

```
Fleet Command
├── backend/          Node.js REST API (deployed on Google Cloud Run)
├── web-admin/        Next.js admin dashboard (deployed on Google Cloud Run)
├── mobile-app/       Expo React Native app (distributed via EAS Build)
└── database/         Supabase SQL schema
```

**Infrastructure:**
- **Auth:** Supabase Auth (PKCE flow, invite-based for technicians)
- **Database:** Supabase (PostgreSQL)
- **Maps:** Mapbox GL (web), React Native Maps (mobile)
- **Email:** Nodemailer + Gmail SMTP
- **Hosting:** Google Cloud Run (`asia-south2`)
- **Mobile builds:** EAS Build

---

## Getting Started

### Prerequisites

- Node.js 18+
- [Supabase](https://supabase.com) project
- [Mapbox](https://mapbox.com) account (for maps)
- Gmail account with an [App Password](https://myaccount.google.com/apppasswords) (for invite emails)
- [Google Cloud CLI](https://cloud.google.com/sdk) (for deployment)
- [EAS CLI](https://docs.expo.dev/eas/) (for mobile builds)

### 1. Database

Run the schema against your Supabase project:

```bash
# In the Supabase SQL editor, run:
database/schema.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Fill in .env values (see Environment Variables section)
npm install
npm run dev
```

Runs on `http://localhost:4000`

### 3. Web Admin

```bash
cd web-admin
cp .env .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:4000/api
npm install
npm run dev
```

Runs on `http://localhost:3000`

### 4. Mobile App

```bash
cd mobile-app
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) or press `a` for Android emulator.

> **Note:** AsyncStorage and location features require a native build — use `npx expo run:android` or an EAS build for full functionality.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `PORT` | Server port (default: `4000`) |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SECRET_KEY` | Supabase service role key (admin operations) |
| `SUPABASE_ANON_KEY` | Supabase anon key |
| `MAPBOX_ACCESS_TOKEN` | Mapbox token for geocoding |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `WEB_ADMIN_URL` | Web admin base URL (used in invite email links) |
| `GMAIL_USER` | Gmail address for sending invite emails |
| `GMAIL_APP_PASSWORD` | Gmail App Password (not your login password) |

### Web Admin (`web-admin/.env`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox token for job map |

### Mobile App (`mobile-app/.env`)

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_API_URL` | Backend API URL |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |

---

## User Roles

### Admin
- Logs in at the web admin dashboard
- Creates and assigns jobs to technicians
- Invites new technicians via email
- Views live job map and stats

### Technician
- Receives an email invite from admin
- Sets password via the invite link (web browser)
- Logs into the mobile app to view and action jobs
- Location is tracked when marking jobs in progress

---

## Key Features

- **Job management** — create, assign, and track jobs through statuses: `Pending → Assigned → In Progress → Completed`
- **Technician invites** — admin sends invite emails; technicians set their own password and sign in on mobile
- **Live map** — Mapbox-powered map showing all job locations with priority colour coding
- **Truth Engine** — verifies technician is on-site before allowing job status updates
- **Address autocomplete** — Mapbox geocoding on job creation

---

## Deployment

### Backend (Cloud Run)

```bash
cd backend
gcloud run deploy fleetcommand-backend \
  --source . \
  --region asia-south2 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,SUPABASE_URL=...,SUPABASE_SECRET_KEY=...,SUPABASE_ANON_KEY=...,MAPBOX_ACCESS_TOKEN=...,CORS_ORIGINS=https://your-admin-url.run.app,WEB_ADMIN_URL=https://your-admin-url.run.app,GMAIL_USER=...,GMAIL_APP_PASSWORD=..."
```

### Web Admin (Cloud Run)

> `NEXT_PUBLIC_*` variables are baked in at build time — they **must** be in `.env.production` before deploying, not just set in Cloud Run console.

```bash
cd web-admin
# Update .env.production with real values first, then:
gcloud run deploy fleetcommand-admin \
  --source . \
  --region asia-south2 \
  --allow-unauthenticated
```

### Mobile App (EAS Build)

```bash
cd mobile-app

# Preview APK (Android)
eas build --platform android --profile preview

# Production
eas build --platform android --profile production
eas build --platform ios --profile production
```

Set secrets via EAS before building:
```bash
eas env:create --environment preview --name EXPO_PUBLIC_API_URL --value https://your-backend.run.app/api
```

---

## Project Structure

```
backend/src/
├── config/          Supabase client
├── controllers/     Route handlers (jobs, technicians)
├── middleware/      Auth, error handling
├── routes/          Express routers
└── services/        Geocoding, Truth Engine, email

web-admin/src/
├── app/             Next.js App Router pages
│   ├── (dashboard)/ Protected dashboard pages
│   ├── auth/        Supabase auth callback
│   ├── login/       Admin login
│   ├── set-password/        Admin invite setup
│   └── technician/setup/    Technician invite setup
├── components/      UI components
├── layout/          Sidebar, Header
└── lib/             API client, Supabase clients

mobile-app/
├── app/             Expo Router screens
│   ├── (tabs)/      Home (job list), Profile
│   ├── job/[id]     Job detail
│   ├── login        Auth screen
│   └── set-password Technician invite setup
├── components/      Shared components
├── context/         Auth context
└── lib/             API client, types
```
