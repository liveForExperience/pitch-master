import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toast, Dialog, Input, TextArea, SpinLoading } from 'antd-mobile';
import { Trophy, Plus, ChevronRight, Users, LogIn, LogOut as LogOutIcon, ShieldCheck, UserCog, Trash2 } from 'lucide-react';
import { tournamentApi, type Tournament } from '../api/tournament';
import useAuthStore from '../store/useAuthStore';
import useTournamentStore from '../store/useTournamentStore';
import TournamentAdminModal from '../components/TournamentAdminModal';
import TournamentMemberModal from '../components/TournamentMemberModal';

const TournamentList: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<number | null>(null);
  const [adminModalTournament, setAdminModalTournament] = useState<Tournament | null>(null);
  const [memberModalTournament, setMemberModalTournament] = useState<Tournament | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const navigate = useNavigate();
  const { me, fetchMe, isPlatformAdmin, isTournamentAdmin } = useAuthStore();

  const joinedIds = me?.joinedTournamentIds ?? [];

  const loadTournaments = async () => {
    setLoading(true);
    try {
      const list = await tournamentApi.list();
      setTournaments(list);
    } catch {
      // error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTournaments();
    if (!me) fetchMe();
  }, []);

  const handleJoin = async (tournamentId: number) => {
    setJoining(tournamentId);
    try {
      const result = await tournamentApi.join(tournamentId);
      if (result.joinStatus === 'PENDING') {
        Toast.show({ icon: 'success', content: '申请已提交，等待管理员审批' });
      } else {
        Toast.show({ icon: 'success', content: '加入成功！' });
      }
      await fetchMe();
    } catch {
    } finally {
      setJoining(null);
    }
  };

  const handleLeave = async (tournamentId: number) => {
    const confirmed = await Dialog.confirm({
      content: '确定要退出该赛事吗？退出后历史数据不会删除。',
    });
    if (!confirmed) return;
    try {
      await tournamentApi.leave(tournamentId);
      Toast.show({ icon: 'success', content: '已退出赛事' });
      await fetchMe();
    } catch {
    }
  };

  const handleEnter = (tournament: Tournament) => {
    useTournamentStore.getState().setCurrent(tournament);
    navigate(`/tournaments/${tournament.id}/matches`);
  };

  const handleSoftDelete = async (t: Tournament) => {
    const confirmed = await Dialog.confirm({
      content: `确定要删除「${t.name}」吗？删除后可在回收站恢复。`,
    });
    if (!confirmed) return;
    setDeletingId(t.id);
    try {
      await tournamentApi.softDelete(t.id);
      Toast.show({ icon: 'success', content: '已删除，可在回收站恢复' });
      await loadTournaments();
    } catch {
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreate = async () => {
    let name = '';
    let description = '';

    const confirmed = await Dialog.confirm({
      title: '创建新赛事',
      content: (
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">赛事名称</label>
            <Input
              placeholder="例如：老男孩周六联赛"
              onChange={(val) => { name = val; }}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">描述（选填）</label>
            <TextArea
              placeholder="简要描述赛事"
              rows={2}
              onChange={(val) => { description = val; }}
            />
          </div>
        </div>
      ),
    });
    if (!confirmed || !name.trim()) return;

    try {
      await tournamentApi.create({ name: name.trim(), description: description.trim() });
      Toast.show({ icon: 'success', content: '创建成功' });
      await loadTournaments();
    } catch {
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center rounded-full border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-4">
            Tournament Hub
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-gray-900 dark:text-white mb-2">
            绿茵场
          </h1>
          <p className="text-gray-500 dark:text-neutral-500 font-medium">
            选择一个赛事加入，或者进入已参与的赛事
          </p>
        </div>

        {/* Platform admin: header actions */}
        {isPlatformAdmin() && (
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => navigate('/tournaments/trash')}
              className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-100 dark:bg-neutral-900 px-4 py-2 text-sm font-bold text-gray-500 dark:text-neutral-400 transition-all hover:border-gray-300 dark:hover:border-neutral-700 hover:text-gray-900 dark:hover:text-white"
            >
              <Trash2 size={14} />
              回收站
            </button>
          </div>
        )}

        {/* Create button for platform admins */}
        {isPlatformAdmin() && (
          <button
            onClick={handleCreate}
            className="mb-6 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 dark:bg-primary/10 py-4 text-sm font-bold text-primary transition-all hover:border-primary/50 hover:bg-primary/10 active:scale-[0.98]"
          >
            <Plus size={18} />
            创建新赛事
          </button>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <SpinLoading color="primary" style={{ '--size': '36px' }} />
          </div>
        )}

        {/* Tournament Cards */}
        {!loading && tournaments.length === 0 && (
          <div className="text-center py-20 text-gray-400 dark:text-neutral-600">
            <Trophy size={48} className="mx-auto mb-4 opacity-50" />
            <p className="font-bold">暂无赛事</p>
          </div>
        )}

        <div className="space-y-4">
          {tournaments.map((t) => {
            const isJoined = joinedIds.includes(t.id);
            const isAdminOfThis = useAuthStore.getState().isTournamentAdmin(t.id);

            return (
              <div
                key={t.id}
                className="relative overflow-hidden rounded-[1.75rem] border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/80 shadow-sm dark:shadow-none transition-all hover:shadow-md dark:hover:border-neutral-700"
              >
                {/* Admin badge */}
                {isAdminOfThis && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-1 text-[9px] font-black tracking-wider text-primary uppercase">
                    <ShieldCheck size={10} />
                    Admin
                  </div>
                )}

                <div className="p-6">
                  {/* 左上角：返回绿茵场 + 当前 Tournament 名称 */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                      <Trophy size={20} className="text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-black text-gray-900 dark:text-white truncate">
                        {t.name}
                      </h3>
                      {t.description && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-neutral-500 line-clamp-2">
                          {t.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-3 text-[11px] font-bold text-gray-400 dark:text-neutral-600">
                        <span className="flex items-center gap-1">
                          <Users size={12} />
                          {t.joinMode === 'OPEN' ? '自由加入' : '需审批'}
                        </span>
                        {t.maxPlayers && (
                          <span>上限 {t.maxPlayers} 人</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {isJoined ? (
                      <>
                        <button
                          onClick={() => handleEnter(t)}
                          className="flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-black text-black transition-all hover:translate-y-[-1px] hover:shadow-lg hover:shadow-primary/25 active:translate-y-0"
                        >
                          进入赛事中心
                          <ChevronRight size={16} />
                        </button>
                        <button
                          onClick={() => handleLeave(t.id)}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 text-sm font-bold text-gray-400 dark:text-neutral-600 transition-all hover:border-red-500/30 hover:text-red-500"
                          title="退出赛事"
                        >
                          <LogOutIcon size={16} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleJoin(t.id)}
                        disabled={joining === t.id}
                        className="flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-black text-primary transition-all hover:bg-primary/20 active:scale-[0.98] disabled:opacity-50"
                      >
                        <LogIn size={16} />
                        {joining === t.id ? '加入中...' : (t.joinMode === 'OPEN' ? '加入赛事' : '申请加入')}
                      </button>
                    )}
                    {isTournamentAdmin(t.id) && (
                      <button
                        onClick={() => setMemberModalTournament(t)}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 text-sm font-bold text-gray-400 dark:text-neutral-600 transition-all hover:border-primary/30 hover:text-primary"
                        title="管理成员"
                      >
                        <Users size={16} />
                      </button>
                    )}
                    {isPlatformAdmin() && (
                      <button
                        onClick={() => setAdminModalTournament(t)}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 text-sm font-bold text-gray-400 dark:text-neutral-600 transition-all hover:border-primary/30 hover:text-primary"
                        title="管理 Tournament Admin"
                      >
                        <UserCog size={16} />
                      </button>
                    )}
                    {isPlatformAdmin() && (
                      <button
                        onClick={() => handleSoftDelete(t)}
                        disabled={deletingId === t.id}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 text-sm font-bold text-gray-400 dark:text-neutral-600 transition-all hover:border-red-500/30 hover:text-red-500 disabled:opacity-40"
                        title="删除 Tournament"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <TournamentAdminModal
        tournamentId={adminModalTournament?.id ?? null}
        tournamentName={adminModalTournament?.name ?? ''}
        onClose={() => setAdminModalTournament(null)}
      />

      <TournamentMemberModal
        tournamentId={memberModalTournament?.id ?? null}
        tournamentName={memberModalTournament?.name ?? ''}
        onClose={() => setMemberModalTournament(null)}
      />
    </div>
  );
};

export default TournamentList;
