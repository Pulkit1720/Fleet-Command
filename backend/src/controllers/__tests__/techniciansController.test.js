import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFrom, mockGenerateLink, mockSendInvite, mockDeleteUser } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockGenerateLink: vi.fn(),
  mockSendInvite: vi.fn(),
  mockDeleteUser: vi.fn(),
}));

vi.mock('../../config/supabase.js', () => ({
  default: {
    from: (...args) => mockFrom(...args),
    auth: {
      admin: {
        generateLink: (...args) => mockGenerateLink(...args),
        deleteUser: (...args) => mockDeleteUser(...args),
      },
    },
  },
}));

vi.mock('../../services/truthEngineService.js', () => ({
  calculateDistance: vi.fn(() => 1000),
}));

vi.mock('../../services/emailService.js', () => ({
  sendTechnicianInvite: (...args) => mockSendInvite(...args),
}));

import { calculateDistance } from '../../services/truthEngineService.js';
import {
  getTechnicians,
  getTechnician,
  updateLocation,
  inviteTechnician,
  updateTechnician,
  deleteTechnician,
  getTechnicianJobs,
} from '../techniciansController.js';

function chainable(finalResult) {
  const chain = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
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
  chain.delete.mockReturnValue(chain);
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

      await getTechnicians({ query: {}, user: { id: 'admin-1' } }, res, next);

      expect(res.json).toHaveBeenCalledWith(technicians);
      expect(chain.eq).toHaveBeenCalledWith('admin_id', 'admin-1');
    });

    it('filters by is_active when query param provided', async () => {
      const chain = chainable({ data: [], error: null });
      mockFrom.mockReturnValue(chain);

      const res = mockRes();
      const next = vi.fn();

      await getTechnicians(
        { query: { is_active: 'true' }, user: { id: 'admin-1' } },
        res,
        next
      );

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
    const adminUser = {
      id: 'admin-1',
      email: 'admin@example.com',
      user_metadata: { role: 'admin', full_name: 'Dana Admin' },
    };

    it('returns 403 when caller is not an admin', async () => {
      const res = mockRes();
      const next = vi.fn();

      await inviteTechnician(
        {
          body: { full_name: 'Tech', email: 'tech@test.com' },
          user: { id: 'tech-1', user_metadata: { role: 'technician' } },
        },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Only an admin can invite technicians',
      });
    });

    it('returns 403 for the public demo account', async () => {
      const res = mockRes();
      const next = vi.fn();

      await inviteTechnician(
        {
          body: { full_name: 'Tech', email: 'tech@test.com' },
          user: {
            id: 'demo-1',
            email: 'demo@fleetcd.com',
            user_metadata: { role: 'admin' },
          },
        },
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invites are disabled in the demo workspace',
      });
    });

    it('returns 400 when required fields missing', async () => {
      const res = mockRes();
      const next = vi.fn();

      await inviteTechnician(
        { body: { full_name: 'Only Name' }, user: adminUser },
        res,
        next
      );

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
        { body: { full_name: 'Tech', email: 'tech@test.com' }, user: adminUser },
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
      mockGenerateLink.mockResolvedValue({
        data: {
          user: { id: 'auth-user-1' },
          properties: { action_link: 'https://supabase.test/verify?token_hash=abc&type=invite' },
        },
        error: null,
      });
      mockSendInvite.mockResolvedValue();

      const res = mockRes();
      const next = vi.fn();

      await inviteTechnician(
        {
          body: {
            full_name: 'New Tech',
            email: 'new@test.com',
            phone: '555-0100',
          },
          user: adminUser,
        },
        res,
        next
      );

      expect(mockGenerateLink).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'invite',
          email: 'new@test.com',
          options: expect.objectContaining({
            data: { full_name: 'New Tech', role: 'technician' },
            redirectTo: 'http://localhost:3000/auth/confirm',
          }),
        })
      );
      expect(mockSendInvite).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'new@test.com',
          full_name: 'New Tech',
          inviterName: 'Dana Admin',
          inviteUrl: 'https://supabase.test/verify?token_hash=abc&type=invite',
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('updateTechnician', () => {
    const adminUser = {
      id: 'admin-1',
      email: 'admin@example.com',
      user_metadata: { role: 'admin' },
    };

    it('returns 403 when caller is not an admin', async () => {
      const res = mockRes();

      await updateTechnician(
        {
          params: { id: 'tech-1' },
          body: { full_name: 'New Name' },
          user: { id: 'tech-1', user_metadata: { role: 'technician' } },
        },
        res,
        vi.fn()
      );

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Only an admin can update technicians',
      });
    });

    it('returns 400 for an invalid phone number', async () => {
      const res = mockRes();

      await updateTechnician(
        { params: { id: 'tech-1' }, body: { phone: '12345' }, user: adminUser },
        res,
        vi.fn()
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Phone must be exactly 10 digits',
      });
    });

    it('returns 400 when no editable fields provided', async () => {
      const res = mockRes();

      await updateTechnician(
        { params: { id: 'tech-1' }, body: {}, user: adminUser },
        res,
        vi.fn()
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No editable fields provided',
      });
    });

    it('returns 404 when technician is not owned by the admin', async () => {
      mockFrom.mockReturnValue(chainable({ data: null, error: { code: 'PGRST116' } }));
      const res = mockRes();

      await updateTechnician(
        { params: { id: 'tech-x' }, body: { full_name: 'New Name' }, user: adminUser },
        res,
        vi.fn()
      );

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Technician not found' });
    });

    it('normalizes phone and updates the technician', async () => {
      const updated = {
        id: 'tech-1',
        full_name: 'New Name',
        phone: '3128471928',
        is_active: false,
      };
      const chain = chainable({ data: updated, error: null });
      mockFrom.mockReturnValue(chain);
      const res = mockRes();

      await updateTechnician(
        {
          params: { id: 'tech-1' },
          body: { full_name: '  New Name  ', phone: '(312) 847-1928', is_active: false },
          user: adminUser,
        },
        res,
        vi.fn()
      );

      expect(chain.update).toHaveBeenCalledWith({
        full_name: 'New Name',
        phone: '3128471928',
        is_active: false,
      });
      expect(chain.eq).toHaveBeenCalledWith('admin_id', 'admin-1');
      expect(res.json).toHaveBeenCalledWith(updated);
    });
  });

  describe('deleteTechnician', () => {
    const adminUser = {
      id: 'admin-1',
      email: 'admin@example.com',
      user_metadata: { role: 'admin' },
    };

    it('returns 403 when caller is not an admin', async () => {
      const res = mockRes();

      await deleteTechnician(
        {
          params: { id: 'tech-1' },
          user: { id: 'tech-1', user_metadata: { role: 'technician' } },
        },
        res,
        vi.fn()
      );

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Only an admin can delete technicians',
      });
    });

    it('returns 403 for the public demo account', async () => {
      const res = mockRes();

      await deleteTechnician(
        {
          params: { id: 'tech-1' },
          user: { id: 'demo-1', email: 'demo@fleetcd.com', user_metadata: { role: 'admin' } },
        },
        res,
        vi.fn()
      );

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Deleting technicians is disabled in the demo workspace',
      });
    });

    it('returns 404 when technician is not owned by the admin', async () => {
      mockFrom.mockReturnValue(chainable({ data: null, error: { code: 'PGRST116' } }));
      const res = mockRes();

      await deleteTechnician(
        { params: { id: 'tech-x' }, user: adminUser },
        res,
        vi.fn()
      );

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Technician not found' });
    });

    it('unassigns open jobs, deletes the technician, and removes the auth user', async () => {
      const fetchChain = chainable({
        data: { id: 'tech-1', user_id: 'auth-user-1' },
        error: null,
      });
      const jobsChain = chainable({ error: null });
      const deleteChain = chainable({ error: null });
      mockFrom
        .mockReturnValueOnce(fetchChain)
        .mockReturnValueOnce(jobsChain)
        .mockReturnValueOnce(deleteChain);
      mockDeleteUser.mockResolvedValue({ error: null });
      const res = mockRes();

      await deleteTechnician(
        { params: { id: 'tech-1' }, user: adminUser },
        res,
        vi.fn()
      );

      expect(jobsChain.update).toHaveBeenCalledWith({
        assigned_technician: null,
        status: 'Unassigned',
      });
      expect(jobsChain.in).toHaveBeenCalledWith('status', ['Assigned', 'In Progress']);
      expect(deleteChain.delete).toHaveBeenCalled();
      expect(mockDeleteUser).toHaveBeenCalledWith('auth-user-1');
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });

    it('returns 409 when the delete is blocked by job attachments', async () => {
      const fetchChain = chainable({
        data: { id: 'tech-1', user_id: 'auth-user-1' },
        error: null,
      });
      const jobsChain = chainable({ error: null });
      const deleteChain = chainable({ error: { code: '23503' } });
      mockFrom
        .mockReturnValueOnce(fetchChain)
        .mockReturnValueOnce(jobsChain)
        .mockReturnValueOnce(deleteChain);
      const res = mockRes();

      await deleteTechnician(
        { params: { id: 'tech-1' }, user: adminUser },
        res,
        vi.fn()
      );

      expect(res.status).toHaveBeenCalledWith(409);
      expect(mockDeleteUser).not.toHaveBeenCalled();
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
