import { create } from 'zustand';

interface NavState {
  profileVisible: boolean;
  setProfileVisible: (visible: boolean) => void;
}

const useNavStore = create<NavState>((set) => ({
  profileVisible: false,
  setProfileVisible: (visible) => set({ profileVisible: visible }),
}));

export default useNavStore;
