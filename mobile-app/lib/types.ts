export type JobType = 'Repair' | 'Install' | 'Ongoing Install' | 'Maintenance' | 'Inspection';
export type JobPriority = 'Low' | 'Normal' | 'Emergency';
export type JobStatus = 'Unassigned' | 'Assigned' | 'In Progress' | 'Completed' | 'Cancelled';

export interface Job {
  id: string;
  job_number: number;
  client_name: string;
  client_phone: string | null;
  job_type: JobType;
  priority: JobPriority;
  status: JobStatus;
  description: string | null;
  site_address: string;
  lat: number | null;
  lng: number | null;
  geofence_radius_meters: number;
  scheduled_date: string | null;
  scheduled_time_start: string | null;
  distance_meters?: number | null;
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface GeofenceCheck {
  within_geofence: boolean;
  distance_meters: number;
  geofence_radius: number;
}