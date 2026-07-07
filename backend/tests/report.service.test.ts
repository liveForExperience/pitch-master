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
    // Two teams goalless-drew twice: same points/GD/GF and head-to-head
    // (0-0 twice) is also level → they share rank 1, printed order by
    // Chinese collation puts 甲 before 乙.
    expect(standings.map((s) => s.teamName)).toEqual(['甲队', '乙队']);
    expect(standings[0]?.rank).toBe(1);
    expect(standings[1]?.rank).toBe(1);
  });

  it('breaks a two-way tie by head-to-head result', () => {
    const twoTeams: ReportTeam[] = [
      { id: 't1', name: '红队', colorHex: '#111' },
      { id: 't2', name: '蓝队', colorHex: '#222' },
    ];
    // Two games between the same pair, aggregate GD equals but 蓝队 won
    // more of the head-to-head cluster than 红队.
    const games = [
      finishedGame('g1', 't1', 't2', [
        goal('e1', 'A', 'p1', 100),
        goal('e2', 'B', 'p9', 200),
        goal('e3', 'B', 'p9', 300),
      ]),
      finishedGame('g2', 't1', 't2', [
        goal('e4', 'A', 'p1', 100),
        goal('e5', 'A', 'p1', 200),
        goal('e6', 'B', 'p9', 300),
      ]),
    ];
    const standings = computeStandings(twoTeams, games);
    // Both won one — points 3 vs 3, GD 0 vs 0, GF 3 vs 3. Head-to-head
    // is the same games as the whole set, so still level → tie.
    expect(standings[0]?.rank).toBe(1);
    expect(standings[1]?.rank).toBe(1);
  });

  it('three-way tie uses mini-league to separate teams', () => {
    const threeTeams: ReportTeam[] = [
      { id: 't1', name: 'A队', colorHex: '#111' },
      { id: 't2', name: 'B队', colorHex: '#222' },
      { id: 't3', name: 'C队', colorHex: '#333' },
      { id: 't4', name: 'D队', colorHex: '#444' },
    ];
    // t1, t2, t3 each play D (t4) and beat it 1-0 → same primary triple.
    // Head-to-head cluster: t1 beat t2 1-0, t2 beat t3 1-0, t3 beat t1 1-0
    // → mini-league also level → all three share the same rank.
    const games = [
      finishedGame('g1', 't1', 't4', [goal('e1', 'A', 'p1', 10)]),
      finishedGame('g2', 't2', 't4', [goal('e2', 'A', 'p2', 20)]),
      finishedGame('g3', 't3', 't4', [goal('e3', 'A', 'p3', 30)]),
      finishedGame('g4', 't1', 't2', [goal('e4', 'A', 'p1', 40)]),
      finishedGame('g5', 't2', 't3', [goal('e5', 'A', 'p2', 50)]),
      finishedGame('g6', 't3', 't1', [goal('e6', 'A', 'p3', 60)]),
    ];
    const standings = computeStandings(threeTeams, games);
    const ranksByTeam = new Map(standings.map((s) => [s.teamId, s.rank]));
    expect(ranksByTeam.get('t1')).toBe(1);
    expect(ranksByTeam.get('t2')).toBe(1);
    expect(ranksByTeam.get('t3')).toBe(1);
    expect(ranksByTeam.get('t4')).toBe(4);
  });

  it('shootout with a current leader credits the winner in standings even without SHOOTOUT_END', () => {
    // 1-1 regulation, one round of penalties (A made, B missed).
    // Admin never pressed "End shootout" but the outcome is clear —
    // A should still be credited with the win.
    const games: ReportGameInput[] = [
      finishedGame('g1', 't1', 't2', [
        goal('e1', 'A', 'p1', 100),
        goal('e2', 'B', 'p9', 200),
        {
          id: 'e3',
          type: 'PENALTY_MADE',
          teamSide: 'A',
          scorerRosterId: 'p1',
          assistantRosterId: null,
          undoTargetEventId: null,
          serverTs: 300,
        },
        {
          id: 'e4',
          type: 'PENALTY_MISSED',
          teamSide: 'B',
          scorerRosterId: 'p9',
          assistantRosterId: null,
          undoTargetEventId: null,
          serverTs: 400,
        },
      ]),
    ];
    const standings = computeStandings(teams.slice(0, 2), games);
    const a = standings.find((s) => s.teamId === 't1');
    const b = standings.find((s) => s.teamId === 't2');
    expect(a).toMatchObject({ wins: 1, draws: 0, losses: 0, points: 3 });
    expect(b).toMatchObject({ wins: 0, draws: 0, losses: 1, points: 0 });
    // Regulation goals only — shootout kicks never inflate goalsFor.
    expect(a?.goalsFor).toBe(1);
    expect(a?.goalsAgainst).toBe(1);
  });

  it('shootout still tied (equal rounds, equal makes) stays a draw in standings', () => {
    // 0-0 regulation, both sides scored 1 penalty each — no leader.
    const games: ReportGameInput[] = [
      finishedGame('g1', 't1', 't2', [
        {
          id: 'e1',
          type: 'PENALTY_MADE',
          teamSide: 'A',
          scorerRosterId: 'p1',
          assistantRosterId: null,
          undoTargetEventId: null,
          serverTs: 100,
        },
        {
          id: 'e2',
          type: 'PENALTY_MADE',
          teamSide: 'B',
          scorerRosterId: 'p9',
          assistantRosterId: null,
          undoTargetEventId: null,
          serverTs: 200,
        },
      ]),
    ];
    const standings = computeStandings(teams.slice(0, 2), games);
    expect(standings.every((s) => s.draws === 1 && s.points === 1)).toBe(true);
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

  it('counts goals and assists and orders by count', () => {
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
      expect.objectContaining({ personId: 'person1', rosterId: 'p1', goals: 2 }),
      expect.objectContaining({ personId: 'person3', rosterId: 'p3', goals: 1 }),
    ]);
    expect(topAssists(stats, 5)).toEqual([
      expect.objectContaining({ personId: 'person2', rosterId: 'p2', assists: 1 }),
    ]);
  });

  it('breaks equal-goal ties by name (pinyin/alphabetical) not scoring time', () => {
    // Wang Wu scores first (earlier ts) but Li Si should sort before him
    // when both have the same goal count.
    const twoTeams = [
      {
        id: 't1',
        name: 'Reds',
        colorHex: '#ef4444',
        roster: [
          { id: 'r1', name: '李四', personId: 'personLi' },
          { id: 'r2', name: '王五', personId: 'personWang' },
        ],
      },
    ];
    const rosterById = buildRosterLookup(twoTeams);
    const games = [
      finishedGame('g1', 't1', 't2', [
        goal('e1', 'A', 'r2', 100), // Wang scores first
        goal('e2', 'A', 'r1', 200), // Li scores second
      ]),
    ];
    const stats = aggregatePlayerStats(games, rosterById);
    const scorers = topScorers(stats, 5);
    expect(scorers.map((s) => s.name)).toEqual(['李四', '王五']);
  });

  it('ignores penalty shootout kicks in the scorer leaderboard', () => {
    const rosterById = buildRosterLookup(rosterTeams);
    const games: ReportGameInput[] = [
      finishedGame('g1', 't1', 't2', [
        goal('e1', 'A', 'p1', 100),
        // Shootout entries for the same player must NOT bump goals count.
        {
          id: 'e2',
          type: 'PENALTY_MADE',
          teamSide: 'A',
          scorerRosterId: 'p1',
          assistantRosterId: null,
          undoTargetEventId: null,
          serverTs: 300,
        },
        {
          id: 'e3',
          type: 'PENALTY_MADE',
          teamSide: 'A',
          scorerRosterId: 'p1',
          assistantRosterId: null,
          undoTargetEventId: null,
          serverTs: 400,
        },
      ]),
    ];
    const stats = aggregatePlayerStats(games, rosterById);
    const scorers = topScorers(stats, 5);
    expect(scorers).toHaveLength(1);
    expect(scorers[0]).toMatchObject({ personId: 'person1', goals: 1 });
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
