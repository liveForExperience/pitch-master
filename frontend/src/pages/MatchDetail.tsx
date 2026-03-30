import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Toast, CenterPopup } from 'antd-mobile';
import { useConfirmDialog } from '../components/ConfirmDialog';
import {
  ChevronLeft, Clock, MapPin, Users, CalendarClock,
  UserPlus, LogOut, Shield, Loader2, Calculator, CheckCircle,
  XCircle, Play, LayoutList, Edit3, Trash2, ChevronRight, Swords, Share2, X
} from 'lucide-react';
import apiClient from '../api/client';
import { matchApi } from '../api/match';
import type { GroupsVO, StandingsVO, MatchStatsVO, MatchGame } from '../api/match';
import dayjs from 'dayjs';
import useAuthStore from '../store/useAuthStore';
import html2canvas from 'html2canvas';
import GameCard from '../components/GameCard';
import RegistrationPoster from '../components/poster/RegistrationPoster';
import ReportPoster from '../components/poster/ReportPoster';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { positionMeta, getMatchStatusMeta } from '../constants/match';

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

const MatchDetail: React.FC = () => {
  const { id, tournamentId } = useParams<{ id: string; tournamentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = `/tournaments/${tournamentId}/matches`;
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
  const registrationPosterRef = useRef<HTMLDivElement>(null);
  const reportPosterRef = useRef<HTMLDivElement>(null);
  const [generatedPosterUrl, setGeneratedPosterUrl] = useState<string | null>(null);

  // Post-match states
  const [standings, setStandings] = useState<StandingsVO | null>(null);
  const [stats, setStats] = useState<MatchStatsVO | null>(null);
  const [games, setGames] = useState<MatchGame[]>([]);

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

      // Fetch post-match info if finished
      if (matchData.status === 'MATCH_FINISHED') {
        try {
          const [st, ss, gm] = await Promise.all([
            matchApi.getStandings(id!),
            matchApi.getStats(id!),
            apiClient.get(`/api/game/list`, { params: { matchId: id } }) as Promise<MatchGame[]>
          ]);
          setStandings(st);
          setStats(ss);
          setGames(gm || []);
        } catch { }
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
  const myReg = registrations.find(r => r.playerId === currentPlayerId);

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
  const handleShowAddPlayer = () => {
    navigate(`${basePath}/${id}/add-players`);
  };

  /* ── Admin: close registration ── */
  const handleCloseRegistration = async () => {
    const confirmed = await showConfirm({
      title: '结束报名',
      content: '确定要关闭报名吗？关闭后球员将无法继续报名，可进入分组阶段。',
    });
    if (!confirmed) return;
    try {
      await matchApi.closeRegistration(id!);
      Toast.show({ icon: 'success', content: '报名已关闭' });
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
          <div className="text-sm text-gray-500 dark:text-neutral-500">开赛后将生成场次，请确认分组已发布且球员已就位。</div>
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

  /* ── Admin: finish match ── */
  const handleFinishMatch = async () => {
    const result = await showConfirm({
      title: '结束比赛',
      content: '确定要结束比赛吗？未结束的场次将作废为0:0。',
    });
    if (!result) return;
    try {
      await apiClient.post(`/api/match/${id}/finish`);
      Toast.show({ icon: 'success', content: '比赛已结束' });
      fetchData();
    } catch { }
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
      navigate(basePath);
    } catch { /* handled by interceptor */ }
  };

  /* ── Poster generation ── */
  const handleGeneratePoster = async () => {
    const isReport = match.status === 'MATCH_FINISHED';
    const targetRef = isReport ? reportPosterRef : registrationPosterRef;
    if (!targetRef.current) return;
    Toast.show({ icon: 'loading', content: '生成海报中...', duration: 0 });
    try {
      const canvas = await html2canvas(targetRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: '#0a0a0a',
      });
      setGeneratedPosterUrl(canvas.toDataURL('image/png'));
      Toast.clear();
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
      <nav className="relative z-10 mb-10 flex items-center">
        <button onClick={() => navigate(`${basePath}${location.search || ''}`)} className="group flex items-center text-gray-500 dark:text-neutral-500 font-bold hover:text-gray-900 dark:hover:text-white transition-colors">
          <ChevronLeft size={20} className="mr-1 group-hover:-translate-x-1 transition-transform" /> 赛事中心
        </button>
      </nav>

      {/* ── Hero Header ── */}
      <header className="relative z-10 mx-auto mb-8 max-w-5xl overflow-hidden rounded-[2rem] border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_26%),linear-gradient(180deg,rgba(24,24,27,1)_0%,rgba(10,10,10,1)_100%)] px-6 py-5 sm:px-7 sm:py-6">
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

          <h1 className="max-w-3xl text-3xl font-black leading-[1.08] tracking-[-0.03em] text-gray-900 dark:text-white lg:text-5xl">
            {match.title}
          </h1>
          <div className={`mt-3 h-px w-20 bg-gradient-to-r ${statusMeta.accentClass}`} />
        </div>
      </header>

      {/* ── Admin Action Block ── */}
      {admin && (
        <div className="relative z-10 mx-auto mb-8 max-w-5xl">
          <div className="overflow-hidden rounded-[2rem] border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[linear-gradient(180deg,rgba(24,24,27,0.98)_0%,rgba(10,10,10,1)_100%)] p-6">
            {/* Section label */}
            <div className="mb-5 flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-primary/15">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              <span className="text-[10px] font-black tracking-[0.18em] text-gray-400 dark:text-neutral-500">管理员操作</span>
            </div>

            {/* Primary action */}
            {match.status === 'PUBLISHED' && (
              <button
                onClick={handleCloseRegistration}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-black text-black tracking-wide shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <XCircle size={16} /> 结束报名
              </button>
            )}
            {match.status === 'REGISTRATION_CLOSED' && (
              <button
                onClick={handleStartMatch}
                disabled={!match.groupsPublished}
                title={!match.groupsPublished ? '请先在"球员与分组"选项卡中发布分组' : undefined}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-black text-black tracking-wide shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
              >
                <Play size={16} /> 开始比赛
                {!match.groupsPublished && <span className="text-[10px] font-semibold opacity-70">（需先发布分组）</span>}
              </button>
            )}
            {match.status === 'ONGOING' && (
              <button
                onClick={() => navigate(`${basePath}/${id}/live`)}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-black text-black tracking-wide shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Swords size={16} /> 进入赛场
              </button>
            )}
            {match.status === 'MATCH_FINISHED' && (
              <button
                onClick={() => navigate(`${basePath}/${id}/finance`)}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-black text-black tracking-wide shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Calculator size={16} /> 管理结算信息
              </button>
            )}

            {/* Secondary actions */}
            {['PUBLISHED', 'REGISTRATION_CLOSED', 'ONGOING', 'PREPARING'].includes(match.status) && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {match.status === 'PREPARING' && (
                  <button
                    onClick={() => navigate(`${basePath}/${id}/edit`)}
                    className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] py-3 text-xs font-bold text-gray-600 dark:text-neutral-300 transition-all hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-100 dark:hover:bg-white/[0.06] active:scale-95"
                  >
                    <Edit3 size={13} /> 编辑赛事信息
                  </button>
                )}
                {match.status === 'PUBLISHED' && (
                  <>
                    <button
                      onClick={handleRevertToPreparing}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] py-3 text-xs font-bold text-gray-600 dark:text-neutral-300 transition-all hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-100 dark:hover:bg-white/[0.06] active:scale-95"
                    >
                      <ChevronLeft size={13} /> 回退筹备
                    </button>
                    <button
                      onClick={handleShowAddPlayer}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] py-3 text-xs font-bold text-gray-600 dark:text-neutral-300 transition-all hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-100 dark:hover:bg-white/[0.06] active:scale-95"
                    >
                      <UserPlus size={13} /> 添加球员
                    </button>
                    <button
                      onClick={() => navigate(`${basePath}/${id}/grouping`)}
                      className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] py-3 text-xs font-bold text-gray-600 dark:text-neutral-300 transition-all hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-100 dark:hover:bg-white/[0.06] active:scale-95"
                    >
                      <LayoutList size={13} /> 管理分组
                    </button>
                  </>
                )}
                {match.status === 'REGISTRATION_CLOSED' && (
                  <>
                    <button
                      onClick={handleShowAddPlayer}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] py-3 text-xs font-bold text-gray-600 dark:text-neutral-300 transition-all hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-100 dark:hover:bg-white/[0.06] active:scale-95"
                    >
                      <UserPlus size={13} /> 添加球员
                    </button>
                    <button
                      onClick={() => navigate(`${basePath}/${id}/grouping`)}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] py-3 text-xs font-bold text-gray-600 dark:text-neutral-300 transition-all hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-100 dark:hover:bg-white/[0.06] active:scale-95"
                    >
                      <LayoutList size={13} /> 管理分组
                    </button>
                  </>
                )}
                {match.status === 'ONGOING' && (
                  <>
                    <button
                      onClick={handleRollbackStatus}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] py-3 text-xs font-bold text-gray-600 dark:text-neutral-300 transition-all hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-100 dark:hover:bg-white/[0.06] active:scale-95"
                    >
                      <ChevronLeft size={13} /> 回退状态
                    </button>
                    <button
                      onClick={handleFinishMatch}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/60 dark:bg-red-950/30 py-3 text-xs font-bold text-red-500 dark:text-red-400 transition-all hover:bg-red-100/60 dark:hover:bg-red-900/40 active:scale-95"
                    >
                      <XCircle size={13} /> 结束比赛
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Universal actions */}
            <div className="flex items-center gap-4 border-t border-gray-100 dark:border-white/[0.06] pt-4">
              <button
                onClick={handleSoftDelete}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 dark:text-neutral-500 transition-colors hover:text-red-400"
              >
                <Trash2 size={12} /> 删除赛事
              </button>
              <ChevronRight size={12} className="ml-auto text-gray-300 dark:text-neutral-700" />
            </div>
          </div>
        </div>
      )}

      {/* ── User Action Block ── */}
      <div className="relative z-10 mx-auto mb-8 max-w-5xl">
        <div className="overflow-hidden rounded-[2rem] border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[linear-gradient(180deg,rgba(24,24,27,0.98)_0%,rgba(10,10,10,1)_100%)] p-6">
          <div className="mb-5 flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-sky-500/15">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
            </span>
            <span className="text-[10px] font-black tracking-[0.18em] text-gray-400 dark:text-neutral-500">我的操作</span>
          </div>

          <div className="flex flex-col gap-3">
            {match.settlementPublished && myReg && !myReg.isExempt && (
              <div className="mb-4 rounded-2xl bg-amber-500/10 p-5 border border-amber-500/20">
                <div className="flex justify-between items-end mb-3">
                  <div className="text-xs font-bold text-amber-500">我的账单</div>
                  <div className="text-2xl font-black text-amber-500 dark:text-amber-400 leading-none">¥{myReg.paymentAmount}</div>
                </div>
                {myReg.paymentStatus === 'PAID' ? (
                  <div className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary/10 py-2.5 text-xs font-bold text-primary">
                    <CheckCircle size={14} /> 已支付
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      const confirmed = await showConfirm({
                        title: '确认支付',
                        content: '确定已通过线下方式支付该费用吗？'
                      });
                      if (!confirmed) return;
                      try {
                        await apiClient.post(`/api/match/${id}/payment`, null, { params: { playerId: currentPlayerId, status: 'PAID' } });
                        Toast.show({ icon: 'success', content: '支付成功' });
                        fetchData();
                      } catch (e) { }
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                  >
                    <CheckCircle size={14} /> 确认支付
                  </button>
                )}
              </div>
            )}

            {canRegister && !isRegistered && !isPending && (
              <button
                onClick={handleRegister}
                disabled={registering}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-black text-black tracking-wide shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
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
                {match.status === 'ONGOING' && (
                  <button
                    onClick={() => navigate(`${basePath}/${id}/live`)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 py-4 text-sm font-black text-white tracking-wide shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Swords size={16} /> 进入比赛
                  </button>
                )}
                {canRegister && (
                  <button
                    onClick={handleCancelRegistration}
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold text-gray-500 dark:text-neutral-500 transition-colors hover:text-red-400"
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
                <div className="text-center text-[10px] text-gray-400 dark:text-neutral-600">
                  人数已满，您的报名申请需要管理员批准
                </div>
                <button
                  onClick={handleCancelRegistration}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold text-gray-500 dark:text-neutral-500 transition-colors hover:text-red-400"
                >
                  <LogOut size={14} /> 取消申请
                </button>
              </div>
            )}
            
            {!canRegister && !isRegistered && !isPending && (
              <div className="flex items-center justify-center rounded-2xl border border-gray-200 dark:border-neutral-800 bg-gray-100 dark:bg-white/[0.03] py-4 text-xs font-bold text-gray-500 dark:text-neutral-500">
                {match.status === 'PREPARING' ? '报名尚未开始' : '报名已截止'}
              </div>
            )}

            {/* Poster Generator Button for normal users */}
            {match.status !== 'PREPARING' && (
              <button
                onClick={handleGeneratePoster}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 py-4 text-sm font-black text-white tracking-wide shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Share2 size={16} />
                {match.status === 'MATCH_FINISHED' ? '分享战报海报' : '分享报名海报'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Content Tabs ── */}
      <div className="relative z-10 mx-auto max-w-5xl pb-32">
        <Tabs defaultValue="overview" className="mb-8">
          <TabsList className="mb-6 w-full">
            <TabsTrigger value="overview">概览与费用</TabsTrigger>
            <TabsTrigger value="players">球员与分组</TabsTrigger>
            {['ONGOING', 'MATCH_FINISHED'].includes(match.status) && (
              <TabsTrigger value="live">赛况与数据</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-[1.6rem] border border-gray-200 dark:border-neutral-700/60 bg-white dark:bg-neutral-900 px-5 py-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Clock size={14} className="text-primary" />
                    <span className="text-[10px] font-black tracking-[0.16em] text-gray-400 dark:text-neutral-600">开赛时间</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">{posterDate.full}</div>
                </div>
                <div className="rounded-[1.6rem] border border-gray-200 dark:border-neutral-700/60 bg-white dark:bg-neutral-900 px-5 py-4">
                  <div className="mb-3 flex items-center gap-2">
                    <MapPin size={14} className="text-primary" />
                    <span className="text-[10px] font-black tracking-[0.16em] text-gray-400 dark:text-neutral-600">比赛地点</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">{match.location}</div>
                </div>
                <div className="rounded-[1.6rem] border border-gray-200 dark:border-neutral-700/60 bg-white dark:bg-neutral-900 px-5 py-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Users size={14} className="text-primary" />
                    <span className="text-[10px] font-black tracking-[0.16em] text-gray-400 dark:text-neutral-600">比赛规模</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {match.numGroups}组 · 每组{match.playersPerGroup}人 · {match.plannedGameCount}场
                  </div>
                </div>
                <div className="rounded-[1.6rem] border border-gray-200 dark:border-neutral-700/60 bg-white dark:bg-neutral-900 px-5 py-4">
                  <div className="mb-3 flex items-center gap-2">
                    <CalendarClock size={14} className="text-primary" />
                    <span className="text-[10px] font-black tracking-[0.16em] text-gray-400 dark:text-neutral-600">报名截止</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {match.registrationDeadline
                      ? dayjs(match.registrationDeadline).format('MM月DD日 HH:mm')
                      : '未设置'}
                  </div>
                </div>
              </div>
              <div className="rounded-[2rem] border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[linear-gradient(180deg,rgba(24,24,27,0.98)_0%,rgba(10,10,10,1)_100%)] p-8">
                <h3 className="mb-6 text-xs font-black tracking-[0.2em] text-gray-500 dark:text-neutral-400">费用概览</h3>
                <div className="space-y-4">
                  {match.totalCost > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500 dark:text-neutral-500">场地总费用</span>
                      <span className="text-sm font-black text-gray-900 dark:text-white">¥{match.totalCost}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 dark:text-neutral-500">当前报名</span>
                    <span className="text-sm font-black text-gray-900 dark:text-white">{registeredCount} 人</span>
                  </div>

                  <div className="border-t border-gray-100 dark:border-neutral-800 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold tracking-[0.12em] text-gray-500 dark:text-neutral-400">预估人均</span>
                      <span className="text-3xl font-black tracking-tight text-primary">
                        ¥{estimatedCost || '--'}
                      </span>
                    </div>
                    {estimatedCost && (
                      <div className="mt-2 text-[10px] font-medium text-gray-400 dark:text-neutral-600">
                        基于当前 {registeredCount} 人分摊，最终以结算为准
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {admin && match.status === 'MATCH_FINISHED' && (
                <div className="rounded-[2rem] border border-rose-200 dark:border-rose-800/60 bg-rose-50/60 dark:bg-neutral-900 p-6 sm:p-8">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xs font-black tracking-[0.2em] text-rose-500 dark:text-rose-400">应付费明细</h3>
                    <span className="text-xs font-medium text-gray-500 dark:text-neutral-500">{activeRegs.filter(r => !r.isExempt && r.status !== 'CANCELLED').length} 人</span>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {registrations.filter(r => !r.isExempt && r.status !== 'CANCELLED').map((reg) => {
                      const p = players[reg.playerId];
                      return (
                        <div key={reg.id} className="flex justify-between items-center rounded-xl bg-white dark:bg-neutral-800 border border-rose-100 dark:border-neutral-700/60 py-2 px-3">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[120px]">{p?.nickname || `球员 #${reg.playerId}`}</span>
                          <span className={`text-xs font-bold ${reg.paymentStatus === 'PAID' ? 'text-primary' : 'text-rose-400'}`}>
                            {reg.paymentStatus === 'PAID' ? '已付' : (reg.paymentAmount != null && match.settlementPublished ? `¥${reg.paymentAmount}` : '待结算')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {match.settlementPublished && (
                    <button
                      onClick={() => navigate(`${basePath}/${id}/finance`)}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-300 bg-rose-100 py-3 text-xs font-bold text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100 transition-all hover:bg-rose-200 dark:hover:bg-rose-900 hover:border-rose-400 dark:hover:border-rose-800 active:scale-[0.98]"
                    >
                      前往对账统计
                    </button>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="players">
            <div className="space-y-6 pt-4">
              {admin && pendingRegistrations.length > 0 && (
                <div className="rounded-[2rem] border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[linear-gradient(180deg,rgba(24,24,27,0.98)_0%,rgba(10,10,10,1)_100%)] p-8">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-xs font-black tracking-[0.2em] text-amber-600 dark:text-amber-400">待审批报名</h3>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{pendingRegistrations.length}</span>
                      <span className="text-sm font-medium text-gray-500 dark:text-neutral-400">人</span>
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
                            <div className="truncate text-sm font-bold text-gray-900 dark:text-white">
                              {player?.nickname || `球员 #${reg.playerId}`}
                            </div>
                            <div className="mt-0.5 text-[10px] font-medium text-gray-400 dark:text-neutral-500">{dayjs(reg.createdAt).format('MM-DD HH:mm')}</div>
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
              <div className="rounded-[2rem] border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[linear-gradient(180deg,rgba(24,24,27,0.98)_0%,rgba(10,10,10,1)_100%)] p-8">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-xs font-black tracking-[0.2em] text-gray-500 dark:text-neutral-400">已报名球员</h3>
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
                      <span className="text-2xl font-black text-gray-900 dark:text-white">{registeredCount}</span>
                      {totalCapacity > 0 && (
                        <span className="text-sm font-medium text-gray-400 dark:text-neutral-600">/ {totalCapacity}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                {totalCapacity > 0 && (
                  <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-neutral-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-700"
                      style={{ width: `${Math.min((registeredCount / totalCapacity) * 100, 100)}%` }}
                    />
                  </div>
                )}

                {activeRegs.length === 0 ? (
                  <div className="py-12 text-center">
                    <Users size={36} className="mx-auto mb-3 text-gray-300 dark:text-neutral-800" />
                    <div className="text-sm font-medium text-gray-400 dark:text-neutral-600">暂无人报名，成为第一个吧</div>
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
                          className="flex items-center gap-3 rounded-2xl border border-gray-100 dark:border-neutral-700/60 bg-gray-50 dark:bg-neutral-800/50 px-4 py-3 transition-colors hover:border-gray-200 dark:hover:border-neutral-600 hover:bg-gray-100 dark:hover:bg-neutral-700/50"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-black text-primary">
                            {initial}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-bold text-gray-900 dark:text-white">
                              {player?.nickname || `球员 #${reg.playerId}`}
                            </div>
                            <div className="mt-0.5 text-[10px] font-medium text-gray-400 dark:text-neutral-500">#{idx + 1}</div>
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
              {groupsData && (groupsData.groupsPublished || admin) && (
                <div className="rounded-[2rem] border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[linear-gradient(180deg,rgba(24,24,27,0.98)_0%,rgba(10,10,10,1)_100%)] p-8">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-xs font-black tracking-[0.2em] text-violet-600 dark:text-violet-400">
                      分组情况
                      {admin && !groupsData.groupsPublished && (
                        <span className="ml-2 text-[10px] font-medium text-gray-400 dark:text-neutral-500 normal-case tracking-normal">草稿 · 仅管理员可见</span>
                      )}
                    </h3>
                    {admin && ['PUBLISHED', 'REGISTRATION_CLOSED'].includes(match.status) && (
                      <button
                        onClick={() => navigate(`${basePath}/${id}/grouping`)}
                        className="text-xs font-bold text-violet-600 dark:text-violet-400 border border-violet-400/30 dark:border-violet-500/20 rounded-full px-3 py-1.5 hover:bg-violet-500/10 transition-colors"
                      >
                        管理分组
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {Object.entries(groupsData.groups).sort(([a], [b]) => Number(a) - Number(b)).map(([groupIdx, players]) => (
                      <div key={groupIdx} className="rounded-2xl border border-gray-100 dark:border-neutral-700/60 bg-gray-50 dark:bg-neutral-800/40 p-4">
                        <div className="mb-3 text-[10px] font-black tracking-widest text-gray-400 dark:text-neutral-500">
                          TEAM {String.fromCharCode(65 + parseInt(groupIdx))}
                        </div>
                        <div className="space-y-2">
                          {players.map(p => (
                            <div key={p.id} className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-gray-500 dark:text-neutral-500">
                                {p.name.slice(0, 1)}
                              </div>
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">{p.name}</span>
                              <span className="ml-auto text-xs text-gray-400 dark:text-neutral-600">{p.rating?.toFixed(1)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="live">
              <div className="space-y-6 pt-4">
                {match.status === 'MATCH_FINISHED' && standings && stats && (
                  <div className="space-y-6">
                    {/* Games List */}
                    {games.length > 0 && (
                      <div className="rounded-[2rem] border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[linear-gradient(180deg,rgba(24,24,27,0.98)_0%,rgba(10,10,10,1)_100%)] p-6 sm:p-8">
                        <div className="mb-6 flex items-center justify-between">
                          <h3 className="text-xs font-black tracking-[0.2em] text-orange-600 dark:text-orange-400">比赛场次</h3>
                        </div>
                        <div className="flex flex-col gap-3">
                          {games.map(game => (
                            <GameCard key={game.id} game={game} tNames={match.teamNames ?? {}} matchId={id!} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Standings */}
                    <div className="rounded-[2rem] border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[linear-gradient(180deg,rgba(24,24,27,0.98)_0%,rgba(10,10,10,1)_100%)] p-6 sm:p-8">
                      <div className="mb-6 flex items-center justify-between">
                        <h3 className="text-xs font-black tracking-[0.2em] text-amber-600 dark:text-amber-400">积分榜</h3>
                      </div>
                      <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-neutral-700/50 bg-gray-50 dark:bg-neutral-800/40">
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
                        {standings.standings.map((row: any, idx: number) => (
                          <div key={row.teamIndex} className={`grid grid-cols-[2rem_1fr_2.5rem_2.5rem_2.5rem_2.5rem_2.5rem_2.5rem_3rem] items-center gap-1 px-4 py-3 text-sm hover:bg-gray-100/80 dark:hover:bg-white/[0.05] ${idx < standings.standings.length - 1 ? 'border-b border-gray-100 dark:border-white/[0.04]' : ''}`}>
                            <span className={`text-xs font-black ${row.rank === 1 ? 'text-amber-400' : 'text-gray-400 dark:text-neutral-600'}`}>{row.rank}</span>
                            <span className="font-semibold text-gray-900 dark:text-white truncate">{row.teamName}</span>
                            <span className="text-center text-xs text-gray-400 dark:text-neutral-500">{row.played}</span>
                            <span className="text-center text-xs text-primary">{row.wins}</span>
                            <span className="text-center text-xs text-neutral-400">{row.draws}</span>
                            <span className="text-center text-xs text-red-400/70">{row.losses}</span>
                            <span className="text-center text-xs text-neutral-400">{row.goalsFor}</span>
                            <span className={`text-center text-xs font-semibold ${row.goalDifference > 0 ? 'text-primary' : row.goalDifference < 0 ? 'text-red-400/70' : 'text-gray-400 dark:text-neutral-500'}`}>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</span>
                            <span className="text-center text-sm font-black text-gray-900 dark:text-white">{row.points}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Stats - Scorers */}
                    <div className="rounded-[2rem] border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[linear-gradient(180deg,rgba(24,24,27,0.98)_0%,rgba(10,10,10,1)_100%)] p-6 sm:p-8">
                      <div className="mb-6 flex items-center justify-between">
                        <h3 className="text-xs font-black tracking-[0.2em] text-sky-600 dark:text-sky-400">射手榜</h3>
                      </div>
                      <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-neutral-700/50 bg-gray-50 dark:bg-neutral-800/40">
                        {stats.topScorers.length === 0 ? (
                          <div className="py-6 text-center text-sm text-gray-400 dark:text-neutral-600">暂无数据</div>
                        ) : (
                          stats.topScorers.slice(0, 5).map((p: any, idx: number) => (
                            <div key={p.playerId} className={`flex items-center gap-3 px-5 py-3.5 hover:bg-gray-100/80 dark:hover:bg-white/[0.05] ${idx < Math.min(stats.topScorers.length, 5) - 1 ? 'border-b border-gray-100 dark:border-white/[0.04]' : ''}`}>
                              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${idx === 0 ? 'bg-amber-400/15 text-amber-400' : idx === 1 ? 'bg-neutral-400/15 text-neutral-400' : idx === 2 ? 'bg-amber-700/15 text-amber-700' : 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-neutral-400'}`}>{idx + 1}</div>
                              <div className="flex-1 min-w-0">
                                <div className="truncate text-sm font-bold text-gray-900 dark:text-white">{p.playerName}</div>
                              </div>
                              <div className="text-2xl font-black text-primary">{p.goals}</div>
                              <div className="w-10 text-right text-[10px] font-semibold text-gray-400 dark:text-neutral-600">进球</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
          </TabsContent>
        </Tabs>
      </div>



      {/* ── Hidden Poster Templates ── */}
      <RegistrationPoster
        posterRef={registrationPosterRef}
        match={match}
        posterDate={posterDate}
        registeredCount={registeredCount}
        totalCapacity={totalCapacity}
      />
      <ReportPoster
        posterRef={reportPosterRef}
        match={match}
        posterDate={posterDate}
        games={games}
        teamNames={match.teamNames ?? groupsData?.teamNames ?? {}}
        standings={standings}
        stats={stats}
        groupsData={groupsData}
      />

      {/* Confirm Dialog */}
      <DialogComponent />

      {/* Poster Preview Modal */}
      <CenterPopup visible={!!generatedPosterUrl} onMaskClick={() => setGeneratedPosterUrl(null)}>
        <div className="p-4 flex flex-col items-center">
          {generatedPosterUrl && (
            <img src={generatedPosterUrl} alt="Poster" className="max-h-[70vh] w-auto rounded-lg shadow-xl" />
          )}
          <div className="mt-4 text-white font-bold text-sm bg-black/50 px-4 py-2 rounded-full backdrop-blur-md">
            长按图片保存或分享给好友
          </div>
          <button 
            onClick={() => setGeneratedPosterUrl(null)}
            className="mt-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-transform active:scale-95"
          >
            <X size={20} />
          </button>
        </div>
      </CenterPopup>
    </div>
  );
};

export default MatchDetail;
