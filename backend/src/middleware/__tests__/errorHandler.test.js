import { describe, it, expect, vi, beforeEach } from 'vitest';
import { errorHandler, aysyncHandler } from '../errorHandler.js';

describe('errorHandler', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {};
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('returns 404 for PGRST116 not found code', () => {
    errorHandler({ code: 'PGRST116', message: 'not found' }, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Resource not found ' });
  });

  it('returns 409 for unique violation 23505', () => {
    errorHandler({ code: '23505' }, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Resource already exists' });
  });

  it('returns 400 for foreign key violation 23503', () => {
    errorHandler({ code: '23503' }, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid reference' });
  });

  it('uses err.status when provided', () => {
    errorHandler({ status: 422, message: 'Validation failed' }, req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({ error: 'Validation failed' });
  });

  it('defaults to 500 with generic message', () => {
    errorHandler({}, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });

  it('logs the error to console', () => {
    const err = new Error('boom');
    errorHandler(err, req, res, next);
    expect(console.error).toHaveBeenCalledWith('Error:', err);
  });
});

describe('aysyncHandler', () => {
  it('calls handler and forwards resolved result', async () => {
    const handler = vi.fn(async (req, res) => {
      res.json({ ok: true });
    });
    const wrapped = aysyncHandler(handler);
    const req = {};
    const res = { json: vi.fn() };
    const next = vi.fn();

    await wrapped(req, res, next);

    expect(handler).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it('forwards rejected promises to next', async () => {
    const error = new Error('async failure');
    const handler = vi.fn(async () => {
      throw error;
    });
    const wrapped = aysyncHandler(handler);
    const next = vi.fn();

    await wrapped({}, {}, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
