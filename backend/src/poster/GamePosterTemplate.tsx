import type { GameReport } from '../services/report.service.js';
import {
  PosterCard,
  PosterMuted,
  PosterRoot,
  PosterTitle,
  TeamDot,
  ZebraRow,
} from './layout.js';
import { colors, gamePosterHeight, posterWidth } from './tokens.js';
import { formatDurationMs, formatPosterDate } from './utils.js';

export type GamePosterContext = {
  eventName: string;
  shortCode: string;
  gameNumber: number;
};

export function GamePosterTemplate({
  report,
  context,
}: {
  report: GameReport;
  context: GamePosterContext;
}) {
  const teamA = report.game.teamA ?? { name: 'A 队', colorHex: colors.textSec };
  const teamB = report.game.teamB ?? { name: 'B 队', colorHex: colors.textSec };
  const goalsA = report.goals.filter((g) => g.teamSide === 'A');
  const goalsB = report.goals.filter((g) => g.teamSide === 'B');

  return (
    <PosterRoot width={posterWidth} height={gamePosterHeight}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 28, fontWeight: 700 }}>PitchMaster</div>
        <PosterMuted>{`${context.eventName} · 第 ${context.gameNumber} 场`}</PosterMuted>
        <PosterMuted>
          {report.game.finishedAt
            ? formatPosterDate(report.game.finishedAt).slice(0, 10)
            : formatPosterDate(report.meta.generatedAt).slice(0, 10)}
        </PosterMuted>
      </div>

      <PosterCard>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 280 }}>
            <TeamDot colorHex={teamA.colorHex} />
            <span style={{ fontSize: 22, fontWeight: 700 }}>{teamA.name}</span>
          </div>
          <div style={{ fontSize: 56, fontWeight: 800, display: 'flex' }}>
            {`${report.game.scoreA} - ${report.game.scoreB}`}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: 280,
              justifyContent: 'flex-end',
            }}
          >
            <span style={{ fontSize: 22, fontWeight: 700 }}>{teamB.name}</span>
            <TeamDot colorHex={teamB.colorHex} />
          </div>
        </div>
        <div style={{ fontSize: 14, color: colors.textSec, textAlign: 'center' }}>
          {report.game.status === 'FINISHED'
            ? `全场 ${formatDurationMs(report.game.durationMs)} · 已结束`
            : `状态 ${report.game.status}`}
        </div>
      </PosterCard>

      <PosterCard>
        <PosterTitle text="进球流水" />
        <GoalGroup teamName={teamA.name} colorHex={teamA.colorHex} goals={goalsA} />
        <GoalGroup teamName={teamB.name} colorHex={teamB.colorHex} goals={goalsB} />
        {report.goals.length === 0 && <PosterMuted>暂无进球</PosterMuted>}
      </PosterCard>

      {report.gameMvp && (
        <PosterCard>
          <PosterTitle text="本场 MVP" />
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              textAlign: 'center',
              padding: 12,
              display: 'flex',
            }}
          >
            {`${report.gameMvp.name} · ${report.gameMvp.teamName} · ${report.gameMvp.goals}G / ${report.gameMvp.assists}A`}
          </div>
        </PosterCard>
      )}

      <div style={{ fontSize: 14, color: colors.textSec, textAlign: 'center', marginTop: 'auto', display: 'flex' }}>
        {`PitchMaster · ${context.shortCode}`}
      </div>
    </PosterRoot>
  );
}

function GoalGroup({
  teamName,
  colorHex,
  goals,
}: {
  teamName: string;
  colorHex: string;
  goals: GameReport['goals'];
}) {
  if (goals.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <TeamDot colorHex={colorHex} />
        <span style={{ fontSize: 16, fontWeight: 700 }}>{teamName}</span>
      </div>
      {goals.map((goal, i) => (
        <ZebraRow key={`${goal.minute}-${goal.scorerName}-${i}`} zebra={i % 2 === 0}>
          <span style={{ width: 48, fontSize: 14, color: colors.textSec, display: 'flex' }}>
            {`${goal.minute}'`}
          </span>
          <span style={{ fontSize: 16, fontWeight: 600, display: 'flex' }}>
            {`${goal.scorerName}${goal.type === 'OWN_GOAL' ? '（乌龙）' : ''}${goal.assistantName ? ` · 助攻 ${goal.assistantName}` : ''}`}
          </span>
        </ZebraRow>
      ))}
    </div>
  );
}
