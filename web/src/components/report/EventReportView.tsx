import { Link } from 'react-router-dom';
import type { EventReport } from '../../api/types';
import {
  MonoNumber,
  RankNumeral,
  ReportPageRoot,
  ReportSection,
  TeamBar,
  Eyebrow,
} from './layout';
import { ReportHero } from './ReportHero';
import { eventPosterUrl } from '../../lib/poster-url';
import {
  buildEventShareText,
  eventReportPath,
  type ShareReportInput,
} from '../../lib/share-report';
import { PosterPreview } from './PosterPreview';
import { getMatchResult } from '../../lib/report-display';
import { formatMs } from '../../lib/time-format';
import { useT } from '../../i18n';

function MonthDay(epochMs: number): string {
  const d = new Date(epochMs);
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}`;
}

function StandingsTable({
  rows,
  t,
}: {
  rows: EventReport['standings'];
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  return (
    <div className="border-t border-border">
      <div className="grid grid-cols-[1.75rem_4px_1fr_auto_auto] items-center gap-x-3 px-1 py-2 text-textSec">
        <span />
        <span />
        <Eyebrow>{t('reports.standingsHeader.team')}</Eyebrow>
        <Eyebrow>{t('reports.standingsHeader.goals')}</Eyebrow>
        <Eyebrow className="text-right">{t('reports.standingsHeader.points')}</Eyebrow>
      </div>
      {rows.map((row, i) => (
        <div
          key={row.teamId}
          className={`grid grid-cols-[1.75rem_4px_1fr_auto_auto] items-center gap-x-3 px-1 py-3 ${i === rows.length - 1 ? '' : 'border-b border-border'}`}
        >
          <RankNumeral rank={row.rank} dim={row.rank > 3} />
          <TeamBar colorHex={row.colorHex} height={24} />
          <div className="min-w-0">
            <p className="truncate text-body font-semibold text-textPri">{row.teamName}</p>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-textSec">
              {row.wins}-{row.draws}-{row.losses}
            </p>
          </div>
          <MonoNumber size="sm" className="text-textSec">
            {row.goalsFor}:{row.goalsAgainst}
          </MonoNumber>
          <MonoNumber size="md">{row.points}</MonoNumber>
        </div>
      ))}
    </div>
  );
}

function LeaderColumn<T extends { rosterId: string; name: string; teamName: string; colorHex: string }>({
  label,
  rows,
  valueOf,
  rowsCap,
  emptyLabel,
}: {
  label: string;
  rows: T[];
  valueOf: (row: T) => number;
  rowsCap: number;
  emptyLabel: string;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between border-t border-border pt-3">
        <Eyebrow>{label}</Eyebrow>
      </div>
      {rows.length === 0 && (
        <p className="py-3 text-caption text-textSec">{emptyLabel}</p>
      )}
      {rows.map((row, i) => (
        <div
          key={row.rosterId}
          className={`grid grid-cols-[1.75rem_4px_1fr_auto] items-center gap-x-3 py-3 ${i === Math.min(rows.length, rowsCap) - 1 ? '' : 'border-b border-border'}`}
        >
          <RankNumeral rank={i + 1} dim={i + 1 > 3} />
          <TeamBar colorHex={row.colorHex} height={20} />
          <div className="min-w-0">
            <p className="truncate text-body font-semibold text-textPri">{row.name}</p>
            <p className="truncate text-caption text-textSec">{row.teamName}</p>
          </div>
          <MonoNumber size="md">{valueOf(row)}</MonoNumber>
        </div>
      ))}
    </div>
  );
}

function ZigzagLeaderboards({
  scorers,
  assists,
  t,
}: {
  scorers: EventReport['topScorers'];
  assists: EventReport['topAssists'];
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const rows = Math.max(scorers.length, assists.length, 1);
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
      <LeaderColumn
        label={t('reports.topScorers')}
        rows={scorers}
        valueOf={(r) => r.goals}
        rowsCap={rows}
        emptyLabel={t('reports.emptyLeader')}
      />
      <LeaderColumn
        label={t('reports.topAssists')}
        rows={assists}
        valueOf={(r) => r.assists}
        rowsCap={rows}
        emptyLabel={t('reports.emptyLeader')}
      />
    </div>
  );
}

function GamesTimeline({
  games,
  t,
}: {
  games: EventReport['games'];
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  return (
    <div
      className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2"
      style={{ scrollbarWidth: 'none' }}
    >
      {games.map((game) => {
        const result = getMatchResult(game.scoreA, game.scoreB, game.status);
        const winner =
          result === 'A_WIN'
            ? game.teamA.name
            : result === 'B_WIN'
              ? game.teamB.name
              : null;
        const verdict =
          result === 'DRAW'
            ? t('reports.fixtures.draw')
            : result === 'PENDING'
              ? t('reports.fixtures.pending')
              : t('reports.fixtures.winner', { team: winner ?? '' });
        return (
          <Link
            key={game.id}
            to={`/games/${game.id}/report`}
            className="flex w-[220px] shrink-0 snap-start flex-col gap-3 rounded-xl border border-border bg-surface p-4 active:bg-elevated"
          >
            <Eyebrow>
              {game.status === 'FINISHED'
                ? t('reports.fixtures.elapsed', { elapsed: formatMs(game.durationMs) })
                : t('reports.fixtures.inProgress')}
            </Eyebrow>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 truncate">
                <TeamBar colorHex={game.teamA.colorHex} height={16} />
                <span className="truncate text-body font-medium">{game.teamA.name}</span>
              </div>
              <MonoNumber size="lg">{game.scoreA}</MonoNumber>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 truncate">
                <TeamBar colorHex={game.teamB.colorHex} height={16} />
                <span className="truncate text-body font-medium">{game.teamB.name}</span>
              </div>
              <MonoNumber size="lg">{game.scoreB}</MonoNumber>
            </div>
            <p className="text-caption text-textSec">{verdict}</p>
          </Link>
        );
      })}
    </div>
  );
}

export function EventReportView({ report }: { report: EventReport }) {
  const t = useT();
  const finishedGames = report.games.filter((g) => g.status === 'FINISHED').length;
  const totalGoals = report.standings.reduce((acc, s) => acc + s.goalsFor, 0);
  const share: ShareReportInput = {
    title: `${report.event.name} · ${t('reports.eventTitle')}`,
    text: buildEventShareText(report.event.name, report.event.shortCode, t),
    url: eventReportPath(report.event.shortCode),
    posterUrl: eventPosterUrl(report.event.shortCode),
  };

  return (
    <ReportPageRoot>
      <ReportHero
        eyebrow={`${MonthDay(report.event.createdAt)} · ${report.event.shortCode}`}
        title={report.event.name}
        share={share}
        stats={[
          { label: 'GAMES', value: finishedGames },
          { label: 'GOALS', value: totalGoals },
          {
            label: 'MVP',
            value: report.mvp ? (
              <span className="font-sans text-2xl">{report.mvp.name}</span>
            ) : (
              '—'
            ),
          },
        ]}
      />

      {report.standings.length > 0 && (
        <ReportSection title={t('reports.standings')}>
          <StandingsTable rows={report.standings} t={t} />
        </ReportSection>
      )}

      {(report.topScorers.length > 0 || report.topAssists.length > 0) && (
        <ReportSection title={t('reports.leaderboards')}>
          <ZigzagLeaderboards scorers={report.topScorers} assists={report.topAssists} t={t} />
        </ReportSection>
      )}

      {report.games.length > 0 && (
        <ReportSection
          title={t('reports.fixtures')}
          meta={t('reports.fixturesMeta', { count: finishedGames })}
        >
          <GamesTimeline games={report.games} t={t} />
        </ReportSection>
      )}

      <ReportSection title={t('reports.poster')}>
        <PosterPreview
          src={eventPosterUrl(report.event.shortCode)}
          downloadName={`pitchmaster-${report.event.shortCode}-report.png`}
          share={share}
        />
      </ReportSection>

      <Link
        to={`/events/${report.event.shortCode}`}
        className="block border-t border-border pt-6 text-center text-caption uppercase tracking-[0.14em] text-textSec"
      >
        {t('reports.backToEvent')}
      </Link>
    </ReportPageRoot>
  );
}
