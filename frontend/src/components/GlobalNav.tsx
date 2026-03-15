import React, { useEffect, useState } from 'react';
import { Popup, Toast, Skeleton } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, X, ChevronRight, IdCard, Shield } from 'lucide-react';
import apiClient from '../api/client';
import useAuthStore from '../store/useAuthStore';

const gridStyle = {
  backgroundImage:
    'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
  backgroundSize: '32px 32px',
};

const GlobalNav: React.FC = () => {
  const [visible, setShowProfile] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();
  const { me, loading, fetched, fetchMe } = useAuthStore();

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

  const displayName = me?.player?.nickname || me?.user?.username || '';
  const clubName = me?.player?.clubName || 'Free Agent';
  const rating = me?.player?.rating?.toFixed(1) || '5.0';
  const roles = me?.user?.roles || [];
  const displayRole = roles.map(r => r.name).join(' / ') || '';
  const hasPlayer = !!me?.player;

  return (
    <>
      {/* 顶部悬浮导航条 */}
      <div className="fixed top-6 right-6 z-[1000]">
        <button 
          onClick={() => setShowProfile(true)}
          className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-primary shadow-2xl hover:scale-105 active:scale-95 transition-all group"
        >
          <User size={20} className="group-hover:animate-pulse" />
        </button>
      </div>

      {/* 个人信息侧边栏 */}
      <Popup
        visible={visible}
        onMaskClick={() => setShowProfile(false)}
        position='right'
        bodyStyle={{ width: '85vw', maxWidth: '400px', backgroundColor: '#0a0a0a' }}
      >
        <div className="h-full flex flex-col text-white overflow-y-auto">

          {/* ─── Hero Profile Header ─── */}
          <div className="relative overflow-hidden px-7 pt-7 pb-6">
            <div className="pointer-events-none absolute right-[-14%] top-2 h-48 w-48 rounded-full bg-gradient-to-br from-primary/70 to-primary/5 opacity-20 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.035]" style={gridStyle} />
            <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="relative z-10">
              {/* Close button */}
              <button
                onClick={() => setShowProfile(false)}
                className="absolute right-0 top-0 flex h-8 w-8 items-center justify-center rounded-xl border border-white/8 bg-white/[0.04] text-neutral-500 transition-colors hover:text-white"
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
                    <div className="flex h-[76px] w-[76px] items-center justify-center overflow-hidden rounded-[1.4rem] border-2 border-primary/15 bg-neutral-900">
                      <User size={30} className="text-neutral-700" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 rounded-lg bg-primary px-2 py-0.5 text-[10px] font-black text-black shadow-lg shadow-primary/25">
                      {rating}
                    </div>
                  </div>

                  {/* Name & meta */}
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-[22px] font-black leading-tight tracking-tight">
                      {displayName}
                    </h2>
                    <div className="mt-1 text-[11px] font-bold tracking-wide text-neutral-500">
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
                <div className="text-neutral-600 text-sm italic">未登录</div>
              )}
            </div>
          </div>

          {/* ─── Content Area ─── */}
          {me && (
            <div className="flex-1 space-y-4 px-7 pb-7 pt-2">

              {/* 基本信息入口 */}
              <button
                type="button"
                className="group flex w-full items-center justify-between rounded-[1.75rem] border border-white/8 bg-white/[0.03] px-5 py-4 text-left transition-all hover:border-neutral-700 hover:bg-white/[0.05] active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-white/[0.05]">
                    <IdCard size={18} className="text-neutral-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">基本信息</div>
                    <div className="mt-0.5 text-[11px] font-medium text-neutral-500">
                      查看和编辑个人资料
                    </div>
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className="shrink-0 text-neutral-600 transition-all group-hover:translate-x-0.5 group-hover:text-primary"
                />
              </button>

              {/* ─── Player Stats Card (conditional) ─── */}
              {hasPlayer && (
                <div className="relative overflow-hidden rounded-[2rem] border border-neutral-800 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_24%),linear-gradient(180deg,rgba(24,24,27,1)_0%,rgba(10,10,10,1)_100%)]">
                  <div className="pointer-events-none absolute right-[-14%] top-4 h-36 w-36 rounded-full bg-gradient-to-br from-primary/60 to-primary/5 opacity-20 blur-2xl" />
                  <div className="pointer-events-none absolute inset-0 opacity-[0.035]" style={gridStyle} />
                  <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                  <div className="relative z-10 p-6">
                    <div className="mb-5 text-[10px] font-black tracking-[0.28em] text-primary/80 uppercase">
                      Player Stats
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-3 py-3.5 text-center">
                        <div className="mb-1.5 text-[9px] font-black tracking-[0.16em] text-neutral-600 uppercase">
                          Rating
                        </div>
                        <div className="text-xl font-black tracking-tight text-primary">
                          {rating}
                        </div>
                      </div>
                      <div className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-3 py-3.5 text-center">
                        <div className="mb-1.5 text-[9px] font-black tracking-[0.16em] text-neutral-600 uppercase">
                          Position
                        </div>
                        <div className="text-sm font-black italic text-white">
                          {me.player?.position || 'N/A'}
                        </div>
                      </div>
                      <div className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-3 py-3.5 text-center">
                        <div className="mb-1.5 text-[9px] font-black tracking-[0.16em] text-neutral-600 uppercase">
                          Foot
                        </div>
                        <div className="text-sm font-black text-white">
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
                  className="group flex w-full items-center justify-between rounded-[1.75rem] border border-neutral-800 bg-white/[0.02] px-5 py-4 text-left transition-all hover:border-red-500/25 hover:bg-red-500/[0.04] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-500/15 bg-red-500/10 text-red-400 transition-colors group-hover:bg-red-500/15">
                      <LogOut size={16} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">
                        {loggingOut ? '退出中…' : '退出登录'}
                      </div>
                      <div className="mt-0.5 text-[11px] font-medium text-neutral-500">
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
          <div className="mt-auto border-t border-neutral-900 px-7 pb-6 pt-4">
            <button
              onClick={() => setShowProfile(false)}
              className="w-full py-3 text-center text-xs font-bold uppercase tracking-widest text-neutral-500 transition-colors hover:text-white"
            >
              返回
            </button>
          </div>
        </div>
      </Popup>
    </>
  );
};

export default GlobalNav;
