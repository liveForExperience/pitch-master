import type { GameReport } from '../services/report.service.js';
import {
  Eyebrow,
  MonoNumeral,
  PosterFooter,
  PosterHeader,
  PosterRoot,
  Section,
  SerifVerdict,
  TeamBar,
} from './layout.js';
import { colors, fonts, gamePosterHeight, posterWidth } from './tokens.js';
import { formatHeaderDate } from './utils.js';

export type GamePosterContext = {
  eventName: string;
  shortCode: string;
  gameNumber: number;
};

function verdictLabel(
  scoreA: number,
  scoreB: number,
  status: string,
  teamA: string,
  teamB: string,
): { eyebrow: string; serif: string } {
  if (status !== 'FINISHED') return { eyebrow: 'IN PROGRESS', serif: 'live' };
  if (scoreA > scoreB) return { eyebrow: 'WINNER', serif: `${teamA} wins` };
  if (scoreA < scoreB) return { eyebrow: 'WINNER', serif: `${teamB} wins` };
  return { eyebrow: 'RESULT', serif: 'Draw' };
}

function HeroScore({
  scoreA,
  scoreB,
  teamA,
  teamB,
  status,
}: {
  scoreA: number;
  scoreB: number;
  teamA: { name: string; colorHex: string };
  teamB: { name: string; colorHex: string };
  status: string;
}) {
  const verdict = verdictLabel(scoreA, scoreB, status, teamA.name, teamB.name);
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 40,
        paddingBottom: 56,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <TeamBar colorHex={teamA.colorHex} width={6} height={56} />
          <span
            style={{
              display: 'flex',
              fontSize: 40,
              fontWeight: 700,
              color: colors.textPri,
            }}
          >
            {teamA.name}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <span
            style={{
              display: 'flex',
              fontSize: 40,
              fontWeight: 700,
              color: colors.textPri,
            }}
          >
            {teamB.name}
          </span>
          <TeamBar colorHex={teamB.colorHex} width={6} height={56} />
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 56,
          paddingTop: 24,
          paddingBottom: 24,
        }}
      >
        <span
          style={{
            display: 'flex',
            fontFamily: fonts.mono,
            fontSize: 240,
            lineHeight: 1,
            color: colors.textPri,
            letterSpacing: '-0.04em',
          }}
        >
          {String(scoreA)}
        </span>
        <span
          style={{
            display: 'flex',
            fontFamily: fonts.mono,
            fontSize: 96,
            lineHeight: 1,
            color: colors.textSec,
          }}
        >
          :
        </span>
        <span
          style={{
            display: 'flex',
            fontFamily: fonts.mono,
            fontSize: 240,
            lineHeight: 1,
            color: colors.textPri,
            letterSpacing: '-0.04em',
          }}
        >
          {String(scoreB)}
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          paddingTop: 16,
        }}
      >
        <Eyebrow text={verdict.eyebrow} muted />
        <SerifVerdict text={verdict.serif} size={64} />
      </div>
    </div>
  );
}

function TimelineRow({
  side,
  minute,
  scorer,
  assistant,
  own,
  teamA,
  teamB,
  last,
}: {
  side: 'A' | 'B';
  minute: number;
  scorer: string;
  assistant?: string;
  own?: boolean;
  teamA: { colorHex: string };
  teamB: { colorHex: string };
  last: boolean;
}) {
  const isA = side === 'A';
  const teamColor = isA ? teamA.colorHex : teamB.colorHex;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: 64,
        borderBottom: last ? 'none' : `1px solid ${colors.border}`,
      }}
    >
      <MonoNumeral text={`${minute}'`} size={20} color={colors.textSec} width={72} />
      <div
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: isA ? 'flex-start' : 'flex-end',
          gap: 12,
        }}
      >
        {isA && <TeamBar colorHex={teamColor} width={4} height={32} />}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: isA ? 'flex-start' : 'flex-end',
            gap: 2,
          }}
        >
          <span
            style={{
              display: 'flex',
              fontSize: 24,
              fontWeight: 600,
              color: colors.textPri,
            }}
          >
            {scorer}
            {own ? '（乌龙）' : ''}
          </span>
          {assistant && (
            <span
              style={{
                display: 'flex',
                fontSize: 16,
                color: colors.textSec,
              }}
            >
              助攻 · {assistant}
            </span>
          )}
        </div>
        {!isA && <TeamBar colorHex={teamColor} width={4} height={32} />}
      </div>
    </div>
  );
}

export function GamePosterTemplate({
  report,
  context,
}: {
  report: GameReport;
  context: GamePosterContext;
}) {
  const teamA = report.game.teamA ?? { name: 'A 队', colorHex: colors.textSec };
  const teamB = report.game.teamB ?? { name: 'B 队', colorHex: colors.textSec };
  const headerTs = report.game.finishedAt ?? report.game.startedAt ?? report.meta.generatedAt;
  const headerEyebrow = `${formatHeaderDate(headerTs)} · GAME ${String(context.gameNumber).padStart(2, '0')}`;
  const visibleGoals = report.goals.slice(0, 9);

  return (
    <PosterRoot width={posterWidth} height={gamePosterHeight}>
      <PosterHeader eyebrow={headerEyebrow} shortCode={context.shortCode} />

      <HeroScore
        scoreA={report.game.scoreA}
        scoreB={report.game.scoreB}
        teamA={teamA}
        teamB={teamB}
        status={report.game.status}
      />

      <Section title="GOALS">
        {report.goals.length === 0 ? (
          <span
            style={{
              display: 'flex',
              fontSize: 18,
              color: colors.textSec,
            }}
          >
            暂无进球
          </span>
        ) : (
          visibleGoals.map((g, i) => (
            <TimelineRow
              key={`${g.minute}-${g.scorerName}-${i}`}
              side={g.teamSide}
              minute={g.minute}
              scorer={g.scorerName}
              assistant={g.assistantName}
              own={g.type === 'OWN_GOAL'}
              teamA={teamA}
              teamB={teamB}
              last={i === visibleGoals.length - 1}
            />
          ))
        )}
      </Section>

      {report.gameMvp && (
        <Section title="MATCH MVP">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <span
              style={{
                display: 'flex',
                fontSize: 56,
                fontWeight: 700,
                color: colors.textPri,
                letterSpacing: '-0.01em',
              }}
            >
              {report.gameMvp.name}
            </span>
            <span
              style={{
                display: 'flex',
                fontFamily: fonts.mono,
                fontSize: 22,
                color: colors.textSec,
                letterSpacing: '0.04em',
              }}
            >
              {report.gameMvp.goals} G / {report.gameMvp.assists} A · {report.gameMvp.teamName}
            </span>
          </div>
        </Section>
      )}

      <PosterFooter shortCode={context.shortCode} />
    </PosterRoot>
  );
}
