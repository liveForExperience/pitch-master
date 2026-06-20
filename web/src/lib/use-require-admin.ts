import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  deriveRequireAdminLoading,
  shouldRedirectNonAdmin,
} from './admin-session-logic';
import { useAdminSession } from './use-admin-session';

/** Redirect to read-only event page when server says this device is not admin. */
export function useRequireAdmin(
  shortCode: string,
  eventId: string | undefined,
  redirectTo: string,
) {
  const nav = useNavigate();
  const { canWrite, loading: sessionLoading } = useAdminSession(shortCode, eventId);
  const loading = deriveRequireAdminLoading(sessionLoading, eventId, shortCode);

  useEffect(() => {
    if (
      !shouldRedirectNonAdmin({
        eventId,
        shortCode,
        loading: sessionLoading,
        canWrite,
      })
    ) {
      return;
    }
    nav(redirectTo, { replace: true });
  }, [eventId, shortCode, canWrite, sessionLoading, nav, redirectTo]);

  return { canWrite, loading };
}
