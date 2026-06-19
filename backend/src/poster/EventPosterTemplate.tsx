import type { EventReport } from '../services/report.service.js';
import {
  Eyebrow,
  HairlineRow,
  MonoNumeral,
  PosterFooter,
  PosterHeader,
  PosterRoot,
  RankNumeral,
  Section,
  StatBadge,
  TeamBar,
} from './layout.js';
import { colors, fonts, posterHeight, posterHeightTall, posterWidth } from './tokens.js';
import { formatHeaderRange, goalDiffLabel } from './utils.js';

const STANDING_ROW_H = 64;
const TOP_ROW_H = 56;

const SECTION_PAD_TOP = 32;
const SECTION_PAD_BOTTOM = 32;
const HEADER_BLOCK_H = 96;
const HERO_BLOCK_H = 320;
const STAT_BADGE_BLOCK_H = 192;
const FOOTER_BLOCK_H = 112;
const ROW_TITLE_H = 18 + 16;

function sectionH(rows: number, rowH: number, hasTitle = true): number {
  return SECTION_PAD_TOP + SECTION_PAD_BOTTOM + (hasTitle ? ROW_TITLE_H : 0) + rows * rowH;
}

/**
 * Pick fixed canvas height: 1350 (4:5) or 1620 (4:6).
 * Defensive: returns 1620 only when the conservative layout estimate breaches 1350.
 */
export function estimateEventPosterHeight(report: EventReport): number {
  const sumGoals = report.topScorers.reduce((acc, r) => acc + r.goals, 0);

  const blocks =
    HEADER_BLOCK_H +
    HERO_BLOCK_H +
    STAT_BADGE_BLOCK_H +
    sectionH(Math.min(report.standings.length, 6), STANDING_ROW_H) +
    sectionH(Math.min(Math.max(report.topScorers.length, report.topAssists.length), 5), TOP_ROW_H) +
    FOOTER_BLOCK_H;

  // intentionally read sumGoals so satori cannot tree-shake the rank computation away from the
  // estimator branch; also makes long activities reliably bump to the taller canvas
  if (blocks > posterHeight - 80 || sumGoals > 60) return posterHeightTall;
  return posterHeight;
}

function getDateRange(report: EventReport): { start: number; end: number | null } {
  const startDates = report.games
    .map((g) => g.id)
    .filter(Boolean)
    .map(() => report.event.createdAt);
  const ends = report.games.map(() => report.event.finishedAt ?? report.event.createdAt);
  const start = startDates.length ? Math.min(...startDates) : report.event.createdAt;
  const end = ends.length ? Math.max(...ends) : report.event.finishedAt ?? null;
  return { start, end };
}

function HeroTitle({ name }: { name: string }) {
  // CJK is subset-limited under Newsreader; hero name uses NotoSC Bold tight tracking
  // so it reads editorial against the mono eyebrow above and below.
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 24,
        paddingBottom: 24,
      }}
    >
      <span
        style={{
          display: 'flex',
          fontFamily: fonts.sans,
          fontSize: 88,
          fontWeight: 700,
          color: colors.textPri,
          letterSpacing: '-0.03em',
          lineHeight: 1.05,
        }}
      >
        {name}
      </span>
    </div>
  );
}

function StatBadgeRow({ report }: { report: EventReport }) {
  const finished = report.games.filter((g) => g.status === 'FINISHED').length;
  // sum of every team's goalsFor over finished games == total goals scored in the event
  const totalGoals = report.standings.reduce((acc, s) => acc + s.goalsFor, 0);
  const mvpName = report.mvp?.name ?? '—';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        borderTop: `1px solid ${colors.border}`,
        borderBottom: `1px solid ${colors.border}`,
        marginTop: 16,
        marginBottom: 16,
      }}
    >
      <StatBadge value={String(finished)} label="GAMES" />
      <StatBadge value={String(totalGoals)} label="GOALS" hairlineLeft />
      <StatBadge value={mvpName} label="MVP" hairlineLeft cjk />
    </div>
  );
}

function StandingsRow({
  row,
  last,
}: {
  row: EventReport['standings'][number];
  last: boolean;
}) {
  return (
    <HairlineRow height={STANDING_ROW_H} last={last}>
      <RankNumeral rank={row.rank} dim={row.rank > 3} />
      <TeamBar colorHex={row.colorHex} width={4} height={28} />
      <span
        style={{
          display: 'flex',
          paddingLeft: 16,
          fontSize: 26,
          fontWeight: 600,
          color: colors.textPri,
          flex: 1,
        }}
      >
        {row.teamName}
      </span>
      <MonoNumeral
        text={`${row.wins}-${row.draws}-${row.losses}`}
        size={20}
        color={colors.textSec}
        width={120}
        align="center"
      />
      <MonoNumeral
        text={`${row.goalsFor}:${row.goalsAgainst}`}
        size={20}
        color={colors.textSec}
        width={96}
        align="center"
      />
      <MonoNumeral
        text={goalDiffLabel(row.goalDiff)}
        size={20}
        color={row.goalDiff < 0 ? colors.danger : colors.textSec}
        width={64}
        align="center"
      />
      <MonoNumeral text={String(row.points)} size={28} width={56} align="right" />
    </HairlineRow>
  );
}

function TopRow({
  rank,
  name,
  value,
  colorHex,
  last,
}: {
  rank: number;
  name: string;
  value: number;
  colorHex: string;
  last: boolean;
}) {
  return (
    <HairlineRow height={TOP_ROW_H} last={last}>
      <RankNumeral rank={rank} dim={rank > 3} />
      <TeamBar colorHex={colorHex} width={4} height={24} />
      <span
        style={{
          display: 'flex',
          paddingLeft: 16,
          fontSize: 22,
          fontWeight: 600,
          color: colors.textPri,
          flex: 1,
        }}
      >
        {name}
      </span>
      <MonoNumeral text={String(value)} size={24} width={56} align="right" />
    </HairlineRow>
  );
}

function ZigzagLeaderboards({
  scorers,
  assists,
}: {
  scorers: EventReport['topScorers'];
  assists: EventReport['topAssists'];
}) {
  const rows = Math.max(scorers.length, assists.length);
  return (
    <div style={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          paddingRight: 32,
        }}
      >
        <div style={{ display: 'flex', paddingBottom: 18 }}>
          <Eyebrow text="TOP SCORERS" />
        </div>
        {Array.from({ length: rows }).map((_, i) => {
          const row = scorers[i];
          if (!row) return <HairlineRow key={`s-${i}`} height={TOP_ROW_H} last={i === rows - 1}><span /></HairlineRow>;
          return (
            <TopRow
              key={row.rosterId}
              rank={i + 1}
              name={row.name}
              value={row.goals}
              colorHex={row.colorHex}
              last={i === rows - 1}
            />
          );
        })}
      </div>
      <div
        style={{
          display: 'flex',
          width: 1,
          backgroundColor: colors.border,
        }}
      />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          paddingLeft: 32,
        }}
      >
        <div style={{ display: 'flex', paddingBottom: 18 }}>
          <Eyebrow text="TOP ASSISTS" />
        </div>
        {Array.from({ length: rows }).map((_, i) => {
          const row = assists[i];
          if (!row) return <HairlineRow key={`a-${i}`} height={TOP_ROW_H} last={i === rows - 1}><span /></HairlineRow>;
          return (
            <TopRow
              key={row.rosterId}
              rank={i + 1}
              name={row.name}
              value={row.assists}
              colorHex={row.colorHex}
              last={i === rows - 1}
            />
          );
        })}
      </div>
    </div>
  );
}

export function EventPosterTemplate({ report }: { report: EventReport }) {
  const height = estimateEventPosterHeight(report);
  const range = getDateRange(report);
  const gamesCount = report.games.filter((g) => g.status === 'FINISHED').length;
  const headerEyebrow = `${formatHeaderRange(range.start, range.end)} · ${gamesCount} GAMES`;
  const standingsCap = report.standings.slice(0, 6);

  return (
    <PosterRoot width={posterWidth} height={height}>
      <PosterHeader eyebrow={headerEyebrow} shortCode={report.event.shortCode} />

      <HeroTitle name={report.event.name} />

      <StatBadgeRow report={report} />

      {standingsCap.length > 0 && (
        <Section title="STANDINGS">
          {standingsCap.map((row, i) => (
            <StandingsRow key={row.teamId} row={row} last={i === standingsCap.length - 1} />
          ))}
        </Section>
      )}

      {(report.topScorers.length > 0 || report.topAssists.length > 0) && (
        <Section title={undefined as unknown as string} hairlineTop padTop={32} padBottom={24}>
          <ZigzagLeaderboards
            scorers={report.topScorers.slice(0, 5)}
            assists={report.topAssists.slice(0, 5)}
          />
        </Section>
      )}

      <PosterFooter shortCode={report.event.shortCode} />
    </PosterRoot>
  );
}
