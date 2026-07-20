import { Job, JobStats, Technician, AddressSuggestion, Client } from '@/types';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  // Attach the current admin's access token so the backend can scope by user
  const {
    data: { session },
  } = await createSupabaseClient().auth.getSession();

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return res.json();
}

// Auth API
export async function signupAdmin(data: {
  full_name: string;
  email: string;
  password: string;
}): Promise<{ ok: boolean; user_id?: string }> {
  return fetchApi('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
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

export async function updateTechnician(
  id: string,
  data: Partial<Pick<Technician, 'full_name' | 'phone' | 'is_active'>>
): Promise<Technician> {
  return fetchApi(`/technicians/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteTechnician(id: string): Promise<{ ok: boolean }> {
  return fetchApi(`/technicians/${id}`, {
    method: 'DELETE',
  });
}

// Clients API
export async function getClients(): Promise<Client[]> {
  return fetchApi('/clients');
}

export async function createClient(data: Partial<Client>): Promise<Client> {
  return fetchApi('/clients', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateClient(id: string, data: Partial<Client>): Promise<Client> {
  return fetchApi(`/clients/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteClient(id: string): Promise<{ ok: boolean }> {
  return fetchApi(`/clients/${id}`, {
    method: 'DELETE',
  });
}