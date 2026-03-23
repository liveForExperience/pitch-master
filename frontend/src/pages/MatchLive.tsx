import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ChevronLeft, Trophy, BarChart2, Swords, Target, Handshake } from 'lucide-react';
import apiClient from '../api/client';
import { matchApi } from '../api/match';
import type { StandingsVO, MatchStatsVO, MatchGame } from '../api/match';
import dayjs from 'dayjs';
import GameCard from '../components/GameCard';

type GameTab = 'PLAYING' | 'READY' | 'FINISHED';
type StatsTab = 'scorers' | 'assisters';

/* ── Helpers ── */

const gameStatusLabel: Record<string, string> = {
  READY: '待开始',
  PLAYING: '进行中',
  FINISHED: '已结束',
};

/* ── Component ── */
import { useConfirmDialog } from '../components/ConfirmDialog';
import { Toast } from 'antd-mobile';
import useAuthStore from '../store/useAuthStore';

const MatchLive: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuthStore();
  const admin = isAdmin();
  const { show: showConfirm, DialogComponent } = useConfirmDialog();

  const [match, setMatch] = useState<any>(null);
  const [games, setGames] = useState<MatchGame[]>([]);
  const [standings, setStandings] = useState<StandingsVO | null>(null);
  const [stats, setStats] = useState<MatchStatsVO | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  const [gameTab, setGameTab] = useState<GameTab>('PLAYING');
  const [statsTab, setStatsTab] = useState<StatsTab>('scorers');

  const sseRef = useRef<EventSource | null>(null);

  /* ── Initial data fetch ── */
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const [matchData, gamesData, standingsData, statsData] = await Promise.all([
          apiClient.get(`/api/match/${id}`) as Promise<any>,
          apiClient.get(`/api/game/list`, { params: { matchId: id } }) as Promise<MatchGame[]>,
          matchApi.getStandings(id),
          matchApi.getStats(id),
        ]);
        setMatch(matchData);
        setGames(gamesData ?? []);
        setStandings(standingsData);
        setStats(statsData);
        const hasPlaying = (gamesData ?? []).some((g: MatchGame) => g.status === 'PLAYING');
        const hasReady = (gamesData ?? []).some((g: MatchGame) => g.status === 'READY');
        setGameTab(hasPlaying ? 'PLAYING' : hasReady ? 'READY' : 'FINISHED');
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, [id]);

  /* ── SSE subscription ── */
  useEffect(() => {
    if (!id) return;
    const es = new EventSource(`/api/realtime/subscribe/${id}`);
    sseRef.current = es;
    es.onmessage = (e) => {
      try {
        const updated: MatchGame = JSON.parse(e.data);
        setGames(prev =>
          prev.map(g => (g.id === updated.id ? { ...g, ...updated } : g))
        );
        if (updated.status === 'FINISHED') {
          matchApi.getStandings(id).then(setStandings).catch(() => {});
          matchApi.getStats(id).then(setStats).catch(() => {});
        }
      } catch { /* ignore parse errors */ }
    };
    return () => es.close();
  }, [id]);

  /* ── Derived ── */
  const playingGames = games.filter(g => g.status === 'PLAYING');
  const readyGames = games.filter(g => g.status === 'READY');
  const finishedGames = games.filter(g => g.status === 'FINISHED');

  const tabCounts: Record<GameTab, number> = {
    PLAYING: playingGames.length,
    READY: readyGames.length,
    FINISHED: finishedGames.length,
  };

  const activeGames: Record<GameTab, MatchGame[]> = {
    PLAYING: playingGames,
    READY: readyGames,
    FINISHED: finishedGames,
  };

  /* ── Loading ── */
  if (pageLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }
  if (!match) return null;

  const tNames: Record<number, string> = match.teamNames ?? {};

  return (
    <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-14">
      {/* Background glows */}
      <div className="pointer-events-none absolute left-0 top-0 h-64 w-64 rounded-full bg-orange-500/6 blur-[140px]" />
      <div className="pointer-events-none absolute right-0 top-32 h-64 w-64 rounded-full bg-primary/6 blur-[160px]" />

      {/* ── Nav ── */}
      <nav className="relative z-10 mb-8 flex items-center gap-4">
        <button
          onClick={() => navigate(`/matches/${id}`)}
          className="group flex items-center text-gray-500 dark:text-neutral-500 font-bold hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ChevronLeft size={20} className="mr-1 group-hover:-translate-x-1 transition-transform" />
          赛事详情
        </button>
        <span className="text-gray-300 dark:text-neutral-800">/</span>
        <span className="text-sm font-semibold text-gray-500 dark:text-neutral-400">赛场</span>
        {admin && match?.status === 'ONGOING' && (
          <button
            onClick={async () => {
              const result = await showConfirm({
                title: '结束比赛',
                content: '确定要结束比赛吗？未结束的场次将作废为0:0。',
              });
              if (result) {
                try {
                  await apiClient.post(`/api/match/${id}/finish`);
                  Toast.show({ icon: 'success', content: '比赛已结束' });
                  navigate(`/matches/${id}`);
                } catch {}
              }
            }}
            className="ml-auto flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-1.5 text-[11px] font-bold text-red-400 transition-colors hover:bg-red-500/15"
          >
            结束比赛
          </button>
        )}
      </nav>

      {/* Dialog Context */}
      <DialogComponent />

      {/* ── Hero ── */}
      <header className="relative z-10 mb-10 overflow-hidden rounded-[2rem] border border-orange-500/20 bg-[linear-gradient(180deg,rgba(234,88,12,0.08)_0%,rgba(249,250,251,1)_100%)] dark:bg-[linear-gradient(180deg,rgba(234,88,12,0.08)_0%,rgba(10,10,10,1)_100%)] px-6 py-5 sm:px-8 sm:py-6">
        <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-[11px] font-bold text-orange-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-orange-400" />
          比赛进行中
        </div>
        <div className="text-[11px] font-bold tracking-[0.12em] text-primary/80 mb-2">
          {match.tournamentName || '老男孩俱乐部'}
        </div>
        <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white sm:text-3xl">{match.title}</h1>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-neutral-500">
          <span>{match.location}</span>
          <span>{match.numGroups} 队 · {match.plannedGameCount} 场</span>
          <span>{dayjs(match.startTime).format('MM月DD日 HH:mm')}</span>
        </div>
      </header>

      {/* ── Games Module ── */}
      <section className="relative z-10 mb-8">
        <div className="mb-4 flex items-center gap-3">
          <Swords size={16} className="text-orange-400" />
          <h2 className="text-xs font-black tracking-[0.18em] text-gray-500 dark:text-neutral-400">场次</h2>
        </div>

        {/* Tab bar */}
        <div className="mb-5 flex gap-1 rounded-2xl border border-gray-200 dark:border-white/6 bg-gray-100 dark:bg-white/[0.02] p-1">
          {(['PLAYING', 'READY', 'FINISHED'] as GameTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setGameTab(tab)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[11px] font-bold transition-all ${
                gameTab === tab
                  ? 'bg-white dark:bg-white/8 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-neutral-600 hover:text-gray-700 dark:hover:text-neutral-400'
              }`}
            >
              {tab === 'PLAYING' && (
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400" />
              )}
              {gameStatusLabel[tab]}
              {tabCounts[tab] > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-black ${
                  gameTab === tab ? 'bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-white' : 'bg-gray-200/50 dark:bg-white/5 text-gray-400 dark:text-neutral-600'
                }`}>
                  {tabCounts[tab]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Game cards */}
        {activeGames[gameTab].length === 0 ? (
          <div className="rounded-2xl border border-gray-200 dark:border-white/6 bg-gray-50 dark:bg-white/[0.02] py-10 text-center text-sm text-gray-400 dark:text-neutral-600">
            暂无{gameStatusLabel[gameTab]}场次
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {activeGames[gameTab].map(game => (
              <GameCard key={game.id} game={game} tNames={tNames} matchId={id!} />
            ))}
          </div>
        )}
      </section>

      {/* ── Standings ── */}
      <section className="relative z-10 mb-8">
        <div className="mb-4 flex items-center gap-3">
          <Trophy size={16} className="text-amber-400" />
          <h2 className="text-xs font-black tracking-[0.18em] text-gray-500 dark:text-neutral-400">积分榜</h2>
          <span className="text-[10px] font-medium text-gray-400 dark:text-neutral-700">联赛积分制</span>
        </div>

        <div className="overflow-hidden rounded-[1.6rem] border border-gray-200 dark:border-white/6 bg-white dark:bg-white/[0.02]">
          {/* Table header */}
          <div className="grid grid-cols-[2rem_1fr_2.5rem_2.5rem_2.5rem_2.5rem_2.5rem_2.5rem_3rem] items-center gap-1 border-b border-gray-100 dark:border-white/5 px-4 py-2.5 text-[10px] font-black tracking-widest text-gray-400 dark:text-neutral-600">
            <span>#</span>
            <span>队伍</span>
            <span className="text-center">场</span>
            <span className="text-center">胜</span>
            <span className="text-center">平</span>
            <span className="text-center">负</span>
            <span className="text-center">进</span>
            <span className="text-center">净</span>
            <span className="text-center text-amber-400/70">分</span>
          </div>

          {standings && standings.standings.length > 0 ? (
            standings.standings.map((row, idx) => (
              <div
                key={row.teamIndex}
                className={`grid grid-cols-[2rem_1fr_2.5rem_2.5rem_2.5rem_2.5rem_2.5rem_2.5rem_3rem] items-center gap-1 px-4 py-3 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.02] ${
                  idx < standings.standings.length - 1 ? 'border-b border-gray-100 dark:border-white/[0.04]' : ''
                }`}
              >
                <span className={`text-xs font-black ${row.rank === 1 ? 'text-amber-400' : 'text-gray-400 dark:text-neutral-600'}`}>
                  {row.rank}
                </span>
                <span className="font-semibold text-gray-900 dark:text-white truncate">{row.teamName}</span>
                <span className="text-center text-xs text-gray-500 dark:text-neutral-500">{row.played}</span>
                <span className="text-center text-xs text-primary">{row.wins}</span>
                <span className="text-center text-xs text-gray-500 dark:text-neutral-400">{row.draws}</span>
                <span className="text-center text-xs text-red-400/70">{row.losses}</span>
                <span className="text-center text-xs text-gray-500 dark:text-neutral-400">{row.goalsFor}</span>
                <span className={`text-center text-xs font-semibold ${row.goalDifference > 0 ? 'text-primary' : row.goalDifference < 0 ? 'text-red-400/70' : 'text-neutral-500'}`}>
                  {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                </span>
                <span className="text-center text-sm font-black text-gray-900 dark:text-white">{row.points}</span>
              </div>
            ))
          ) : (
            <div className="py-10 text-center text-sm text-gray-400 dark:text-neutral-600">暂无积分数据</div>
          )}
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="relative z-10">
        <div className="mb-4 flex items-center gap-3">
          <BarChart2 size={16} className="text-sky-400" />
          <h2 className="text-xs font-black tracking-[0.18em] text-gray-500 dark:text-neutral-400">数据榜</h2>
        </div>

        {/* Tab */}
        <div className="mb-5 flex gap-1 rounded-2xl border border-gray-200 dark:border-white/6 bg-gray-100 dark:bg-white/[0.02] p-1">
          <button
            onClick={() => setStatsTab('scorers')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[11px] font-bold transition-all ${
              statsTab === 'scorers' ? 'bg-white dark:bg-white/8 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-neutral-600 hover:text-gray-700 dark:hover:text-neutral-400'
            }`}
          >
            <Target size={12} /> 射手榜
          </button>
          <button
            onClick={() => setStatsTab('assisters')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[11px] font-bold transition-all ${
              statsTab === 'assisters' ? 'bg-white dark:bg-white/8 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-neutral-600 hover:text-gray-700 dark:hover:text-neutral-400'
            }`}
          >
            <Handshake size={12} /> 助攻榜
          </button>
        </div>

        {/* Stats list */}
        <div className="overflow-hidden rounded-[1.6rem] border border-gray-200 dark:border-white/6 bg-white dark:bg-white/[0.02]">
          {(() => {
            const list = statsTab === 'scorers'
              ? (stats?.topScorers ?? [])
              : (stats?.topAssisters ?? []);
            const mainKey = statsTab === 'scorers' ? 'goals' : 'assists';
            const mainLabel = statsTab === 'scorers' ? '进球' : '助攻';
            const subLabel = statsTab === 'scorers' ? '助攻' : '进球';
            const subKey = statsTab === 'scorers' ? 'assists' : 'goals';

            if (list.length === 0) {
              return <div className="py-10 text-center text-sm text-gray-400 dark:text-neutral-600">暂无数据</div>;
            }
            return list.map((p, idx) => (
              <div
                key={p.playerId}
                className={`flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.02] ${
                  idx < list.length - 1 ? 'border-b border-gray-100 dark:border-white/[0.04]' : ''
                }`}
              >
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                  idx === 0 ? 'bg-amber-400/15 text-amber-400' :
                  idx === 1 ? 'bg-neutral-400/15 text-neutral-400' :
                  idx === 2 ? 'bg-amber-700/15 text-amber-700' :
                  'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-neutral-600'
                }`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-bold text-gray-900 dark:text-white">{p.playerName}</div>
                  <div className="text-[10px] text-gray-400 dark:text-neutral-600">{subLabel} {p[subKey as keyof typeof p]}</div>
                </div>
                <div className="text-2xl font-black text-primary">{p[mainKey as keyof typeof p]}</div>
                <div className="w-10 text-right text-[10px] font-semibold text-gray-400 dark:text-neutral-600">{mainLabel}</div>
              </div>
            ));
          })()}
        </div>
      </section>
    </div>
  );
};

export default MatchLive;
