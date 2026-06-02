import { supabase } from '../supabase';
import {
  getMyJobs,
  getJob,
  checkGeofence,
  updateJobStatus,
  updateMyLocation,
} from '../api';

jest.mock('../supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
  },
}));

const mockGetSession = supabase.auth.getSession as jest.Mock;

describe('mobile api client', () => {
  const API_URL = 'http://localhost:4000/api';

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
    });
  });

  it('attaches bearer token from supabase session', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ jobs: [] }),
    });

    await getMyJobs('tech-1');

    expect(global.fetch).toHaveBeenCalledWith(
      `${API_URL}/technicians/tech-1/jobs`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('omits auth header when session is missing', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ jobs: [] }),
    });

    await getMyJobs('tech-1');

    const headers = (global.fetch as jest.Mock).mock.calls[0][1].headers;
    expect(headers.Authorization).toBeUndefined();
  });

  it('getMyJobs appends lat/lng query params when provided', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ jobs: [] }),
    });

    await getMyJobs('tech-1', 40.7, -74.0);

    expect(global.fetch).toHaveBeenCalledWith(
      `${API_URL}/technicians/tech-1/jobs?lat=40.7&lng=-74`,
      expect.any(Object)
    );
  });

  it('getJob fetches single job by id', async () => {
    const job = { id: 'job-1', client_name: 'Acme' };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => job,
    });

    const result = await getJob('job-1');
    expect(result).toEqual(job);
    expect(global.fetch).toHaveBeenCalledWith(
      `${API_URL}/jobs/job-1`,
      expect.any(Object)
    );
  });

  it('checkGeofence calls geofence endpoint with coordinates', async () => {
    const geofence = {
      within_geofence: true,
      distance_meters: 50,
      geofence_radius: 200,
    };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => geofence,
    });

    const result = await checkGeofence('job-1', 40.71, -74.01);
    expect(result).toEqual(geofence);
    expect(global.fetch).toHaveBeenCalledWith(
      `${API_URL}/jobs/job-1/geofence?tech_lat=40.71&tech_lng=-74.01`,
      expect.any(Object)
    );
  });

  it('updateJobStatus POSTs status with technician location and device info', async () => {
    const updatedJob = { id: 'job-1', status: 'In Progress' };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => updatedJob,
    });

    const result = await updateJobStatus(
      'job-1',
      'tech-1',
      'In Progress',
      40.7128,
      -74.006
    );

    expect(result).toEqual(updatedJob);
    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(options.method).toBe('POST');
    const body = JSON.parse(options.body);
    expect(body).toMatchObject({
      status: 'In Progress',
      technician_id: 'tech-1',
      tech_lat: 40.7128,
      tech_lng: -74.006,
      device_info: expect.objectContaining({ platform: 'mobile' }),
    });
  });

  it('updateMyLocation POSTs coordinates to technician endpoint', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    await updateMyLocation('tech-1', 40.7, -74.0);

    expect(global.fetch).toHaveBeenCalledWith(
      `${API_URL}/technicians/tech-1/location`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ lat: 40.7, lng: -74.0 }),
      })
    );
  });

  it('throws server error message on failed response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Geofence verification failed' }),
    });

    await expect(getJob('job-1')).rejects.toThrow('Geofence verification failed');
  });

  it('throws generic message when error body is not JSON', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => {
        throw new Error('invalid json');
      },
    });

    await expect(getJob('job-1')).rejects.toThrow('Request failed');
  });

  it('uses error.message when error field is absent', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Not allowed' }),
    });

    await expect(getJob('job-1')).rejects.toThrow('Not allowed');
  });
});
