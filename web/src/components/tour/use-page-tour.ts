import { useEffect, useState } from 'react';
import { useOnboardingStore } from '../../stores/onboarding';

/**
 * Drives a Tour for the current page.
 *
 * Opens automatically on the first visit (unless skipped/completed), and
 * also opens on demand when something elsewhere (e.g. the "Replay tour"
 * button in Settings) calls `requestTour(tourId)` — the destination page
 * picks the request up on mount.
 *
 * `ready` lets the page hold the tour back until target elements are
 * mounted (e.g. after data has loaded).
 */
export function usePageTour(tourId: string, opts: { ready?: boolean; auto?: boolean } = {}) {
  const { ready = true, auto = true } = opts;
  const [open, setOpen] = useState(false);
  const isCompleted = useOnboardingStore((s) => s.isCompleted(tourId));
  const pendingTour = useOnboardingStore((s) => s.pendingTour);
  const consumePendingTour = useOnboardingStore((s) => s.consumePendingTour);

  // Explicit cross-page request takes priority — fires as soon as we're
  // ready, even if the user had previously completed this tour.
  useEffect(() => {
    if (!ready) return;
    if (pendingTour !== tourId) return;
    setOpen(true);
    consumePendingTour(tourId);
  }, [ready, pendingTour, tourId, consumePendingTour]);

  // First-visit auto-open.
  useEffect(() => {
    if (!ready || !auto || isCompleted) return;
    if (pendingTour && pendingTour !== tourId) return;
    const id = window.setTimeout(() => setOpen(true), 400);
    return () => window.clearTimeout(id);
  }, [ready, auto, isCompleted, pendingTour, tourId]);

  return { open, close: () => setOpen(false) };
}
