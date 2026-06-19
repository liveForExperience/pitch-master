import { describe, expect, it } from 'vitest';
import { ApiError, parseApiFailure, parseApiResponse } from './parse-response';

describe('parseApiResponse', () => {
  it('returns data on ok envelope', () => {
    expect(parseApiResponse<{ id: string }>('{"ok":true,"data":{"id":"1"}}', 200)).toEqual({
      id: '1',
    });
  });

  it('throws ApiError on v2 failure envelope', () => {
    expect(() =>
      parseApiResponse('{"ok":false,"error":{"code":"not_found","message":"Event not found"}}', 404),
    ).toThrowError(ApiError);
    try {
      parseApiResponse('{"ok":false,"error":{"code":"not_found","message":"Event not found"}}', 404);
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).code).toBe('not_found');
    }
  });

  it('throws on empty body with friendly message', () => {
    expect(() => parseApiResponse('', 502)).toThrow(/后端服务未响应/);
  });

  it('parses legacy production failure shape', () => {
    const err = parseApiFailure({ error: 'not_found', path: '/api/events/X' }, 404);
    expect(err.code).toBe('not_found');
    expect(err.message).toContain('/api/events/X');
  });
});
