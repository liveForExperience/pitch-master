import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ChevronLeft, Trophy, BarChart2, Swords, Target, Handshake, MapPin, Users } from 'lucide-react';
import apiClient from '../api/client';
import { matchApi } from '../api/match';
import type { StandingsVO, MatchStatsVO, MatchGame } from '../api/match';
import dayjs from 'dayjs';
import GameCard from '../components/GameCard';
import { useConfirmDialog } from '../components/ConfirmDialog';
import { Toast } from 'antd-mobile';
import useAuthStore from '../store/useAuthStore';
import { cn } from '../lib/utils';

type GameTab = 'PLAYING' | 'READY' | 'FINISHED';
type StatsTab = 'scorers' | 'assisters';

const gameStatusLabel: Record<string, string> = {
  READY: '待开始',
  PLAYING: '进行中',
  FINISHED: '已结束',
};

const MatchLive: React.FC = () => {
  const { id, tournamentId } = useParams<{ id: string; tournamentId: string }>();
  const navigate = useNavigate();
  const { isAdmin, isTournamentAdmin } = useAuthStore();
  const admin = isAdmin() || (tournamentId ? isTournamentAdmin(Number(tournamentId)) : false);
  const basePath = `/tournaments/${tournamentId}/matches`;
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
          matchApi.getStandings(id).then(setStandings).catch(() => { });
          matchApi.getStats(id).then(setStats).catch(() => { });
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
      <div className="pointer-events-none absolute left-[-6%] top-0 h-72 w-72 rounded-full bg-orange-500/8 blur-[140px]" />
      <div className="pointer-events-none absolute right-[-4%] top-32 h-64 w-64 rounded-full bg-primary/6 blur-[160px]" />

      {/* ── Nav ── */}
      <nav className="relative z-10 mb-8 flex items-center gap-4">
        <button
          onClick={() => navigate(`${basePath}/${id}`)}
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
                  navigate(`${basePath}/${id}`);
                } catch { }
              }
            }}
            className="ml-auto flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/[0.08] px-4 py-1.5 text-[11px] font-bold text-red-400 transition-all hover:bg-red-500/[0.14] active:scale-95"
          >
            结束比赛
          </button>
        )}
      </nav>

      <DialogComponent />

      {/* ── Hero ── */}
      <header className="relative z-10 mb-10 overflow-hidden rounded-[2rem] border border-orange-500/25 bg-[linear-gradient(160deg,rgba(234,88,12,0.10)_0%,rgba(249,250,251,1)_55%)] dark:bg-[linear-gradient(160deg,rgba(234,88,12,0.10)_0%,rgba(10,10,10,1)_55%)] px-6 py-6 sm:px-8 sm:py-8">
        {/* Decorative grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        {/* Glow orb */}
        <div className="absolute right-[-5%] top-[-20%] h-48 w-48 rounded-full bg-orange-500/20 blur-3xl" />

        <div className="relative z-10">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="text-[11px] font-bold tracking-[0.12em] text-primary/80">
              {match.tournamentName || '老男孩俱乐部'}
            </div>
            <div className="flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-[11px] font-black text-orange-500 dark:text-orange-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-orange-400" />
              LIVE · 比赛进行中
            </div>
          </div>

          <h1 className="max-w-2xl text-2xl font-black tracking-tight text-gray-900 dark:text-white sm:text-3xl lg:text-4xl">
            {match.title}
          </h1>
          <div className="mt-1 h-px w-16 bg-gradient-to-r from-orange-500/60 to-transparent" />

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-500 dark:text-neutral-500">
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={12} className="text-gray-400 dark:text-neutral-600" />
              {match.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users size={12} className="text-gray-400 dark:text-neutral-600" />
              {match.numGroups} 队 · {match.plannedGameCount} 场
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Swords size={12} className="text-orange-400/70" />
              {dayjs(match.startTime).format('MM月DD日 HH:mm')} 开赛
            </span>
          </div>
        </div>
      </header>

      {/* ── Games Module ── */}
      <section className="relative z-10 mb-10">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-500/15">
            <Swords size={13} className="text-orange-400" />
          </span>
          <h2 className="text-xs font-black tracking-[0.18em] text-gray-500 dark:text-neutral-400">场次</h2>
        </div>

        {/* Tab bar */}
        <div className="mb-5 flex gap-1 rounded-2xl border border-gray-200 dark:border-white/6 bg-gray-100 dark:bg-white/[0.02] p-1">
          {(['PLAYING', 'READY', 'FINISHED'] as GameTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setGameTab(tab)}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[11px] font-bold transition-all',
                gameTab === tab
                  ? 'bg-white dark:bg-white/[0.12] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-neutral-600 hover:text-gray-700 dark:hover:text-neutral-400'
              )}
            >
              {tab === 'PLAYING' && (
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400" />
              )}
              {gameStatusLabel[tab]}
              {tabCounts[tab] > 0 && (
                <span className={cn(
                  'rounded-full px-1.5 py-0.5 text-[9px] font-black',
                  gameTab === tab
                    ? 'bg-gray-200 dark:bg-white/[0.15] text-gray-800 dark:text-white'
                    : 'bg-gray-200/50 dark:bg-white/[0.06] text-gray-400 dark:text-neutral-600'
                )}>
                  {tabCounts[tab]}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeGames[gameTab].length === 0 ? (
          <div className="rounded-2xl border border-gray-200 dark:border-white/6 bg-gray-50 dark:bg-white/[0.02] py-12 text-center">
            <div className="mb-1 text-sm font-bold text-gray-400 dark:text-neutral-600">暂无{gameStatusLabel[gameTab]}场次</div>
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
      <section className="relative z-10 mb-10">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/15">
            <Trophy size={13} className="text-amber-400" />
          </span>
          <h2 className="text-xs font-black tracking-[0.18em] text-gray-500 dark:text-neutral-400">积分榜</h2>
          <span className="ml-auto text-[10px] font-medium text-gray-400 dark:text-neutral-700">联赛积分制</span>
        </div>

        <div className="overflow-hidden rounded-[1.6rem] border border-gray-200 dark:border-white/6 bg-white dark:bg-white/[0.02]">
          {/* Table header */}
          <div className="grid grid-cols-[2rem_1fr_2.5rem_2.5rem_2.5rem_2.5rem_2.5rem_2.5rem_3rem] items-center gap-1 border-b border-gray-100 dark:border-white/5 px-4 py-2.5 text-[10px] font-black tracking-widest text-gray-400 dark:text-neutral-600">
            <span>#</span><span>队伍</span>
            <span className="text-center">场</span><span className="text-center">胜</span>
            <span className="text-center">平</span><span className="text-center">负</span>
            <span className="text-center">进</span><span className="text-center">净</span>
            <span className="text-center text-amber-400/80">分</span>
          </div>

          {standings && standings.standings.length > 0 ? (
            standings.standings.map((row, idx) => (
              <div
                key={row.teamIndex}
                className={cn(
                  'grid grid-cols-[2rem_1fr_2.5rem_2.5rem_2.5rem_2.5rem_2.5rem_2.5rem_3rem] items-center gap-1 px-4 py-3 text-sm transition-colors',
                  idx < standings.standings.length - 1 ? 'border-b border-gray-100 dark:border-white/[0.04]' : '',
                  row.rank === 1
                    ? 'bg-amber-500/[0.05] hover:bg-amber-500/[0.08]'
                    : 'hover:bg-gray-50 dark:hover:bg-white/[0.02]'
                )}
              >
                <span className={cn('text-xs font-black', row.rank === 1 ? 'text-amber-400' : row.rank === 2 ? 'text-neutral-400' : row.rank === 3 ? 'text-amber-700/80' : 'text-gray-400 dark:text-neutral-600')}>
                  {row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : row.rank}
                </span>
                <span className={cn('truncate font-semibold', row.rank === 1 ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-700 dark:text-neutral-300')}>{row.teamName}</span>
                <span className="text-center text-xs text-gray-500 dark:text-neutral-500">{row.played}</span>
                <span className="text-center text-xs font-semibold text-primary">{row.wins}</span>
                <span className="text-center text-xs text-gray-400 dark:text-neutral-500">{row.draws}</span>
                <span className="text-center text-xs text-red-400/70">{row.losses}</span>
                <span className="text-center text-xs text-gray-500 dark:text-neutral-400">{row.goalsFor}</span>
                <span className={cn('text-center text-xs font-semibold', row.goalDifference > 0 ? 'text-primary' : row.goalDifference < 0 ? 'text-red-400/70' : 'text-neutral-500')}>
                  {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                </span>
                <span className={cn('text-center font-black', row.rank === 1 ? 'text-base text-amber-400' : 'text-sm text-gray-900 dark:text-white')}>{row.points}</span>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-sm text-gray-400 dark:text-neutral-600">暂无积分数据</div>
          )}
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="relative z-10">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-500/15">
            <BarChart2 size={13} className="text-sky-400" />
          </span>
          <h2 className="text-xs font-black tracking-[0.18em] text-gray-500 dark:text-neutral-400">数据榜</h2>
        </div>

        {/* Stats tab */}
        <div className="mb-5 flex gap-1 rounded-2xl border border-gray-200 dark:border-white/6 bg-gray-100 dark:bg-white/[0.02] p-1">
          <button
            onClick={() => setStatsTab('scorers')}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[11px] font-bold transition-all',
              statsTab === 'scorers' ? 'bg-white dark:bg-white/[0.12] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-neutral-600 hover:text-gray-700 dark:hover:text-neutral-400'
            )}
          >
            <Target size={12} /> 射手榜
          </button>
          <button
            onClick={() => setStatsTab('assisters')}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[11px] font-bold transition-all',
              statsTab === 'assisters' ? 'bg-white dark:bg-white/[0.12] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-neutral-600 hover:text-gray-700 dark:hover:text-neutral-400'
            )}
          >
            <Handshake size={12} /> 助攻榜
          </button>
        </div>

        {/* Stats list */}
        <div className="overflow-hidden rounded-[1.6rem] border border-gray-200 dark:border-white/6 bg-white dark:bg-white/[0.02]">
          {(() => {
            const list = statsTab === 'scorers' ? (stats?.topScorers ?? []) : (stats?.topAssisters ?? []);
            const mainKey = statsTab === 'scorers' ? 'goals' : 'assists';
            const mainLabel = statsTab === 'scorers' ? '进球' : '助攻';
            const subLabel = statsTab === 'scorers' ? '助攻' : '进球';
            const subKey = statsTab === 'scorers' ? 'assists' : 'goals';
            const medalCls = ['bg-amber-400/15 text-amber-400', 'bg-neutral-400/15 text-neutral-400', 'bg-amber-700/15 text-amber-700/80'];

            if (list.length === 0) {
              return <div className="py-12 text-center text-sm text-gray-400 dark:text-neutral-600">暂无数据</div>;
            }
            return list.map((p, idx) => (
              <div
                key={p.playerId}
                className={cn(
                  'flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.02]',
                  idx < list.length - 1 ? 'border-b border-gray-100 dark:border-white/[0.04]' : ''
                )}
              >
                <div className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black',
                  medalCls[idx] ?? 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-neutral-600'
                )}>
                  {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-bold text-gray-900 dark:text-white">{p.playerName}</div>
                  <div className="text-[10px] text-gray-400 dark:text-neutral-600">{subLabel} {p[subKey as keyof typeof p]}</div>
                </div>
                <div className="text-2xl font-black text-primary tabular-nums">{p[mainKey as keyof typeof p]}</div>
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
