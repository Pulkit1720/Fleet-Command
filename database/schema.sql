--Fleet command Database schema
--postGis enabled to use location in database

create extension if not exists postgis;
---------------------------------------
-- enum
---------------------------------------

-- Type of job
create type job_type as enum (
    'Repair',
    'Install',
    'Ongoing Install',
    'Maintenance',
    'Inspection'
);

create type job_priority as enum (
    'Low',
    'Normal',
    'High'
);

create type job_status as enum (
    'Unassigned',
    'Assigned',
    'In Progress',
    'Completed',
    'Cancelled'
);

create type log_option as enum (
  'job_started',
  'job_completed',
  'location_verified',
  'geofence_entered',
  'geofence_exited'
);

-- =============================
  --TABLES
-- =============================

--TODO: Check phone number is 10 character, do it on the front end also make sure int is right type
--TODO: ONduty, offduty
create table if not exists technician (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    full_name text not null,
    email text unique not null,
    phone text unique not null,  
    avatar_url text,
    is_active boolean default true,
    current_lat float,
    current_lng float,
    last_location_update timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    --Check phone number
    constraint technician_phone_10_digits check (phone ~ '^\d{10}$'),
    constraint tech_email_check check (email ~* E'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$')
);

create table if not exists client (
    id uuid primary key default gen_random_uuid(),
    client_name text,
    contact_name text not null,
    email text unique,
    phone text unique,
    address text,
    city text,
    state text,
    notes text,
    postal_code text,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),

    constraint client_phone_10_digits check (phone ~ '^\d{10}$'),
    constraint client_email_check check (email ~* E'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$')
);

--Jobs table 
-- Multiple technicians can be assigned to same job solve that
create table if not exists jobs(
    id uuid primary key default gen_random_uuid(),
    job_number serial,
    client_id uuid references client(id) on delete set null,
    job_type job_type not null default 'Repair',
    priority job_priority not null default 'Normal',
    status job_status not null default 'Unassigned',
    description text,
    site_address text not null,
    lat float,
    lng float,
    geofence_radius_meters int default 200,
    assigned_technician uuid references technician(id) on delete set null,
    scheduled_date date,
    scheduled_time_start time,
    scheduled_time_end time,
    estimated_duration_time time default (interval '120 minutes')::time,
    actual_start_time timestamptz,
    actual_end_time timestamptz,
    notes text,
    created_by uuid references auth.users(id),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists logs (
    id uuid primary key default gen_random_uuid(),
    job_id uuid not null references jobs(id) on delete cascade,
    technician_id uuid not null references technician(id) on delete cascade,
    action log_option not null,
    recorded_lat float not null,
    recorded_lng float not null,
    distance_from_site_meters float,
    within_geofence boolean not null,
    device_info JSONB,
    timestamp timestamptz default now()
);

-- Job attachments (photos, documents)
create table if not exists job_attachments (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  uploaded_by uuid not null references technician(id),
  file_url text not null,
  file_type text,
  description text,
  uploaded_at timestamptz default now()
);



------------------------------
-- functions
------------------------------

-- function to calculate distance between two points

create or replace function calculate_distnce_meters (lat1 float, lng1 float, lat2 float, lng2 float)
returns float as $$
declare
    distance float;
begin 
    select st_distancesphere(st_makepoint(lng1, lat1),st_makepoint(lng2, lat2)) into distance;
    return distance;
end;
$$ language plpgsql immutable;

-- function to check points inside geofence

create or replace function is_within_geofence(tech_lat float, tech_lng float, job_lat float, job_lng float , radius_meters int)
returns boolean as $$
begin
    return calculate_distnce_meters(tech_lat, tech_lng, job_lat, job_lng) <= radius_meters;
end;
$$ language plpgsql immutable;

-- auto-update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$ 
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

----------------------------------------
-- triggers
----------------------------------------

create trigger update_jobs_updated_at
    before update on jobs
    for each row execute function update_updated_at_column();

create trigger update_technicians_updated_at
    before update on technician
    for each row
    execute function update_updated_at_column();

----------------------------------------
-- ROW LEVEL SECURITY (RLS)
----------------------------------------

alter table technician enable row level security;
alter table jobs enable row level security;
alter table logs enable row level security;
alter table job_attachments enable row level security;

-- policies for technician

--policies for job_attachments

cREATE POLICY "Authenticated users can view attachments"
  ON job_attachments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can upload attachments"
  ON job_attachments FOR INSERT
  TO authenticated
  WITH CHECK (true);

  -- ============================================
-- SEED DATA (Optional - for testing)
-- ============================================

-- Insert sample technicians
INSERT INTO technician (full_name, email, phone) VALUES
  ('John Smith', 'john.smith@fleetcommand.io', '5550101001'),
  ('Sarah Johnson', 'sarah.johnson@fleetcommand.io', '5550102002'),
  ('Mike Davis', 'mike.davis@fleetcommand.io', '5550103003');

-- Insert sample jobs
INSERT INTO jobs (job_type, priority, status, description, site_address, lat, lng, scheduled_date) VALUES
  ('Install', 'Normal', 'Unassigned', 'Install new gate system with keypad access', '123 Business Park Dr, Austin, TX 78701', 30.2672, -97.7431, CURRENT_DATE + INTERVAL '1 day'),
  ('Repair', 'High', 'Unassigned', 'Gate not closing properly - security concern', '456 Oak Lane, Austin, TX 78702', 30.2849, -97.7341, CURRENT_DATE),
  ('Maintenance', 'Low', 'Unassigned', 'Quarterly maintenance check on access control system', '789 Congress Ave, Austin, TX 78701', 30.2687, -97.7428, CURRENT_DATE + INTERVAL '3 days'),
  ('Ongoing Install', 'Normal', 'In Progress', 'Phase 2: Security camera installation', '101 Lakefront Blvd, Austin, TX 78703', 30.2950, -97.7650, CURRENT_DATE),
  ('Install', 'Normal', 'Assigned', 'Smart home integration with existing gate system', '202 Innovation Way, Austin, TX 78758', 30.3900, -97.7200, CURRENT_DATE + INTERVAL '2 days');

-- ============================================
-- VIEWS (Optional - for dashboard queries)
-- ============================================

CREATE OR REPLACE VIEW job_stats AS
SELECT
  COUNT(*) FILTER (WHERE status = 'Unassigned') AS unassigned_count,
  COUNT(*) FILTER (WHERE status = 'Assigned') AS assigned_count,
  COUNT(*) FILTER (WHERE status = 'In Progress') AS in_progress_count,
  COUNT(*) FILTER (WHERE status = 'Completed') AS completed_count,
  COUNT(*) FILTER (WHERE priority = 'Emergency' AND status NOT IN ('Completed', 'Cancelled')) AS emergency_count,
  COUNT(*) FILTER (WHERE scheduled_date = CURRENT_DATE) AS today_count,
  COUNT(*) AS total_count
FROM jobs;

