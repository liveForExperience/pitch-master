import { create } from 'zustand';
import apiClient from '../api/client';

interface AuthUser {
  user?: { 
    id: number; 
    username: string; 
    roles?: Array<{ id: number; name: string; description: string }>;
  };
  player?: { id: number; nickname: string; position: string; preferredFoot: string; rating: number; clubName?: string };
}

interface AuthState {
  me: AuthUser | null;
  loading: boolean;
  fetched: boolean;
  fetchMe: () => Promise<void>;
  clear: () => void;
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

  isAdmin: () => {
    const roles = get().me?.user?.roles;
    if (!roles) return false;
    return roles.some(r => r.name === 'admin');
  },
}));

export default useAuthStore;
