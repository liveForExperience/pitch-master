import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchAdminSession } from '../api/events';
import type { AdminSession } from '../api/types';
import {
  buildAdminSessionKey,
  isAdminSessionLoading,
  normalizeShortCode,
} from './admin-session-logic';
import { clearAdminToken, getAdminToken } from './storage';

const POLL_MS = 30_000;

export function useAdminSession(shortCode: string, eventId?: string | null) {
  const code = normalizeShortCode(shortCode);
  const adminToken = eventId ? getAdminToken(eventId) : null;
  const key = useMemo(
    () => buildAdminSessionKey(shortCode, eventId, adminToken),
    [shortCode, eventId, adminToken],
  );

  const [session, setSession] = useState<AdminSession | null>(null);
  const [resolvedKey, setResolvedKey] = useState('');
  const loading = isAdminSessionLoading(key, resolvedKey);

  const refresh = useCallback(async () => {
    if (!code) {
      setSession(null);
      setResolvedKey('');
      return;
    }
    const activeKey = buildAdminSessionKey(shortCode, eventId, adminToken);
    try {
      const data = await fetchAdminSession(code, adminToken);
      if (data.tokenStatus === 'invalid' && eventId) {
        clearAdminToken(eventId);
      }
      setSession(data);
    } catch {
      setSession(null);
    } finally {
      setResolvedKey(activeKey);
    }
  }, [code, adminToken, eventId, shortCode]);

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
