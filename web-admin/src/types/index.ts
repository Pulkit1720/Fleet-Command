export type JobType = 'Repair' | 'Install' | 'Ongoing Install' | 'Maintenance' | 'Inspection';
export type JobPriority = 'Low' | 'Normal' | 'Emergency';
export type JobStatus = 'Unassigned' | 'Assigned' | 'In Progress' | 'Completed' | 'Cancelled';

export interface Technician {
  id: string;
  user_id: string | null;
  admin_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  current_lat: number | null;
  current_lng: number | null;
  last_location_update: string | null;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  job_number: number;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  job_type: JobType;
  priority: JobPriority;
  status: JobStatus;
  description: string | null;
  site_address: string;
  lat: number | null;
  lng: number | null;
  geofence_radius_meters: number;
  assigned_technician_id: string | null;
  assigned_technician: Technician | null;
  scheduled_date: string | null;
  scheduled_time_start: string | null;
  scheduled_time_end: string | null;
  estimated_duration_minutes: number;
  actual_start_time: string | null;
  actual_end_time: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobStats {
  unassigned_count: number;
  assigned_count: number;
  in_progress_count: number;
  completed_count: number;
  emergency_count: number;
  today_count: number;
  total_count: number;
}

export interface AddressSuggestion {
  id: string;
  address: string;
  lat: number;
  lng: number;
}