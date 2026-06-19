import { Link } from 'react-router-dom';
import type { GameReport } from '../../api/types';
import { Card } from '../ui/card';
import { ScoreBoard } from '../ui/score-board';
import { Section } from '../ui/section';
import { StatusChip } from '../ui/status-chip';
import { gameStatusLabel, getMatchResult, matchResultLabel } from '../../lib/report-display';
import { formatMs } from '../../lib/time-format';

export function GameReportView({
  report,
  eventShortCode,
}: {
  report: GameReport;
  eventShortCode?: string | null;
}) {
  const { game } = report;
  const teamA = game.teamA ?? { id: '', name: 'A 队', colorHex: '#64748b' };
  const teamB = game.teamB ?? { id: '', name: 'B 队', colorHex: '#64748b' };
  const result = getMatchResult(game.scoreA, game.scoreB, game.status);

  return (
    <div className="space-y-4">
      <Card>
        <ScoreBoard
          teamAName={teamA.name}
          teamAColor={teamA.colorHex}
          teamBName={teamB.name}
          teamBColor={teamB.colorHex}
          scoreA={game.scoreA}
          scoreB={game.scoreB}
          subtitle={
            game.status === 'FINISHED'
              ? `已结束 · 用时 ${formatMs(game.durationMs)}`
              : gameStatusLabel(game.status)
          }
        />
        <div className="mt-3 flex justify-center">
          <StatusChip
            label={matchResultLabel(
              result,
              result === 'A_WIN' ? teamA.name : result === 'B_WIN' ? teamB.name : undefined,
            )}
            variant={result === 'DRAW' ? 'draw' : result === 'PENDING' ? 'playing' : 'win'}
          />
        </div>
        {report.gameMvp && (
          <p className="mt-4 text-center text-body text-textPri">
            单场 MVP · {report.gameMvp.name}（{report.gameMvp.teamName}）· {report.gameMvp.goals} 球{' '}
            {report.gameMvp.assists} 助
          </p>
        )}
      </Card>

      <Card>
        <Section title="进球流水" icon="⚽">
          {report.goals.length === 0 ? (
            <p className="text-body text-textSec">暂无进球记录</p>
          ) : (
            <ul className="space-y-2">
              {report.goals.map((goal, i) => (
                <li
                  key={`${goal.minute}-${goal.scorerName}-${i}`}
                  className={`flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 tabular-nums ${i % 2 === 0 ? 'bg-chipBg/50' : ''}`}
                >
                  <span className="w-10 text-caption text-textSec">{goal.minute}&apos;</span>
                  <span className="flex-1 text-body text-textPri">
                    {goal.scorerName}
                    {goal.type === 'OWN_GOAL' && (
                      <span className="ml-1 text-caption text-danger">（乌龙）</span>
                    )}
                    {goal.assistantName && (
                      <span className="text-caption text-textSec"> · 助攻 {goal.assistantName}</span>
                    )}
                  </span>
                  <StatusChip
                    label={goal.teamSide === 'A' ? teamA.name : teamB.name}
                    variant="neutral"
                  />
                </li>
              ))}
            </ul>
          )}
        </Section>
      </Card>

      <div className="flex flex-col gap-2 text-center text-caption text-textSec">
        <Link to={`/games/${game.id}`} className="text-primary">
          查看比赛详情
        </Link>
        {eventShortCode && (
          <Link to={`/events/${eventShortCode}/report`} className="text-primary">
            查看活动战报
          </Link>
        )}
      </div>
    </div>
  );
}
