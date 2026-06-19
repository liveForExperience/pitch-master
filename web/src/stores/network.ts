import { create } from 'zustand';
import { probeOnline } from '../lib/network-probe';

type NetworkState = {
  online: boolean;
  probing: boolean;
  setOnline: (online: boolean) => void;
  probe: () => Promise<boolean>;
};

export const useNetworkStore = create<NetworkState>((set) => ({
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  probing: false,
  setOnline: (online) => set({ online }),
  probe: async () => {
    set({ probing: true });
    try {
      const reachable = await probeOnline();
      set({ online: reachable });
      return reachable;
    } finally {
      set({ probing: false });
    }
  },
}));
