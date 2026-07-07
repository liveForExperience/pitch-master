import { Card, PrimaryButton } from './ui/layout';
import { useT } from '../i18n';

type RosterMember = { id: string; name: string };

/**
 * Pick flow phases:
 *   { side }                              → picking own-team scorer
 *   { side, scorerId, scorerName }        → choosing optional assist
 *   { side, mode: 'own-goal' }            → picking opposing player as own-goal scorer
 *
 * `side` is always the team receiving the goal (the team the admin
 * tapped on). For own goals the actual DB event is written with
 * `teamSide` = opposite of `side` (the team that scored into their own
 * net), but for UX purposes we always start from "who gets the point?".
 */
type PickPhase =
  | null
  | { side: 'A' | 'B' }
  | { side: 'A' | 'B'; scorerId: string; scorerName: string }
  | { side: 'A' | 'B'; mode: 'own-goal' };

type Props = {
  pick: PickPhase;
  editing: boolean;
  /** Roster of the team on `side` — for normal goals. */
  rosterForSide: (side: 'A' | 'B') => RosterMember[];
  /** Roster of the opposing team (used when picking an own-goal scorer). */
  opposingRosterForSide: (side: 'A' | 'B') => RosterMember[];
  teamNameForSide?: (side: 'A' | 'B') => string;
  onPickScorer: (side: 'A' | 'B', scorerId: string, scorerName: string) => void;
  onSubmitGoal: (side: 'A' | 'B', scorerId: string, assistantId?: string) => void;
  /**
   * side = the team that receives the goal.
   * scorerRosterId (optional) = the opposing-team player who scored the OG.
   */
  onSubmitOwnGoal?: (side: 'A' | 'B', scorerRosterId?: string) => void;
  onPickOwnGoal?: (side: 'A' | 'B') => void;
  onCancel: () => void;
  onBackToScorerList: (side: 'A' | 'B') => void;
};

export function GoalPickPanel({
  pick,
  editing,
  rosterForSide,
  opposingRosterForSide,
  teamNameForSide,
  onPickScorer,
  onSubmitGoal,
  onSubmitOwnGoal,
  onPickOwnGoal,
  onCancel,
  onBackToScorerList,
}: Props) {
  const t = useT();
  if (!pick) return null;

  const sideName = teamNameForSide?.(pick.side) ?? pick.side;

  // Own-goal phase: pick an opposing-team player.
  if ('mode' in pick && pick.mode === 'own-goal') {
    const opponents = opposingRosterForSide(pick.side);
    return (
      <Card>
        <p className="mb-2 text-sm text-textSec">
          {t('pick.ownGoalPickScorer', { side: sideName })}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {opponents.map((p) => (
            <button
              key={p.id}
              type="button"
              className="min-h-14 rounded-xl bg-chipBg px-2 py-2 text-sm font-semibold"
              onClick={() => onSubmitOwnGoal?.(pick.side, p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <PrimaryButton onClick={() => onSubmitOwnGoal?.(pick.side)}>
            {t('pick.ownGoalNoScorer')}
          </PrimaryButton>
          <button
            type="button"
            className="min-h-14 rounded-xl bg-chipBg text-sm font-medium"
            onClick={() => onBackToScorerList(pick.side)}
          >
            {t('pick.backToScorer')}
          </button>
        </div>
      </Card>
    );
  }

  if (!('scorerId' in pick)) {
    return (
      <Card>
        <p className="mb-2 text-sm text-textSec">
          {editing ? t('pick.scorerEdit') : t('pick.scorerSide', { side: sideName })}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {rosterForSide(pick.side).map((p) => (
            <button
              key={p.id}
              type="button"
              className="min-h-14 rounded-xl bg-chipBg px-2 py-2 text-sm font-semibold"
              onClick={() => onPickScorer(pick.side, p.id, p.name)}
            >
              {p.name}
            </button>
          ))}
        </div>
        {onPickOwnGoal && !editing && (
          <button
            type="button"
            className="mt-3 w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm font-medium text-textPri transition-colors active:bg-elevated/80"
            onClick={() => onPickOwnGoal(pick.side)}
          >
            {t('pick.ownGoal')}
          </button>
        )}
        <button type="button" className="mt-2 text-sm text-textSec" onClick={onCancel}>
          {t('common.cancel')}
        </button>
      </Card>
    );
  }

  return (
    <Card>
      <p className="mb-1 text-sm font-medium">
        {editing
          ? t('pick.scoredByEdit', { name: pick.scorerName })
          : t('pick.scoredBy', { name: pick.scorerName })}
      </p>
      <p className="mb-2 text-xs text-textSec">{t('pick.assistHint')}</p>
      <div className="grid grid-cols-2 gap-2">
        {rosterForSide(pick.side)
          .filter((p) => p.id !== pick.scorerId)
          .map((p) => (
            <button
              key={p.id}
              type="button"
              className="min-h-14 rounded-xl bg-chipBg px-2 py-2 text-sm font-semibold"
              onClick={() => onSubmitGoal(pick.side, pick.scorerId, p.id)}
            >
              {t('pick.assist', { name: p.name })}
            </button>
          ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <PrimaryButton onClick={() => onSubmitGoal(pick.side, pick.scorerId)}>
          {editing ? t('pick.confirmEdit') : t('pick.confirmNoAssist')}
        </PrimaryButton>
        <button
          type="button"
          className="min-h-14 rounded-xl bg-chipBg text-sm font-medium"
          onClick={() => onBackToScorerList(pick.side)}
        >
          {t('pick.backToScorer')}
        </button>
      </div>
    </Card>
  );
}

export type { PickPhase };
