import { useMemo, useState } from 'react';
import { ArrowUUpLeft } from '@phosphor-icons/react';
import type { GameDetail } from '../api/types';
import { buildRosterNameMap, deriveShootoutView } from '../lib/game-events';
import { useT } from '../i18n';
import { PagePanel, PagePanelBody, PagePanelHeader } from './ui/page-panel';

type RosterMember = { id: string; name: string };

type Props = {
  game: GameDetail;
  /** Called after the admin picks a scorer + made/missed. */
  onRecordKick: (side: 'A' | 'B', scorerRosterId: string, made: boolean) => void | Promise<void>;
  /** Called with the most recent active penalty kick when the admin taps "undo". */
  onUndoKick: (eventId: string) => void | Promise<void>;
  /** Called when admin confirms shootout is over. */
  onEndShootout: () => void | Promise<void>;
  /** Called with the SHOOTOUT_END event id to undo (reopen the shootout). */
  onReopenShootout: (endEventId: string) => void | Promise<void>;
  /** Optional dismissal — only meaningful before any kick is recorded. */
  onClose?: () => void;
};

type Pending = { side: 'A' | 'B'; scorer: RosterMember } | null;

/**
 * Penalty shootout recorder. Handles first-kicker selection, ordered
 * alternate kicks, undo of latest kick, and explicit "end shootout"
 * that requires equal rounds + a decisive lead. Never mutates the
 * regulation score.
 */
export function ShootoutPanel({
  game,
  onRecordKick,
  onUndoKick,
  onEndShootout,
  onReopenShootout,
  onClose,
}: Props) {
  const t = useT();
  const [firstPreference, setFirstPreference] = useState<'A' | 'B'>('A');
  const view = useMemo(
    () => deriveShootoutView(game.events, firstPreference),
    [game.events, firstPreference],
  );
  const rosterNames = useMemo(() => buildRosterNameMap(game), [game]);
  const [pending, setPending] = useState<Pending>(null);

  const rosterForSide = (side: 'A' | 'B'): RosterMember[] => {
    const team = side === 'A' ? game.teamA : game.teamB;
    return team?.roster.map((r) => ({ id: r.id, name: r.name })) ?? [];
  };

  const teamAName = game.teamA?.name ?? 'A';
  const teamBName = game.teamB?.name ?? 'B';
  const winnerName =
    view.winner === 'A' ? teamAName : view.winner === 'B' ? teamBName : null;

  const lastKick = view.kicks[view.kicks.length - 1];
  const shootoutStarted = view.kicks.length > 0;
  // The SHOOTOUT_END event that put us in ended state — needed to reopen.
  const endEventId = useMemo(() => {
    if (!view.ended) return null;
    const undone = new Set(
      game.events
        .filter((e) => e.type === 'UNDO' && e.undoTargetEventId)
        .map((e) => e.undoTargetEventId!),
    );
    const active = game.events.filter(
      (e) => e.type === 'SHOOTOUT_END' && !undone.has(e.id),
    );
    return active[active.length - 1]?.id ?? null;
  }, [game.events, view.ended]);

  const finalizeKick = (made: boolean) => {
    if (!pending) return;
    void onRecordKick(pending.side, pending.scorer.id, made);
    setPending(null);
  };

  const subtitle = view.ended
    ? winnerName
      ? t('shootout.ended', {
          team: winnerName,
          madeA: view.madeA,
          madeB: view.madeB,
        })
      : t('shootout.awaitingResume')
    : view.decided
      ? t('shootout.decided', {
          team: winnerName ?? '',
          madeA: view.madeA,
          madeB: view.madeB,
        })
      : view.nextSide
        ? t('shootout.nextKick', {
            team: view.nextSide === 'A' ? teamAName : teamBName,
          })
        : t('shootout.awaitingResume');

  return (
    <PagePanel data-tour="shootout">
      <PagePanelHeader
        title={t('shootout.title')}
        subtitle={subtitle}
        action={
          onClose && !shootoutStarted && !view.ended ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-xs text-textSec transition-colors active:bg-elevated/80"
            >
              {t('common.close')}
            </button>
          ) : null
        }
      />
      <PagePanelBody className="space-y-4">
        {/* Tally header — big A vs B numbers. */}
        <div className="flex items-center justify-center gap-4 font-mono tabular-nums tracking-[-0.02em]">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] uppercase tracking-[0.14em] text-textSec">
              {teamAName}
            </span>
            <span className="text-5xl font-bold text-textPri">{view.madeA}</span>
            <span className="text-[10px] uppercase tracking-[0.14em] text-textSec">
              {t('shootout.attempts', { count: view.attemptsA })}
            </span>
          </div>
          <span className="text-2xl text-textSec">:</span>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] uppercase tracking-[0.14em] text-textSec">
              {teamBName}
            </span>
            <span className="text-5xl font-bold text-textPri">{view.madeB}</span>
            <span className="text-[10px] uppercase tracking-[0.14em] text-textSec">
              {t('shootout.attempts', { count: view.attemptsB })}
            </span>
          </div>
        </div>

        {/* Kick markers — one row per side. Each chip shows the icon plus
            kicker name so admins can trace who took which spot-kick without
            hovering (mobile has no hover). */}
        <div className="space-y-2">
          {(['A', 'B'] as const).map((side) => {
            const rowKicks = view.kicks.filter((k) => k.teamSide === side);
            const sideColor =
              (side === 'A' ? game.teamA?.colorHex : game.teamB?.colorHex) ?? '#64748b';
            return (
              <div key={side} className="flex items-start gap-2">
                <span
                  className="mt-1 h-4 w-1 shrink-0 rounded-sm"
                  style={{ backgroundColor: sideColor }}
                />
                <div className="flex flex-wrap items-center gap-1.5">
                  {rowKicks.length === 0 && (
                    <span className="text-xs text-textSec">
                      {t('shootout.emptyMarkers')}
                    </span>
                  )}
                  {rowKicks.map((k) => {
                    const name = k.scorerRosterId
                      ? rosterNames.get(k.scorerRosterId)
                      : null;
                    // Unicode-safe first grapheme so 中文/emoji names don't
                    // split mid-codepoint.
                    const initial = name
                      ? (Array.from(name)[0] ?? '?')
                      : '?';
                    return (
                      <span
                        key={k.id}
                        title={name ?? t('shootout.unknownKicker')}
                        className={
                          'inline-flex h-7 w-12 items-center justify-center gap-1 rounded-full border text-[11px] font-semibold ' +
                          (k.made
                            ? 'border-primary bg-primaryPale text-primaryDk'
                            : 'border-border bg-surface text-textSec')
                        }
                      >
                        <span aria-hidden className="font-bold">
                          {k.made ? '✓' : '✕'}
                        </span>
                        <span>{initial}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* First-kicker selector — only before the first kick is recorded. */}
        {!shootoutStarted && !view.ended && (
          <div className="rounded-xl border border-border bg-surface p-3">
            <p className="mb-2 text-sm text-textSec">{t('shootout.firstKicker')}</p>
            <div className="grid grid-cols-2 gap-2">
              {(['A', 'B'] as const).map((side) => (
                <button
                  key={side}
                  type="button"
                  onClick={() => setFirstPreference(side)}
                  className={
                    'min-h-11 rounded-xl px-3 text-sm font-semibold transition-colors ' +
                    (firstPreference === side
                      ? 'bg-primary text-textInv'
                      : 'bg-chipBg text-textPri')
                  }
                >
                  {side === 'A' ? teamAName : teamBName}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Kick picker */}
        {!view.decided && !view.ended && view.nextSide && (
          <div className="rounded-xl border border-border bg-surface p-3">
            {pending == null ? (
              <>
                <p className="mb-2 text-sm text-textSec">
                  {t('shootout.pickKicker', {
                    team: view.nextSide === 'A' ? teamAName : teamBName,
                  })}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {rosterForSide(view.nextSide).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPending({ side: view.nextSide!, scorer: p })}
                      className="min-h-12 rounded-xl bg-chipBg px-2 py-2 text-sm font-semibold"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="mb-2 text-sm">
                  {t('shootout.result', { name: pending.scorer.name })}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => finalizeKick(true)}
                    className="min-h-12 rounded-xl bg-primaryPale text-sm font-semibold text-primaryDk"
                  >
                    {t('shootout.made')}
                  </button>
                  <button
                    type="button"
                    onClick={() => finalizeKick(false)}
                    className="min-h-12 rounded-xl bg-elevated text-sm font-semibold text-textSec"
                  >
                    {t('shootout.missed')}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setPending(null)}
                  className="mt-2 text-xs text-textSec"
                >
                  {t('shootout.backToKicker')}
                </button>
              </>
            )}
          </div>
        )}

        {/* End / reopen actions */}
        {view.ended && endEventId && (
          <button
            type="button"
            onClick={() => void onReopenShootout(endEventId)}
            className="w-full rounded-xl border border-border bg-surface py-2.5 text-xs text-textSec transition-colors active:bg-elevated/80"
          >
            {t('shootout.reopen')}
          </button>
        )}

        {!view.ended && (
          <button
            type="button"
            disabled={!view.canEnd}
            onClick={() => void onEndShootout()}
            className={
              'w-full rounded-xl py-3 text-sm font-semibold transition-colors ' +
              (view.canEnd
                ? 'bg-primary text-textInv active:bg-primaryDk'
                : 'cursor-not-allowed bg-elevated text-textSec')
            }
          >
            {view.canEnd ? t('shootout.end') : t('shootout.endDisabledHint')}
          </button>
        )}

        {view.kicks.length > 0 && lastKick && !view.ended && (
          <button
            type="button"
            onClick={() => void onUndoKick(lastKick.id)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface py-2.5 text-xs text-textSec transition-colors active:bg-elevated/80"
          >
            <ArrowUUpLeft size={14} weight="bold" aria-hidden />
            {t('shootout.undoLast')}
          </button>
        )}
      </PagePanelBody>
    </PagePanel>
  );
}
