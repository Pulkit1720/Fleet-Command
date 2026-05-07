import { Job, JobStats, Technician, AddressSuggestion } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return res.json();
}

// Jobs API
export async function getJobs(params?: {
  status?: string;
  priority?: string;
  technician_id?: string;
  date?: string;
}): Promise<{ jobs: Job[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, value);
    });
  }
  const query = searchParams.toString();
  return fetchApi(`/jobs${query ? `?${query}` : ''}`);
}

export async function getJob(id: string): Promise<Job> {
  return fetchApi(`/jobs/${id}`);
}

export async function createJob(data: Partial<Job>): Promise<Job> {
  return fetchApi('/jobs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateJob(id: string, data: Partial<Job>): Promise<Job> {
  return fetchApi(`/jobs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function updateJobStatus(
  id: string,
  status: string,
  technicianData?: {
    technician_id: string;
    tech_lat: number;
    tech_lng: number;
  }
): Promise<Job> {
  return fetchApi(`/jobs/${id}/status`, {
    method: 'POST',
    body: JSON.stringify({ status, ...technicianData }),
  });
}

export async function getJobStats(): Promise<JobStats> {
  return fetchApi('/jobs/stats');
}

export async function searchAddress(query: string): Promise<AddressSuggestion[]> {
  return fetchApi(`/jobs/address-search?q=${encodeURIComponent(query)}`);
}

// Technicians API
export async function getTechnicians(): Promise<Technician[]> {
  return fetchApi('/technicians');
}

export async function getTechnician(id: string): Promise<Technician> {
  return fetchApi(`/technicians/${id}`);
}

export async function inviteTechnician(data: {
  full_name: string;
  email: string;
  phone?: string;
}): Promise<Technician> {
  return fetchApi('/technicians/invite', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}