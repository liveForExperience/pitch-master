import { describe, expect, it } from 'vitest';
import {
  buildAdminSessionKey,
  deriveRequireAdminLoading,
  isAdminSessionLoading,
  isWaitingForAdminContext,
  normalizeShortCode,
  shouldDeferAdminRedirect,
  shouldRedirectNonAdmin,
} from './admin-session-logic';

describe('admin-session-logic', () => {
  it('normalizeShortCode trims and uppercases', () => {
    expect(normalizeShortCode(' abc123 ')).toBe('ABC123');
  });

  it('buildAdminSessionKey encodes code, eventId, and token', () => {
    expect(buildAdminSessionKey('abc', 'evt-1', 'tok_x')).toBe('ABC:evt-1:tok_x');
    expect(buildAdminSessionKey('abc', undefined, null)).toBe('ABC::');
    expect(buildAdminSessionKey('', 'evt-1', 'tok_x')).toBe('');
  });

  it('isAdminSessionLoading is true when key changed before resolve', () => {
    expect(isAdminSessionLoading('ABC:evt:tok', '')).toBe(true);
    expect(isAdminSessionLoading('ABC:evt:tok', 'ABC:evt:tok')).toBe(false);
    expect(isAdminSessionLoading('', '')).toBe(false);
  });

  it('isWaitingForAdminContext when eventId exists without shortCode', () => {
    expect(isWaitingForAdminContext('evt-1', '')).toBe(true);
    expect(isWaitingForAdminContext('evt-1', '  ')).toBe(true);
    expect(isWaitingForAdminContext(undefined, 'ABC')).toBe(false);
    expect(isWaitingForAdminContext('evt-1', 'ABC')).toBe(false);
  });

  it('shouldDeferAdminRedirect blocks until context and session are ready', () => {
    expect(
      shouldDeferAdminRedirect({ eventId: 'evt-1', shortCode: 'ABC', loading: true }),
    ).toBe(true);
    expect(
      shouldDeferAdminRedirect({ eventId: 'evt-1', shortCode: '', loading: false }),
    ).toBe(true);
    expect(
      shouldDeferAdminRedirect({ eventId: undefined, shortCode: 'ABC', loading: false }),
    ).toBe(true);
    expect(
      shouldDeferAdminRedirect({ eventId: 'evt-1', shortCode: 'ABC', loading: false }),
    ).toBe(false);
  });

  it('shouldRedirectNonAdmin only fires after defer conditions clear', () => {
    expect(
      shouldRedirectNonAdmin({
        eventId: 'evt-1',
        shortCode: 'ABC',
        loading: true,
        canWrite: false,
      }),
    ).toBe(false);
    expect(
      shouldRedirectNonAdmin({
        eventId: 'evt-1',
        shortCode: 'ABC',
        loading: false,
        canWrite: false,
      }),
    ).toBe(true);
    expect(
      shouldRedirectNonAdmin({
        eventId: 'evt-1',
        shortCode: 'ABC',
        loading: false,
        canWrite: true,
      }),
    ).toBe(false);
  });

  it('deriveRequireAdminLoading covers session poll and missing shortCode', () => {
    expect(deriveRequireAdminLoading(true, 'evt-1', 'ABC')).toBe(true);
    expect(deriveRequireAdminLoading(false, 'evt-1', '')).toBe(true);
    expect(deriveRequireAdminLoading(false, 'evt-1', 'ABC')).toBe(false);
  });

  it('regression: eventId appearing before shortCode must defer redirect', () => {
    const args = { eventId: 'evt-1' as string | undefined, shortCode: '', loading: false };
    expect(shouldDeferAdminRedirect(args)).toBe(true);
    expect(shouldRedirectNonAdmin({ ...args, canWrite: false })).toBe(false);
  });

  it('regression: stale viewer result must not redirect while session reloads', () => {
    const key = buildAdminSessionKey('ABC', 'evt-1', 'tok_old');
    expect(isAdminSessionLoading(key, buildAdminSessionKey('ABC', undefined, null))).toBe(true);
    expect(
      shouldRedirectNonAdmin({
        eventId: 'evt-1',
        shortCode: 'ABC',
        loading: true,
        canWrite: false,
      }),
    ).toBe(false);
  });
});
