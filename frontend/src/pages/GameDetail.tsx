import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gameApi } from '../api/game';
import type { GameDetailVO, ParticipantInfo, RecordGoalRequest } from '../api/game';

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

  const handleStart = async () => {
    if (!gameId || actionLoading) return;
    setActionLoading(true);
    try {
      await gameApi.startGame(gameId);
      await fetchGame();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinish = async () => {
    if (!gameId || actionLoading) return;
    if (!confirm('确认结束本场比赛？')) return;
    setActionLoading(true);
    try {
      await gameApi.finishGame(gameId);
      await fetchGame();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddOvertime = async () => {
    if (!gameId || actionLoading) return;
    const mins = parseInt(overtimeInput, 10);
    if (isNaN(mins) || mins <= 0) { alert('请输入有效的加时分钟数'); return; }
    setActionLoading(true);
    try {
      await gameApi.addOvertime(gameId, mins);
      setOvertimeInput('');
      setShowOvertimeInput(false);
      await fetchGame();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '操作失败');
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
      alert(e instanceof Error ? e.message : '录入失败');
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
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !game) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-red-400">{error || '场次不存在'}</p>
      <button onClick={() => navigate(-1)} className="text-primary underline">返回</button>
    </div>
  );

  const sched = scheduledStart();

  return (
    <div className="min-h-screen pb-24 px-4 pt-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-neutral-400 hover:text-white text-xl">←</button>
        <div>
          <h1 className="text-lg font-bold">
            {teamName(game.teamAIndex)} <span className="text-neutral-500">vs</span> {teamName(game.teamBIndex)}
          </h1>
          <p className="text-xs text-neutral-500">第 {(game.gameIndex ?? 0) + 1} 场</p>
        </div>
        <StatusBadge status={game.status} />
      </div>

      {/* ===== READY STATE ===== */}
      {game.status === 'READY' && (
        <div className="space-y-4">
          {sched && (
            <div className="bg-neutral-800 rounded-xl p-4 text-center">
              <p className="text-xs text-neutral-400 mb-1">预计开始时间</p>
              <p className="text-3xl font-bold text-primary">{formatTime(sched.toISOString())}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <TeamRoster title={teamName(game.teamAIndex)} participants={game.teamAParticipants} accent="text-blue-400" />
            <TeamRoster title={teamName(game.teamBIndex)} participants={game.teamBParticipants} accent="text-orange-400" />
          </div>

          <button
            onClick={handleStart}
            disabled={actionLoading}
            className="w-full bg-primary text-black font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-40"
          >
            {actionLoading ? '请稍候…' : '开始比赛'}
          </button>
        </div>
      )}

      {/* ===== PLAYING STATE ===== */}
      {game.status === 'PLAYING' && (
        <div className="space-y-4">
          {/* Scoreboard */}
          <div className="bg-neutral-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 text-center">
                <p className="text-xs text-neutral-400 mb-1 truncate">{teamName(game.teamAIndex)}</p>
                <p className="text-5xl font-black text-white">{game.scoreA ?? 0}</p>
              </div>
              <div className="text-center px-4">
                <p className="text-neutral-500 text-sm font-mono">
                  {formatTime(game.startTime)} ~ {formatTime(game.endTime)}
                </p>
                {(game.overtimeMinutes ?? 0) > 0 && (
                  <p className="text-xs text-yellow-400">+{game.overtimeMinutes}分钟</p>
                )}
              </div>
              <div className="flex-1 text-center">
                <p className="text-xs text-neutral-400 mb-1 truncate">{teamName(game.teamBIndex)}</p>
                <p className="text-5xl font-black text-white">{game.scoreB ?? 0}</p>
              </div>
            </div>
          </div>

          {/* Goal recording flow */}
          {goalStep === 'idle' && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => beginGoalFlow(game.teamAIndex)}
                disabled={actionLoading}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl disabled:opacity-40"
              >
                {teamName(game.teamAIndex)} 进球
              </button>
              <button
                onClick={() => beginGoalFlow(game.teamBIndex)}
                disabled={actionLoading}
                className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-xl disabled:opacity-40"
              >
                {teamName(game.teamBIndex)} 进球
              </button>
            </div>
          )}

          {goalStep === 'select_type' && (
            <GoalModal title={`${teamName(goalDraft.teamIndex)} — 进球类型`} onCancel={cancelGoalFlow}>
              <button
                onClick={() => selectType('NORMAL')}
                className="w-full bg-primary text-black font-bold py-3 rounded-xl"
              >
                ⚽ 正常进球
              </button>
              <button
                onClick={() => selectType('OWN_GOAL')}
                className="w-full bg-red-700 text-white font-bold py-3 rounded-xl"
              >
                🙈 乌龙球
              </button>
            </GoalModal>
          )}

          {goalStep === 'select_scorer' && (
            <GoalModal
              title={goalDraft.type === 'OWN_GOAL'
                ? `选择乌龙球员（${teamName(goalDraft.teamIndex === game.teamAIndex ? game.teamBIndex : game.teamAIndex)} 球员）`
                : `选择进球球员（${teamName(goalDraft.teamIndex)}）`}
              onCancel={cancelGoalFlow}
            >
              <ScorerList
                participants={goalDraft.type === 'OWN_GOAL'
                  ? (goalDraft.teamIndex === game.teamAIndex ? game.teamBParticipants : game.teamAParticipants)
                  : (goalDraft.teamIndex === game.teamAIndex ? game.teamAParticipants : game.teamBParticipants)}
                onSelect={selectScorer}
              />
            </GoalModal>
          )}

          {goalStep === 'select_assistant' && (
            <GoalModal
              title={`选择助攻球员（${teamName(goalDraft.teamIndex)}，可跳过）`}
              onCancel={cancelGoalFlow}
            >
              <button
                onClick={() => selectAssistant(null)}
                className="w-full bg-neutral-600 text-white font-bold py-3 rounded-xl mb-2"
              >
                无助攻
              </button>
              <ScorerList
                participants={(goalDraft.teamIndex === game.teamAIndex ? game.teamAParticipants : game.teamBParticipants)
                  .filter(p => p.playerId !== goalDraft.scorer?.playerId)}
                onSelect={selectAssistant}
              />
            </GoalModal>
          )}

          {/* Goals log */}
          <GoalLog goals={game.goals} game={game} />

          {/* Overtime */}
          <div className="bg-neutral-800 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-neutral-400">加时</span>
              <button onClick={() => setShowOvertimeInput(v => !v)} className="text-xs text-primary">
                {showOvertimeInput ? '取消' : '添加加时'}
              </button>
            </div>
            {showOvertimeInput && (
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={overtimeInput}
                  onChange={e => setOvertimeInput(e.target.value)}
                  placeholder="分钟数"
                  className="flex-1 bg-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none"
                />
                <button
                  onClick={handleAddOvertime}
                  disabled={actionLoading}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-40"
                >
                  确认
                </button>
              </div>
            )}
          </div>

          {/* Finish */}
          <button
            onClick={handleFinish}
            disabled={actionLoading}
            className="w-full bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-3 rounded-xl disabled:opacity-40"
          >
            {actionLoading ? '请稍候…' : '结束比赛'}
          </button>
        </div>
      )}

      {/* ===== FINISHED STATE ===== */}
      {game.status === 'FINISHED' && (
        <div className="space-y-4">
          {/* Final score */}
          <div className="bg-neutral-800 rounded-xl p-4">
            <p className="text-xs text-neutral-400 text-center mb-3">最终比分</p>
            <div className="flex items-center justify-between">
              <div className="flex-1 text-center">
                <p className="text-sm text-neutral-300 mb-1 truncate">{teamName(game.teamAIndex)}</p>
                <p className="text-5xl font-black text-white">{game.scoreA ?? 0}</p>
              </div>
              <p className="text-2xl text-neutral-500 px-3">—</p>
              <div className="flex-1 text-center">
                <p className="text-sm text-neutral-300 mb-1 truncate">{teamName(game.teamBIndex)}</p>
                <p className="text-5xl font-black text-white">{game.scoreB ?? 0}</p>
              </div>
            </div>
            <p className="text-center text-xs text-neutral-500 mt-3">
              {formatTime(game.startTime)} — {formatTime(game.endTime)}
              {(game.overtimeMinutes ?? 0) > 0 && ` (+${game.overtimeMinutes}')`}
            </p>
          </div>

          {/* Goal log */}
          <GoalLog goals={game.goals} game={game} />

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <ParticipantStats title={teamName(game.teamAIndex)} participants={game.teamAParticipants} />
            <ParticipantStats title={teamName(game.teamBIndex)} participants={game.teamBParticipants} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Helper Components ──────────────────────────────────────────── */

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    READY: { label: '未开始', cls: 'bg-neutral-700 text-neutral-300' },
    PLAYING: { label: '进行中', cls: 'bg-green-700 text-green-200 animate-pulse' },
    FINISHED: { label: '已结束', cls: 'bg-neutral-600 text-neutral-400' },
  };
  const s = map[status] ?? { label: status, cls: 'bg-neutral-700 text-neutral-300' };
  return (
    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>{s.label}</span>
  );
}

function TeamRoster({ title, participants, accent }: {
  title: string;
  participants: ParticipantInfo[];
  accent: string;
}) {
  return (
    <div className="bg-neutral-800 rounded-xl p-3">
      <p className={`text-sm font-bold mb-2 ${accent}`}>{title}</p>
      {participants.length === 0
        ? <p className="text-xs text-neutral-500">暂无名单</p>
        : participants.map(p => (
          <div key={p.playerId} className="text-sm text-neutral-300 py-0.5">{p.playerName}</div>
        ))
      }
    </div>
  );
}

function GoalModal({ title, children, onCancel }: {
  title: string;
  children: React.ReactNode;
  onCancel: () => void;
}) {
  return (
    <div className="bg-neutral-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-white">{title}</p>
        <button onClick={onCancel} className="text-neutral-500 hover:text-white text-sm">取消</button>
      </div>
      {children}
    </div>
  );
}

function ScorerList({ participants, onSelect }: {
  participants: ParticipantInfo[];
  onSelect: (p: ParticipantInfo) => void;
}) {
  if (participants.length === 0) {
    return <p className="text-sm text-neutral-500 text-center py-2">暂无球员</p>;
  }
  return (
    <div className="space-y-2 max-h-60 overflow-y-auto">
      {participants.map(p => (
        <button
          key={p.playerId}
          onClick={() => onSelect(p)}
          className="w-full flex items-center gap-3 bg-neutral-700 hover:bg-neutral-600 rounded-lg px-3 py-2 text-left"
        >
          <span className="w-7 h-7 rounded-full bg-neutral-600 flex items-center justify-center text-xs font-bold text-primary">
            {p.playerName.charAt(0)}
          </span>
          <span className="text-sm text-white">{p.playerName}</span>
          <span className="ml-auto text-xs text-neutral-500">
            {p.goals}球 {p.assists}助
          </span>
        </button>
      ))}
    </div>
  );
}

function GoalLog({ goals, game }: { goals: GameDetailVO['goals']; game: GameDetailVO }) {
  if (!goals || goals.length === 0) return null;

  const teamName = (idx: number) => game.teamNames?.[idx] ?? `第${idx + 1}队`;

  return (
    <div className="bg-neutral-800 rounded-xl p-3">
      <p className="text-sm font-bold text-neutral-300 mb-2">进球记录</p>
      <div className="space-y-2">
        {goals.map(g => (
          <div key={g.goalId} className="flex items-center gap-2 text-sm">
            <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${
              g.type === 'OWN_GOAL' ? 'bg-red-800 text-red-200' : 'bg-neutral-700 text-neutral-200'
            }`}>
              {g.type === 'OWN_GOAL' ? '乌龙' : teamName(g.teamIndex)}
            </span>
            <span className="text-white">{g.scorerName ?? '未知'}</span>
            {g.assistantName && (
              <span className="text-neutral-400 text-xs">助攻: {g.assistantName}</span>
            )}
            {g.occurredAt && (
              <span className="ml-auto text-xs text-neutral-500">
                {new Date(g.occurredAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ParticipantStats({ title, participants }: { title: string; participants: ParticipantInfo[] }) {
  const sorted = [...participants].sort((a, b) => (b.goals + b.assists) - (a.goals + a.assists));
  return (
    <div className="bg-neutral-800 rounded-xl p-3">
      <p className="text-sm font-bold text-neutral-300 mb-2">{title}</p>
      {sorted.length === 0
        ? <p className="text-xs text-neutral-500">暂无数据</p>
        : sorted.map(p => (
          <div key={p.playerId} className="flex items-center justify-between py-0.5 text-xs">
            <span className={`text-neutral-300 ${p.isMvp ? 'text-yellow-400 font-bold' : ''}`}>
              {p.isMvp ? '★ ' : ''}{p.playerName}
            </span>
            <span className="text-neutral-500">{p.goals}球 {p.assists}助</span>
          </div>
        ))
      }
    </div>
  );
}
