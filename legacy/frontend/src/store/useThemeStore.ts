import { create } from 'zustand';

export type ThemeMode = 'dark' | 'light';

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

const STORAGE_KEY = 'pm-theme';

const saved = localStorage.getItem(STORAGE_KEY);
const initial: ThemeMode = saved === 'light' ? 'light' : 'dark';

const useThemeStore = create<ThemeState>((set) => ({
  theme: initial,

  setTheme: (theme: ThemeMode) => {
    localStorage.setItem(STORAGE_KEY, theme);
    set({ theme });
  },
}));

export default useThemeStore;
