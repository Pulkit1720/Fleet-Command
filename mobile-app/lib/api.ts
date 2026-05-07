import { Job, GeofenceCheck } from './types';
import { supabase } from './supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // Attach Supabase session token if available
  const { data: { session } } = await supabase.auth.getSession();
  const authHeader = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || 'Request failed');
  }

  return res.json();
}

// Get technician's jobs sorted by distance
export async function getMyJobs(
  technicianId: string,
  lat?: number,
  lng?: number
): Promise<{ jobs: Job[] }> {
  let endpoint = `/technicians/${technicianId}/jobs`;
  if (lat && lng) {
    endpoint += `?lat=${lat}&lng=${lng}`;
  }
  return fetchApi(endpoint);
}

// Get single job
export async function getJob(id: string): Promise<Job> {
  return fetchApi(`/jobs/${id}`);
}

// Check geofence
export async function checkGeofence(
  jobId: string,
  techLat: number,
  techLng: number
): Promise<GeofenceCheck> {
  return fetchApi(`/jobs/${jobId}/geofence?tech_lat=${techLat}&tech_lng=${techLng}`);
}

// Update job status with location verification
export async function updateJobStatus(
  jobId: string,
  technicianId: string,
  status: string,
  techLat: number,
  techLng: number
): Promise<Job> {
  return fetchApi(`/jobs/${jobId}/status`, {
    method: 'POST',
    body: JSON.stringify({
      status,
      technician_id: technicianId,
      tech_lat: techLat,
      tech_lng: techLng,
      device_info: {
        platform: 'mobile',
        timestamp: new Date().toISOString(),
      },
    }),
  });
}

// Update technician location
export async function updateMyLocation(
  technicianId: string,
  lat: number,
  lng: number
): Promise<void> {
  await fetchApi(`/technicians/${technicianId}/location`, {
    method: 'POST',
    body: JSON.stringify({ lat, lng }),
  });
}
