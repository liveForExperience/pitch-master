import type { GameDetail } from '../api/types';
import {
  buildRosterNameMap,
  formatGameEventLabel,
  getUndoneEventIds,
  listActiveScorableEvents,
} from '../lib/game-events';

type GameEventRow = GameDetail['events'][number];

type Props = {
  game: GameDetail;
  /** 只展示进球/乌龙/撤销，隐藏 START 等系统事件 */
  scorableOnly?: boolean;
  /** 管理员录入页：每条进球可删除或修改 */
  editable?: boolean;
  onDelete?: (event: GameEventRow) => void;
  onEdit?: (event: GameEventRow) => void;
};

export function GameEventFeed({
  game,
  scorableOnly = false,
  editable = false,
  onDelete,
  onEdit,
}: Props) {
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
    return <p className="text-sm text-textSec">暂无记录</p>;
  }

  const undone = getUndoneEventIds(game.events);
  const rows = editable ? visible : [...visible].reverse();

  return (
    <ul className="space-y-2 text-sm">
      {rows.map((e) => {
        const struck = e.type === 'UNDO' || undone.has(e.id);
        return (
          <li
            key={e.id}
            className="flex items-start justify-between gap-2 border-b border-border py-2 last:border-0"
          >
            <div className="min-w-0 flex-1">
              <span className={struck ? 'text-textSec line-through' : ''}>
                {formatGameEventLabel(e, names, teamA, teamB)}
              </span>
              {editable && (e.type === 'GOAL' || e.type === 'OWN_GOAL') && (
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-chipBg px-3 py-1.5 text-xs font-medium text-textPri"
                    onClick={() => onEdit?.(e)}
                  >
                    修改
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-danger/10 px-3 py-1.5 text-xs font-medium text-danger"
                    onClick={() => onDelete?.(e)}
                  >
                    删除
                  </button>
                </div>
              )}
            </div>
            <span className="shrink-0 text-xs text-textSec tabular-nums">
              {new Date(e.serverTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
