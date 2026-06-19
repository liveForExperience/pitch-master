import { Card, PrimaryButton } from './ui/layout';

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
  if (!pick) return null;

  if (!('scorerId' in pick)) {
    return (
      <Card>
        <p className="mb-2 text-sm text-textSec">
          {editing ? '修改进球：重新选择球员' : `选择进球球员 (${pick.side} 队)`}
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
          取消
        </button>
      </Card>
    );
  }

  return (
    <Card>
      <p className="mb-1 text-sm font-medium">
        {editing ? '修改' : ''}
        {pick.scorerName} 进球
      </p>
      <p className="mb-2 text-xs text-textSec">可选助攻（同队，可不选）</p>
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
              助攻 · {p.name}
            </button>
          ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <PrimaryButton onClick={() => onSubmitGoal(pick.side, pick.scorerId)}>
          {editing ? '确认修改' : '无助攻，确认进球'}
        </PrimaryButton>
        <button
          type="button"
          className="min-h-14 rounded-xl bg-chipBg text-sm font-medium"
          onClick={() => onBackToScorerList(pick.side)}
        >
          返回改球员
        </button>
      </div>
    </Card>
  );
}

export type { PickPhase };
