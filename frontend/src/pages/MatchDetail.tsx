import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Toast } from 'antd-mobile';
import { X, Clock, History, MapPin, ChevronLeft } from 'lucide-react';
import apiClient from '../api/client';
import dayjs from 'dayjs';
import useAuthStore from '../store/useAuthStore';
import MatchPoster from '../components/MatchPoster';

const matchStatusMeta: Record<string, { label: string; badgeClass: string; dotClass: string; accentClass: string }> = {
  PREPARING: {
    label: '筹备中',
    badgeClass: 'border-neutral-500/20 bg-neutral-500/10 text-neutral-400',
    dotClass: 'bg-neutral-400',
    accentClass: 'from-neutral-400/80 to-neutral-400/10',
  },
  PUBLISHED: {
    label: '报名中',
    badgeClass: 'border-primary/20 bg-primary/10 text-primary',
    dotClass: 'bg-primary',
    accentClass: 'from-primary/80 to-primary/10',
  },
  REGISTRATION_CLOSED: {
    label: '报名已截止',
    badgeClass: 'border-sky-500/20 bg-sky-500/10 text-sky-400',
    dotClass: 'bg-sky-400',
    accentClass: 'from-sky-400/80 to-sky-400/10',
  },
  GROUPING_DRAFT: {
    label: '分组中',
    badgeClass: 'border-violet-500/20 bg-violet-500/10 text-violet-400',
    dotClass: 'bg-violet-400',
    accentClass: 'from-violet-400/80 to-violet-400/10',
  },
  ONGOING: {
    label: '比赛中',
    badgeClass: 'border-orange-500/20 bg-orange-500/10 text-orange-400',
    dotClass: 'bg-orange-400',
    accentClass: 'from-orange-400/80 to-orange-400/10',
  },
  MATCH_FINISHED: {
    label: '待核算',
    badgeClass: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
    dotClass: 'bg-amber-400',
    accentClass: 'from-amber-400/80 to-amber-400/10',
  },
  SETTLED: {
    label: '已完结',
    badgeClass: 'border-neutral-700 bg-neutral-800/80 text-neutral-300',
    dotClass: 'bg-neutral-400',
    accentClass: 'from-neutral-300/70 to-neutral-300/5',
  },
  CANCELLED: {
    label: '已取消',
    badgeClass: 'border-red-500/20 bg-red-500/10 text-red-400',
    dotClass: 'bg-red-400',
    accentClass: 'from-red-400/70 to-red-400/5',
  },
};

const formatPosterDate = (value: string | number | Date) => {
  const parsed = dayjs(value);
  return {
    month: parsed.format('MM月'),
    day: parsed.format('DD'),
    full: parsed.format('YYYY年MM月DD日 HH:mm'),
  };
};

const getMatchStatusMeta = (status?: string) => {
  return matchStatusMeta[status || ''] || {
    label: '状态待定',
    badgeClass: 'border-neutral-700 bg-neutral-800/80 text-neutral-300',
    dotClass: 'bg-neutral-400',
    accentClass: 'from-neutral-300/70 to-neutral-300/5',
  };
};

const getLogTypeText = (type?: string) => {
  const map: Record<string, string> = {
    MANUAL: '手动调整',
    GOAL: '比分变更',
  };
  return map[type || ''] || '操作记录';
};

const MatchDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuthStore();
  const admin = isAdmin();

  const [match, setMatch] = useState<any>(null);
  const [games, setGames] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingGameId, setEditingGameId] = useState<number | null>(null);
  const [tempScores, setTempScores] = useState({ scoreA: 0, scoreB: 0 });
  const [logs, setLogs] = useState<any[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  
  const sseRef = useRef<EventSource | null>(null);

  const fetchData = async () => {
    try {
      const matchData: any = await apiClient.get(`/api/match/${id}`);
      setMatch(matchData);
      const gamesData: any = await apiClient.get(`/api/game/list?matchId=${id}`);
      setGames(gamesData);
    } catch (err) {}
  };

  const fetchLogs = async (gameId: number) => {
    try {
      const logData: any = await apiClient.get(`/api/game/${gameId}/logs`);
      setLogs(logData);
      setShowLogs(true);
    } catch (err) {}
  };

  useEffect(() => {
    fetchData();
    const sseUrl = `/api/realtime/subscribe/${id}`;
    sseRef.current = new EventSource(sseUrl);
    sseRef.current.onmessage = (event) => {
      try {
        const updatedGame = JSON.parse(event.data);
        setGames(prev => prev.map(g => g.id === updatedGame.id ? updatedGame : g));
        if (!isEditing) Toast.show({ content: '比分已实时更新', duration: 1000 });
      } catch (e) {}
    };
    return () => { sseRef.current?.close(); };
  }, [id, isEditing]);

  const handleStartEdit = async (game: any) => {
    try {
      await apiClient.post(`/api/game/${game.id}/lock`);
      setEditingGameId(game.id);
      setTempScores({ scoreA: game.scoreA, scoreB: game.scoreB });
      setIsEditing(true);
    } catch (err) {}
  };

  const handleSaveScore = async () => {
    if (!editingGameId) return;
    try {
      await apiClient.post(`/api/game/${editingGameId}/score`, null, {
        params: { scoreA: tempScores.scoreA, scoreB: tempScores.scoreB }
      });
      Toast.show({ icon: 'success', content: '更新成功' });
      setIsEditing(false);
      setEditingGameId(null);
      fetchData();
    } catch (err) {}
  };

  if (!match) return null;

  const statusMeta = getMatchStatusMeta(match.status);
  const posterDate = formatPosterDate(match.startTime);

  return (
    <div className="relative mx-auto max-w-6xl px-6 py-8 sm:px-8 lg:px-10 lg:py-16">
      <div className="pointer-events-none absolute left-[-8%] top-10 h-64 w-64 rounded-full bg-primary/8 blur-[140px]"></div>
      <div className="pointer-events-none absolute right-[-6%] top-24 h-72 w-72 rounded-full bg-white/[0.04] blur-[160px]"></div>

      <nav className="relative z-10 mb-10 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="group flex items-center text-neutral-500 transition-colors font-bold hover:text-white">
          <ChevronLeft size={20} className="mr-1 group-hover:-translate-x-1 transition-transform" /> 返回列表
        </button>
        <div className="flex space-x-4">
          {admin && (
            <button 
              onClick={() => navigate(`/matches/${id}/finance`)}
              className="hidden h-11 items-center rounded-full border border-white/10 bg-white px-5 text-xs font-black tracking-[0.16em] text-black shadow-[0_12px_30px_rgba(255,255,255,0.08)] transition-all hover:scale-[1.03] hover:shadow-[0_16px_36px_rgba(255,255,255,0.14)] md:flex"
            >
              费用管理
            </button>
          )}
        </div>
      </nav>

      <header className="relative z-10 mx-auto mb-12 max-w-5xl overflow-hidden rounded-[2.75rem] border border-neutral-800 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_26%),linear-gradient(180deg,rgba(24,24,27,1)_0%,rgba(10,10,10,1)_100%)] p-7 sm:p-8 lg:p-10">
        <div className={`absolute right-[-8%] top-10 h-56 w-56 rounded-full bg-gradient-to-br ${statusMeta.accentClass} opacity-25 blur-3xl`}></div>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        <div className="absolute right-7 top-8 text-[96px] font-black leading-none tracking-[-0.08em] text-white/[0.05] lg:text-[132px]">
          {posterDate.day}
        </div>
        <div className="relative z-10">
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div className="inline-flex items-center gap-2.5 px-0.5 py-1.5">
              <span className={`h-2 w-2 rounded-full ${statusMeta.dotClass}`}></span>
              <div className="text-[12px] font-semibold tracking-[0.08em] text-primary/90">
                {match.tournamentName || '默认周赛'}
              </div>
            </div>
            <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-semibold tracking-[0.08em] backdrop-blur-sm ${statusMeta.badgeClass}`}>
              <span className={`h-2 w-2 rounded-full ${statusMeta.dotClass} ${match.status === 'ONGOING' ? 'animate-pulse' : ''}`}></span>
              <span>{statusMeta.label}</span>
            </div>
          </div>

          <div className="mb-4 flex items-end gap-3">
            <div className="text-[11px] font-black tracking-[0.22em] text-neutral-500">{posterDate.month}</div>
            <div className="h-px flex-1 bg-gradient-to-r from-white/12 to-transparent"></div>
          </div>

          <h1 className="max-w-3xl text-4xl font-black leading-[1.02] tracking-[-0.04em] text-white lg:text-6xl">
              {match.title}
            </h1>
          <div className={`mt-5 mb-8 h-px w-24 bg-gradient-to-r ${statusMeta.accentClass}`}></div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] px-5 py-4">
              <div className="mb-2 text-[10px] font-black tracking-[0.16em] text-neutral-600">开赛时间</div>
              <div className="text-sm font-semibold text-white">{posterDate.full}</div>
            </div>
            <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] px-5 py-4">
              <div className="mb-2 text-[10px] font-black tracking-[0.16em] text-neutral-600">比赛地点</div>
              <div className="text-sm font-semibold text-white">{match.location}</div>
            </div>
            <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] px-5 py-4">
              <div className="mb-2 text-[10px] font-black tracking-[0.16em] text-neutral-600">人均费用</div>
              <div className="text-2xl font-black tracking-tight text-white">¥{match.perPersonCost || '0.00'}</div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 grid grid-cols-1 items-start gap-10 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <div className="space-y-8">
            {games.map((game) => (
              <div key={game.id} className="relative overflow-hidden rounded-[3rem] border border-neutral-800 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_26%),linear-gradient(180deg,rgba(24,24,27,0.96)_0%,rgba(10,10,10,1)_100%)] p-8 shadow-2xl lg:p-10">
                <div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '34px 34px' }}></div>
                <div className={`absolute right-[-10%] top-8 h-40 w-40 rounded-full bg-gradient-to-br ${statusMeta.accentClass} opacity-20 blur-3xl`}></div>
                <div className="flex items-center justify-around relative z-10">
                  <div className="text-center">
                    <div className="mb-6 text-[10px] font-black tracking-[0.2em] text-neutral-500">A 队 · 第 {game.teamAIndex + 1} 组</div>
                    {isEditing && editingGameId === game.id ? (
                      <button 
                        onClick={() => setTempScores(s => ({...s, scoreA: s.scoreA + 1}))}
                        className="w-32 h-32 bg-primary text-black rounded-[2.5rem] text-5xl font-black shadow-[0_0_40px_rgba(29,185,84,0.3)] active:scale-95 transition-all"
                      >
                        {tempScores.scoreA}
                      </button>
                    ) : (
                      <div className="text-8xl font-black text-white tracking-tighter">{game.scoreA}</div>
                    )}
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="text-4xl font-black italic select-none text-neutral-800">VS</div>
                    {!isEditing && (
                      <button onClick={() => fetchLogs(game.id)} className="mt-6 p-2 text-neutral-700 transition-colors hover:text-primary">
                        <History size={24} />
                      </button>
                    )}
                  </div>

                  <div className="text-center">
                    <div className="mb-6 text-[10px] font-black tracking-[0.2em] text-neutral-500">B 队 · 第 {game.teamBIndex + 1} 组</div>
                    {isEditing && editingGameId === game.id ? (
                      <button 
                        onClick={() => setTempScores(s => ({...s, scoreB: s.scoreB + 1}))}
                        className="w-32 h-32 bg-primary text-black rounded-[2.5rem] text-5xl font-black shadow-[0_0_40px_rgba(29,185,84,0.3)] active:scale-95 transition-all"
                      >
                        {tempScores.scoreB}
                      </button>
                    ) : (
                      <div className="text-8xl font-black text-white tracking-tighter">{game.scoreB}</div>
                    )}
                  </div>
                </div>

                <div className="mt-12 flex justify-center border-t border-white/5 pt-8">
                  {isEditing && editingGameId === game.id ? (
                    <div className="flex items-center justify-center space-x-6">
                      <button onClick={handleSaveScore} className="rounded-full bg-white px-12 py-4 text-sm font-black tracking-[0.16em] text-black transition-all hover:scale-105 active:scale-95">确认比分</button>
                      <button onClick={() => {setIsEditing(false); apiClient.post(`/api/game/${game.id}/unlock`);}} className="px-8 py-4 font-bold text-neutral-500 transition-colors hover:text-white">取消</button>
                    </div>
                  ) : (
                    admin && (
                      <button 
                        onClick={() => handleStartEdit(game)}
                        disabled={isEditing}
                        className="text-xs font-black tracking-[0.28em] text-primary/60 transition-colors hover:text-primary disabled:opacity-20"
                      >
                        点击开始记分
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8 lg:sticky lg:top-16">
          <div className="rounded-[2rem] border border-neutral-800 bg-[linear-gradient(180deg,rgba(24,24,27,0.98)_0%,rgba(10,10,10,1)_100%)] p-8">
            <h3 className="mb-6 text-xs font-black tracking-[0.2em] text-neutral-400">赛事信息</h3>
            <div className="space-y-6">
              <div className="flex items-start">
                <Clock size={18} className="mr-4 text-primary mt-0.5" />
                <div>
                  <div className="text-sm font-bold text-white mb-1">开始时间</div>
                  <div className="text-xs text-neutral-500 font-medium">{dayjs(match.startTime).format('YYYY年MM月DD日 HH:mm')}</div>
                </div>
              </div>
              <div className="flex items-start">
                <MapPin size={18} className="mr-4 text-primary mt-0.5" />
                <div>
                  <div className="text-sm font-bold text-white mb-1">比赛地点</div>
                  <div className="text-xs text-neutral-500 font-medium">{match.location}</div>
                </div>
              </div>
              <div className="pt-6 border-t border-neutral-800">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold tracking-[0.16em] text-neutral-500">人均费用</span>
                  <span className="text-xl font-black text-white tracking-tighter">¥{match.perPersonCost || '0.00'}</span>
                </div>
                <button className="w-full py-4 bg-primary text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20">
                  一键报名
                </button>
              </div>
            </div>
          </div>

          <MatchPoster match={match} games={games} />

          {showLogs && (
            <div className="animate-in fade-in slide-in-from-right duration-500 rounded-[2rem] border border-neutral-800 bg-[linear-gradient(180deg,rgba(24,24,27,0.98)_0%,rgba(10,10,10,1)_100%)] p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-black tracking-[0.2em] text-neutral-400">比分修订记录</h3>
                <button onClick={() => setShowLogs(false)}><X size={16} className="text-neutral-600 hover:text-white" /></button>
              </div>
              <div className="space-y-6">
                {logs.map(log => (
                  <div key={log.id} className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-black text-white">{log.scoreA} : {log.scoreB}</div>
                      <div className="mt-1 text-[10px] font-bold text-neutral-600">{dayjs(log.createdAt).format('HH:mm:ss')}</div>
                    </div>
                    <span className="rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-[10px] font-black tracking-[0.12em] text-primary/80">
                      {getLogTypeText(log.type)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchDetail;
