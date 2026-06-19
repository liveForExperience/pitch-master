import { describe, expect, it } from 'vitest';
import { OUTBOX_FLUSH_MESSAGE, OUTBOX_SYNC_TAG, canUseBackgroundSync } from './register-sync';

describe('register-sync', () => {
  it('exports stable sync constants', () => {
    expect(OUTBOX_SYNC_TAG).toBe('outbox-flush');
    expect(OUTBOX_FLUSH_MESSAGE).toBe('OUTBOX_FLUSH');
  });

  it('canUseBackgroundSync is false in vitest node env', () => {
    expect(canUseBackgroundSync()).toBe(false);
  });
});
