import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminSession } from './use-admin-session';

/** Redirect to read-only event page when server says this device is not admin. */
export function useRequireAdmin(
  shortCode: string,
  eventId: string | undefined,
  redirectTo: string,
) {
  const nav = useNavigate();
  const { canWrite, loading } = useAdminSession(shortCode, eventId);

  useEffect(() => {
    if (!eventId || loading) return;
    if (!canWrite) {
      nav(redirectTo, { replace: true });
    }
  }, [eventId, canWrite, loading, nav, redirectTo]);

  return { canWrite, loading };
}
