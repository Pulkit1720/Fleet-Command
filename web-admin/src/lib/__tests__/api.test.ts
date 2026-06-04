import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// fetchApi attaches the Supabase access token — mock the client to return one.
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: async () => ({
        data: { session: { access_token: 'test-token' } },
      }),
    },
  }),
}));

const API_URL = 'http://localhost:4000/api';

const AUTH_HEADERS = {
  'Content-Type': 'application/json',
  Authorization: 'Bearer test-token',
};

describe('api client', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', API_URL);
    vi.resetModules();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  async function loadApi() {
    return import('../api');
  }

  describe('getJobs', () => {
    it('fetches jobs without query params', async () => {
      const mockJobs = { jobs: [{ id: '1' }], total: 1 };
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => mockJobs,
      });

      const { getJobs } = await loadApi();
      const result = await getJobs();

      expect(fetch).toHaveBeenCalledWith(`${API_URL}/jobs`, expect.any(Object));
      expect(result).toEqual(mockJobs);
    });

    it('appends filter query params', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ jobs: [], total: 0 }),
      });

      const { getJobs } = await loadApi();
      await getJobs({ status: 'Assigned', priority: 'Emergency' });

      expect(fetch).toHaveBeenCalledWith(
        `${API_URL}/jobs?status=Assigned&priority=Emergency`,
        expect.any(Object)
      );
    });

    it('throws with server error message on failure', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Unauthorized' }),
      });

      const { getJobs } = await loadApi();
      await expect(getJobs()).rejects.toThrow('Unauthorized');
    });

    it('throws generic message when error body is not JSON', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        json: async () => {
          throw new Error('invalid json');
        },
      });

      const { getJobs } = await loadApi();
      await expect(getJobs()).rejects.toThrow('Request failed');
    });
  });

  describe('createJob', () => {
    it('POSTs job payload as JSON', async () => {
      const job = { id: 'new', client_name: 'Acme' };
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => job,
      });

      const { createJob } = await loadApi();
      const payload = { client_name: 'Acme', site_address: '123 St' };
      const result = await createJob(payload);

      expect(fetch).toHaveBeenCalledWith(`${API_URL}/jobs`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: AUTH_HEADERS,
      });
      expect(result).toEqual(job);
    });
  });

  describe('updateJobStatus', () => {
    it('POSTs status with technician geolocation data', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'j1', status: 'In Progress' }),
      });

      const { updateJobStatus } = await loadApi();
      await updateJobStatus('j1', 'In Progress', {
        technician_id: 't1',
        tech_lat: 40.7,
        tech_lng: -74.0,
      });

      expect(fetch).toHaveBeenCalledWith(`${API_URL}/jobs/j1/status`, {
        method: 'POST',
        body: JSON.stringify({
          status: 'In Progress',
          technician_id: 't1',
          tech_lat: 40.7,
          tech_lng: -74.0,
        }),
        headers: AUTH_HEADERS,
      });
    });
  });

  describe('searchAddress', () => {
    it('encodes query parameter', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      const { searchAddress } = await loadApi();
      await searchAddress('main st & ave');

      expect(fetch).toHaveBeenCalledWith(
        `${API_URL}/jobs/address-search?q=main%20st%20%26%20ave`,
        expect.any(Object)
      );
    });
  });

  describe('inviteTechnician', () => {
    it('POSTs invite payload to technicians endpoint', async () => {
      const technician = { id: 't1', email: 'tech@test.com' };
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => technician,
      });

      const { inviteTechnician } = await loadApi();
      const result = await inviteTechnician({
        full_name: 'Tech',
        email: 'tech@test.com',
        phone: '555-0100',
      });

      expect(fetch).toHaveBeenCalledWith(`${API_URL}/technicians/invite`, {
        method: 'POST',
        body: JSON.stringify({
          full_name: 'Tech',
          email: 'tech@test.com',
          phone: '555-0100',
        }),
        headers: AUTH_HEADERS,
      });
      expect(result).toEqual(technician);
    });
  });
});
