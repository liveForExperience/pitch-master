import { useCallback, useEffect, useState } from 'react';
import { fetchAdminSession } from '../api/events';
import type { AdminSession } from '../api/types';
import { clearAdminToken, getAdminToken } from './storage';

const POLL_MS = 30_000;

export function useAdminSession(shortCode: string, eventId?: string | null) {
  const code = shortCode.trim().toUpperCase();
  const adminToken = eventId ? getAdminToken(eventId) : null;
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!code) {
      setSession(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchAdminSession(code, adminToken);
      if (data.tokenStatus === 'invalid' && eventId) {
        clearAdminToken(eventId);
      }
      setSession(data);
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [code, adminToken, eventId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  useEffect(() => {
    if (!code) return;
    const id = window.setInterval(() => void refresh(), POLL_MS);
    return () => window.clearInterval(id);
  }, [code, refresh]);

  const canWrite = session?.role === 'admin';
  const tokenRevoked = session?.tokenStatus === 'invalid';

  return {
    session,
    loading,
    canWrite,
    tokenRevoked,
    refresh,
  };
}
