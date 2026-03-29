import React, { useState } from 'react';
import { Toast } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, User as UserIcon, Lock, ShieldCheck, Sun, Moon } from 'lucide-react';
import apiClient from '../api/client';
import useAuthStore from '../store/useAuthStore';
import useThemeStore from '../store/useThemeStore';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const navigate = useNavigate();
  const { theme, setTheme } = useThemeStore();

  const onFinish = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const username = credentials.username.trim();
    const password = credentials.password;

    if (!username || !password) {
      Toast.show({ icon: 'fail', content: '请输入账号和密码' });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      await apiClient.post('/auth/login', formData);
      await useAuthStore.getState().fetchMe();
      Toast.show({ icon: 'success', content: '欢迎回来，老男孩' });
      navigate('/tournaments');
    } catch (err) {
      // 错误已由拦截器处理
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-black overflow-hidden font-sans">
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        title={theme === 'dark' ? '切换到白天模式' : '切换到黑夜模式'}
        className="fixed top-6 right-6 z-50 w-10 h-10 rounded-2xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 flex items-center justify-center text-gray-500 dark:text-neutral-400 shadow-lg hover:scale-105 active:scale-95 transition-all hover:text-primary"
      >
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>
      {/* 左侧：品牌展示区 (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-stretch p-8 xl:p-10">
        <div className="relative flex w-full flex-col justify-between overflow-hidden rounded-[2.75rem] border border-gray-200 dark:border-neutral-900 bg-white dark:bg-neutral-950 p-10 xl:p-12">
        {/* 动态背景光效 */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-[-10%] right-[-10%] h-[50%] w-[70%] rounded-full bg-primary/10 blur-[140px]"></div>
            <div className="absolute bottom-[-15%] left-[-10%] h-72 w-72 rounded-full bg-white/5 blur-[120px]"></div>
          {/* 网格纹理装饰 */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            ></div>
          </div>

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-8">
              老男孩竞技场系统
            </div>
            <h1 className="text-6xl xl:text-7xl font-black text-gray-900 dark:text-white leading-[0.95] tracking-tighter mb-8">
              回到赛场
              <br />
              从这里开始
            </h1>
            <p className="max-w-lg text-lg xl:text-xl leading-relaxed text-gray-500 dark:text-neutral-500 font-medium">
              统一的赛事管理、分组协作与比分同步体验，用克制而有力量的界面语言，把每场球赛都带回真正的比赛状态。
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-4">
            <div className="rounded-[1.75rem] border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-5">
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-primary mb-3">Match</div>
              <div className="text-sm font-bold text-gray-800 dark:text-white leading-6">赛事组织与报名流程更清晰</div>
            </div>
            <div className="rounded-[1.75rem] border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-5">
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-primary mb-3">Group</div>
              <div className="text-sm font-bold text-gray-800 dark:text-white leading-6">智能分组逻辑保持统一体验</div>
            </div>
            <div className="rounded-[1.75rem] border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-5">
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-primary mb-3">Live</div>
              <div className="text-sm font-bold text-gray-800 dark:text-white leading-6">实时比分与状态反馈更直接</div>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧：登录操作区 */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 py-8 sm:px-8 lg:px-10 bg-gray-50 dark:bg-black relative">
        {/* 背景氛围灯 */}
        <div className="absolute top-16 right-[-10%] h-56 w-56 rounded-full bg-primary/10 blur-[140px] pointer-events-none"></div>
        <div className="absolute bottom-8 left-[-10%] h-48 w-48 rounded-full bg-white/5 blur-[120px] pointer-events-none"></div>

        <div className="w-full max-w-md relative z-10">
          <div className="mb-10 text-left">
            <div className="inline-flex items-center rounded-full border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-6">
              Oldboy Arena
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tighter">登入竞技场</h2>
            <p className="text-gray-500 dark:text-neutral-500 font-medium text-base sm:text-lg">准备好回到你的比赛日节奏了吗？</p>
          </div>

          <div className="rounded-[2.5rem] border border-gray-200 dark:border-neutral-900 bg-white dark:bg-neutral-950/90 p-6 sm:p-8 shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-center space-x-2 text-gray-500 dark:text-neutral-400 font-black text-[10px] uppercase tracking-widest border-b border-gray-100 dark:border-neutral-900 pb-4 mb-8">
              <ShieldCheck size={14} className="text-primary" />
              <span>账户安全凭证</span>
            </div>

            <form onSubmit={onFinish} className="space-y-8">
              <div className="space-y-6">
                {/* 用户名输入区 */}
                <div className="space-y-3">
                  <label className="inline-block ml-1 text-[11px] font-black tracking-[0.2em] text-gray-500 dark:text-neutral-500">球员账号</label>
                  <div className="group flex h-16 items-center rounded-2xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-black/40 px-5 transition-all duration-300 focus-within:border-primary/40 focus-within:bg-white dark:focus-within:bg-neutral-950">
                    <UserIcon size={18} className="mr-4 text-gray-400 dark:text-neutral-600 transition-colors duration-300 group-focus-within:text-primary" />
                    <input
                      value={credentials.username}
                      onChange={(event) =>
                        setCredentials((current) => ({
                          ...current,
                          username: event.target.value,
                        }))
                      }
                      placeholder="请输入账号"
                      autoComplete="username"
                      className="auth-input h-full w-full bg-transparent text-base font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-neutral-600 outline-none"
                    />
                  </div>
                </div>

                {/* 密码输入区 */}
                <div className="space-y-3">
                  <label className="inline-block ml-1 text-[11px] font-black tracking-[0.2em] text-gray-500 dark:text-neutral-500">安全密码</label>
                  <div className="group flex h-16 items-center rounded-2xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-black/40 px-5 transition-all duration-300 focus-within:border-primary/40 focus-within:bg-white dark:focus-within:bg-neutral-950">
                    <Lock size={18} className="mr-4 text-gray-400 dark:text-neutral-600 transition-colors duration-300 group-focus-within:text-primary" />
                    <input
                      value={credentials.password}
                      onChange={(event) =>
                        setCredentials((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }
                      type="password"
                      placeholder="请输入密码"
                      autoComplete="current-password"
                      className="auth-input h-full w-full bg-transparent text-base font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-neutral-600 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  aria-busy={loading}
                  className="flex h-16 w-full items-center justify-center rounded-[1.75rem] border border-primary/30 bg-primary text-[15px] font-black tracking-[0.2em] text-black shadow-[0_20px_40px_rgba(29,185,84,0.2)] transition-all hover:translate-y-[-2px] hover:shadow-[0_25px_50px_rgba(29,185,84,0.35)] active:translate-y-[0px] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span>{loading ? '进入中...' : '进入竞技场'}</span>
                  {!loading && <ArrowRight className="ml-3" size={20} />}
                </button>
                
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="flex h-14 w-full items-center justify-center rounded-[1.5rem] border border-gray-200 dark:border-neutral-800 bg-gray-100 dark:bg-white/5 text-[12px] font-black tracking-[0.12em] text-gray-500 dark:text-neutral-400 transition-all duration-300 hover:border-gray-300 dark:hover:border-neutral-700 hover:text-gray-900 dark:hover:text-white"
                >
                  还没有账号？
                  <span className="ml-2 text-primary">立即加入球友会</span>
                </button>
              </div>
            </form>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-[1.5rem] border border-gray-200 dark:border-neutral-900 bg-white dark:bg-neutral-950/70 px-4 py-4 text-center">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">Match</div>
              <div className="text-xs font-bold text-gray-500 dark:text-neutral-400">赛事组织</div>
            </div>
            <div className="rounded-[1.5rem] border border-gray-200 dark:border-neutral-900 bg-white dark:bg-neutral-950/70 px-4 py-4 text-center">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">Group</div>
              <div className="text-xs font-bold text-gray-500 dark:text-neutral-400">智能分组</div>
            </div>
            <div className="rounded-[1.5rem] border border-gray-200 dark:border-neutral-900 bg-white dark:bg-neutral-950/70 px-4 py-4 text-center">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">Live</div>
              <div className="text-xs font-bold text-gray-500 dark:text-neutral-400">实时比分</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
