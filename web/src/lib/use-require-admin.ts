import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminToken } from '../lib/storage';

/** 无 adminToken 时重定向（分享码观众不可进入管理页） */
export function useRequireAdmin(eventId: string | undefined, redirectTo: string) {
  const nav = useNavigate();
  const token = eventId ? getAdminToken(eventId) : null;

  useEffect(() => {
    if (eventId && !token) {
      nav(redirectTo, { replace: true });
    }
  }, [eventId, token, nav, redirectTo]);

  return token;
}
