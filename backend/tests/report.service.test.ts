import { describe, expect, it } from 'vitest';
import {
  __testing,
  computeEventMvp,
  computeStandings,
  topAssists,
  topScorers,
  type ReportEventRow,
  type ReportGameInput,
  type ReportTeam,
} from '../src/services/report.service.js';

const { aggregatePlayerStats, buildRosterLookup } = __testing;

const teams: ReportTeam[] = [
  { id: 't1', name: '红队', colorHex: '#ef4444' },
  { id: 't2', name: '蓝队', colorHex: '#3b82f6' },
  { id: 't3', name: '绿队', colorHex: '#22c55e' },
];

function goal(
  id: string,
  teamSide: 'A' | 'B',
  scorer: string,
  serverTs: number,
  assistant?: string,
): ReportEventRow {
  return {
    id,
    type: 'GOAL',
    teamSide,
    scorerRosterId: scorer,
    assistantRosterId: assistant ?? null,
    undoTargetEventId: null,
    serverTs,
  };
}

function undo(id: string, target: string, serverTs: number): ReportEventRow {
  return {
    id,
    type: 'UNDO',
    teamSide: null,
    scorerRosterId: null,
    assistantRosterId: null,
    undoTargetEventId: target,
    serverTs,
  };
}

function finishedGame(
  id: string,
  teamAId: string,
  teamBId: string,
  events: ReportEventRow[],
): ReportGameInput {
  return {
    id,
    teamAId,
    teamBId,
    status: 'FINISHED',
    startedAt: 1_000,
    finishedAt: 3_600_000,
    pausedDurationMs: 0,
    pauseStartedAt: null,
    plannedDurationMs: 30 * 60 * 1000,
    events,
  };
}

describe('computeStandings', () => {
  it('ranks by points then goal difference then goals for', () => {
    const games = [
      finishedGame('g1', 't1', 't2', [
        goal('e1', 'A', 'p1', 100),
        goal('e2', 'A', 'p1', 200),
      ]),
      finishedGame('g2', 't1', 't3', [
        goal('e3', 'A', 'p1', 100),
        goal('e4', 'B', 'p9', 200),
        goal('e5', 'B', 'p9', 300),
      ]),
      finishedGame('g3', 't2', 't3', [
        goal('e6', 'A', 'p5', 100),
        goal('e7', 'B', 'p9', 200),
      ]),
    ];

    const standings = computeStandings(teams, games);
    expect(standings.map((s) => s.teamId)).toEqual(['t3', 't1', 't2']);
    expect(standings[0]).toMatchObject({ wins: 1, draws: 1, points: 4, rank: 1 });
    expect(standings[1]).toMatchObject({ wins: 1, losses: 1, points: 3, rank: 2 });
  });

  it('counts draws correctly', () => {
    const games = [
      finishedGame('g1', 't1', 't2', [goal('e1', 'A', 'p1', 100), goal('e2', 'B', 'p2', 200)]),
    ];
    const standings = computeStandings(teams.slice(0, 2), games);
    expect(standings[0]).toMatchObject({ played: 1, draws: 1, points: 1 });
    expect(standings[1]).toMatchObject({ played: 1, draws: 1, points: 1 });
  });

  it('ignores non-finished games', () => {
    const games: ReportGameInput[] = [
      {
        ...finishedGame('g1', 't1', 't2', [goal('e1', 'A', 'p1', 100)]),
        status: 'PLAYING',
      },
    ];
    const standings = computeStandings(teams.slice(0, 2), games);
    expect(standings.every((s) => s.played === 0)).toBe(true);
  });

  it('returns stable ordering for tied teams by name', () => {
    const tiedTeams: ReportTeam[] = [
      { id: 't1', name: '乙队', colorHex: '#111' },
      { id: 't2', name: '甲队', colorHex: '#222' },
    ];
    const games = [
      finishedGame('g1', 't1', 't2', []),
      finishedGame('g2', 't1', 't2', []),
    ];
    const standings = computeStandings(tiedTeams, games);
    expect(standings.map((s) => s.teamName)).toEqual(['甲队', '乙队']);
  });
});

describe('topScorers and topAssists', () => {
  const rosterTeams = [
    {
      id: 't1',
      name: '红队',
      colorHex: '#ef4444',
      roster: [
        { id: 'p1', name: '张三', personId: 'person1' },
        { id: 'p2', name: '李四', personId: 'person2' },
      ],
    },
    {
      id: 't2',
      name: '蓝队',
      colorHex: '#3b82f6',
      roster: [{ id: 'p3', name: '王五', personId: 'person3' }],
    },
  ];

  it('counts goals and assists with tie-breaker on first event time', () => {
    const rosterById = buildRosterLookup(rosterTeams);
    const games = [
      finishedGame('g1', 't1', 't2', [
        goal('e1', 'A', 'p1', 100, 'p2'),
        goal('e2', 'A', 'p3', 200),
        goal('e3', 'B', 'p3', 300),
        undo('e4', 'e2', 400),
      ]),
      finishedGame('g2', 't1', 't2', [goal('e5', 'A', 'p1', 500)]),
    ];

    const stats = aggregatePlayerStats(games, rosterById);
    expect(topScorers(stats, 5)).toEqual([
      expect.objectContaining({ personId: 'person1', rosterId: 'p1', goals: 2, firstGoalAt: 100 }),
      expect.objectContaining({ personId: 'person3', rosterId: 'p3', goals: 1, firstGoalAt: 300 }),
    ]);
    expect(topAssists(stats, 5)).toEqual([
      expect.objectContaining({ personId: 'person2', rosterId: 'p2', assists: 1, firstAssistAt: 100 }),
    ]);
  });

  it('merges stats for same person across two teams', () => {
    const rosterTeams = [
      {
        id: 't1',
        name: '红队',
        colorHex: '#ef4444',
        roster: [{ id: 'r1', name: '张三', personId: 'person1' }],
      },
      {
        id: 't2',
        name: '蓝队',
        colorHex: '#3b82f6',
        roster: [{ id: 'r2', name: '张三', personId: 'person1' }],
      },
    ];
    const rosterById = buildRosterLookup(rosterTeams);
    const games = [
      finishedGame('g1', 't1', 't2', [goal('e1', 'A', 'r1', 100)]),
      finishedGame('g2', 't2', 't1', [goal('e2', 'A', 'r2', 200)]),
    ];
    const stats = aggregatePlayerStats(games, rosterById);
    const scorers = topScorers(stats, 5);
    expect(scorers).toHaveLength(1);
    expect(scorers[0]).toMatchObject({
      personId: 'person1',
      goals: 2,
      teamNames: ['红队', '蓝队'],
    });
  });

  it('returns empty lists for zero data', () => {
    const stats = aggregatePlayerStats([], buildRosterLookup(rosterTeams));
    expect(topScorers(stats, 5)).toEqual([]);
    expect(topAssists(stats, 5)).toEqual([]);
  });
});

describe('computeEventMvp', () => {
  it('picks highest goals+assists with first-goal tie-break', () => {
    const stats = new Map([
      [
        'person1',
        {
          personId: 'person1',
          rosterId: 'p1',
          name: '张三',
          teamId: 't1',
          teamName: '红队',
          teamNames: ['红队'],
          colorHex: '#ef4444',
          goals: 2,
          assists: 0,
          firstGoalAt: 200,
          firstAssistAt: Number.MAX_SAFE_INTEGER,
        },
      ],
      [
        'person2',
        {
          personId: 'person2',
          rosterId: 'p2',
          name: '李四',
          teamId: 't1',
          teamName: '红队',
          teamNames: ['红队'],
          colorHex: '#ef4444',
          goals: 1,
          assists: 1,
          firstGoalAt: 100,
          firstAssistAt: 150,
        },
      ],
    ]);
    expect(computeEventMvp(stats)).toMatchObject({ personId: 'person2', goals: 1, assists: 1 });
  });

  it('returns undefined when no contributions', () => {
    expect(computeEventMvp(new Map())).toBeUndefined();
  });
});
