import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Tracks which onboarding "tours" the user has finished (or explicitly
 * skipped) on this device. We treat skip == complete: the goal is "don't
 * pester the user twice"; users can always re-trigger from Settings.
 *
 * `pendingTour` is a one-shot cross-page request: when the user taps a
 * "replay tour" button in Settings, we navigate to the target page and
 * leave the tour id here so the destination page can pick it up on mount.
 * It is intentionally NOT persisted to localStorage — only kept in memory
 * for the current session so a page refresh discards stale requests.
 */
type OnboardingState = {
  completed: Record<string, boolean>;
  pendingTour: string | null;
  isCompleted: (tourId: string) => boolean;
  markCompleted: (tourId: string) => void;
  resetTour: (tourId: string) => void;
  resetAll: () => void;
  /** Mark a tour for replay; destination page will consume it on mount. */
  requestTour: (tourId: string) => void;
  /** Returns true and clears `pendingTour` if it matches `tourId`. */
  consumePendingTour: (tourId: string) => boolean;
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      completed: {},
      pendingTour: null,
      isCompleted: (tourId) => Boolean(get().completed[tourId]),
      markCompleted: (tourId) =>
        set((s) => ({ completed: { ...s.completed, [tourId]: true } })),
      resetTour: (tourId) =>
        set((s) => {
          if (!s.completed[tourId]) return s;
          const next = { ...s.completed };
          delete next[tourId];
          return { completed: next };
        }),
      resetAll: () => set({ completed: {} }),
      requestTour: (tourId) =>
        set((s) => {
          const next = { ...s.completed };
          delete next[tourId];
          return { completed: next, pendingTour: tourId };
        }),
      consumePendingTour: (tourId) => {
        if (get().pendingTour !== tourId) return false;
        set({ pendingTour: null });
        return true;
      },
    }),
    {
      name: 'pitchmaster-onboarding',
      version: 1,
      // pendingTour is in-memory only — replays are a single navigation,
      // and we don't want them to survive across full page reloads.
      partialize: (state) => ({ completed: state.completed }),
    },
  ),
);
