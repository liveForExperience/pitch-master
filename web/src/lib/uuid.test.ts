import { afterEach, describe, expect, it, vi } from 'vitest';
import { randomUUID } from './uuid';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('randomUUID', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses crypto.randomUUID when available', () => {
    const spy = vi.fn(() => 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee');
    vi.stubGlobal('crypto', { randomUUID: spy, getRandomValues: vi.fn() });
    expect(randomUUID()).toBe('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee');
    expect(spy).toHaveBeenCalledOnce();
  });

  it('falls back when randomUUID is missing (plain HTTP / some WebViews)', () => {
    vi.stubGlobal('crypto', {
      getRandomValues: (arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) arr[i] = i * 17;
        return arr;
      },
    });
    const id = randomUUID();
    expect(id).toMatch(UUID_RE);
  });

  it('falls back to Math.random when crypto is unavailable', () => {
    vi.stubGlobal('crypto', undefined);
    const id = randomUUID();
    expect(id).toMatch(UUID_RE);
  });
});
