import { Link } from 'react-router-dom';
import type { GameReport } from '../../api/types';
import {
  HairlineRow,
  MonoNumber,
  ReportPageRoot,
  ReportSection,
  TeamBar,
} from './layout';
import { ReportHero } from './ReportHero';
import { PosterPreview } from './PosterPreview';
import { gamePosterUrl } from '../../lib/poster-url';
import {
  buildGameShareText,
  gameReportPath,
  type ShareReportInput,
} from '../../lib/share-report';
import { formatMs } from '../../lib/time-format';

function MonthDayTime(epochMs: number | null): string {
  if (!epochMs) return '';
  const d = new Date(epochMs);
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')} · ${hh}:${mm}`;
}

function GoalRow({
  goal,
  teamA,
  teamB,
  last,
}: {
  goal: GameReport['goals'][number];
  teamA: { name: string; colorHex: string };
  teamB: { name: string; colorHex: string };
  last: boolean;
}) {
  const isA = goal.teamSide === 'A';
  const color = isA ? teamA.colorHex : teamB.colorHex;
  return (
    <HairlineRow last={last} className="!gap-4">
      <MonoNumber size="sm" className="w-12 shrink-0 text-textSec">
        {goal.minute}&apos;
      </MonoNumber>
      <div
        className={`flex flex-1 items-center gap-3 ${isA ? 'justify-start' : 'justify-end text-right'}`}
      >
        {isA && <TeamBar colorHex={color} height={24} />}
        <div className={`min-w-0 ${isA ? '' : 'flex flex-col items-end'}`}>
          <p className="truncate text-body font-semibold text-textPri">
            {goal.scorerName}
            {goal.type === 'OWN_GOAL' && (
              <span className="ml-1 text-caption text-danger">（乌龙）</span>
            )}
          </p>
          {goal.assistantName && (
            <p className="text-caption text-textSec">助攻 · {goal.assistantName}</p>
          )}
        </div>
        {!isA && <TeamBar colorHex={color} height={24} />}
      </div>
    </HairlineRow>
  );
}

function HeroScore({
  scoreA,
  scoreB,
  teamA,
  teamB,
}: {
  scoreA: number;
  scoreB: number;
  teamA: { name: string; colorHex: string };
  teamB: { name: string; colorHex: string };
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TeamBar colorHex={teamA.colorHex} height={40} width={6} />
          <span className="text-h2 font-bold text-textPri">{teamA.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-h2 font-bold text-textPri">{teamB.name}</span>
          <TeamBar colorHex={teamB.colorHex} height={40} width={6} />
        </div>
      </div>
      <div className="flex items-center justify-center gap-6 font-mono tabular-nums tracking-[-0.04em]">
        <span className="text-[112px] leading-none text-textPri">{scoreA}</span>
        <span className="text-[56px] leading-none text-textSec">:</span>
        <span className="text-[112px] leading-none text-textPri">{scoreB}</span>
      </div>
    </div>
  );
}

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

  const verdict =
    game.status !== 'FINISHED'
      ? '比赛进行中'
      : game.scoreA > game.scoreB
        ? <>{teamA.name} <i className="font-serif italic">wins</i></>
        : game.scoreA < game.scoreB
          ? <>{teamB.name} <i className="font-serif italic">wins</i></>
          : <i className="font-serif italic">Draw</i>;

  const share: ShareReportInput = {
    title: `${teamA.name} vs ${teamB.name} · 单场战报`,
    text: buildGameShareText(teamA.name, teamB.name, game.scoreA, game.scoreB),
    url: gameReportPath(game.id),
    posterUrl: gamePosterUrl(game.id),
  };

  return (
    <ReportPageRoot>
      <ReportHero
        eyebrow={`${MonthDayTime(game.finishedAt ?? game.startedAt)} · GAME`}
        title={`${teamA.name} vs ${teamB.name}`}
        subtitle={
          <span>
            {verdict}
            {game.status === 'FINISHED' && (
              <span className="ml-2 text-textSec">· 用时 {formatMs(game.durationMs)}</span>
            )}
          </span>
        }
        share={share}
      >
        <HeroScore
          scoreA={game.scoreA}
          scoreB={game.scoreB}
          teamA={teamA}
          teamB={teamB}
        />
      </ReportHero>

      <ReportSection title="GOALS · 进球流水" meta={`${report.goals.length} 球`}>
        {report.goals.length === 0 ? (
          <p className="py-3 text-body text-textSec">暂无进球记录</p>
        ) : (
          <div className="border-t border-border">
            {report.goals.map((goal, i) => (
              <GoalRow
                key={`${goal.minute}-${goal.scorerName}-${i}`}
                goal={goal}
                teamA={teamA}
                teamB={teamB}
                last={i === report.goals.length - 1}
              />
            ))}
          </div>
        )}
      </ReportSection>

      {report.gameMvp && (
        <ReportSection title="MATCH MVP">
          <div className="flex items-baseline justify-between gap-3 pt-1">
            <div>
              <p className="text-3xl font-bold tracking-[-0.01em] text-textPri">
                {report.gameMvp.name}
              </p>
              <p className="mt-1 text-caption text-textSec">{report.gameMvp.teamName}</p>
            </div>
            <p className="font-mono text-lg uppercase tracking-[0.08em] text-textSec">
              {report.gameMvp.goals} G / {report.gameMvp.assists} A
            </p>
          </div>
        </ReportSection>
      )}

      <ReportSection title="POSTER · 海报版战报">
        <PosterPreview
          src={gamePosterUrl(game.id)}
          downloadName={`pitchmaster-game-${game.id}-report.png`}
          share={share}
        />
      </ReportSection>

      <ReportSection title="" className="!border-t-0 pt-0">
        <div className="grid grid-cols-2 gap-3 text-center text-caption text-textSec">
          <Link
            to={`/games/${game.id}`}
            className="border-y border-border py-3 uppercase tracking-[0.14em]"
          >
            比赛详情 →
          </Link>
          {eventShortCode && (
            <Link
              to={`/events/${eventShortCode}/report`}
              className="border-y border-border py-3 uppercase tracking-[0.14em]"
            >
              活动战报 →
            </Link>
          )}
        </div>
      </ReportSection>
    </ReportPageRoot>
  );
}
