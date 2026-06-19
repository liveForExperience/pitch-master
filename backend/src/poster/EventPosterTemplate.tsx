import type { EventReport } from '../services/report.service.js';
import {
  PosterCard,
  PosterMuted,
  PosterRoot,
  PosterTitle,
  RankBadge,
  ResultChip,
  TeamDot,
  ZebraRow,
} from './layout.js';
import { cardGap, cardPadding, colors, posterWidth } from './tokens.js';
import { formatDurationMs, formatPosterDate, goalDiffLabel } from './utils.js';

function matchVariant(
  scoreA: number,
  scoreB: number,
  status: string,
): 'win' | 'draw' | 'loss' | 'neutral' {
  if (status !== 'FINISHED') return 'neutral';
  if (scoreA > scoreB) return 'win';
  if (scoreA < scoreB) return 'loss';
  return 'draw';
}

function matchLabel(
  scoreA: number,
  scoreB: number,
  status: string,
  teamA: string,
  teamB: string,
): string {
  if (status !== 'FINISHED') return '未结束';
  if (scoreA > scoreB) return `${teamA} 胜`;
  if (scoreA < scoreB) return `${teamB} 胜`;
  return '平局';
}

export function estimateEventPosterHeight(report: EventReport): number {
  const header = 160;
  const footer = 72;
  const cardOverhead = 72;
  const gameRow = 96;
  const standingRow = 44;
  const statRow = 52;
  const mvpBlock = report.mvp ? 120 : 0;
  const bottomPad = 100;

  return (
    cardPadding * 2 +
    header +
    footer +
    bottomPad +
    cardGap * 6 +
    cardOverhead * 5 +
    report.games.length * gameRow +
    report.standings.length * standingRow +
    report.topScorers.length * statRow +
    report.topAssists.length * statRow +
    mvpBlock
  );
}

export function EventPosterTemplate({ report }: { report: EventReport }) {
  const height = estimateEventPosterHeight(report);

  return (
    <PosterRoot width={posterWidth} height={height}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
        <div style={{ fontSize: 32, fontWeight: 700, display: 'flex' }}>
          {report.event.name}
        </div>
        <PosterMuted>{formatPosterDate(report.meta.generatedAt)}</PosterMuted>
        <PosterMuted>{report.event.shortCode}</PosterMuted>
      </div>

      {report.games.length > 0 && (
        <PosterCard>
          <PosterTitle text="场次结果" />
          {report.games.map((game, i) => (
            <ZebraRow key={game.id} zebra={i % 2 === 0}>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TeamDot colorHex={game.teamA.colorHex} />
                  <span style={{ fontSize: 18, fontWeight: 600 }}>{game.teamA.name}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 24, fontWeight: 800 }}>
                    {game.scoreA}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TeamDot colorHex={game.teamB.colorHex} />
                  <span style={{ fontSize: 18, fontWeight: 600 }}>{game.teamB.name}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 24, fontWeight: 800 }}>
                    {game.scoreB}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <ResultChip
                  label={matchLabel(
                    game.scoreA,
                    game.scoreB,
                    game.status,
                    game.teamA.name,
                    game.teamB.name,
                  )}
                  variant={matchVariant(game.scoreA, game.scoreB, game.status)}
                />
                {game.status === 'FINISHED' && (
                  <PosterMuted>{formatDurationMs(game.durationMs)}</PosterMuted>
                )}
              </div>
            </ZebraRow>
          ))}
        </PosterCard>
      )}

      {report.standings.length > 0 && (
        <PosterCard>
          <PosterTitle text="积分榜" />
          {report.standings.map((row, i) => (
            <ZebraRow key={row.teamId} zebra={i % 2 === 0}>
              <RankBadge rank={row.rank} />
              <TeamDot colorHex={row.colorHex} />
              <span style={{ fontSize: 16, fontWeight: 600, width: 160 }}>{row.teamName}</span>
              <span style={{ fontSize: 14, color: colors.textSec, width: 40, display: 'flex' }}>
                {`${row.played}场`}
              </span>
              <span style={{ fontSize: 14, color: colors.textSec, width: 72, display: 'flex' }}>
                {`${row.wins}胜${row.draws}平${row.losses}负`}
              </span>
              <span style={{ fontSize: 14, color: colors.textSec, width: 48 }}>
                {goalDiffLabel(row.goalDiff)}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 20, fontWeight: 700 }}>{row.points}</span>
            </ZebraRow>
          ))}
        </PosterCard>
      )}

      {report.topScorers.length > 0 && (
        <PosterCard>
          <PosterTitle text="射手榜 Top 5" />
          {report.topScorers.map((row, i) => (
            <ZebraRow key={row.rosterId} zebra={i % 2 === 0}>
              <RankBadge rank={i + 1} />
              <span style={{ fontSize: 16, fontWeight: 600, width: 120 }}>{row.name}</span>
              <TeamDot colorHex={row.colorHex} />
              <span style={{ fontSize: 14, color: colors.textSec }}>{row.teamName}</span>
              <span style={{ marginLeft: 'auto', fontSize: 20, fontWeight: 700, display: 'flex' }}>
                {`${row.goals} 球`}
              </span>
            </ZebraRow>
          ))}
        </PosterCard>
      )}

      {report.topAssists.length > 0 && (
        <PosterCard>
          <PosterTitle text="助攻榜 Top 5" />
          {report.topAssists.map((row, i) => (
            <ZebraRow key={row.rosterId} zebra={i % 2 === 0}>
              <RankBadge rank={i + 1} />
              <span style={{ fontSize: 16, fontWeight: 600, width: 120 }}>{row.name}</span>
              <TeamDot colorHex={row.colorHex} />
              <span style={{ fontSize: 14, color: colors.textSec }}>{row.teamName}</span>
              <span style={{ marginLeft: 'auto', fontSize: 20, fontWeight: 700, display: 'flex' }}>
                {`${row.assists} 助`}
              </span>
            </ZebraRow>
          ))}
        </PosterCard>
      )}

      {report.mvp && (
        <PosterCard>
          <PosterTitle text="活动 MVP" />
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              textAlign: 'center',
              padding: 12,
              display: 'flex',
            }}
          >
            {`${report.mvp.name} · ${report.mvp.teamName} · ${report.mvp.goals}G / ${report.mvp.assists}A`}
          </div>
        </PosterCard>
      )}

      <div style={{ fontSize: 14, color: colors.textSec, textAlign: 'center', display: 'flex' }}>
        {`PitchMaster · ${report.event.shortCode}`}
      </div>
    </PosterRoot>
  );
}
