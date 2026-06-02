import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFrom, mockInviteUserByEmail } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockInviteUserByEmail: vi.fn(),
}));

vi.mock('../../config/supabase.js', () => ({
  default: {
    from: (...args) => mockFrom(...args),
    auth: {
      admin: {
        inviteUserByEmail: (...args) => mockInviteUserByEmail(...args),
      },
    },
  },
}));

vi.mock('../../services/truthEngineService.js', () => ({
  calculateDistance: vi.fn(() => 1000),
}));

import { calculateDistance } from '../../services/truthEngineService.js';
import {
  getTechnicians,
  getTechnician,
  updateLocation,
  inviteTechnician,
  getTechnicianJobs,
} from '../techniciansController.js';

function chainable(finalResult) {
  const chain = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
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
  chain.in.mockReturnValue(chain);
  return chain;
}

function mockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
}

describe('techniciansController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.WEB_ADMIN_URL = 'http://localhost:3000';
  });

  describe('getTechnicians', () => {
    it('returns all technicians', async () => {
      const technicians = [{ id: 't1', full_name: 'Alice' }];
      const chain = chainable({ data: technicians, error: null });
      mockFrom.mockReturnValue(chain);

      const res = mockRes();
      const next = vi.fn();

      await getTechnicians({ query: {} }, res, next);

      expect(res.json).toHaveBeenCalledWith(technicians);
    });

    it('filters by is_active when query param provided', async () => {
      const chain = chainable({ data: [], error: null });
      mockFrom.mockReturnValue(chain);

      const res = mockRes();
      const next = vi.fn();

      await getTechnicians({ query: { is_active: 'true' } }, res, next);

      expect(chain.eq).toHaveBeenCalledWith('is_active', true);
    });
  });

  describe('getTechnician', () => {
    it('returns technician by id', async () => {
      const technician = { id: 't1', full_name: 'Bob' };
      const chain = chainable({ data: technician, error: null });
      mockFrom.mockReturnValue(chain);

      const res = mockRes();
      const next = vi.fn();

      await getTechnician({ params: { id: 't1' } }, res, next);

      expect(res.json).toHaveBeenCalledWith(technician);
    });
  });

  describe('updateLocation', () => {
    it('updates technician coordinates and timestamp', async () => {
      const updated = { id: 't1', current_lat: 40.7, current_lng: -74.0 };
      const chain = chainable({ data: updated, error: null });
      mockFrom.mockReturnValue(chain);

      const res = mockRes();
      const next = vi.fn();

      await updateLocation(
        { params: { id: 't1' }, body: { lat: 40.7, lng: -74.0 } },
        res,
        next
      );

      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          current_lat: 40.7,
          current_lng: -74.0,
          last_location_update: expect.any(String),
        })
      );
      expect(res.json).toHaveBeenCalledWith(updated);
    });
  });

  describe('inviteTechnician', () => {
    it('returns 400 when required fields missing', async () => {
      const res = mockRes();
      const next = vi.fn();

      await inviteTechnician({ body: { full_name: 'Only Name' } }, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'full_name and email are required',
      });
    });

    it('returns 409 when technician email already exists', async () => {
      const chain = chainable({ data: { id: 'existing' }, error: null });
      mockFrom.mockReturnValue(chain);

      const res = mockRes();
      const next = vi.fn();

      await inviteTechnician(
        { body: { full_name: 'Tech', email: 'tech@test.com' } },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: 'A technician with this email already exists',
      });
    });

    it('invites user and creates technician record', async () => {
      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) {
          return chainable({ data: null, error: { code: 'PGRST116' } });
        }
        return chainable({
          data: {
            id: 'tech-new',
            full_name: 'New Tech',
            email: 'new@test.com',
          },
          error: null,
        });
      });
      mockInviteUserByEmail.mockResolvedValue({
        data: { user: { id: 'auth-user-1' } },
        error: null,
      });

      const res = mockRes();
      const next = vi.fn();

      await inviteTechnician(
        {
          body: {
            full_name: 'New Tech',
            email: 'new@test.com',
            phone: '555-0100',
          },
        },
        res,
        next
      );

      expect(mockInviteUserByEmail).toHaveBeenCalledWith(
        'new@test.com',
        expect.objectContaining({
          data: { full_name: 'New Tech', role: 'technician' },
          redirectTo: 'http://localhost:3000/auth/confirm',
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('getTechnicianJobs', () => {
    it('returns jobs sorted by distance when location provided', async () => {
      const technician = {
        id: 't1',
        current_lat: 40.7,
        current_lng: -74.0,
      };
      const jobs = [
        { id: 'j1', lat: 40.71, lng: -74.01, status: 'Assigned' },
        { id: 'j2', lat: 40.8, lng: -74.1, status: 'In Progress' },
      ];

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) {
          return chainable({ data: technician, error: null });
        }
        return chainable({ data: jobs, error: null });
      });

      calculateDistance
        .mockReturnValueOnce(500)
        .mockReturnValueOnce(5000);

      const res = mockRes();
      const next = vi.fn();

      await getTechnicianJobs(
        { params: { id: 't1' }, query: { lat: '40.7', lng: '-74.0' } },
        res,
        next
      );

      expect(res.json).toHaveBeenCalledWith({
        technician,
        jobs: expect.arrayContaining([
          expect.objectContaining({ id: 'j1', distance_meters: 500 }),
          expect.objectContaining({ id: 'j2', distance_meters: 5000 }),
        ]),
      });
      const response = res.json.mock.calls[0][0];
      expect(response.jobs[0].distance_meters).toBeLessThan(
        response.jobs[1].distance_meters
      );
    });

    it('returns null distance when job has no coordinates', async () => {
      const technician = { id: 't1', current_lat: 40.7, current_lng: -74.0 };
      const jobs = [{ id: 'j1', lat: null, lng: null, status: 'Assigned' }];

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) {
          return chainable({ data: technician, error: null });
        }
        return chainable({ data: jobs, error: null });
      });

      const res = mockRes();
      const next = vi.fn();

      await getTechnicianJobs(
        { params: { id: 't1' }, query: {} },
        res,
        next
      );

      expect(res.json).toHaveBeenCalledWith({
        technician,
        jobs: [expect.objectContaining({ distance_meters: null })],
      });
    });
  });
});
