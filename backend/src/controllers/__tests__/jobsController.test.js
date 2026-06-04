import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockOrder = vi.fn();
const mockRange = vi.fn();
const mockIn = vi.fn();

vi.mock('../../config/supabase.js', () => ({
  default: { from: (...args) => mockFrom(...args) },
}));

vi.mock('../../services/geocodingService.js', () => ({
  geocodeAddress: vi.fn(),
  autocompleteAddress: vi.fn(),
}));

vi.mock('../../services/truthEngineService.js', () => ({
  logTruthEntry: vi.fn(),
  isWithinGeofence: vi.fn(),
  getJobTruthLogs: vi.fn(),
}));

import { geocodeAddress, autocompleteAddress } from '../../services/geocodingService.js';
import {
  logTruthEntry,
  isWithinGeofence,
  getJobTruthLogs,
} from '../../services/truthEngineService.js';
import {
  getJobs,
  getJob,
  createJob,
  updateJob,
  updateJobStatus,
  getJobStats,
  searchAddress,
  getJobLogs,
  checkGeofence,
} from '../jobsController.js';

function chainable(finalResult) {
  const chain = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
    in: vi.fn(),
    single: vi.fn().mockResolvedValue(finalResult),
    then(onFulfilled, onRejected) {
      return Promise.resolve(finalResult).then(onFulfilled, onRejected);
    },
  };
  chain.select.mockReturnValue(chain);
  chain.insert.mockReturnValue(chain);
  chain.update.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  chain.range.mockReturnValue(chain);
  chain.in.mockReturnValue(chain);
  return chain;
}

function mockRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
  return res;
}

function mockNext() {
  return vi.fn();
}

describe('jobsController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getJobs', () => {
    it('returns paginated jobs with normalized duration', async () => {
      const jobs = [
        {
          id: '1',
          client_name: 'Acme',
          estimated_duration_minutes: '01:30:00',
        },
      ];
      const chain = chainable({ data: jobs, error: null, count: 1 });
      mockFrom.mockReturnValue(chain);

      const req = { query: { limit: '10', offset: '0' }, user: { id: 'admin-1' } };
      const res = mockRes();
      const next = mockNext();

      await getJobs(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        jobs: [{ ...jobs[0], estimated_duration_minutes: 90 }],
        total: 1,
        limit: 10,
        offset: 0,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('forwards errors to next', async () => {
      const error = { message: 'db error' };
      const chain = chainable({ data: null, error, count: 0 });
      mockFrom.mockReturnValue(chain);

      const req = { query: {}, user: { id: 'admin-1' } };
      const res = mockRes();
      const next = mockNext();

      await getJobs(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getJob', () => {
    it('returns single job by id', async () => {
      const job = { id: 'job-1', estimated_duration_minutes: '02:00:00' };
      const chain = chainable({ data: job, error: null });
      mockFrom.mockReturnValue(chain);

      const req = { params: { id: 'job-1' }, user: { id: 'admin-1' } };
      const res = mockRes();
      const next = mockNext();

      await getJob(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        ...job,
        estimated_duration_minutes: 120,
      });
    });
  });

  describe('createJob', () => {
    it('creates job with provided coordinates', async () => {
      const created = {
        id: 'new-job',
        status: 'Unassigned',
        estimated_duration_minutes: '01:00:00',
      };
      const chain = chainable({ data: created, error: null });
      mockFrom.mockReturnValue(chain);

      const req = {
        user: { id: 'admin-1' },
        body: {
          client_name: 'Client',
          site_address: '123 St',
          lat: 40.7,
          lng: -74.0,
          estimated_duration_minutes: 60,
        },
      };
      const res = mockRes();
      const next = mockNext();

      await createJob(req, res, next);

      expect(geocodeAddress).not.toHaveBeenCalled();
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          client_name: 'Client',
          lat: 40.7,
          lng: -74.0,
          status: 'Unassigned',
          estimated_duration_minutes: '01:00:00',
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('geocodes address when lat/lng missing', async () => {
      geocodeAddress.mockResolvedValue({
        lat: 40.7128,
        lng: -74.006,
        formattedAddress: 'NYC, NY',
      });
      const chain = chainable({
        data: { id: 'j1', estimated_duration_minutes: null },
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const req = {
        user: { id: 'admin-1' },
        body: {
          client_name: 'Client',
          site_address: 'New York',
          assigned_technician_id: 'tech-1',
        },
      };
      const res = mockRes();
      const next = mockNext();

      await createJob(req, res, next);

      expect(geocodeAddress).toHaveBeenCalledWith('New York');
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          site_address: 'NYC, NY',
          lat: 40.7128,
          lng: -74.006,
          status: 'Assigned',
          assigned_technician: 'tech-1',
        })
      );
    });
  });

  describe('updateJob', () => {
    it('maps assigned_technician_id to DB column', async () => {
      const chain = chainable({
        data: { id: 'j1', estimated_duration_minutes: null },
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const req = {
        params: { id: 'j1' },
        user: { id: 'admin-1' },
        body: { assigned_technician_id: 'tech-2', status: 'Assigned' },
      };
      const res = mockRes();
      const next = mockNext();

      await updateJob(req, res, next);

      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          assigned_technician: 'tech-2',
          status: 'Assigned',
        })
      );
      expect(chain.update).toHaveBeenCalledWith(
        expect.not.objectContaining({ assigned_technician_id: expect.anything() })
      );
    });

    it('geocodes site_address when coordinates not provided', async () => {
      geocodeAddress.mockResolvedValue({
        lat: 1,
        lng: 2,
        formattedAddress: 'Formatted',
      });
      const chain = chainable({
        data: { id: 'j1', estimated_duration_minutes: null },
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const req = {
        params: { id: 'j1' },
        user: { id: 'admin-1' },
        body: { site_address: 'New address' },
      };
      const res = mockRes();
      const next = mockNext();

      await updateJob(req, res, next);

      expect(geocodeAddress).toHaveBeenCalledWith('New address');
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          lat: 1,
          lng: 2,
          site_address: 'Formatted',
        })
      );
    });
  });

  describe('updateJobStatus', () => {
    it('rejects status update when geofence check fails', async () => {
      const job = {
        id: 'job-1',
        lat: 40.7128,
        lng: -74.006,
        geofence_radius_meters: 200,
      };
      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) {
          return chainable({ data: job, error: null });
        }
        return chainable({ data: null, error: null });
      });
      isWithinGeofence.mockReturnValue({ isWithin: false, distance: 500 });
      logTruthEntry.mockResolvedValue({ id: 'log-1' });

      const req = {
        params: { id: 'job-1' },
        body: {
          status: 'In Progress',
          technician_id: 'tech-1',
          tech_lat: 40.8,
          tech_lng: -74.0,
        },
      };
      const res = mockRes();
      const next = mockNext();

      await updateJobStatus(req, res, next);

      expect(logTruthEntry).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Geofence verification failed',
          distance: 500,
        })
      );
    });

    it('updates job when geofence passes for In Progress', async () => {
      const job = {
        id: 'job-1',
        lat: 40.7128,
        lng: -74.006,
        geofence_radius_meters: 200,
      };
      const updated = {
        id: 'job-1',
        status: 'In Progress',
        estimated_duration_minutes: null,
      };
      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) {
          return chainable({ data: job, error: null });
        }
        return chainable({ data: updated, error: null });
      });
      isWithinGeofence.mockReturnValue({ isWithin: true, distance: 10 });
      logTruthEntry.mockResolvedValue({ id: 'log-1' });

      const req = {
        params: { id: 'job-1' },
        body: {
          status: 'In Progress',
          technician_id: 'tech-1',
          tech_lat: 40.7128,
          tech_lng: -74.006,
        },
      };
      const res = mockRes();
      const next = mockNext();

      await updateJobStatus(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'In Progress' })
      );
    });

    it('skips geofence for statuses that do not require verification', async () => {
      const job = { id: 'job-1', lat: 40.7, lng: -74.0, geofence_radius_meters: 200 };
      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) {
          return chainable({ data: job, error: null });
        }
        return chainable({
          data: { id: 'job-1', status: 'Assigned', estimated_duration_minutes: null },
          error: null,
        });
      });

      const req = {
        params: { id: 'job-1' },
        body: { status: 'Assigned' },
      };
      const res = mockRes();
      const next = mockNext();

      await updateJobStatus(req, res, next);

      expect(isWithinGeofence).not.toHaveBeenCalled();
      expect(logTruthEntry).not.toHaveBeenCalled();
    });
  });

  describe('getJobStats', () => {
    it('aggregates stats over the requesting admin\'s jobs only', async () => {
      const today = new Date().toISOString().slice(0, 10);
      const jobs = [
        { status: 'Unassigned', priority: 'Normal', scheduled_date: today },
        { status: 'Assigned', priority: 'Emergency', scheduled_date: null },
        { status: 'In Progress', priority: 'Normal', scheduled_date: today },
        { status: 'Completed', priority: 'Emergency', scheduled_date: null },
      ];
      const chain = chainable({ data: jobs, error: null });
      mockFrom.mockReturnValue(chain);

      const res = mockRes();
      const next = mockNext();

      await getJobStats({ user: { id: 'admin-1' } }, res, next);

      expect(chain.eq).toHaveBeenCalledWith('created_by', 'admin-1');
      expect(res.json).toHaveBeenCalledWith({
        unassigned_count: 1,
        assigned_count: 1,
        in_progress_count: 1,
        completed_count: 1,
        emergency_count: 1, // the Completed Emergency is excluded
        today_count: 2,
        total_count: 4,
      });
    });
  });

  describe('searchAddress', () => {
    it('returns empty array for short queries', async () => {
      const res = mockRes();
      const next = mockNext();

      await searchAddress({ query: { q: 'ab' } }, res, next);

      expect(res.json).toHaveBeenCalledWith([]);
      expect(autocompleteAddress).not.toHaveBeenCalled();
    });

    it('returns autocomplete suggestions for valid query', async () => {
      autocompleteAddress.mockResolvedValue([{ id: '1', address: 'Main St' }]);
      const res = mockRes();
      const next = mockNext();

      await searchAddress({ query: { q: 'main street' } }, res, next);

      expect(autocompleteAddress).toHaveBeenCalledWith('main street');
      expect(res.json).toHaveBeenCalledWith([{ id: '1', address: 'Main St' }]);
    });
  });

  describe('getJobLogs', () => {
    it('returns truth logs for job', async () => {
      getJobTruthLogs.mockResolvedValue([{ id: 'log-1' }]);
      const res = mockRes();
      const next = mockNext();

      await getJobLogs({ params: { id: 'job-1' } }, res, next);

      expect(getJobTruthLogs).toHaveBeenCalledWith('job-1');
      expect(res.json).toHaveBeenCalledWith([{ id: 'log-1' }]);
    });
  });

  describe('checkGeofence', () => {
    it('returns 400 when tech coordinates missing', async () => {
      const res = mockRes();
      const next = mockNext();

      await checkGeofence({ params: { id: 'j1' }, query: {} }, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'tech_lat and tech_lng required',
      });
    });

    it('returns geofence check result', async () => {
      const chain = chainable({
        data: { lat: 40.7, lng: -74.0, geofence_radius_meters: 200 },
        error: null,
      });
      mockFrom.mockReturnValue(chain);
      isWithinGeofence.mockReturnValue({ isWithin: true, distance: 50 });

      const res = mockRes();
      const next = mockNext();

      await checkGeofence(
        { params: { id: 'j1' }, query: { tech_lat: '40.71', tech_lng: '-74.01' } },
        res,
        next
      );

      expect(isWithinGeofence).toHaveBeenCalledWith(40.71, -74.01, 40.7, -74.0, 200);
      expect(res.json).toHaveBeenCalledWith({
        within_geofence: true,
        distance_meters: 50,
        geofence_radius: 200,
      });
    });
  });
});
