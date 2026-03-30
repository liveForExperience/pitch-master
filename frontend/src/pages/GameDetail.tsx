import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Toast } from 'antd-mobile';
import { ChevronLeft, Target, Zap, Clock, Flag, Trophy, User } from 'lucide-react';
import { gameApi } from '../api/game';
import type { GameDetailVO, ParticipantInfo, RecordGoalRequest } from '../api/game';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';

type GoalStep = 'idle' | 'select_type' | 'select_scorer' | 'select_assistant';

interface GoalDraft {
  teamIndex: number;
  type: 'NORMAL' | 'OWN_GOAL' | null;
  scorer: ParticipantInfo | null;
}

export default function GameDetail() {
  const { gameId } = useParams<{ id: string; gameId: string }>();
  const navigate = useNavigate();

  const [game, setGame] = useState<GameDetailVO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [goalStep, setGoalStep] = useState<GoalStep>('idle');
  const [goalDraft, setGoalDraft] = useState<GoalDraft>({ teamIndex: 0, type: null, scorer: null });

  const [overtimeInput, setOvertimeInput] = useState('');
  const [showOvertimeInput, setShowOvertimeInput] = useState(false);

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [showStartModal, setShowStartModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [timeInput, setTimeInput] = useState('');

  const toLocalIsoString = (date: Date) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const fetchGame = useCallback(async () => {
    if (!gameId) return;
    try {
      const data = await gameApi.getDetail(gameId);
      setGame(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    fetchGame();
    let interval: ReturnType<typeof setInterval> | null = null;
    if (game?.status === 'PLAYING') {
      interval = setInterval(fetchGame, 15000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [fetchGame, game?.status]);

  const teamName = (idx: number) =>
    game?.teamNames?.[idx] ?? `第${idx + 1}队`;

  const scheduledStart = () => {
    if (!game?.matchStartTime || game.durationPerGame == null || game.gameIndex == null) return null;
    const base = new Date(game.matchStartTime);
    base.setMinutes(base.getMinutes() + game.durationPerGame * game.gameIndex);
    return base;
  };

  const formatTime = (iso: string | null | undefined) => {
    if (!iso) return '--:--';
    const d = new Date(iso);
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const confirmStart = async () => {
    if (!gameId || actionLoading) return;
    setActionLoading(true);
    try {
      const formattedTime = timeInput.length === 16 ? timeInput + ':00' : timeInput;
      await gameApi.startGame(gameId, timeInput ? formattedTime : undefined);
      setShowStartModal(false);
      await fetchGame();
    } catch (e: unknown) {
      Toast.show({ icon: 'fail', content: e instanceof Error ? e.message : '操作失败' });
    } finally {
      setActionLoading(false);
    }
  };

  const confirmFinish = async () => {
    if (!gameId || actionLoading) return;
    setActionLoading(true);
    try {
      const formattedTime = timeInput.length === 16 ? timeInput + ':00' : timeInput;
      await gameApi.finishGame(gameId, timeInput ? formattedTime : undefined);
      setShowFinishModal(false);
      await fetchGame();
    } catch (e: unknown) {
      Toast.show({ icon: 'fail', content: e instanceof Error ? e.message : '操作失败' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddOvertime = async () => {
    if (!gameId || actionLoading) return;
    const mins = parseInt(overtimeInput, 10);
    if (isNaN(mins) || mins <= 0) { Toast.show({ icon: 'fail', content: '请输入有效的分钟数' }); return; }
    setActionLoading(true);
    try {
      await gameApi.addOvertime(gameId, mins);
      setOvertimeInput('');
      setShowOvertimeInput(false);
      await fetchGame();
    } catch (e: unknown) {
      Toast.show({ icon: 'fail', content: e instanceof Error ? e.message : '操作失败' });
    } finally {
      setActionLoading(false);
    }
  };

  const beginGoalFlow = (teamIndex: number) => {
    setGoalDraft({ teamIndex, type: null, scorer: null });
    setGoalStep('select_type');
  };

  const selectType = (type: 'NORMAL' | 'OWN_GOAL') => {
    setGoalDraft(d => ({ ...d, type }));
    setGoalStep('select_scorer');
  };

  const selectScorer = (p: ParticipantInfo) => {
    setGoalDraft(d => ({ ...d, scorer: p }));
    if (goalDraft.type === 'OWN_GOAL') {
      submitGoal(goalDraft.teamIndex, goalDraft.type, p, null);
    } else {
      setGoalStep('select_assistant');
    }
  };

  const selectAssistant = (p: ParticipantInfo | null) => {
    submitGoal(goalDraft.teamIndex, goalDraft.type!, goalDraft.scorer!, p);
  };

  const submitGoal = async (
    teamIndex: number,
    type: 'NORMAL' | 'OWN_GOAL',
    scorer: ParticipantInfo,
    assistant: ParticipantInfo | null,
  ) => {
    if (!gameId || actionLoading) return;
    setActionLoading(true);
    const payload: RecordGoalRequest = {
      gameId: Number(gameId),
      teamIndex,
      type,
      scorerId: scorer.playerId,
      assistantId: assistant?.playerId ?? null,
      occurredAt: new Date().toISOString(),
    };
    try {
      await gameApi.recordGoal(payload);
      setGoalStep('idle');
      await fetchGame();
    } catch (e: unknown) {
      Toast.show({ icon: 'fail', content: e instanceof Error ? e.message : '录入失败' });
      setGoalStep('idle');
    } finally {
      setActionLoading(false);
    }
  };

  const cancelGoalFlow = () => {
    setGoalStep('idle');
    setGoalDraft({ teamIndex: 0, type: null, scorer: null });
  };

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  if (error || !game) return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
      <p className="text-sm text-red-400">{error || '场次不存在'}</p>
      <button onClick={() => navigate(-1)} className="text-sm font-semibold text-primary underline">返回</button>
    </div>
  );

  const sched = scheduledStart();

  const nameA = teamName(game.teamAIndex);
  const nameB = teamName(game.teamBIndex);
  const scoreA = game.scoreA ?? 0;
  const scoreB = game.scoreB ?? 0;

  /* ── PLAYING derived values ── */
  let elapsedMins = 0, elapsedSecs = 0;
  if (game.status === 'PLAYING' && game.startTime) {
    const diff = Math.max(0, Math.floor((now.getTime() - new Date(game.startTime).getTime()) / 1000));
    elapsedMins = Math.floor(diff / 60);
    elapsedSecs = diff % 60;
  }
  const isOvertime = !!(game.durationPerGame && elapsedMins >= game.durationPerGame);
  const timerDisplay = `${elapsedMins.toString().padStart(2, '0')}:${elapsedSecs.toString().padStart(2, '0')}`;

  /* ── Goal dialog state ── */
  const goalDialogOpen = goalStep !== 'idle';

  return (
    <div className="relative mx-auto max-w-lg pb-28 px-4 pt-4 sm:px-6">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed left-0 top-0 h-64 w-64 rounded-full bg-primary/5 blur-[120px]" />
      <div className="pointer-events-none fixed right-0 top-20 h-56 w-56 rounded-full bg-orange-500/5 blur-[120px]" />

      {/* ── Navigation ── */}
      <nav className="relative z-10 mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center gap-1 text-gray-500 dark:text-neutral-500 font-bold hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
          返回
        </button>
        <span className="text-gray-300 dark:text-neutral-800">/</span>
        <span className="text-sm font-semibold text-gray-500 dark:text-neutral-400">
          第 {(game.gameIndex ?? 0) + 1} 场
        </span>
        <GameStatusBadge status={game.status} />
      </nav>

      {/* ── READY STATE ── */}
      {game.status === 'READY' && (
        <div className="space-y-4">
          {/* Upcoming match hero */}
          <div className="overflow-hidden rounded-[2rem] border border-gray-200 dark:border-white/8 bg-white dark:bg-[linear-gradient(180deg,rgba(24,24,27,1)_0%,rgba(10,10,10,1)_100%)] px-6 py-7">
            <div className="text-center text-[10px] font-black tracking-[0.2em] text-gray-400 dark:text-neutral-600 mb-5">待开赛</div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/20">
                  <span className="text-xs font-black text-sky-400">{nameA.charAt(0)}</span>
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{nameA}</p>
              </div>
              <div className="flex flex-col items-center gap-1 shrink-0">
                <span className="text-2xl font-black text-gray-300 dark:text-neutral-700">VS</span>
                {sched && (
                  <span className="text-[10px] font-semibold text-gray-400 dark:text-neutral-600">
                    {formatTime(sched.toISOString())}
                  </span>
                )}
              </div>
              <div className="flex-1 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <span className="text-xs font-black text-orange-400">{nameB.charAt(0)}</span>
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{nameB}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TeamRoster title={nameA} accentColor="sky" participants={game.teamAParticipants} />
            <TeamRoster title={nameB} accentColor="orange" participants={game.teamBParticipants} />
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => { setTimeInput(toLocalIsoString(new Date())); setShowStartModal(true); }}
            disabled={actionLoading}
          >
            <Flag size={16} />
            设置并开始比赛
          </Button>
        </div>
      )}

      {/* ── PLAYING STATE ── */}
      {game.status === 'PLAYING' && (
        <div className="space-y-4">
          {/* ── Hero Scoreboard ── */}
          <div className="relative overflow-hidden rounded-[2rem] border border-orange-500/25 bg-[linear-gradient(160deg,rgba(234,88,12,0.12)_0%,rgba(249,250,251,1)_60%)] dark:bg-[linear-gradient(160deg,rgba(234,88,12,0.10)_0%,rgba(10,10,10,1)_55%)] px-5 py-6">
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-orange-400/30 bg-orange-500/10 px-2.5 py-1 text-[10px] font-black text-orange-500 dark:text-orange-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400" />
              LIVE
            </div>
            <div className="relative z-10 flex items-center">
              {/* Team A */}
              <div className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-500/25 bg-sky-500/10">
                  <span className="text-base font-black text-sky-500">{nameA.charAt(0)}</span>
                </div>
                <p className="max-w-[80px] text-center text-[11px] font-bold text-gray-600 dark:text-neutral-400 truncate">{nameA}</p>
                <p className={cn(
                  'text-6xl font-black leading-none tracking-tighter',
                  scoreA > scoreB ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-neutral-600'
                )}>{scoreA}</p>
              </div>
              {/* Center */}
              <div className="flex flex-col items-center gap-2 px-3 shrink-0">
                <div className={cn(
                  'rounded-xl px-3 py-1.5 text-xl font-mono font-black tabular-nums',
                  isOvertime
                    ? 'bg-red-500/15 text-red-500 dark:text-red-400 animate-pulse'
                    : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                )}>
                  {timerDisplay}
                </div>
                {isOvertime && (
                  <span className="text-[9px] font-black tracking-widest text-red-400">加时</span>
                )}
                <span className="text-[10px] font-mono text-gray-400 dark:text-neutral-600 whitespace-nowrap">
                  {formatTime(game.startTime)}~{formatTime(game.endTime)}
                </span>
              </div>
              {/* Team B */}
              <div className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-500/25 bg-orange-500/10">
                  <span className="text-base font-black text-orange-500">{nameB.charAt(0)}</span>
                </div>
                <p className="max-w-[80px] text-center text-[11px] font-bold text-gray-600 dark:text-neutral-400 truncate">{nameB}</p>
                <p className={cn(
                  'text-6xl font-black leading-none tracking-tighter',
                  scoreB > scoreA ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-neutral-600'
                )}>{scoreB}</p>
              </div>
            </div>
          </div>

          {/* Goal buttons */}
          {goalStep === 'idle' && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => beginGoalFlow(game.teamAIndex)}
                disabled={actionLoading}
                className="group relative overflow-hidden rounded-2xl border border-sky-500/25 bg-sky-500/[0.08] py-4 text-sm font-black text-sky-600 dark:text-sky-400 transition-all hover:border-sky-500/40 hover:bg-sky-500/[0.14] active:scale-[0.97] disabled:opacity-40"
              >
                <div className="flex items-center justify-center gap-2">
                  <Target size={15} />
                  {nameA} 进球
                </div>
              </button>
              <button
                onClick={() => beginGoalFlow(game.teamBIndex)}
                disabled={actionLoading}
                className="group relative overflow-hidden rounded-2xl border border-orange-500/25 bg-orange-500/[0.08] py-4 text-sm font-black text-orange-600 dark:text-orange-400 transition-all hover:border-orange-500/40 hover:bg-orange-500/[0.14] active:scale-[0.97] disabled:opacity-40"
              >
                <div className="flex items-center justify-center gap-2">
                  <Target size={15} />
                  {nameB} 进球
                </div>
              </button>
            </div>
          )}

          {/* Goal log */}
          <GoalLog goals={game.goals} game={game} />

          {/* Overtime */}
          <div className="rounded-2xl border border-gray-200 dark:border-white/6 bg-white dark:bg-white/[0.02] px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-amber-400" />
                <span className="text-xs font-semibold text-gray-600 dark:text-neutral-400">补时</span>
                {(game.overtimeMinutes ?? 0) > 0 && (
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-500">+{game.overtimeMinutes}'</span>
                )}
              </div>
              <button
                onClick={() => setShowOvertimeInput(v => !v)}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {showOvertimeInput ? '取消' : '添加补时'}
              </button>
            </div>
            {showOvertimeInput && (
              <div className="mt-3 flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={overtimeInput}
                  onChange={e => setOvertimeInput(e.target.value)}
                  placeholder="分钟数"
                  className="flex-1 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/[0.04] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-600 outline-none focus:border-primary/50"
                />
                <Button variant="amber" size="sm" onClick={handleAddOvertime} disabled={actionLoading}>确认</Button>
              </div>
            )}
          </div>

          {/* End game */}
          <Button
            variant="secondary"
            size="lg"
            className="w-full border-red-200 dark:border-red-900/30 bg-red-50/60 dark:bg-red-950/20 text-red-500 dark:text-red-400 hover:bg-red-100/60 dark:hover:bg-red-900/30 hover:border-red-300 dark:hover:border-red-800/50"
            onClick={() => { setTimeInput(toLocalIsoString(new Date())); setShowFinishModal(true); }}
            disabled={actionLoading}
          >
            结束本场比赛
          </Button>
        </div>
      )}

      {/* ── FINISHED STATE ── */}
      {game.status === 'FINISHED' && (
        <div className="space-y-4">
          {/* Final score card */}
          <div className="relative overflow-hidden rounded-[2rem] border border-gray-200 dark:border-white/8 bg-white dark:bg-[linear-gradient(180deg,rgba(24,24,27,1)_0%,rgba(10,10,10,1)_100%)] px-5 py-7">
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            <div className="relative z-10 text-center text-[10px] font-black tracking-[0.2em] text-gray-400 dark:text-neutral-600 mb-5">
              最终比分 · FT
            </div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex-1 text-center">
                <div className={cn('mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border', scoreA > scoreB ? 'border-primary/30 bg-primary/10' : 'border-gray-200 dark:border-white/6 bg-gray-100 dark:bg-white/[0.04]')}>
                  <span className={cn('text-base font-black', scoreA > scoreB ? 'text-primary' : 'text-gray-500 dark:text-neutral-500')}>{nameA.charAt(0)}</span>
                </div>
                <p className="text-xs font-semibold text-gray-500 dark:text-neutral-500 truncate mb-2">{nameA}</p>
                <p className={cn('text-6xl font-black leading-none tracking-tighter', scoreA > scoreB ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-neutral-700')}>{scoreA}</p>
              </div>
              <div className="shrink-0 flex flex-col items-center gap-1 px-2">
                <span className="text-2xl font-black text-gray-300 dark:text-neutral-700">:</span>
                <span className="text-[9px] font-mono text-gray-400 dark:text-neutral-600 whitespace-nowrap">
                  {formatTime(game.startTime)} — {formatTime(game.endTime)}
                  {(game.overtimeMinutes ?? 0) > 0 && ` +${game.overtimeMinutes}'`}
                </span>
              </div>
              <div className="flex-1 text-center">
                <div className={cn('mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border', scoreB > scoreA ? 'border-primary/30 bg-primary/10' : 'border-gray-200 dark:border-white/6 bg-gray-100 dark:bg-white/[0.04]')}>
                  <span className={cn('text-base font-black', scoreB > scoreA ? 'text-primary' : 'text-gray-500 dark:text-neutral-500')}>{nameB.charAt(0)}</span>
                </div>
                <p className="text-xs font-semibold text-gray-500 dark:text-neutral-500 truncate mb-2">{nameB}</p>
                <p className={cn('text-6xl font-black leading-none tracking-tighter', scoreB > scoreA ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-neutral-700')}>{scoreB}</p>
              </div>
            </div>
          </div>

          <GoalLog goals={game.goals} game={game} />

          <div className="grid grid-cols-2 gap-3">
            <ParticipantStats title={nameA} participants={game.teamAParticipants} />
            <ParticipantStats title={nameB} participants={game.teamBParticipants} />
          </div>
        </div>
      )}

      {/* ── Goal Flow Dialog ── */}
      <Dialog open={goalDialogOpen} onOpenChange={(open) => { if (!open) cancelGoalFlow(); }}>
        <DialogContent className="max-w-sm">
          {goalStep === 'select_type' && (
            <>
              <DialogHeader>
                <DialogTitle>进球类型</DialogTitle>
                <p className="text-sm text-gray-500 dark:text-neutral-400">{teamName(goalDraft.teamIndex)}</p>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => selectType('NORMAL')}
                  className="flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary/[0.08] px-5 py-4 text-left transition-all hover:border-primary/40 hover:bg-primary/[0.14] active:scale-[0.97]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-xl">⚽</span>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">正常进球</p>
                    <p className="text-xs text-gray-500 dark:text-neutral-500">射门得分</p>
                  </div>
                </button>
                <button
                  onClick={() => selectType('OWN_GOAL')}
                  className="flex items-center gap-3 rounded-2xl border border-red-500/25 bg-red-500/[0.06] px-5 py-4 text-left transition-all hover:border-red-500/40 hover:bg-red-500/[0.12] active:scale-[0.97]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-xl">🙈</span>
                  <div>
                    <p className="font-bold text-red-500 dark:text-red-400">乌龙球</p>
                    <p className="text-xs text-gray-500 dark:text-neutral-500">计入对方进球</p>
                  </div>
                </button>
              </div>
            </>
          )}

          {goalStep === 'select_scorer' && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {goalDraft.type === 'OWN_GOAL' ? '选择乌龙球员' : '选择进球球员'}
                </DialogTitle>
                <p className="text-sm text-gray-500 dark:text-neutral-400">
                  {goalDraft.type === 'OWN_GOAL'
                    ? teamName(goalDraft.teamIndex === game.teamAIndex ? game.teamBIndex : game.teamAIndex)
                    : teamName(goalDraft.teamIndex)}
                </p>
              </DialogHeader>
              <ScorerList
                participants={goalDraft.type === 'OWN_GOAL'
                  ? (goalDraft.teamIndex === game.teamAIndex ? game.teamBParticipants : game.teamAParticipants)
                  : (goalDraft.teamIndex === game.teamAIndex ? game.teamAParticipants : game.teamBParticipants)}
                onSelect={selectScorer}
              />
            </>
          )}

          {goalStep === 'select_assistant' && (
            <>
              <DialogHeader>
                <DialogTitle>选择助攻球员</DialogTitle>
                <p className="text-sm text-gray-500 dark:text-neutral-400">{teamName(goalDraft.teamIndex)} · 可跳过</p>
              </DialogHeader>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => selectAssistant(null)}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-white/8 bg-gray-50 dark:bg-white/[0.03] px-4 py-3 text-sm font-bold text-gray-500 dark:text-neutral-400 transition-all hover:border-gray-300 dark:hover:border-white/15 hover:text-gray-900 dark:hover:text-white"
                >
                  无助攻，直接确认
                </button>
                <div className="my-1 text-[10px] font-black tracking-widest text-gray-400 dark:text-neutral-600">或选择助攻者</div>
                <ScorerList
                  participants={(goalDraft.teamIndex === game.teamAIndex ? game.teamAParticipants : game.teamBParticipants)
                    .filter(p => p.playerId !== goalDraft.scorer?.playerId)}
                  onSelect={selectAssistant}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Start / Finish Time Dialogs ── */}
      <Dialog open={showStartModal} onOpenChange={setShowStartModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>确认开赛时间</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <input
              type="datetime-local"
              value={timeInput}
              onChange={e => setTimeInput(e.target.value)}
              className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/[0.04] px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-primary/50 w-full"
            />
            <Button variant="primary" size="lg" className="w-full" onClick={confirmStart} disabled={actionLoading}>
              <Flag size={15} /> 确认开始
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showFinishModal} onOpenChange={setShowFinishModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>确认结束时间</DialogTitle>
            <p className="text-sm text-gray-500 dark:text-neutral-400">将基于此时间和原定时长自动计算补时。</p>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <input
              type="datetime-local"
              value={timeInput}
              onChange={e => setTimeInput(e.target.value)}
              className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/[0.04] px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-primary/50 w-full"
            />
            <Button
              variant="secondary"
              size="lg"
              className="w-full border-red-200 dark:border-red-900/30 bg-red-50/60 dark:bg-red-950/20 text-red-500 hover:bg-red-100/60 dark:hover:bg-red-900/30"
              onClick={confirmFinish}
              disabled={actionLoading}
            >
              确认结束比赛
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Helper Components ──────────────────────────────────────────── */

function GameStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    READY:    { label: '待开始', cls: 'border-gray-200 dark:border-white/8 bg-gray-100 dark:bg-white/[0.04] text-gray-500 dark:text-neutral-400' },
    PLAYING:  { label: '进行中', cls: 'border-orange-500/25 bg-orange-500/10 text-orange-500 dark:text-orange-400' },
    FINISHED: { label: '已结束', cls: 'border-gray-200 dark:border-white/6 bg-gray-100 dark:bg-white/[0.03] text-gray-400 dark:text-neutral-600' },
  };
  const s = map[status] ?? { label: status, cls: 'border-gray-200 dark:border-white/8 bg-gray-100 dark:bg-white/[0.03] text-gray-500 dark:text-neutral-500' };
  return (
    <span className={cn('ml-auto inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold', s.cls)}>
      {status === 'PLAYING' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400" />}
      {s.label}
    </span>
  );
}

function TeamRoster({ title, accentColor, participants }: {
  title: string;
  accentColor: 'sky' | 'orange';
  participants: ParticipantInfo[];
}) {
  const colors = {
    sky:    { header: 'text-sky-500 dark:text-sky-400',    dot: 'bg-sky-500/20 border-sky-500/20',    icon: 'text-sky-400' },
    orange: { header: 'text-orange-500 dark:text-orange-400', dot: 'bg-orange-500/20 border-orange-500/20', icon: 'text-orange-400' },
  };
  const c = colors[accentColor];
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/6 bg-white dark:bg-white/[0.02] p-4">
      <div className={cn('mb-3 flex items-center gap-1.5 text-xs font-bold', c.header)}>
        <User size={12} />
        {title}
      </div>
      {participants.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-neutral-600">暂无名单</p>
      ) : (
        <div className="flex flex-col gap-1">
          {participants.map(p => (
            <div key={p.playerId} className="flex items-center gap-2">
              <span className={cn('h-1.5 w-1.5 rounded-full border', c.dot)} />
              <span className="text-xs text-gray-700 dark:text-neutral-300">{p.playerName}</span>
              {p.isMvp && <Trophy size={10} className="text-amber-400 ml-auto" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScorerList({ participants, onSelect }: {
  participants: ParticipantInfo[];
  onSelect: (p: ParticipantInfo) => void;
}) {
  if (participants.length === 0) {
    return <p className="py-4 text-center text-sm text-gray-400 dark:text-neutral-600">暂无球员</p>;
  }
  return (
    <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
      {participants.map(p => (
        <button
          key={p.playerId}
          onClick={() => onSelect(p)}
          className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-white/6 bg-gray-50 dark:bg-white/[0.03] px-4 py-3 text-left transition-all hover:border-gray-300 dark:hover:border-white/15 hover:bg-gray-100 dark:hover:bg-white/[0.06] active:scale-[0.98]"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-black text-primary">
            {p.playerName.charAt(0)}
          </span>
          <span className="flex-1 text-sm font-semibold text-gray-900 dark:text-white">{p.playerName}</span>
          <span className="text-xs text-gray-400 dark:text-neutral-600">{p.goals}球 {p.assists}助</span>
        </button>
      ))}
    </div>
  );
}

function GoalLog({ goals, game }: { goals: GameDetailVO['goals']; game: GameDetailVO }) {
  if (!goals || goals.length === 0) return null;
  const tName = (idx: number) => game.teamNames?.[idx] ?? `第${idx + 1}队`;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/6 bg-white dark:bg-white/[0.02] px-5 py-4">
      <div className="mb-4 flex items-center gap-2">
        <Zap size={13} className="text-primary" />
        <span className="text-[10px] font-black tracking-[0.18em] text-gray-400 dark:text-neutral-600">进球记录</span>
      </div>
      <div className="relative flex flex-col gap-0">
        {/* Timeline line */}
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200 dark:bg-white/[0.06]" />
        {goals.map((g, i) => {
          const isOG = g.type === 'OWN_GOAL';
          return (
            <div key={g.goalId} className={cn('relative flex items-start gap-4 pb-4', i === goals.length - 1 && 'pb-0')}>
              <div className={cn(
                'relative z-10 mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-black',
                isOG
                  ? 'bg-red-500/20 border border-red-500/30 text-red-400'
                  : 'bg-primary/20 border border-primary/30 text-primary'
              )}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn(
                    'rounded-md border px-1.5 py-0.5 text-[10px] font-bold',
                    isOG
                      ? 'border-red-500/20 bg-red-500/10 text-red-400'
                      : 'border-primary/20 bg-primary/10 text-primary'
                  )}>
                    {isOG ? '乌龙' : tName(g.teamIndex)}
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{g.scorerName ?? '未知'}</span>
                  {g.assistantName && (
                    <span className="text-xs text-gray-400 dark:text-neutral-600">↪ {g.assistantName}</span>
                  )}
                  {g.occurredAt && (
                    <span className="ml-auto text-[10px] font-mono text-gray-400 dark:text-neutral-600">
                      {new Date(g.occurredAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ParticipantStats({ title, participants }: { title: string; participants: ParticipantInfo[] }) {
  const sorted = [...participants].sort((a, b) => (b.goals + b.assists) - (a.goals + a.assists));
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/6 bg-white dark:bg-white/[0.02] p-4">
      <div className="mb-3 text-xs font-bold text-gray-600 dark:text-neutral-400 truncate">{title}</div>
      {sorted.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-neutral-600">暂无数据</p>
      ) : sorted.map(p => (
        <div key={p.playerId} className="flex items-center justify-between py-1 text-xs">
          <span className={cn('truncate', p.isMvp ? 'font-bold text-amber-400' : 'text-gray-700 dark:text-neutral-300')}>
            {p.isMvp && '★ '}{p.playerName}
          </span>
          <span className="ml-2 shrink-0 text-gray-400 dark:text-neutral-600">{p.goals}球 {p.assists}助</span>
        </div>
      ))}
    </div>
  );
}
