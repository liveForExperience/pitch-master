import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatDeviceTail, getOrCreateDeviceId } from './device-id';

describe('device-id', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('formatDeviceTail shows last 4 hex chars', () => {
    expect(formatDeviceTail('aaaaaaaa-bbbb-cccc-dddd-1234abcd')).toBe('ABCD');
  });

  it('getOrCreateDeviceId returns stable value when storage works', () => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    });
    const a = getOrCreateDeviceId();
    const b = getOrCreateDeviceId();
    expect(a).toBe(b);
    expect(a.length).toBeGreaterThan(10);
  });
});
