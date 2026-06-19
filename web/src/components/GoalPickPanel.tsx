import { Card, PrimaryButton } from './ui/layout';
import { useT } from '../i18n';

type RosterMember = { id: string; name: string };

type PickPhase = null | { side: 'A' | 'B' } | { side: 'A' | 'B'; scorerId: string; scorerName: string };

type Props = {
  pick: PickPhase;
  editing: boolean;
  rosterForSide: (side: 'A' | 'B') => RosterMember[];
  onPickScorer: (side: 'A' | 'B', scorerId: string, scorerName: string) => void;
  onSubmitGoal: (side: 'A' | 'B', scorerId: string, assistantId?: string) => void;
  onCancel: () => void;
  onBackToScorerList: (side: 'A' | 'B') => void;
};

export function GoalPickPanel({
  pick,
  editing,
  rosterForSide,
  onPickScorer,
  onSubmitGoal,
  onCancel,
  onBackToScorerList,
}: Props) {
  const t = useT();
  if (!pick) return null;

  if (!('scorerId' in pick)) {
    return (
      <Card>
        <p className="mb-2 text-sm text-textSec">
          {editing ? t('pick.scorerEdit') : t('pick.scorerSide', { side: pick.side })}
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
