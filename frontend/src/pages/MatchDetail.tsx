import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Toast } from 'antd-mobile';
import { useConfirmDialog } from '../components/ConfirmDialog';
import {
  ChevronLeft, Clock, MapPin, Users, CalendarClock,
  Share2, UserPlus, LogOut, Shield, Loader2, Undo2, Edit, Swords
} from 'lucide-react';
import apiClient from '../api/client';
import { matchApi } from '../api/match';
import type { GroupsVO } from '../api/match';
import dayjs from 'dayjs';
import useAuthStore from '../store/useAuthStore';
import html2canvas from 'html2canvas';

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

const positionMeta: Record<string, { label: string; colorClass: string }> = {
  GK: { label: '门将', colorClass: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  DF: { label: '后卫', colorClass: 'bg-sky-500/15 text-sky-400 border-sky-500/20' },
  MF: { label: '中场', colorClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  FW: { label: '前锋', colorClass: 'bg-rose-500/15 text-rose-400 border-rose-500/20' },
};

const formatPosterDate = (value: string | number | Date) => {
  const parsed = dayjs(value);
  return {
    month: parsed.format('MM月'),
    day: parsed.format('DD'),
    weekday: parsed.format('dddd'),
    full: parsed.format('YYYY年MM月DD日 HH:mm'),
    short: parsed.format('MM.DD HH:mm'),
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

const MatchDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { me, isAdmin } = useAuthStore();
  const admin = isAdmin();
  const currentPlayerId = me?.player?.id;
  const { show: showConfirm, DialogComponent } = useConfirmDialog();

  const [match, setMatch] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [pendingRegistrations, setPendingRegistrations] = useState<any[]>([]);
  const [players, setPlayers] = useState<Record<number, any>>({});
  const [pageLoading, setPageLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [groupsData, setGroupsData] = useState<GroupsVO | null>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [eligiblePlayers, setEligiblePlayers] = useState<any[]>([]);
  const [playerFilter, setPlayerFilter] = useState('');

  const fetchData = async () => {
    try {
      const matchData: any = await apiClient.get(`/api/match/${id}`);
      setMatch(matchData);

      try {
        const regs: any = await apiClient.get(`/api/match/${id}/registrations`);
        setRegistrations(regs || []);

        const playerMap: Record<number, any> = {};
        for (const reg of (regs || [])) {
          if (!playerMap[reg.playerId]) {
            try {
              const p: any = await apiClient.get(`/api/player/${reg.playerId}`);
              playerMap[reg.playerId] = p;
            } catch {
              playerMap[reg.playerId] = { nickname: `球员 #${reg.playerId}`, position: '' };
            }
          }
        }

        // 管理员加载待审批列表
        if (admin) {
          try {
            const pending: any = await apiClient.get(`/api/match/${id}/pending`);
            setPendingRegistrations(pending || []);
            for (const reg of (pending || [])) {
              if (!playerMap[reg.playerId]) {
                try {
                  const p: any = await apiClient.get(`/api/player/${reg.playerId}`);
                  playerMap[reg.playerId] = p;
                } catch {
                  playerMap[reg.playerId] = { nickname: `球员 #${reg.playerId}`, position: '' };
                }
              }
            }
          } catch {
            setPendingRegistrations([]);
          }
        }

        setPlayers(playerMap);
      } catch {
        setRegistrations([]);
        setPendingRegistrations([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  useEffect(() => {
    if (!id) return;
    matchApi.getGroups(id).then(data => setGroupsData(data)).catch(() => setGroupsData(null));
  }, [id, match?.status, match?.groupsPublished]);

  /* ── Derived state ── */
  const activeRegs = registrations.filter(r => r.status === 'REGISTERED');
  const registeredCount = activeRegs.length;
  const totalCapacity = (match?.numGroups || 0) * (match?.playersPerGroup || 0);
  const estimatedCost =
    registeredCount > 0 && match?.totalCost > 0
      ? (parseFloat(match.totalCost) / registeredCount).toFixed(2)
      : null;
  const canRegister = match?.status === 'PUBLISHED';
  const isRegistered = activeRegs.some(r => r.playerId === currentPlayerId);
  const isPending = pendingRegistrations.some(r => r.playerId === currentPlayerId);

  /* ── Registration handlers ── */
  const handleRegister = async () => {
    if (!currentPlayerId) {
      Toast.show({ icon: 'fail', content: '请先完善球员信息' });
      return;
    }
    setRegistering(true);
    try {
      await apiClient.post(`/api/match/${id}/register`, null, { params: { playerId: currentPlayerId } });
      Toast.show({ icon: 'success', content: '报名成功！' });
      fetchData();
    } catch { /* handled by interceptor */ }
    finally { setRegistering(false); }
  };

  const handleCancelRegistration = async () => {
    const confirmed = await showConfirm({
      title: '取消报名',
      content: dayjs().isAfter(dayjs(match?.cancelDeadline))
        ? '已过免费取消时间，取消后仍需分摊费用。确定取消？'
        : '确定要取消报名吗？',
    });
    if (!confirmed) return;
    try {
      await apiClient.post(`/api/match/${id}/cancel`, null, { params: { playerId: currentPlayerId } });
      Toast.show({ icon: 'success', content: '已取消报名' });
      fetchData();
    } catch { /* handled by interceptor */ }
  };

  /* ── Admin: revert to preparing ── */
  const handleRevertToPreparing = async () => {
    const confirmed = await showConfirm({
      title: '回退到筹备',
      content: '确定要将赛事回退到筹备状态吗？报名将暂停。',
    });
    if (!confirmed) return;
    try {
      await apiClient.post(`/api/match/${id}/revert-preparing`);
      Toast.show({ icon: 'success', content: '已回退到筹备状态' });
      fetchData();
    } catch { /* handled by interceptor */ }
  };

  /* ── Admin: approve/reject pending ── */
  const handleApprove = async (playerId: number) => {
    try {
      await apiClient.post(`/api/match/${id}/approve`, null, { params: { playerId } });
      Toast.show({ icon: 'success', content: '已批准报名' });
      fetchData();
    } catch { /* handled by interceptor */ }
  };

  const handleReject = async (playerId: number) => {
    const confirmed = await showConfirm({
      title: '拒绝报名',
      content: '确定要拒绝该球员的报名申请吗？',
    });
    if (!confirmed) return;
    try {
      await apiClient.post(`/api/match/${id}/reject`, null, { params: { playerId } });
      Toast.show({ icon: 'success', content: '已拒绝报名' });
      fetchData();
    } catch { /* handled by interceptor */ }
  };

  /* ── Admin: add player ── */
  const handleShowAddPlayer = async () => {
    if (!showAddPlayer) {
      try {
        const players = await matchApi.getEligiblePlayers(id!);
        setEligiblePlayers(players || []);
        setPlayerFilter('');
      } catch { /* handled by interceptor */ }
    }
    setShowAddPlayer(!showAddPlayer);
  };

  const handleAddPlayer = async (playerId: number, playerName: string) => {
    const confirmed = await showConfirm({
      title: '添加球员',
      content: `确定要添加 ${playerName} 到报名列表吗？`,
    });
    if (!confirmed) return;
    try {
      await matchApi.adminAddPlayer(id!, playerId);
      Toast.show({ icon: 'success', content: '球员已添加' });
      setShowAddPlayer(false);
      fetchData();
    } catch { /* handled by interceptor */ }
  };

  /* ── Admin: start match ── */
  const handleStartMatch = async () => {
    const result = await showConfirm({
      title: '确认开赛',
      content: (
        <div className="space-y-2">
          <div>确定要开始比赛吗？</div>
          <div className="text-sm text-neutral-500">开赛后将生成场次，请确认分组已发布且球员已就位。</div>
        </div>
      ),
    });
    if (!result) return;

    const actualStartTime = match?.startTime || new Date().toISOString();
    try {
      await matchApi.startMatch(id!, actualStartTime);
      Toast.show({ icon: 'success', content: '比赛已开始！' });
      fetchData();
    } catch { /* handled by interceptor */ }
  };

  /* ── Admin: rollback status ── */
  const handleRollbackStatus = async () => {
    const result = await showConfirm({
      title: '回退状态',
      content: '确定要将比赛状态回退吗？已生成的场次将被删除。',
    });
    if (!result) return;

    try {
      await matchApi.rollbackStatus(id!, 'REGISTRATION_CLOSED');
      Toast.show({ icon: 'success', content: '状态已回退' });
      fetchData();
    } catch { /* handled by interceptor */ }
  };

  /* ── Admin: soft delete ── */
  const handleSoftDelete = async () => {
    const result = await showConfirm({
      title: '删除赛事',
      content: '确定要删除此赛事吗？删除后可在回收站中恢复。',
    });
    if (!result) return;

    try {
      await matchApi.softDelete(id!);
      Toast.show({ icon: 'success', content: '赛事已删除' });
      navigate('/matches');
    } catch { /* handled by interceptor */ }
  };

  /* ── Poster generation ── */
  const handleGeneratePoster = async () => {
    if (!posterRef.current) return;
    Toast.show({ icon: 'loading', content: '生成海报中...', duration: 0 });
    try {
      const canvas = await html2canvas(posterRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: '#0a0a0a',
      });
      const link = document.createElement('a');
      link.download = `海报_${match.title}_${dayjs().format('MMDD')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      Toast.clear();
      Toast.show({ icon: 'success', content: '海报已生成，请保存分享' });
    } catch (err) {
      console.error(err);
      Toast.clear();
      Toast.show({ icon: 'fail', content: '生成失败' });
    }
  };

  /* ── Loading / Empty ── */
  if (pageLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }
  if (!match) return null;

  const statusMeta = getMatchStatusMeta(match.status);
  const posterDate = formatPosterDate(match.startTime);

  return (
    <div className="relative mx-auto max-w-6xl px-6 py-8 sm:px-8 lg:px-10 lg:py-16">
      {/* Background glows */}
      <div className="pointer-events-none absolute left-[-8%] top-10 h-64 w-64 rounded-full bg-primary/8 blur-[140px]" />
      <div className="pointer-events-none absolute right-[-6%] top-24 h-72 w-72 rounded-full bg-white/[0.04] blur-[160px]" />

      {/* ── Nav ── */}
      <nav className="relative z-10 mb-10 flex items-center justify-between">
        <button onClick={() => navigate('/matches')} className="group flex items-center text-neutral-500 font-bold hover:text-white transition-colors">
          <ChevronLeft size={20} className="mr-1 group-hover:-translate-x-1 transition-transform" /> 赛事广场
        </button>
        {admin && match?.status === 'PUBLISHED' && (
          <button
            onClick={handleRevertToPreparing}
            className="hidden h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 text-xs font-bold tracking-wide text-neutral-400 transition-all hover:border-neutral-600 hover:text-white md:flex"
          >
            <Undo2 size={14} /> 回退到筹备
          </button>
        )}
      </nav>

      {/* ── Hero Header ── */}
      <header className="relative z-10 mx-auto mb-10 max-w-5xl overflow-hidden rounded-[2rem] border border-neutral-800 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_26%),linear-gradient(180deg,rgba(24,24,27,1)_0%,rgba(10,10,10,1)_100%)] px-6 py-5 sm:px-7 sm:py-6">
        <div className={`absolute right-[-8%] top-6 h-40 w-40 rounded-full bg-gradient-to-br ${statusMeta.accentClass} opacity-25 blur-3xl`} />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        <div className="relative z-10">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-0.5 py-1">
              <span className={`h-2 w-2 rounded-full ${statusMeta.dotClass}`} />
              <div className="text-[12px] font-semibold tracking-[0.08em] text-primary/90">
                {match.tournamentName || '默认周赛'}
              </div>
            </div>
            <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-semibold tracking-[0.08em] backdrop-blur-sm ${statusMeta.badgeClass}`}>
              <span className={`h-2 w-2 rounded-full ${statusMeta.dotClass} ${match.status === 'ONGOING' ? 'animate-pulse' : ''}`} />
              <span>{statusMeta.label}</span>
            </div>
          </div>

          <h1 className="max-w-3xl text-3xl font-black leading-[1.08] tracking-[-0.03em] text-white lg:text-5xl">
            {match.title}
          </h1>
          <div className={`mt-3 h-px w-20 bg-gradient-to-r ${statusMeta.accentClass}`} />
        </div>
      </header>

      {/* ── Main Content Grid ── */}
      <div className="relative z-10 mx-auto grid max-w-5xl grid-cols-1 items-start gap-10 lg:grid-cols-3">

        {/* ── Left Column ── */}
        <div className="space-y-8 lg:col-span-2">

          {/* Match Info Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] px-5 py-4">
              <div className="mb-3 flex items-center gap-2">
                <Clock size={14} className="text-primary" />
                <span className="text-[10px] font-black tracking-[0.16em] text-neutral-600">开赛时间</span>
              </div>
              <div className="text-sm font-semibold text-white">{posterDate.full}</div>
            </div>
            <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] px-5 py-4">
              <div className="mb-3 flex items-center gap-2">
                <MapPin size={14} className="text-primary" />
                <span className="text-[10px] font-black tracking-[0.16em] text-neutral-600">比赛地点</span>
              </div>
              <div className="text-sm font-semibold text-white">{match.location}</div>
            </div>
            <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] px-5 py-4">
              <div className="mb-3 flex items-center gap-2">
                <Users size={14} className="text-primary" />
                <span className="text-[10px] font-black tracking-[0.16em] text-neutral-600">比赛规模</span>
              </div>
              <div className="text-sm font-semibold text-white">
                {match.numGroups}组 · 每组{match.playersPerGroup}人 · {match.plannedGameCount}场
              </div>
            </div>
            <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] px-5 py-4">
              <div className="mb-3 flex items-center gap-2">
                <CalendarClock size={14} className="text-primary" />
                <span className="text-[10px] font-black tracking-[0.16em] text-neutral-600">报名截止</span>
              </div>
              <div className="text-sm font-semibold text-white">
                {match.registrationDeadline
                  ? dayjs(match.registrationDeadline).format('MM月DD日 HH:mm')
                  : '未设置'}
              </div>
            </div>
          </div>

          {/* ── Pending Approvals (Admin Only) ── */}
          {admin && pendingRegistrations.length > 0 && (
            <div className="rounded-[2rem] border border-amber-500/20 bg-[linear-gradient(180deg,rgba(245,158,11,0.08)_0%,rgba(10,10,10,1)_100%)] p-8">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xs font-black tracking-[0.2em] text-amber-400">待审批报名</h3>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-amber-400">{pendingRegistrations.length}</span>
                  <span className="text-sm font-medium text-neutral-600">人</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {pendingRegistrations.map((reg) => {
                  const player = players[reg.playerId];
                  const initial = (player?.nickname || '?')[0];
                  return (
                    <div
                      key={reg.id}
                      className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] px-4 py-3"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-sm font-black text-amber-400">
                        {initial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-white">
                          {player?.nickname || `球员 #${reg.playerId}`}
                        </div>
                        <div className="mt-0.5 text-[10px] font-medium text-neutral-500">{dayjs(reg.createdAt).format('MM-DD HH:mm')}</div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => handleApprove(reg.playerId)}
                          className="rounded-lg bg-primary/15 border border-primary/30 px-3 py-1.5 text-[10px] font-bold text-primary hover:bg-primary/25 transition-colors"
                        >
                          批准
                        </button>
                        <button
                          onClick={() => handleReject(reg.playerId)}
                          className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-[10px] font-bold text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                          拒绝
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Grouping Section ── */}
          {groupsData && (groupsData.groupsPublished || admin) && (
            <div className="rounded-[2rem] border border-violet-500/20 bg-[linear-gradient(180deg,rgba(139,92,246,0.06)_0%,rgba(10,10,10,1)_100%)] p-8">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xs font-black tracking-[0.2em] text-violet-400">
                  分组情况
                  {admin && !groupsData.groupsPublished && (
                    <span className="ml-2 text-[10px] font-medium text-neutral-500 normal-case tracking-normal">草稿 · 仅管理员可见</span>
                  )}
                </h3>
                {admin && ['PUBLISHED', 'REGISTRATION_CLOSED'].includes(match.status) && (
                  <button
                    onClick={() => navigate(`/matches/${id}/grouping`)}
                    className="text-xs font-bold text-violet-400 border border-violet-500/20 rounded-full px-3 py-1.5 hover:bg-violet-500/10 transition-colors"
                  >
                    管理分组
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Object.entries(groupsData.groups).sort(([a],[b]) => Number(a)-Number(b)).map(([groupIdx, players]) => (
                  <div key={groupIdx} className="rounded-2xl border border-white/6 bg-white/[0.02] p-4">
                    <div className="mb-3 text-[10px] font-black tracking-widest text-neutral-500">
                      TEAM {String.fromCharCode(65 + parseInt(groupIdx))}
                    </div>
                    <div className="space-y-2">
                      {players.map(p => (
                        <div key={p.id} className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-neutral-500">
                            {p.name.slice(0,1)}
                          </div>
                          <span className="text-sm font-semibold text-white">{p.name}</span>
                          <span className="ml-auto text-xs text-neutral-600">{p.rating?.toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Registered Players ── */}
          <div className="rounded-[2rem] border border-neutral-800 bg-[linear-gradient(180deg,rgba(24,24,27,0.98)_0%,rgba(10,10,10,1)_100%)] p-8">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xs font-black tracking-[0.2em] text-neutral-400">已报名球员</h3>
              <div className="flex items-center gap-3">
                {admin && ['PUBLISHED', 'REGISTRATION_CLOSED'].includes(match.status) && (
                  <button
                    onClick={handleShowAddPlayer}
                    className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[10px] font-bold text-primary transition-colors hover:bg-primary/15"
                  >
                    <UserPlus size={12} /> 添加球员
                  </button>
                )}
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-white">{registeredCount}</span>
                  {totalCapacity > 0 && (
                    <span className="text-sm font-medium text-neutral-600">/ {totalCapacity}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Admin Add Player Panel */}
            {admin && showAddPlayer && (
              <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <input
                  type="text"
                  placeholder="搜索球员昵称..."
                  value={playerFilter}
                  onChange={(e) => setPlayerFilter(e.target.value)}
                  className="mb-3 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white placeholder-neutral-500 focus:border-primary/50 focus:outline-none"
                />
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {eligiblePlayers
                    .filter(p => !playerFilter || p.nickname?.toLowerCase().includes(playerFilter.toLowerCase()))
                    .map(player => {
                      const pos = positionMeta[player.position] || {
                        label: '球员',
                        colorClass: 'bg-neutral-500/15 text-neutral-400 border-neutral-500/20',
                      };
                      return (
                        <button
                          key={player.id}
                          onClick={() => handleAddPlayer(player.id, player.nickname)}
                          className="flex w-full items-center gap-3 rounded-xl border border-white/6 bg-white/[0.02] px-3 py-2 text-left transition-colors hover:border-primary/30 hover:bg-primary/5"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary">
                            {(player.nickname || '?')[0]}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-bold text-white">{player.nickname}</div>
                            <div className="text-[10px] text-neutral-500">评分: {player.rating?.toFixed(1) || 'N/A'}</div>
                          </div>
                          <span className={`shrink-0 rounded-lg border px-2 py-0.5 text-[10px] font-bold ${pos.colorClass}`}>
                            {pos.label}
                          </span>
                        </button>
                      );
                    })}
                  {eligiblePlayers.filter(p => !playerFilter || p.nickname?.toLowerCase().includes(playerFilter.toLowerCase())).length === 0 && (
                    <div className="py-8 text-center text-sm text-neutral-500">
                      {playerFilter ? '未找到匹配球员' : '暂无可添加球员'}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Progress bar */}
            {totalCapacity > 0 && (
              <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-neutral-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-700"
                  style={{ width: `${Math.min((registeredCount / totalCapacity) * 100, 100)}%` }}
                />
              </div>
            )}

            {activeRegs.length === 0 ? (
              <div className="py-12 text-center">
                <Users size={36} className="mx-auto mb-3 text-neutral-800" />
                <div className="text-sm font-medium text-neutral-600">暂无人报名，成为第一个吧</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {activeRegs.map((reg, idx) => {
                  const player = players[reg.playerId];
                  const pos = positionMeta[player?.position] || {
                    label: '球员',
                    colorClass: 'bg-neutral-500/15 text-neutral-400 border-neutral-500/20',
                  };
                  const initial = (player?.nickname || '?')[0];
                  return (
                    <div
                      key={reg.id}
                      className="flex items-center gap-3 rounded-2xl border border-white/6 bg-white/[0.02] px-4 py-3 transition-colors hover:border-white/10 hover:bg-white/[0.04]"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-black text-primary">
                        {initial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-white">
                          {player?.nickname || `球员 #${reg.playerId}`}
                        </div>
                        <div className="mt-0.5 text-[10px] font-medium text-neutral-500">#{idx + 1}</div>
                      </div>
                      <span className={`shrink-0 rounded-lg border px-2 py-0.5 text-[10px] font-bold ${pos.colorClass}`}>
                        {pos.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Sidebar ── */}
        <div className="space-y-6 lg:sticky lg:top-16">

          {/* Cost Summary Card */}
          <div className="rounded-[2rem] border border-neutral-800 bg-[linear-gradient(180deg,rgba(24,24,27,0.98)_0%,rgba(10,10,10,1)_100%)] p-8">
            <h3 className="mb-6 text-xs font-black tracking-[0.2em] text-neutral-400">费用概览</h3>
            <div className="space-y-4">
              {match.totalCost > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-500">场地总费用</span>
                  <span className="text-sm font-black text-white">¥{match.totalCost}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-500">当前报名</span>
                <span className="text-sm font-black text-white">{registeredCount} 人</span>
              </div>

              <div className="border-t border-neutral-800 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-[0.12em] text-neutral-400">预估人均</span>
                  <span className="text-3xl font-black tracking-tight text-primary">
                    ¥{estimatedCost || '--'}
                  </span>
                </div>
                {estimatedCost && (
                  <div className="mt-2 text-[10px] font-medium text-neutral-600">
                    基于当前 {registeredCount} 人分摊，最终以结算为准
                  </div>
                )}
              </div>
            </div>

            {/* Register / Cancel / Pending */}
            <div className="mt-6">
              {canRegister && !isRegistered && !isPending && (
                <button
                  onClick={handleRegister}
                  disabled={registering}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-black text-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {registering ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                  {registering ? '报名中...' : '立即报名'}
                </button>
              )}
              {isRegistered && (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-primary/8 py-3 text-xs font-bold text-primary">
                    <Shield size={14} /> 您已成功报名
                  </div>
                  {canRegister && (
                    <button
                      onClick={handleCancelRegistration}
                      className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold text-neutral-500 transition-colors hover:text-red-400"
                    >
                      <LogOut size={14} /> 取消报名
                    </button>
                  )}
                </div>
              )}
              {isPending && (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/8 py-3 text-xs font-bold text-amber-400">
                    <Clock size={14} /> 待管理员审批
                  </div>
                  <div className="text-center text-[10px] text-neutral-600">
                    人数已满，您的报名申请需要管理员批准
                  </div>
                  <button
                    onClick={handleCancelRegistration}
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold text-neutral-500 transition-colors hover:text-red-400"
                  >
                    <LogOut size={14} /> 取消申请
                  </button>
                </div>
              )}
              {!canRegister && !isRegistered && !isPending && (
                <div className="flex items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900 py-4 text-xs font-bold text-neutral-500">
                  {match.status === 'PREPARING' ? '报名尚未开始' : '报名已截止'}
                </div>
              )}
            </div>
          </div>

          {/* Admin Grouping Button */}
          {admin && ['PUBLISHED', 'REGISTRATION_CLOSED', 'GROUPING_DRAFT'].includes(match.status) && (
            <button
              onClick={() => navigate(`/matches/${id}/grouping`)}
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-violet-500/30 bg-violet-500/10 py-4 text-sm font-bold text-violet-400 transition-all hover:bg-violet-500/15 active:scale-[0.98]"
            >
              <Users size={16} /> 管理分组
            </button>
          )}

          {/* Admin Start Match Button */}
          {admin && ['REGISTRATION_CLOSED', 'GROUPING_DRAFT'].includes(match.status) && match.groupsPublished && (
            <button
              onClick={handleStartMatch}
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 py-4 text-sm font-bold text-emerald-400 transition-all hover:bg-emerald-500/15 active:scale-[0.98]"
            >
              <Swords size={16} /> 开赛
            </button>
          )}

          {/* Admin Rollback Button */}
          {admin && match.status === 'ONGOING' && (
            <button
              onClick={handleRollbackStatus}
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 py-4 text-sm font-bold text-amber-400 transition-all hover:bg-amber-500/15 active:scale-[0.98]"
            >
              <Undo2 size={16} /> 回退状态
            </button>
          )}

          {/* Admin Edit Button (Only for PREPARING status) */}
          {admin && match.status === 'PREPARING' && (
            <button
              onClick={() => navigate(`/matches/${id}/edit`)}
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 py-4 text-sm font-bold text-amber-400 transition-all hover:bg-amber-500/15 active:scale-[0.98]"
            >
              <Edit size={16} /> 编辑赛事信息
            </button>
          )}

          {/* Live Arena Entry — ONGOING and beyond */}
          {['ONGOING', 'MATCH_FINISHED', 'SETTLED'].includes(match.status) && (
            <button
              onClick={() => navigate(`/matches/${id}/live`)}
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-orange-500/30 bg-orange-500/10 py-4 text-sm font-bold text-orange-400 transition-all hover:bg-orange-500/15 active:scale-[0.98]"
            >
              <Swords size={16} /> 进入赛场
            </button>
          )}

          {/* Admin Delete Button */}
          {admin && (
            <button
              onClick={handleSoftDelete}
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-red-500/30 bg-red-500/10 py-4 text-sm font-bold text-red-400 transition-all hover:bg-red-500/15 active:scale-[0.98]"
            >
              <LogOut size={16} /> 删除赛事
            </button>
          )}

          {/* Generate Poster */}
          <button
            onClick={handleGeneratePoster}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-primary/20 bg-primary/8 py-4 text-sm font-bold text-primary transition-all hover:bg-primary/15 active:scale-[0.98]"
          >
            <Share2 size={16} /> 生成朋友圈海报
          </button>
        </div>
      </div>

      {/* ── Hidden Poster Template (for html2canvas) ── */}
      <div className="fixed -left-[9999px] top-0">
        <div
          ref={posterRef}
          className="w-[375px] bg-neutral-950 text-white font-sans relative overflow-hidden"
          style={{ backgroundImage: 'radial-gradient(circle at top right, rgba(29,185,84,0.35) 0%, transparent 50%)' }}
        >
          {/* Decorative bg */}
          <div className="absolute top-0 right-0 opacity-[0.06] text-[100px] font-black italic select-none pointer-events-none leading-none pr-4 pt-6">
            OLDBOY
          </div>
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-neutral-950 to-transparent" />

          <div className="relative z-10 p-8 pb-6">
            {/* Header */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[10px] font-bold tracking-[0.1em] text-primary uppercase mb-4">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {match?.tournamentName || '默认周赛'}
              </div>
              <h1 className="text-[28px] font-black leading-tight tracking-tight mb-3">{match?.title}</h1>
              <div className="h-px w-16 bg-gradient-to-r from-primary to-transparent mb-4" />
              <div className="space-y-2 text-[13px] text-neutral-300">
                <div className="flex items-center gap-2">
                  <Clock size={13} className="text-primary shrink-0" />
                  <span>{posterDate.full}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={13} className="text-primary shrink-0" />
                  <span>{match?.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={13} className="text-primary shrink-0" />
                  <span>{match?.numGroups}组 · 每组{match?.playersPerGroup}人 · {match?.plannedGameCount}场</span>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] py-3 text-center">
                <div className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-1">已报名</div>
                <div className="text-xl font-black text-primary">{registeredCount}</div>
                {totalCapacity > 0 && (
                  <div className="text-[10px] font-medium text-neutral-600">/ {totalCapacity} 人</div>
                )}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] py-3 text-center">
                <div className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-1">预估人均</div>
                <div className="text-xl font-black text-white">¥{estimatedCost || '--'}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] py-3 text-center">
                <div className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-1">比赛规模</div>
                <div className="text-xl font-black text-white">{match?.plannedGameCount || '-'}</div>
                <div className="text-[10px] font-medium text-neutral-600">场</div>
              </div>
            </div>

            {/* Player list */}
            {activeRegs.length > 0 && (
              <div className="mb-8">
                <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3">报名球员</div>
                <div className="flex flex-wrap gap-2">
                  {activeRegs.map(reg => (
                    <span
                      key={reg.id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.08] px-3 py-1.5 text-[11px] font-bold"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                      {players[reg.playerId]?.nickname || `#${reg.playerId}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Footer branding */}
            <div className="pt-5 border-t border-neutral-800 flex justify-between items-end">
              <div>
                <div className="text-[9px] text-neutral-600 font-bold mb-1 uppercase tracking-widest">Powered by</div>
                <div className="text-lg font-black italic tracking-tighter">
                  OLDBOY <span className="text-primary">CLUB</span>
                </div>
              </div>
              <div className="text-right">
                <div className="rounded-lg bg-primary/15 border border-primary/25 px-3 py-1.5 text-[10px] font-black text-primary tracking-wide">
                  扫码报名
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      <DialogComponent />
    </div>
  );
};

export default MatchDetail;
