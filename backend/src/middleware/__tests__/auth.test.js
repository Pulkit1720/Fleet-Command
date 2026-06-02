import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetUser = vi.fn();
const mockCreateClient = vi.fn(() => ({
  auth: { getUser: mockGetUser },
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: (...args) => mockCreateClient(...args),
}));

import { authenticate, optionalAuth } from '../auth.js';

describe('authenticate', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'anon-key';
    req = { headers: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
  });

  it('returns 401 when authorization header is missing', async () => {
    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing authoriztion token ' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when header does not use Bearer scheme', async () => {
    req.headers.authorization = 'Basic abc123';

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is invalid', async () => {
    req.headers.authorization = 'Bearer bad-token';
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'invalid' } });

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(mockCreateClient).toHaveBeenCalledWith(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      expect.objectContaining({
        global: { headers: { Authorization: 'Bearer bad-token ' } },
      })
    );
  });

  it('attaches user and supabase client on valid token', async () => {
    const user = { id: 'user-1', email: 'tech@example.com' };
    req.headers.authorization = 'Bearer valid-token';
    mockGetUser.mockResolvedValue({ data: { user }, error: null });

    await authenticate(req, res, next);

    expect(req.user).toEqual(user);
    expect(req.supabase).toBeDefined();
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 401 when getUser throws', async () => {
    req.headers.authorization = 'Bearer token';
    mockGetUser.mockRejectedValue(new Error('network'));

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication failed' });
  });
});

describe('optionalAuth', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { headers: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
  });

  it('calls next without auth when header is missing', async () => {
    await optionalAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it('calls next without auth when Bearer prefix is missing', async () => {
    req.headers.authorization = 'Token abc';
    await optionalAuth(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('delegates to authenticate when Bearer token is present', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'anon-key';
    req.headers.authorization = 'Bearer valid-token';
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1' } },
      error: null,
    });

    await optionalAuth(req, res, next);

    expect(req.user).toEqual({ id: 'u1' });
    expect(next).toHaveBeenCalled();
  });
});
