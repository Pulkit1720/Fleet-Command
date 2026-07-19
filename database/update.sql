-- ============================================================
-- Fleet Command – Supabase Update Script
--
-- IMPORTANT: Run this in TWO separate steps in the SQL Editor.
-- Step 1 must be committed before Step 2 can run.
-- ============================================================


-- ============================================================
-- STEP 1 – Run this block alone first, then click Run.
--           After it succeeds, proceed to Step 2.
-- ============================================================

ALTER TYPE job_priority ADD VALUE IF NOT EXISTS 'Emergency';


-- ============================================================
-- STEP 2 – After Step 1 succeeds, run everything below.
-- ============================================================

-- ------------------------------------------------------------
-- RLS Policies
-- Drop then recreate so the script is safe to re-run.
-- ------------------------------------------------------------

-- ── technician ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Technician can view own profile"   ON technician;
DROP POLICY IF EXISTS "Technician can update own profile" ON technician;

CREATE POLICY "Technician can view own profile"
  ON technician FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Technician can update own profile"
  ON technician FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ── jobs ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Technician can view assigned jobs"   ON jobs;
DROP POLICY IF EXISTS "Technician can view unassigned jobs" ON jobs;

CREATE POLICY "Technician can view assigned jobs"
  ON jobs FOR SELECT
  TO authenticated
  USING (
    assigned_technician IN (
      SELECT id FROM technician WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Technician can view unassigned jobs"
  ON jobs FOR SELECT
  TO authenticated
  USING (assigned_technician IS NULL);


-- ── logs ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Technician can insert own logs" ON logs;
DROP POLICY IF EXISTS "Technician can view own logs"   ON logs;

CREATE POLICY "Technician can insert own logs"
  ON logs FOR INSERT
  TO authenticated
  WITH CHECK (
    technician_id IN (
      SELECT id FROM technician WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Technician can view own logs"
  ON logs FOR SELECT
  TO authenticated
  USING (
    technician_id IN (
      SELECT id FROM technician WHERE user_id = auth.uid()
    )
  );


-- ── client ──────────────────────────────────────────────────
ALTER TABLE client ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view clients" ON client;

CREATE POLICY "Authenticated users can view clients"
  ON client FOR SELECT
  TO authenticated
  USING (true);


-- ------------------------------------------------------------
-- Link technician rows to Supabase Auth users
--
-- Before uncommenting:
-- a) Supabase Dashboard → Authentication → Users → Invite user
--    for each email below
-- b) Copy the UUID assigned to each account
-- c) Replace the placeholder UUIDs and run
-- ------------------------------------------------------------

-- UPDATE technician SET user_id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
--   WHERE email = 'john.smith@fleetcommand.io';

-- UPDATE technician SET user_id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
--   WHERE email = 'sarah.johnson@fleetcommand.io';

-- UPDATE technician SET user_id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
--   WHERE email = 'mike.davis@fleetcommand.io';


-- ------------------------------------------------------------
-- Verification – run after the above to confirm setup
-- ------------------------------------------------------------

SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('technician', 'jobs', 'logs', 'client', 'job_attachments');

SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

SELECT id, full_name, email,
       CASE WHEN user_id IS NULL THEN 'NOT LINKED' ELSE 'LINKED' END AS auth_status
FROM technician
ORDER BY full_name;

SELECT unnest(enum_range(NULL::job_priority)) AS priority_values;


-- ============================================================
-- MIGRATION: add_admin_ownership_and_policies  (applied 2026-06)
--
-- Per-admin data isolation. NOTE: the live table is `technicians`
-- (plural) — the `technician` references above and in schema.sql are
-- STALE. This block reflects what was applied to the live database.
-- ============================================================

-- Each technician belongs to the admin (auth user) who invited them.
-- Jobs are scoped by the existing jobs.created_by column.
ALTER TABLE public.technicians
  ADD COLUMN IF NOT EXISTS admin_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS technicians_admin_id_idx ON public.technicians(admin_id);

-- Admin ownership policies (additive — technician self-access policies kept).
-- The Express backend uses the service key and bypasses RLS; these protect
-- direct client (mobile) access and are defense-in-depth.
DROP POLICY IF EXISTS "Admins manage own technicians" ON public.technicians;
CREATE POLICY "Admins manage own technicians"
  ON public.technicians FOR ALL
  TO authenticated
  USING (admin_id = (SELECT auth.uid()))
  WITH CHECK (admin_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins manage own jobs" ON public.jobs;
CREATE POLICY "Admins manage own jobs"
  ON public.jobs FOR ALL
  TO authenticated
  USING (created_by = (SELECT auth.uid()))
  WITH CHECK (created_by = (SELECT auth.uid()));


-- ============================================================
-- 2026-07-15 – Clients page: scope client records per admin
-- (Already applied to the live project via Supabase migration
--  "add_client_created_by".)
-- ============================================================

ALTER TABLE public.client
    ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_client_created_by ON public.client(created_by);


-- ============================================================
-- 2026-07-19 – Invite fix: phone is optional on technicians
-- (Applied live via Supabase migration "technicians_phone_nullable".)
-- ============================================================

ALTER TABLE public.technicians ALTER COLUMN phone DROP NOT NULL;
