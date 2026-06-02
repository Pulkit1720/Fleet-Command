import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockSingle = vi.fn();

vi.mock('../../config/supabase.js', () => ({
  default: {
    from: vi.fn(() => ({
      insert: mockInsert,
      select: mockSelect,
    })),
  },
}));

import {
  calculateDistance,
  isWithinGeofence,
  logTruthEntry,
  getJobTruthLogs,
} from '../truthEngineService.js';

describe('calculateDistance', () => {
  it('returns 0 for identical coordinates', () => {
    expect(calculateDistance(40.7128, -74.006, 40.7128, -74.006)).toBe(0);
  });

  it('calculates known distance between NYC landmarks (~1.4 km)', () => {
    // Empire State Building to Times Square
    const empireState = { lat: 40.7484, lng: -73.9857 };
    const timesSquare = { lat: 40.758, lng: -73.9855 };
    const distance = calculateDistance(
      empireState.lat,
      empireState.lng,
      timesSquare.lat,
      timesSquare.lng
    );
    expect(distance).toBeGreaterThan(1000);
    expect(distance).toBeLessThan(2000);
  });

  it('is symmetric regardless of point order', () => {
    const d1 = calculateDistance(37.7749, -122.4194, 34.0522, -118.2437);
    const d2 = calculateDistance(34.0522, -118.2437, 37.7749, -122.4194);
    expect(d1).toBeCloseTo(d2, 5);
  });

  it('returns larger distances for farther-apart points', () => {
    const near = calculateDistance(0, 0, 0, 0.01);
    const far = calculateDistance(0, 0, 0, 1);
    expect(far).toBeGreaterThan(near);
  });
});

describe('isWithinGeofence', () => {
  const jobLat = 40.7128;
  const jobLng = -74.006;

  it('returns isWithin true when technician is at job site', () => {
    const result = isWithinGeofence(jobLat, jobLng, jobLat, jobLng, 200);
    expect(result.isWithin).toBe(true);
    expect(result.distance).toBe(0);
  });

  it('returns isWithin true when within default 200m radius', () => {
    // ~100m north
    const techLat = jobLat + 0.0009;
    const result = isWithinGeofence(techLat, jobLng, jobLat, jobLng);
    expect(result.isWithin).toBe(true);
    expect(result.distance).toBeLessThanOrEqual(200);
  });

  it('returns isWithin false when outside custom radius', () => {
    // ~5km away
    const techLat = jobLat + 0.05;
    const result = isWithinGeofence(techLat, jobLng, jobLat, jobLng, 200);
    expect(result.isWithin).toBe(false);
    expect(result.distance).toBeGreaterThan(200);
  });

  it('rounds distance to nearest meter', () => {
    const result = isWithinGeofence(jobLat, jobLng, jobLat, jobLng, 200);
    expect(Number.isInteger(result.distance)).toBe(true);
  });
});

describe('logTruthEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: mockSingle,
      }),
    });
  });

  it('inserts log with geofence fields computed from coordinates', async () => {
    const logEntry = {
      id: 'log-1',
      within_geofence: true,
      distance_from_site_meters: 0,
    };
    mockSingle.mockResolvedValue({ data: logEntry, error: null });

    const result = await logTruthEntry({
      jobId: 'job-1',
      technicianId: 'tech-1',
      action: 'job_started',
      techLat: 40.7128,
      techLng: -74.006,
      jobLat: 40.7128,
      jobLng: -74.006,
      geofenceRadius: 200,
      deviceInfo: { platform: 'ios' },
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        job_id: 'job-1',
        technician_id: 'tech-1',
        action: 'job_started',
        recorded_lat: 40.7128,
        recorded_lng: -74.006,
        within_geofence: true,
        distance_from_site_meters: 0,
        device_info: { platform: 'ios' },
      })
    );
    expect(result).toEqual(logEntry);
  });

  it('marks within_geofence false when technician is far from site', async () => {
    mockSingle.mockResolvedValue({
      data: { id: 'log-2', within_geofence: false },
      error: null,
    });

    await logTruthEntry({
      jobId: 'job-1',
      technicianId: 'tech-1',
      action: 'job_completed',
      techLat: 40.8,
      techLng: -74.006,
      jobLat: 40.7128,
      jobLng: -74.006,
      geofenceRadius: 200,
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        within_geofence: false,
      })
    );
    const insertArg = mockInsert.mock.calls[0][0];
    expect(insertArg.distance_from_site_meters).toBeGreaterThan(200);
  });

  it('throws when supabase insert fails', async () => {
    const dbError = { message: 'insert failed', code: '23505' };
    mockSingle.mockResolvedValue({ data: null, error: dbError });

    await expect(
      logTruthEntry({
        jobId: 'job-1',
        technicianId: 'tech-1',
        action: 'job_started',
        techLat: 40.7128,
        techLng: -74.006,
        jobLat: 40.7128,
        jobLng: -74.006,
      })
    ).rejects.toEqual(dbError);
  });
});

describe('getJobTruthLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEq.mockReturnValue({ order: mockOrder });
    mockOrder.mockResolvedValue({ data: [{ id: 'log-1' }], error: null });
    mockSelect.mockReturnValue({ eq: mockEq });
  });

  it('fetches logs for job ordered by timestamp descending', async () => {
    const logs = await getJobTruthLogs('job-123');

    expect(mockSelect).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith('job_id', 'job-123');
    expect(mockOrder).toHaveBeenCalledWith('timestamp', { ascending: false });
    expect(logs).toEqual([{ id: 'log-1' }]);
  });

  it('throws when supabase query fails', async () => {
    const dbError = { message: 'query failed' };
    mockOrder.mockResolvedValue({ data: null, error: dbError });

    await expect(getJobTruthLogs('job-123')).rejects.toEqual(dbError);
  });
});
