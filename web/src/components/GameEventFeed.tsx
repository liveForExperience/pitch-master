import { PencilSimple, Trash } from '@phosphor-icons/react';
import type { GameDetail } from '../api/types';
import { useT } from '../i18n';
import {
  buildRosterNameMap,
  formatGameEventLabel,
  getUndoneEventIds,
  listActiveScorableEvents,
} from '../lib/game-events';

type GameEventRow = GameDetail['events'][number];

type Props = {
  game: GameDetail;
  /** Only show GOAL/OWN_GOAL/UNDO; hide system events like START. */
  scorableOnly?: boolean;
  /** Admin recording mode: each goal becomes editable/deletable. */
  editable?: boolean;
  onDelete?: (event: GameEventRow) => void;
  onEdit?: (event: GameEventRow) => void;
};

function formatTime(serverTs: number) {
  return new Date(serverTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function EditableEventRow({
  label,
  time,
  onEdit,
  onDelete,
}: {
  label: string;
  time: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useT();

  return (
    <li className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5">
      <p className="min-w-0 flex-1 truncate text-sm font-medium text-textPri">{label}</p>
      <time className="shrink-0 font-mono text-xs tabular-nums text-textSec">{time}</time>
      <button
        type="button"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-textSec transition-colors active:bg-elevated/80"
        aria-label={t('common.edit')}
        onClick={onEdit}
      >
        <PencilSimple size={18} weight="bold" aria-hidden />
      </button>
      <button
        type="button"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-danger transition-colors active:bg-elevated/80"
        aria-label={t('common.delete')}
        onClick={onDelete}
      >
        <Trash size={18} weight="bold" aria-hidden />
      </button>
    </li>
  );
}

function ReadonlyEventRow({ label, time, struck }: { label: string; time: string; struck: boolean }) {
  return (
    <li className="flex items-start justify-between gap-3 border-b border-border py-3 last:border-b-0">
      <span
        className={`min-w-0 flex-1 text-sm leading-snug ${struck ? 'text-textSec line-through' : 'text-textPri'}`}
      >
        {label}
      </span>
      <time className="shrink-0 font-mono text-xs tabular-nums text-textSec">{time}</time>
    </li>
  );
}

export function GameEventFeed({
  game,
  scorableOnly = false,
  editable = false,
  onDelete,
  onEdit,
}: Props) {
  const t = useT();
  const names = buildRosterNameMap(game);
  const teamA = game.teamA?.name;
  const teamB = game.teamB?.name;

  const visible = editable
    ? listActiveScorableEvents(game.events)
    : game.events.filter((e) => {
        if (!scorableOnly) return true;
        if (e.type === 'UNDO') return true;
        return e.type === 'GOAL' || e.type === 'OWN_GOAL';
      });

  if (visible.length === 0) {
    return <p className="py-2 text-center text-sm text-textSec">{t('feed.empty')}</p>;
  }

  const undone = getUndoneEventIds(game.events);
  const rows = editable ? visible : [...visible].reverse();

  if (editable) {
    return (
      <ul className="space-y-2">
        {rows.map((e) => (
          <EditableEventRow
            key={e.id}
            label={formatGameEventLabel(e, names, teamA, teamB, t)}
            time={formatTime(e.serverTs)}
            onEdit={() => onEdit?.(e)}
            onDelete={() => onDelete?.(e)}
          />
        ))}
      </ul>
    );
  }

  return (
    <ul>
      {rows.map((e) => {
        const struck = e.type === 'UNDO' || undone.has(e.id);
        return (
          <ReadonlyEventRow
            key={e.id}
            label={formatGameEventLabel(e, names, teamA, teamB, t)}
            time={formatTime(e.serverTs)}
            struck={struck}
          />
        );
      })}
    </ul>
  );
}
