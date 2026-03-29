import { create } from 'zustand';
import type { Tournament } from '../api/tournament';

interface TournamentState {
  /** 当前选中的 Tournament */
  current: Tournament | null;
  /** 设置当前 Tournament */
  setCurrent: (tournament: Tournament | null) => void;
  /** 清空 */
  clear: () => void;
}

const useTournamentStore = create<TournamentState>((set) => ({
  current: null,

  setCurrent: (tournament) => set({ current: tournament }),

  clear: () => set({ current: null }),
}));

export default useTournamentStore;
