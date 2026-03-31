import React, { useEffect, useRef, useState } from 'react';
import { Popup, Toast, Skeleton } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import useNavStore from '../store/useNavStore';
import { User, LogOut, X, ChevronRight, IdCard, Shield, Sun, Moon, ShieldCheck, UserCog, Trash2, Search, UserPlus, ChevronLeft, Users } from 'lucide-react';
import apiClient from '../api/client';
import useAuthStore from '../store/useAuthStore';
import useThemeStore from '../store/useThemeStore';
import { tournamentApi, type Tournament, type AdminUser } from '../api/tournament';
import { adminApi, type PageResult } from '../api/admin';
import TournamentMemberModal from './TournamentMemberModal';
const gridStyle = {
  backgroundImage:
    'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
  backgroundSize: '32px 32px',
};


const GlobalNav: React.FC = () => {
  const { profileVisible: visible, setProfileVisible: setShowProfile } = useNavStore();
  const [loggingOut, setLoggingOut] = useState(false);
  const [adminPanelVisible, setAdminPanelVisible] = useState(false);
  const [panelTournaments, setPanelTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  // Member management panel (tournament admin)
  const [memberSelectorVisible, setMemberSelectorVisible] = useState(false);
  const [memberSelectorTournaments, setMemberSelectorTournaments] = useState<Tournament[]>([]);
  const [memberSelectorLoading, setMemberSelectorLoading] = useState(false);
  const [memberModalTournamentId, setMemberModalTournamentId] = useState<number | null>(null);
  const [memberModalTournamentName, setMemberModalTournamentName] = useState('');
  const [panelAdmins, setPanelAdmins] = useState<AdminUser[]>([]);
  const [panelLoadingAdmins, setPanelLoadingAdmins] = useState(false);
  const [panelSearchQuery, setPanelSearchQuery] = useState('');
  const [panelUserPage, setPanelUserPage] = useState<PageResult<AdminUser> | null>(null);
  const [panelCurrentPage, setPanelCurrentPage] = useState(1);
  const [panelSearching, setPanelSearching] = useState(false);
  const [panelActionUserId, setPanelActionUserId] = useState<number | null>(null);
  const panelDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();
  const { me, loading, fetched, fetchMe } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const fetchPanelUsers = async (q: string, page: number) => {
    setPanelSearching(true);
    try {
      const result = await adminApi.searchUsers(q, page, 10);
      setPanelUserPage(result);
      setPanelCurrentPage(page);
    } catch {}
    finally { setPanelSearching(false); }
  };

  const openAdminPanel = async () => {
    setShowProfile(false);
    setSelectedTournament(null);
    setPanelAdmins([]);
    setPanelSearchQuery('');
    setPanelUserPage(null);
    setPanelCurrentPage(1);
    setAdminPanelVisible(true);
    try {
      const list = await tournamentApi.list();
      setPanelTournaments(list);
    } catch {}
  };

  const selectPanelTournament = async (t: Tournament) => {
    setSelectedTournament(t);
    setPanelSearchQuery('');
    setPanelUserPage(null);
    setPanelCurrentPage(1);
    setPanelLoadingAdmins(true);
    try {
      const admins = await tournamentApi.getAdmins(t.id);
      setPanelAdmins(admins);
    } catch {}
    finally { setPanelLoadingAdmins(false); }
    fetchPanelUsers('', 1);
  };

  const handlePanelSearch = (val: string) => {
    setPanelSearchQuery(val);
    if (panelDebounceRef.current) clearTimeout(panelDebounceRef.current);
    panelDebounceRef.current = setTimeout(() => fetchPanelUsers(val, 1), 300);
  };

  const handlePanelAdd = async (user: AdminUser) => {
    if (!selectedTournament) return;
    setPanelActionUserId(user.id);
    try {
      await tournamentApi.addAdmin(selectedTournament.id, user.id);
      Toast.show({ icon: 'success', content: `已任命 ${user.playerNickname || user.username} 为管理员` });
      const admins = await tournamentApi.getAdmins(selectedTournament.id);
      setPanelAdmins(admins);
    } catch {}
    finally { setPanelActionUserId(null); }
  };

  const handlePanelRemove = async (user: AdminUser) => {
    if (!selectedTournament) return;
    setPanelActionUserId(user.id);
    try {
      await tournamentApi.removeAdmin(selectedTournament.id, user.id);
      Toast.show({ icon: 'success', content: `已移除 ${user.playerNickname || user.username} 的管理员权限` });
      const admins = await tournamentApi.getAdmins(selectedTournament.id);
      setPanelAdmins(admins);
    } catch {}
    finally { setPanelActionUserId(null); }
  };

  useEffect(() => {
    if (visible && (!fetched || !me)) {
      fetchMe();
    }
  }, [visible, fetched, me, fetchMe]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await apiClient.post('/auth/logout');
      useAuthStore.getState().clear();
      setShowProfile(false);
      Toast.show('已安全退出');
      navigate('/login', { replace: true });
    } catch (err) {
    } finally {
      setLoggingOut(false);
    }
  };

  const openMemberSelector = async () => {
    setShowProfile(false);
    setMemberSelectorLoading(true);
    setMemberSelectorVisible(true);
    try {
      const all = await tournamentApi.list();
      const adminIds = me?.adminTournamentIds ?? [];
      const isPlatAdmin = useAuthStore.getState().isPlatformAdmin();
      const filtered = isPlatAdmin ? all : all.filter(t => adminIds.includes(t.id));
      setMemberSelectorTournaments(filtered);
    } catch {}
    finally { setMemberSelectorLoading(false); }
  };

  const displayName = me?.player?.nickname || me?.user?.username || '';
  const clubName = me?.player?.clubName || 'Free Agent';
  const roles = me?.user?.roles || [];
  const displayRole = roles.map(r => r.name).join(' / ') || '';
  const hasPlayer = !!me?.player;
  const isPlatformAdmin = useAuthStore.getState().isPlatformAdmin();
  const isTournamentAdmin = (me?.adminTournamentIds?.length ?? 0) > 0 || isPlatformAdmin;

  return (
    <>
      {/* 顶部悬浮导航条 */}
      <div className="fixed top-6 right-6 z-[1000] flex items-center gap-2">
        {/* 主题切换按钮 */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? '切换到白天模式' : '切换到黑夜模式'}
          className="w-10 h-10 rounded-2xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 flex items-center justify-center text-gray-500 dark:text-neutral-400 shadow-lg hover:scale-105 active:scale-95 transition-all hover:text-primary dark:hover:text-primary"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        {/* 桌面端头像按钮；移动端由底部 BottomNav「我的」Tab 替代 */}
        <button 
          onClick={() => setShowProfile(true)}
          className="hidden md:flex w-12 h-12 rounded-2xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 items-center justify-center text-primary shadow-2xl hover:scale-105 active:scale-95 transition-all group"
        >
          <User size={20} className="group-hover:animate-pulse" />
        </button>
      </div>

      {/* 个人信息侧边栏 */}
      <Popup
        visible={visible}
        onMaskClick={() => setShowProfile(false)}
        position='right'
        bodyStyle={{ width: '85vw', maxWidth: '400px', backgroundColor: 'var(--bg-surface)' }}
      >
        <div className="h-full flex flex-col text-gray-900 dark:text-white overflow-y-auto">

          {/* ─── Hero Profile Header ─── */}
          <div className="relative overflow-hidden px-7 pt-7 pb-6">
            <div className="pointer-events-none absolute right-[-14%] top-2 h-48 w-48 rounded-full bg-gradient-to-br from-primary/70 to-primary/5 opacity-20 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.035]" style={gridStyle} />
            <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="relative z-10">
              {/* Close button */}
              <button
                onClick={() => setShowProfile(false)}
                className="absolute right-0 top-0 flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 dark:border-white/8 bg-gray-100 dark:bg-white/[0.04] text-gray-500 dark:text-neutral-500 transition-colors hover:text-gray-900 dark:hover:text-white"
              >
                <X size={14} />
              </button>

              <div className="text-[10px] font-black tracking-[0.28em] text-primary uppercase mb-6">
                Profile
              </div>

              {loading ? (
                <Skeleton.Paragraph lineCount={3} animated />
              ) : me ? (
                <div className="flex items-center gap-5">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="flex h-[76px] w-[76px] items-center justify-center overflow-hidden rounded-[1.4rem] border-2 border-primary/15 bg-gray-100 dark:bg-neutral-900">
                      <User size={30} className="text-gray-400 dark:text-neutral-700" />
                    </div>
                  </div>

                  {/* Name & meta */}
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-[22px] font-black leading-tight tracking-tight text-gray-900 dark:text-white">
                      {displayName}
                    </h2>
                    <div className="mt-1 text-[11px] font-bold tracking-wide text-gray-500 dark:text-neutral-500">
                      {clubName}
                    </div>
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-[3px] text-[9px] font-black tracking-[0.12em] text-primary uppercase">
                        <Shield size={10} />
                        {displayRole}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-400 dark:text-neutral-600 text-sm italic">未登录</div>
              )}
            </div>
          </div>

          {/* ─── Content Area ─── */}
          {me && (
            <div className="flex-1 space-y-4 px-7 pb-7 pt-2">

              {/* 基本信息入口 */}
              <button
                type="button"
                onClick={() => {
                  setShowProfile(false);
                  navigate('/profile/edit');
                }}
                className="group flex w-full items-center justify-between rounded-[1.75rem] border border-gray-200 dark:border-white/8 bg-gray-50 dark:bg-white/[0.03] px-5 py-4 text-left transition-all hover:border-gray-300 dark:hover:border-neutral-700 hover:bg-gray-100 dark:hover:bg-white/[0.05] active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 dark:border-white/8 bg-gray-100 dark:bg-white/[0.05]">
                    <IdCard size={18} className="text-gray-400 dark:text-neutral-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">基本信息</div>
                    <div className="mt-0.5 text-[11px] font-medium text-gray-500 dark:text-neutral-500">
                      查看和编辑个人资料
                    </div>
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className="shrink-0 text-neutral-600 transition-all group-hover:translate-x-0.5 group-hover:text-primary"
                />
              </button>

              {/* Tournament admin: 管理成员 */}
              {isTournamentAdmin && (
                <button
                  type="button"
                  onClick={openMemberSelector}
                  className="group flex w-full items-center justify-between rounded-[1.75rem] border border-primary/20 bg-primary/5 dark:bg-primary/10 px-5 py-4 text-left transition-all hover:border-primary/40 hover:bg-primary/10 dark:hover:bg-primary/15 active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                      <Users size={18} className="text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">管理成员</div>
                      <div className="mt-0.5 text-[11px] font-medium text-gray-500 dark:text-neutral-500">
                        向赛事中添加平台用户
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className="shrink-0 text-primary/40 transition-all group-hover:translate-x-0.5 group-hover:text-primary"
                  />
                </button>
              )}

              {/* Platform admin: Tournament Admin 管理 */}
              {isPlatformAdmin && (
                <button
                  type="button"
                  onClick={openAdminPanel}
                  className="group flex w-full items-center justify-between rounded-[1.75rem] border border-primary/20 bg-primary/5 dark:bg-primary/10 px-5 py-4 text-left transition-all hover:border-primary/40 hover:bg-primary/10 dark:hover:bg-primary/15 active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                      <UserCog size={18} className="text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">Tournament Admin 管理</div>
                      <div className="mt-0.5 text-[11px] font-medium text-gray-500 dark:text-neutral-500">
                        任免各赛事管理员
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className="shrink-0 text-primary/40 transition-all group-hover:translate-x-0.5 group-hover:text-primary"
                  />
                </button>
              )}

              {/* ─── Player Stats Card (conditional) ─── */}
              {hasPlayer && (
                <div className="relative overflow-hidden rounded-[2rem] border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_24%),linear-gradient(180deg,rgba(24,24,27,1)_0%,rgba(10,10,10,1)_100%)] shadow-sm dark:shadow-none">
                  <div className="pointer-events-none absolute right-[-14%] top-4 h-36 w-36 rounded-full bg-gradient-to-br from-primary/60 to-primary/5 opacity-20 blur-2xl" />
                  <div className="pointer-events-none absolute inset-0 opacity-[0.035]" style={gridStyle} />
                  <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                  <div className="relative z-10 p-6">
                    <div className="mb-5 text-[10px] font-black tracking-[0.28em] text-primary/80 uppercase">
                      Player Stats
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-[1.2rem] border border-gray-200 dark:border-white/8 bg-gray-50 dark:bg-white/[0.03] px-3 py-3.5 text-center">
                        <div className="mb-1.5 text-[9px] font-black tracking-[0.16em] text-gray-400 dark:text-neutral-600 uppercase">
                          Age
                        </div>
                        <div className="text-xl font-black tracking-tight text-primary">
                          {me.player?.age || '—'}
                        </div>
                      </div>
                      <div className="rounded-[1.2rem] border border-gray-200 dark:border-white/8 bg-gray-50 dark:bg-white/[0.03] px-3 py-3.5 text-center">
                        <div className="mb-1.5 text-[9px] font-black tracking-[0.16em] text-gray-400 dark:text-neutral-600 uppercase">
                          Position
                        </div>
                        <div className="text-sm font-black italic text-gray-800 dark:text-white">
                          {me.player?.position || 'N/A'}
                        </div>
                      </div>
                      <div className="rounded-[1.2rem] border border-gray-200 dark:border-white/8 bg-gray-50 dark:bg-white/[0.03] px-3 py-3.5 text-center">
                        <div className="mb-1.5 text-[9px] font-black tracking-[0.16em] text-gray-400 dark:text-neutral-600 uppercase">
                          Foot
                        </div>
                        <div className="text-sm font-black text-gray-800 dark:text-white">
                          {me.player?.preferredFoot || '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── Logout ─── */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="group flex w-full items-center justify-between rounded-[1.75rem] border border-gray-200 dark:border-neutral-800 bg-white dark:bg-white/[0.02] px-5 py-4 text-left transition-all hover:border-red-500/25 hover:bg-red-500/[0.04] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 shadow-sm dark:shadow-none"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-500/15 bg-red-500/10 text-red-400 transition-colors group-hover:bg-red-500/15">
                      <LogOut size={16} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {loggingOut ? '退出中…' : '退出登录'}
                      </div>
                      <div className="mt-0.5 text-[11px] font-medium text-gray-500 dark:text-neutral-500">
                        结束当前会话
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] font-black tracking-[0.2em] text-red-400/50 uppercase group-hover:text-red-400/80 transition-colors">
                    Exit
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ─── Footer ─── */}
          <div className="mt-auto border-t border-gray-200 dark:border-neutral-900 px-7 pb-6 pt-4">
            <button
              onClick={() => setShowProfile(false)}
              className="w-full py-3 text-center text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-neutral-500 transition-colors hover:text-gray-900 dark:hover:text-white"
            >
              关闭
            </button>
          </div>
        </div>
      </Popup>

      {/* ─── Member Selector Panel (tournament admin) ─── */}
      <Popup
        visible={memberSelectorVisible}
        onMaskClick={() => setMemberSelectorVisible(false)}
        position="bottom"
        bodyStyle={{ borderRadius: '20px 20px 0 0', maxHeight: '60vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      >
        <div className="flex flex-col max-h-[60vh] bg-white dark:bg-neutral-950 text-gray-900 dark:text-white">
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-neutral-800 shrink-0">
            <div>
              <div className="text-[9px] font-black tracking-[0.25em] text-primary uppercase mb-0.5">Tournament Admin</div>
              <h3 className="text-base font-black">选择赛事 · 管理成员</h3>
            </div>
            <button
              onClick={() => setMemberSelectorVisible(false)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-100 dark:bg-neutral-900 text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {memberSelectorLoading ? (
              <div className="text-sm text-gray-400 dark:text-neutral-600 italic py-4 text-center">加载中…</div>
            ) : memberSelectorTournaments.length === 0 ? (
              <div className="text-sm text-gray-400 dark:text-neutral-600 italic py-4 text-center">暂无可管理的赛事</div>
            ) : (
              <div className="space-y-2">
                {memberSelectorTournaments.map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setMemberSelectorVisible(false);
                      setMemberModalTournamentId(t.id);
                      setMemberModalTournamentName(t.name);
                    }}
                    className="group flex w-full items-center justify-between rounded-2xl border border-gray-100 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 px-4 py-3.5 text-left transition-all hover:border-primary/30 hover:bg-primary/5 active:scale-[0.98]"
                  >
                    <span className="text-sm font-bold">{t.name}</span>
                    <ChevronRight size={14} className="text-gray-400 group-hover:text-primary transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Popup>

      <TournamentMemberModal
        tournamentId={memberModalTournamentId}
        tournamentName={memberModalTournamentName}
        onClose={() => setMemberModalTournamentId(null)}
      />

      {/* ─── Admin Management Panel (platform admin only) ─── */}
      <Popup
        visible={adminPanelVisible}
        onMaskClick={() => setAdminPanelVisible(false)}
        position="bottom"
        bodyStyle={{ borderRadius: '20px 20px 0 0', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      >
        <div className="flex flex-col max-h-[85vh] bg-white dark:bg-neutral-950 text-gray-900 dark:text-white">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-neutral-800 shrink-0">
            <div className="flex items-center gap-3">
              {selectedTournament && (
                <button
                  onClick={() => { setSelectedTournament(null); setPanelAdmins([]); setPanelSearchQuery(''); setPanelUserPage(null); }}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 dark:border-neutral-800 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
              )}
              <div>
                <div className="text-[9px] font-black tracking-[0.25em] text-primary uppercase mb-0.5">Platform Admin</div>
                <h3 className="text-base font-black">
                  {selectedTournament ? selectedTournament.name : 'Tournament Admin 管理'}
                </h3>
              </div>
            </div>
            <button
              onClick={() => setAdminPanelVisible(false)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-100 dark:bg-neutral-900 text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Step 1: tournament selector */}
            {!selectedTournament && (
              <div className="space-y-2">
                <div className="text-[10px] font-black tracking-[0.2em] text-gray-400 dark:text-neutral-600 uppercase mb-3">
                  选择赛事
                </div>
                {panelTournaments.length === 0 ? (
                  <div className="text-sm text-gray-400 dark:text-neutral-600 italic py-4 text-center">暂无赛事</div>
                ) : (
                  panelTournaments.map(t => (
                    <button
                      key={t.id}
                      onClick={() => selectPanelTournament(t)}
                      className="group flex w-full items-center justify-between rounded-2xl border border-gray-100 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 px-4 py-3.5 text-left transition-all hover:border-primary/30 hover:bg-primary/5 active:scale-[0.98]"
                    >
                      <span className="text-sm font-bold">{t.name}</span>
                      <ChevronRight size={14} className="text-gray-400 group-hover:text-primary transition-colors" />
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Step 2: admin management for selected tournament */}
            {selectedTournament && (
              <div className="space-y-5">
                {/* Current admins */}
                <section>
                  <div className="text-[10px] font-black tracking-[0.2em] text-gray-400 dark:text-neutral-600 uppercase mb-3">
                    当前管理员 ({panelAdmins.length})
                  </div>
                  {panelLoadingAdmins ? (
                    <div className="text-sm text-gray-400 dark:text-neutral-600 py-2">加载中…</div>
                  ) : panelAdmins.length === 0 ? (
                    <div className="text-sm text-gray-400 dark:text-neutral-600 italic py-2">暂无管理员</div>
                  ) : (
                    <div className="space-y-2">
                      {panelAdmins.map(admin => (
                        <div
                          key={admin.id}
                          className="flex items-center justify-between rounded-2xl border border-gray-100 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                              <ShieldCheck size={14} className="text-primary" />
                            </div>
                            <div>
                              <div className="text-sm font-bold">{admin.playerNickname || admin.username}</div>
                              <div className="text-[11px] text-gray-400 dark:text-neutral-600">
                                {[admin.playerNickname ? admin.username : null, admin.realName].filter(Boolean).join(' · ')}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handlePanelRemove(admin)}
                            disabled={panelActionUserId === admin.id}
                            className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-40"
                            title="移除管理员"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Search & add */}
                <section>
                  <div className="text-[10px] font-black tracking-[0.2em] text-gray-400 dark:text-neutral-600 uppercase mb-3">
                    添加管理员
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 px-4 py-3 mb-3 focus-within:border-primary/40">
                    <Search size={14} className="text-gray-400 dark:text-neutral-600 shrink-0" />
                    <input
                      type="text"
                      value={panelSearchQuery}
                      onChange={e => handlePanelSearch(e.target.value)}
                      placeholder="搜索球场名 / 用户名 / 真实姓名…"
                      className="flex-1 bg-transparent text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-neutral-600 outline-none"
                    />
                    {panelSearching && (
                      <span className="text-[10px] text-gray-400 dark:text-neutral-600">搜索中…</span>
                    )}
                  </div>

                  {panelUserPage && panelUserPage.list.length > 0 && (
                    <div className="space-y-2">
                      {panelUserPage.list.map((user: AdminUser) => {
                        const isAlreadyAdmin = panelAdmins.some(a => a.id === user.id);
                        const primary = user.playerNickname || user.username;
                        const secondary = [user.playerNickname ? user.username : null, user.realName].filter(Boolean).join(' · ');
                        return (
                          <div key={user.id} className="flex items-center justify-between rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-3">
                            <div>
                              <div className="text-sm font-bold">{primary}</div>
                              {secondary && <div className="text-[11px] text-gray-400 dark:text-neutral-600">{secondary}</div>}
                            </div>
                            {isAlreadyAdmin ? (
                              <span className="text-[10px] font-black tracking-wide text-primary/60 uppercase shrink-0">已是管理员</span>
                            ) : (
                              <button onClick={() => handlePanelAdd(user)} disabled={panelActionUserId === user.id}
                                className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-[11px] font-black text-primary hover:bg-primary/20 transition-colors disabled:opacity-40 shrink-0">
                                <UserPlus size={12} />
                                任命
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {panelUserPage && panelUserPage.list.length === 0 && !panelSearching && (
                    <div className="text-sm text-gray-400 dark:text-neutral-600 italic py-2">未找到匹配用户</div>
                  )}

                  {panelUserPage && Math.ceil(panelUserPage.total / 10) > 1 && (
                    <div className="flex items-center justify-between pt-3">
                      <button onClick={() => fetchPanelUsers(panelSearchQuery, panelCurrentPage - 1)}
                        disabled={panelCurrentPage <= 1 || panelSearching}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 dark:border-neutral-800 text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 transition-colors">
                        <ChevronLeft size={14} />
                      </button>
                      <span className="text-[11px] font-bold text-gray-400 dark:text-neutral-600">
                        {panelCurrentPage} / {Math.ceil(panelUserPage.total / 10)}
                        <span className="ml-2 text-gray-300 dark:text-neutral-700">({panelUserPage.total} 人)</span>
                      </span>
                      <button onClick={() => fetchPanelUsers(panelSearchQuery, panelCurrentPage + 1)}
                        disabled={panelCurrentPage >= Math.ceil(panelUserPage.total / 10) || panelSearching}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 dark:border-neutral-800 text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 transition-colors">
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        </div>
      </Popup>
    </>
  );
};

export default GlobalNav;
