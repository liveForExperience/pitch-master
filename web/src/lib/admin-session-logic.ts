export function normalizeShortCode(shortCode: string): string {
  return shortCode.trim().toUpperCase();
}

export function buildAdminSessionKey(
  shortCode: string,
  eventId: string | null | undefined,
  adminToken: string | null,
): string {
  const code = normalizeShortCode(shortCode);
  return code ? `${code}:${eventId ?? ''}:${adminToken ?? ''}` : '';
}

/** True while the current session key has not been resolved by the server yet. */
export function isAdminSessionLoading(sessionKey: string, resolvedKey: string): boolean {
  return Boolean(sessionKey) && resolvedKey !== sessionKey;
}

/** eventId is known but shortCode is still missing (e.g. waiting on another fetch). */
export function isWaitingForAdminContext(
  eventId: string | undefined | null,
  shortCode: string,
): boolean {
  return Boolean(eventId && !shortCode.trim());
}

export function shouldDeferAdminRedirect(args: {
  eventId: string | undefined;
  shortCode: string;
  loading: boolean;
}): boolean {
  const code = args.shortCode.trim();
  if (!args.eventId || !code) return true;
  if (args.loading) return true;
  if (isWaitingForAdminContext(args.eventId, args.shortCode)) return true;
  return false;
}

export function shouldRedirectNonAdmin(args: {
  eventId: string | undefined;
  shortCode: string;
  loading: boolean;
  canWrite: boolean;
}): boolean {
  if (shouldDeferAdminRedirect(args)) return false;
  return !args.canWrite;
}

export function deriveRequireAdminLoading(
  sessionLoading: boolean,
  eventId: string | undefined,
  shortCode: string,
): boolean {
  return sessionLoading || isWaitingForAdminContext(eventId, shortCode);
}
