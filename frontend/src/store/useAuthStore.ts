import { create } from 'zustand';
import apiClient from '../api/client';
import type { Tournament } from '../api/tournament';

interface AuthUser {
  user?: { 
    id: number; 
    username: string; 
    roles?: Array<{ id: number; name: string; description: string }>;
  };
  player?: { id: number; nickname: string; position: string; preferredFoot: string; rating: number; clubName?: string; gender?: string; height?: number };
  isPlatformAdmin?: boolean;
  adminTournamentIds?: number[];
  joinedTournamentIds?: number[];
  joinedTournaments?: Tournament[];
}

interface AuthState {
  me: AuthUser | null;
  loading: boolean;
  fetched: boolean;
  fetchMe: () => Promise<void>;
  clear: () => void;
  /** 是否为平台管理员 */
  isPlatformAdmin: () => boolean;
  /** 是否为指定 Tournament 的管理员（含平台管理员） */
  isTournamentAdmin: (tournamentId: number) => boolean;
  /** 兼容旧代码：admin 角色或 platform_admin */
  isAdmin: () => boolean;
}

const useAuthStore = create<AuthState>((set, get) => ({
  me: null,
  loading: false,
  fetched: false,

  fetchMe: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const data: any = await apiClient.get('/auth/me');
      set({ me: data, fetched: true });
    } catch {
      set({ me: null, fetched: true });
    } finally {
      set({ loading: false });
    }
  },

  clear: () => set({ me: null, fetched: false }),

  isPlatformAdmin: () => {
    return get().me?.isPlatformAdmin === true;
  },

  isTournamentAdmin: (tournamentId: number) => {
    const me = get().me;
    if (!me) return false;
    if (me.isPlatformAdmin) return true;
    return me.adminTournamentIds?.includes(tournamentId) ?? false;
  },

  isAdmin: () => {
    const me = get().me;
    if (!me) return false;
    if (me.isPlatformAdmin) return true;
    const roles = me.user?.roles;
    if (!roles) return false;
    return roles.some(r => r.name === 'admin' || r.name === 'platform_admin');
  },
}));

export default useAuthStore;
