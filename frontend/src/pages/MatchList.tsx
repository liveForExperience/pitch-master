import React, { useEffect, useState } from 'react';
import { PullToRefresh, FloatingBubble, Toast } from 'antd-mobile';
import { useConfirmDialog } from '../components/ConfirmDialog';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, MapPin, Users, ChevronRight, Trash2, Megaphone } from 'lucide-react';
import apiClient from '../api/client';
import { matchApi } from '../api/match';
import useAuthStore from '../store/useAuthStore';
import dayjs from 'dayjs';

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

const MatchList: React.FC = () => {
  const [matches, setMatches] = useState<any[]>([]);
  const navigate = useNavigate();
  const { fetchMe, fetched, isAdmin } = useAuthStore();
  const admin = isAdmin();
  const { show: showConfirm, DialogComponent } = useConfirmDialog();

  const fetchMatches = async () => {
    try {
      const data: any = await apiClient.get('/api/match/list');
      setMatches(data || []);
    } catch (err) {
      setMatches([]);
    }  };

  useEffect(() => {
    fetchMatches();
    if (!fetched) fetchMe();
  }, []);

  const getStatusMeta = (status: string) => {
    return matchStatusMeta[status] || {
      label: '状态待定',
      badgeClass: 'border-neutral-700 bg-neutral-800/80 text-neutral-300',
      dotClass: 'bg-neutral-400',
      accentClass: 'from-neutral-300/70 to-neutral-300/5',
    };
  };

  const handleDeleteMatch = async (e: React.MouseEvent, matchId: number) => {
    e.stopPropagation();
    const confirmed = await showConfirm({
      title: '删除赛事',
      content: '确定要删除此赛事吗？删除后可在回收站中恢复。',
    });
    if (confirmed) {
      try {
        await matchApi.softDelete(matchId);
        Toast.show({ icon: 'success', content: '赛事已删除' });
        fetchMatches();
      } catch (err) {
        Toast.show({ icon: 'fail', content: '删除失败' });
      }
    }
  };

  const handleStartRegistration = async (e: React.MouseEvent, matchId: number) => {
    e.stopPropagation();
    const confirmed = await showConfirm({
      title: '开放报名',
      content: '确定要开放报名吗？开放后球员将可以看到并报名此赛事。',
    });
    if (confirmed) {
      try {
        await apiClient.post(`/api/match/${matchId}/publish`);
        Toast.show({ icon: 'success', content: '已开放报名' });
        fetchMatches();
      } catch (err) {
        Toast.show({ icon: 'fail', content: '操作失败' });
      }
    }
  };

  const statusSummary = matches.reduce(
    (summary, match) => {
      if (match.status === 'PUBLISHED') summary.published += 1;
      else if (match.status === 'REGISTRATION_CLOSED') summary.grouping += 1;
      else if (match.status === 'ONGOING') summary.ongoing += 1;
      else if (match.status === 'MATCH_FINISHED') summary.finished += 1;
      return summary;
    },
    { published: 0, grouping: 0, ongoing: 0, finished: 0 }
  );

  return (
    <div className="relative mx-auto max-w-6xl px-6 py-10 sm:px-8 lg:px-10 lg:py-16">
      <div className="pointer-events-none absolute left-[-8%] top-14 h-64 w-64 rounded-full bg-primary/8 blur-[140px]"></div>
      <div className="pointer-events-none absolute right-[-6%] top-28 h-72 w-72 rounded-full bg-white/[0.04] blur-[160px]"></div>
      <header className="mx-auto mb-12 flex max-w-5xl flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl relative z-10">
          <div className="mb-4 inline-flex items-center rounded-full border border-gray-200 dark:border-white/8 bg-gray-100 dark:bg-white/[0.03] px-4 py-2 text-[10px] font-black tracking-[0.28em] text-primary">
            赛事中枢
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-gray-900 dark:text-white lg:text-7xl">赛事广场</h1>
          <p className="mt-5 max-w-xl text-sm font-medium leading-7 text-gray-500 dark:text-neutral-500 sm:text-[15px]">
            查看当前开放赛事、进行中对局与费用信息，用更清晰的卡片结构快速判断每场比赛的状态与参与规模。
          </p>
        </div>
        {admin && (
          <div className="relative z-10 hidden items-center gap-3 md:flex">
            <button
              onClick={() => navigate('/matches/trash')}
              className="flex h-12 items-center rounded-full border border-gray-200 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-900 px-5 text-sm font-bold text-gray-500 dark:text-neutral-400 transition-all hover:border-gray-300 dark:hover:border-neutral-600 hover:text-gray-900 dark:hover:text-white active:scale-[0.98]"
            >
              <Trash2 size={16} className="mr-2" /> 回收站
            </button>
            <button 
              onClick={() => navigate('/matches/publish')}
              className="flex h-12 items-center rounded-full border border-gray-300 dark:border-white/10 bg-gray-900 dark:bg-white px-6 text-sm font-black text-white dark:text-black shadow-[0_4px_16px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_30px_rgba(255,255,255,0.08)] transition-[box-shadow,border-color] duration-300 hover:shadow-[0_8px_28px_rgba(0,0,0,0.25)] dark:hover:shadow-[0_16px_36px_rgba(255,255,255,0.14)] active:opacity-80"
            >
              <Plus size={20} className="mr-2" /> 发布新赛事
            </button>
          </div>
        )}
      </header>

      <section className="relative z-10 mx-auto mb-10 grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.75rem] border border-gray-200 dark:border-white/8 bg-white dark:bg-white/[0.03] px-5 py-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)] hover:border-gray-300 dark:hover:border-neutral-600">
          <div className="mb-2 text-[10px] font-black tracking-[0.18em] text-gray-400 dark:text-neutral-600">赛事总览</div>
          <div className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">{matches.length}</div>
          <div className="mt-1 text-xs font-medium text-gray-500 dark:text-neutral-500">当前可见赛事总数</div>
        </div>
        <div className="rounded-[1.75rem] border border-primary/12 bg-primary/[0.05] px-5 py-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(29,185,84,0.12)] dark:hover:shadow-[0_8px_24px_rgba(29,185,84,0.2)] hover:border-primary/20">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-black tracking-[0.18em] text-primary/80">
            <span className="h-2 w-2 rounded-full bg-primary"></span>
            报名中
          </div>
          <div className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">{statusSummary.published}</div>
          <div className="mt-1 text-xs font-medium text-gray-500 dark:text-neutral-500">可继续加入与报名</div>
        </div>
        <div className="rounded-[1.75rem] border border-orange-500/12 bg-orange-500/[0.05] px-5 py-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(249,115,22,0.12)] dark:hover:shadow-[0_8px_24px_rgba(249,115,22,0.2)] hover:border-orange-500/20">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-black tracking-[0.18em] text-orange-400">
            <span className="h-2 w-2 rounded-full bg-orange-400"></span>
            比赛中
          </div>
          <div className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">{statusSummary.ongoing}</div>
          <div className="mt-1 text-xs font-medium text-gray-500 dark:text-neutral-500">正在进行的实时赛事</div>
        </div>
        <div className="rounded-[1.75rem] border border-gray-200 dark:border-neutral-800 bg-white dark:bg-white/[0.02] px-5 py-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)] hover:border-gray-300 dark:hover:border-neutral-600">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-black tracking-[0.18em] text-gray-400 dark:text-neutral-400">
            <span className="h-2 w-2 rounded-full bg-gray-400 dark:bg-neutral-400"></span>
            已结束
          </div>
          <div className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">{statusSummary.finished}</div>
          <div className="mt-1 text-xs font-medium text-gray-500 dark:text-neutral-500">已结束并待处理结算的赛事</div>
        </div>
      </section>

      <PullToRefresh onRefresh={fetchMatches}>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-7 lg:grid-cols-2 xl:gap-8">
          {matches.map(match => {
            const statusMeta = getStatusMeta(match.status);
            const posterDate = formatPosterDate(match.startTime);
            const isPreparing = match.status === 'PREPARING';
            return (
            <div
              key={match.id}
              onClick={() => navigate(`/matches/${match.id}`)}
              className="group relative overflow-hidden rounded-[2.5rem] border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_24%),linear-gradient(180deg,rgba(24,24,27,1)_0%,rgba(10,10,10,1)_100%)] cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:border-gray-300 dark:hover:border-neutral-700 hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_28px_80px_rgba(0,0,0,0.62)]"
            >
              <div className={`absolute right-[-12%] top-10 h-44 w-44 rounded-full bg-gradient-to-br ${statusMeta.accentClass} opacity-20 blur-3xl transition-all duration-500 group-hover:scale-110 group-hover:opacity-30`}></div>
              <div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
              <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent"></div>
              <div className="absolute right-5 top-14 text-[80px] font-black leading-none tracking-[-0.08em] text-white/[0.04] transition-transform duration-500 group-hover:translate-y-[-4px]">
                {posterDate.day}
              </div>

              <div className="relative z-10 flex flex-col px-7 pt-6 pb-5 xl:px-8">
                {/* Header: tournament + status badge */}
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div className="inline-flex min-w-0 items-center gap-2">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusMeta.dotClass}`}></span>
                    <span className="truncate text-[11px] font-semibold tracking-[0.06em] text-primary/80">
                      {match.tournamentName || '默认周赛'}
                    </span>
                  </div>
                  <div className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] backdrop-blur-sm ${statusMeta.badgeClass}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClass} ${match.status === 'ONGOING' ? 'animate-pulse' : ''}`}></span>
                    <span>{statusMeta.label}</span>
                  </div>
                </div>

                {/* Title */}
                <h2 className="mb-4 max-w-[85%] text-[26px] font-black leading-[1.08] tracking-[-0.03em] text-gray-900 dark:text-white transition-colors group-hover:text-primary">
                  {match.title}
                </h2>

                {/* Compact meta row */}
                <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] font-medium text-gray-500 dark:text-neutral-400">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={13} className="text-gray-400 dark:text-neutral-600" />
                    {posterDate.full}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={13} className="text-gray-400 dark:text-neutral-600" />
                    {match.location}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users size={13} className="text-gray-400 dark:text-neutral-600" />
                    {match.numGroups}组 · {match.plannedGameCount}场 · 每组{match.playersPerGroup}人
                  </span>
                </div>

                {/* Footer: action bar or info bar */}
                <div className="mt-auto border-t border-gray-100 dark:border-white/6 pt-4">
                  {admin && isPreparing ? (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => handleStartRegistration(e, match.id)}
                        className="flex h-10 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-black text-black shadow-[0_8px_24px_rgba(29,185,84,0.2)] transition-all hover:scale-[1.02] hover:shadow-[0_12px_32px_rgba(29,185,84,0.3)] active:scale-[0.98]"
                      >
                        <Megaphone size={15} />
                        开放报名
                      </button>
                      <button
                        onClick={(e) => handleDeleteMatch(e, match.id)}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-red-500/15 bg-red-500/[0.06] text-red-400/80 transition-all hover:border-red-500/30 hover:bg-red-500/[0.12] hover:text-red-400 active:scale-95"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="text-[13px] font-semibold text-gray-500 dark:text-neutral-500">
                        人均 <span className="ml-1 text-lg font-black tracking-tight text-gray-900 dark:text-white">¥{match.perPersonCost || '0.00'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {admin && (
                          <button
                            onClick={(e) => handleDeleteMatch(e, match.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-red-500/15 bg-red-500/[0.06] text-red-400/80 transition-all hover:border-red-500/30 hover:bg-red-500/[0.12] hover:text-red-400 active:scale-95"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 dark:border-white/8 bg-gray-50 dark:bg-white/[0.03] text-gray-400 dark:text-neutral-600 transition-all duration-300 group-hover:border-primary/20 group-hover:bg-primary/[0.08] group-hover:text-primary">
                          <ChevronRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </PullToRefresh>

      {admin && (
        <FloatingBubble
          className="md:hidden"
          style={{ '--initial-position-bottom': '40px', '--initial-position-right': '24px', '--background': '#1DB954' }}
          onClick={() => navigate('/matches/publish')}
        >
          <Plus size={24} color="white" />
        </FloatingBubble>
      )}

      {/* Confirm Dialog */}
      <DialogComponent />
    </div>
  );
};

export default MatchList;
