import { Link } from 'react-router-dom';
import type { EventReport } from '../../api/types';
import { Card } from '../ui/card';
import { RankBadge } from '../ui/rank-badge';
import { ScoreBoard } from '../ui/score-board';
import { Section } from '../ui/section';
import { StatRow } from '../ui/stat-row';
import { StatusChip } from '../ui/status-chip';
import { TeamBadge } from '../ui/team-badge';
import {
  gameStatusLabel,
  getMatchResult,
  matchResultLabel,
} from '../../lib/report-display';
import { formatMs } from '../../lib/time-format';

function StandingRow({ row, zebra }: { row: EventReport['standings'][0]; zebra: boolean }) {
  return (
    <div
      className={`flex min-h-14 items-center gap-2 rounded-xl px-3 py-2 tabular-nums ${zebra ? 'bg-chipBg/50' : ''}`}
    >
      <RankBadge rank={row.rank} />
      <TeamBadge name={row.teamName} colorHex={row.colorHex} className="min-w-0 flex-1" />
      <span className="w-8 text-center text-body text-textSec">{row.played}</span>
      <span className="w-10 text-center text-body font-semibold text-textPri">{row.points}</span>
      <span className="w-14 text-right text-caption text-textSec">
        {row.goalsFor}:{row.goalsAgainst}
      </span>
    </div>
  );
}

export function EventReportView({ report }: { report: EventReport }) {
  return (
    <div className="space-y-4">
      <Card className="text-center">
        <p className="text-caption text-textSec">活动战报</p>
        <h1 className="mt-1 text-h1 font-bold text-textPri">{report.event.name}</h1>
        <p className="mt-1 font-mono text-caption text-textSec">{report.event.shortCode}</p>
        {report.mvp && (
          <p className="mt-3 text-body text-textPri">
            MVP · {report.mvp.name}（{report.mvp.teamName}）· {report.mvp.goals} 球{' '}
            {report.mvp.assists} 助
          </p>
        )}
      </Card>

      {report.standings.length > 0 && (
        <Card>
          <Section title="积分榜" icon="🏆">
            <div className="mb-2 grid grid-cols-[auto_1fr_repeat(3,minmax(0,auto))] gap-2 px-3 text-caption text-textSec">
              <span>#</span>
              <span>队伍</span>
              <span className="text-center">赛</span>
              <span className="text-center">分</span>
              <span className="text-right">进:失</span>
            </div>
            {report.standings.map((row, i) => (
              <StandingRow key={row.teamId} row={row} zebra={i % 2 === 0} />
            ))}
          </Section>
        </Card>
      )}

      {report.topScorers.length > 0 && (
        <Card>
          <Section title="射手榜 Top 5" icon="⚽">
            {report.topScorers.map((row, i) => (
              <StatRow
                key={row.rosterId}
                rank={i + 1}
                name={row.name}
                teamName={row.teamName}
                teamColorHex={row.colorHex}
                value={row.goals}
                valueLabel="进球"
                zebra={i % 2 === 0}
              />
            ))}
          </Section>
        </Card>
      )}

      {report.topAssists.length > 0 && (
        <Card>
          <Section title="助攻榜 Top 5" icon="🎯">
            {report.topAssists.map((row, i) => (
              <StatRow
                key={row.rosterId}
                rank={i + 1}
                name={row.name}
                teamName={row.teamName}
                teamColorHex={row.colorHex}
                value={row.assists}
                valueLabel="助攻"
                zebra={i % 2 === 0}
              />
            ))}
          </Section>
        </Card>
      )}

      {report.games.length > 0 && (
        <Card>
          <Section title="场次结果" icon="📋">
            <div className="space-y-3">
              {report.games.map((game) => {
                const result = getMatchResult(game.scoreA, game.scoreB, game.status);
                const chipVariant =
                  result === 'DRAW'
                    ? 'draw'
                    : result === 'PENDING'
                      ? 'playing'
                      : 'finished';
                return (
                  <Link
                    key={game.id}
                    to={`/games/${game.id}/report`}
                    className="block rounded-xl border border-border p-3 active:bg-chipBg/50"
                  >
                    <ScoreBoard
                      teamAName={game.teamA.name}
                      teamAColor={game.teamA.colorHex}
                      teamBName={game.teamB.name}
                      teamBColor={game.teamB.colorHex}
                      scoreA={game.scoreA}
                      scoreB={game.scoreB}
                      subtitle={
                        game.status === 'FINISHED'
                          ? `用时 ${formatMs(game.durationMs)}`
                          : gameStatusLabel(game.status)
                      }
                      className="pointer-events-none"
                    />
                    <div className="mt-2 flex justify-center">
                      <StatusChip
                        label={matchResultLabel(
                          result,
                          result === 'A_WIN'
                            ? game.teamA.name
                            : result === 'B_WIN'
                              ? game.teamB.name
                              : undefined,
                        )}
                        variant={chipVariant}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </Section>
        </Card>
      )}
    </div>
  );
}
