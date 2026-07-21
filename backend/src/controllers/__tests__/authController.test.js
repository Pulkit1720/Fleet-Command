import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFrom, mockUpdateUserById } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockUpdateUserById: vi.fn(),
}));

vi.mock('../../config/supabase.js', () => ({
  default: {
    from: (...args) => mockFrom(...args),
    auth: {
      admin: {
        updateUserById: (...args) => mockUpdateUserById(...args),
      },
    },
  },
}));

import { getInvite, registerTechnician } from '../authController.js';
import { hashToken } from '../../services/inviteTokenService.js';

// A chainable that resolves whatever the terminal call (maybeSingle/single) needs
// and captures the last update payload for assertions.
function chainable(finalResult) {
  const chain = {
    select: vi.fn(),
    update: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue(finalResult),
    single: vi.fn().mockResolvedValue(finalResult),
    then(onFulfilled, onRejected) {
      return Promise.resolve(finalResult).then(onFulfilled, onRejected);
    },
  };
  chain.select.mockReturnValue(chain);
  chain.update.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  return chain;
}

function mockRes() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn() };
}

const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
const past = new Date(Date.now() - 60 * 1000).toISOString();

describe('authController invite/registration', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getInvite', () => {
    it('returns name and email for a valid token', async () => {
      mockFrom.mockReturnValue(
        chainable({
          data: {
            id: 'tech-1',
            user_id: 'user-1',
            full_name: 'Sam Field',
            email: 'sam@test.com',
            invite_token_expires_at: future,
            invite_accepted_at: null,
          },
          error: null,
        })
      );
      const res = mockRes();

      await getInvite({ params: { token: 'raw-token' } }, res, vi.fn());

      expect(res.json).toHaveBeenCalledWith({ full_name: 'Sam Field', email: 'sam@test.com' });
    });

    it('returns 404 for an unknown token', async () => {
      mockFrom.mockReturnValue(chainable({ data: null, error: null }));
      const res = mockRes();

      await getInvite({ params: { token: 'nope' } }, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 404 for an expired token', async () => {
      mockFrom.mockReturnValue(
        chainable({
          data: { id: 't', user_id: 'u', full_name: 'X', email: 'x@t.com', invite_token_expires_at: past, invite_accepted_at: null },
          error: null,
        })
      );
      const res = mockRes();

      await getInvite({ params: { token: 'old' } }, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 404 for an already-accepted invite', async () => {
      mockFrom.mockReturnValue(
        chainable({
          data: { id: 't', user_id: 'u', full_name: 'X', email: 'x@t.com', invite_token_expires_at: future, invite_accepted_at: future },
          error: null,
        })
      );
      const res = mockRes();

      await getInvite({ params: { token: 'used' } }, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('registerTechnician', () => {
    it('rejects a short password before touching the token', async () => {
      const res = mockRes();

      await registerTechnician({ body: { token: 'raw', password: 'short' } }, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('sets the password and consumes the invite', async () => {
      const lookupChain = chainable({
        data: {
          id: 'tech-1',
          user_id: 'user-1',
          full_name: 'Sam',
          email: 'sam@test.com',
          invite_token_expires_at: future,
          invite_accepted_at: null,
        },
        error: null,
      });
      const updateChain = chainable({ error: null });
      mockFrom.mockReturnValueOnce(lookupChain).mockReturnValueOnce(updateChain);
      mockUpdateUserById.mockResolvedValue({ error: null });
      const res = mockRes();

      await registerTechnician({ body: { token: 'raw-token', password: 'longenough' } }, res, vi.fn());

      expect(mockUpdateUserById).toHaveBeenCalledWith('user-1', { password: 'longenough' });
      expect(updateChain.update).toHaveBeenCalledWith(
        expect.objectContaining({ invite_token_hash: null, invite_token_expires_at: null })
      );
      expect(updateChain.eq).toHaveBeenCalledWith('id', 'tech-1');
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });

    it('returns 404 when the token is invalid', async () => {
      mockFrom.mockReturnValue(chainable({ data: null, error: null }));
      const res = mockRes();

      await registerTechnician({ body: { token: 'bad', password: 'longenough' } }, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(404);
      expect(mockUpdateUserById).not.toHaveBeenCalled();
    });

    it('looks the invite up by the hashed token, never the raw value', async () => {
      const lookupChain = chainable({ data: null, error: null });
      mockFrom.mockReturnValue(lookupChain);
      const res = mockRes();

      await registerTechnician({ body: { token: 'raw-token', password: 'longenough' } }, res, vi.fn());

      expect(lookupChain.eq).toHaveBeenCalledWith('invite_token_hash', hashToken('raw-token'));
      expect(lookupChain.eq).not.toHaveBeenCalledWith('invite_token_hash', 'raw-token');
    });
  });
});
