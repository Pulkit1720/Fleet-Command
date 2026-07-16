import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFrom = vi.fn();

vi.mock('../../config/supabase.js', () => ({
  default: { from: (...args) => mockFrom(...args) },
}));

import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
} from '../clientsController.js';

function chainable(finalResult) {
  const chain = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
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
  return chain;
}

function mockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
}

describe('clientsController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getClients', () => {
    it('merges saved clients with clients derived from jobs', async () => {
      const clientChain = chainable({
        data: [
          {
            id: 'c1',
            client_name: 'Acme',
            contact_name: 'Jo',
            email: 'jo@acme.com',
            phone: '1234567890',
          },
        ],
        error: null,
      });
      const jobsChain = chainable({
        data: [
          { client_name: 'Acme', status: 'Completed', scheduled_date: '2026-07-01' },
          { client_name: 'Acme', status: 'Assigned', scheduled_date: '2026-07-14' },
          {
            client_name: 'Globex',
            client_phone: '9876543210',
            status: 'Unassigned',
            scheduled_date: '2026-07-10',
          },
        ],
        error: null,
      });
      mockFrom.mockImplementation((table) =>
        table === 'client' ? clientChain : jobsChain
      );

      const res = mockRes();
      await getClients({ user: { id: 'admin-1' } }, res, vi.fn());

      const payload = res.json.mock.calls[0][0];
      expect(payload).toHaveLength(2);

      const acme = payload.find((c) => c.client_name === 'Acme');
      expect(acme).toMatchObject({
        id: 'c1',
        saved: true,
        job_count: 2,
        active_job_count: 1,
        last_job_date: '2026-07-14',
      });

      const globex = payload.find((c) => c.client_name === 'Globex');
      expect(globex).toMatchObject({
        id: null,
        saved: false,
        phone: '9876543210',
        job_count: 1,
        active_job_count: 1,
      });
    });
  });

  describe('createClient', () => {
    it('rejects a missing client name', async () => {
      const res = mockRes();
      await createClient({ user: { id: 'admin-1' }, body: {} }, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('normalizes phone numbers and scopes to the admin', async () => {
      const chain = chainable({ data: { id: 'c9', client_name: 'Acme' }, error: null });
      mockFrom.mockReturnValue(chain);

      const req = {
        user: { id: 'admin-1' },
        body: { client_name: 'Acme', phone: '+1 (312) 847-1928' },
      };
      const res = mockRes();
      await createClient(req, res, vi.fn());

      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          client_name: 'Acme',
          contact_name: 'Acme',
          phone: '3128471928',
          created_by: 'admin-1',
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('maps unique violations to 409', async () => {
      const chain = chainable({ data: null, error: { code: '23505' } });
      mockFrom.mockReturnValue(chain);

      const res = mockRes();
      await createClient(
        { user: { id: 'admin-1' }, body: { client_name: 'Acme' } },
        res,
        vi.fn()
      );

      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe('updateClient', () => {
    it('updates a client scoped by id and admin', async () => {
      const chain = chainable({ data: { id: 'c1', client_name: 'Acme 2' }, error: null });
      mockFrom.mockReturnValue(chain);

      const req = {
        params: { id: 'c1' },
        user: { id: 'admin-1' },
        body: { client_name: 'Acme 2' },
      };
      const res = mockRes();
      await updateClient(req, res, vi.fn());

      expect(chain.eq).toHaveBeenCalledWith('id', 'c1');
      expect(chain.eq).toHaveBeenCalledWith('created_by', 'admin-1');
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ client_name: 'Acme 2', saved: true })
      );
    });
  });

  describe('deleteClient', () => {
    it('deletes a client scoped by id and admin', async () => {
      const chain = chainable({ error: null });
      mockFrom.mockReturnValue(chain);

      const req = { params: { id: 'c1' }, user: { id: 'admin-1' } };
      const res = mockRes();
      await deleteClient(req, res, vi.fn());

      expect(chain.delete).toHaveBeenCalled();
      expect(chain.eq).toHaveBeenCalledWith('id', 'c1');
      expect(chain.eq).toHaveBeenCalledWith('created_by', 'admin-1');
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });
  });
});
