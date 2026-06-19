import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useT } from '../../i18n';
import { useOnboardingStore } from '../../stores/onboarding';

export type TourStep = {
  /**
   * CSS selector for the highlighted target. Omit to render the step as a
   * centered "intro" / "outro" card without a spotlight.
   */
  selector?: string;
  /** i18n key for the step title (short, button-like). */
  titleKey: string;
  /** i18n key for the step description (1-2 sentences). */
  descKey: string;
};

type TooltipBox = {
  top: number;
  left: number;
  width: number;
  placement: 'top' | 'bottom' | 'center';
};

const HOLE_PADDING = 8;
const TOOLTIP_GAP = 14;
const TOOLTIP_MARGIN = 12;

function getTargetRect(selector?: string): DOMRect | null {
  if (!selector) return null;
  const el = document.querySelector(selector);
  if (!el) return null;
  return el.getBoundingClientRect();
}

function computeTooltipBox(
  rect: DOMRect | null,
  tooltipHeight: number,
  viewport: { w: number; h: number },
): TooltipBox {
  const maxWidth = Math.min(360, viewport.w - TOOLTIP_MARGIN * 2);
  if (!rect) {
    return {
      top: Math.max(TOOLTIP_MARGIN, viewport.h / 2 - tooltipHeight / 2),
      left: Math.max(TOOLTIP_MARGIN, viewport.w / 2 - maxWidth / 2),
      width: maxWidth,
      placement: 'center',
    };
  }
  const spaceBelow = viewport.h - rect.bottom;
  const spaceAbove = rect.top;
  const placement: 'top' | 'bottom' =
    spaceBelow >= tooltipHeight + TOOLTIP_GAP + TOOLTIP_MARGIN || spaceBelow >= spaceAbove
      ? 'bottom'
      : 'top';
  const top =
    placement === 'bottom'
      ? rect.bottom + TOOLTIP_GAP
      : rect.top - TOOLTIP_GAP - tooltipHeight;
  const centerX = rect.left + rect.width / 2;
  let left = centerX - maxWidth / 2;
  left = Math.max(TOOLTIP_MARGIN, Math.min(viewport.w - maxWidth - TOOLTIP_MARGIN, left));
  const safeTop = Math.max(
    TOOLTIP_MARGIN,
    Math.min(viewport.h - tooltipHeight - TOOLTIP_MARGIN, top),
  );
  return { top: safeTop, left, width: maxWidth, placement };
}

function Spotlight({ rect }: { rect: DOMRect | null }) {
  if (!rect) {
    return (
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: 'rgba(15, 23, 42, 0.62)' }}
      />
    );
  }
  const top = rect.top - HOLE_PADDING;
  const left = rect.left - HOLE_PADDING;
  const width = rect.width + HOLE_PADDING * 2;
  const height = rect.height + HOLE_PADDING * 2;
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed left-0 right-0 top-0"
        style={{ height: Math.max(0, top), background: 'rgba(15, 23, 42, 0.62)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed left-0 right-0 bottom-0"
        style={{
          top: top + height,
          background: 'rgba(15, 23, 42, 0.62)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed left-0"
        style={{
          top,
          width: Math.max(0, left),
          height,
          background: 'rgba(15, 23, 42, 0.62)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed right-0"
        style={{
          top,
          left: left + width,
          height,
          background: 'rgba(15, 23, 42, 0.62)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed rounded-2xl ring-2 ring-primary/80"
        style={{
          top,
          left,
          width,
          height,
          boxShadow: '0 0 0 3px rgba(255,255,255,0.55) inset',
        }}
      />
    </>
  );
}

export function Tour({
  tourId,
  steps,
  open,
  onClose,
}: {
  tourId: string;
  steps: TourStep[];
  open: boolean;
  onClose: () => void;
}) {
  const t = useT();
  const markCompleted = useOnboardingStore((s) => s.markCompleted);
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState<TooltipBox>({
    top: 0,
    left: 0,
    width: 320,
    placement: 'center',
  });

  const step = steps[idx];

  // Reset to step 0 every time the tour is (re-)opened.
  useEffect(() => {
    if (open) setIdx(0);
  }, [open, tourId]);

  const finish = useCallback(() => {
    markCompleted(tourId);
    onClose();
  }, [markCompleted, tourId, onClose]);

  const recompute = useCallback(() => {
    if (!step) return;
    const next = getTargetRect(step.selector);
    setRect(next);
    requestAnimationFrame(() => {
      const h = tooltipRef.current?.offsetHeight ?? 180;
      setBox(
        computeTooltipBox(next, h, {
          w: window.innerWidth,
          h: window.innerHeight,
        }),
      );
    });
  }, [step]);

  // Scroll into view + measure on step change.
  useLayoutEffect(() => {
    if (!open || !step) return;
    const el = step.selector ? document.querySelector(step.selector) : null;
    if (el && 'scrollIntoView' in el) {
      (el as HTMLElement).scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    // Allow the smooth-scroll a frame or two to settle before measuring.
    const r1 = requestAnimationFrame(recompute);
    const t1 = window.setTimeout(recompute, 220);
    return () => {
      cancelAnimationFrame(r1);
      window.clearTimeout(t1);
    };
  }, [open, step, recompute]);

  // Keep position correct on resize / scroll / orientation change.
  useEffect(() => {
    if (!open) return;
    const onChange = () => recompute();
    window.addEventListener('resize', onChange);
    window.addEventListener('scroll', onChange, true);
    return () => {
      window.removeEventListener('resize', onChange);
      window.removeEventListener('scroll', onChange, true);
    };
  }, [open, recompute]);

  // Keyboard escape skips the tour (treated as complete: don't pester twice).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
      if (e.key === 'ArrowRight' && idx < steps.length - 1) setIdx((i) => i + 1);
      if (e.key === 'ArrowLeft' && idx > 0) setIdx((i) => i - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, idx, steps.length, finish]);

  if (!open || !step) return null;

  const isLast = idx === steps.length - 1;
  const isFirst = idx === 0;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('tour.aria.label')}
      className="fixed inset-0 z-[100]"
    >
      <Spotlight rect={rect} />

      <div
        ref={tooltipRef}
        className="fixed rounded-2xl border border-border bg-surface p-4 shadow-2xl"
        style={{ top: box.top, left: box.left, width: box.width }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-textSec">
            {t('tour.step', { current: idx + 1, total: steps.length })}
          </div>
          <button
            type="button"
            onClick={finish}
            className="-mr-1 -mt-1 rounded-md px-2 py-1 text-xs font-semibold text-textSec hover:text-textPri active:bg-elevated"
          >
            {t('tour.skip')}
          </button>
        </div>

        <h3 className="mt-2 text-base font-bold text-textPri">{t(step.titleKey)}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-textSec">{t(step.descKey)}</p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={isFirst}
            className="min-h-10 rounded-xl px-3 text-sm font-semibold text-textSec disabled:opacity-30 active:bg-elevated"
          >
            {t('tour.prev')}
          </button>
          <div className="flex flex-1 justify-center gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === idx ? 'w-5 bg-primary' : 'w-1.5 bg-border'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => (isLast ? finish() : setIdx((i) => i + 1))}
            className="min-h-10 rounded-xl bg-primary px-4 text-sm font-bold text-textInv active:bg-primaryDk"
          >
            {isLast ? t('tour.done') : t('tour.next')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
