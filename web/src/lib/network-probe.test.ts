import { describe, expect, it, vi } from 'vitest';
import { countPendingOutbox, probeApiReachable, probeOnline } from './network-probe';

describe('network-probe', () => {
  it('probeApiReachable returns true on ok response', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: true });
    await expect(probeApiReachable(fetchFn)).resolves.toBe(true);
    expect(fetchFn).toHaveBeenCalledWith('/api/health', expect.objectContaining({ cache: 'no-store' }));
  });

  it('probeApiReachable returns false on error', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('offline'));
    await expect(probeApiReachable(fetchFn)).resolves.toBe(false);
  });

  it('probeOnline respects navigator.onLine', async () => {
    const original = navigator.onLine;
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    await expect(probeOnline(vi.fn())).resolves.toBe(false);
    Object.defineProperty(navigator, 'onLine', { value: original, configurable: true });
  });

  it('countPendingOutbox counts flushable items', () => {
    expect(
      countPendingOutbox([
        { status: 'PENDING' },
        { status: 'SENDING' },
        { status: 'FAILED', retryCount: 2 },
        { status: 'FAILED', retryCount: 5 },
      ]),
    ).toBe(3);
  });
});
