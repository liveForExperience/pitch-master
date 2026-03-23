import React, { useState } from 'react';
import { Toast, Selector } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, UserPlus, ShieldCheck, Sun, Moon } from 'lucide-react';
import apiClient from '../api/client';
import useAuthStore from '../store/useAuthStore';
import useThemeStore from '../store/useThemeStore';
import {
  AuthField,
  AuthStepper,
} from '../components/auth/AuthUI';

const positions = [
  { label: '门将 (GK)', value: 'GK' },
  { label: '后卫 (DF)', value: 'DF' },
  { label: '中场 (MF)', value: 'MF' },
  { label: '前锋 (FW)', value: 'FW' },
];

const preferredFootOptions = [
  { label: '左脚', value: 'LEFT' },
  { label: '右脚', value: 'RIGHT' },
  { label: '双脚', value: 'BOTH' },
];

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [formValues, setFormValues] = useState({
    username: '',
    password: '',
    nickname: '',
    realName: '',
    age: 25,
    preferredFoot: ['RIGHT'],
    position: ['MF'],
  });
  const navigate = useNavigate();
  const { theme, setTheme } = useThemeStore();

  const onFinish = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const username = formValues.username.trim();
    const password = formValues.password;
    const nickname = formValues.nickname.trim();
    const realName = formValues.realName.trim();
    const position = formValues.position[0];

    if (!username || !password || !nickname || !position) {
      Toast.show({ icon: 'fail', content: '请完整填写必填信息' });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        username,
        password,
        nickname,
        realName,
        age: formValues.age,
        preferredFoot: formValues.preferredFoot[0],
        position,
      };
      await apiClient.post('/auth/register', payload);
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      await apiClient.post('/auth/login', formData);
      await useAuthStore.getState().fetchMe();
      Toast.show({ icon: 'success', content: '激活成功，欢迎加入！' });
      navigate('/matches');
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white overflow-x-hidden">
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        title={theme === 'dark' ? '切换到白天模式' : '切换到黑夜模式'}
        className="fixed top-6 right-6 z-50 w-10 h-10 rounded-2xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 flex items-center justify-center text-gray-500 dark:text-neutral-400 shadow-lg hover:scale-105 active:scale-95 transition-all hover:text-primary"
      >
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>
      <div className="relative mx-auto max-w-3xl px-6 py-8 sm:px-8 lg:px-10 lg:py-12">
        <div className="pointer-events-none absolute top-16 right-[-8%] h-64 w-64 rounded-full bg-primary/10 blur-[150px]"></div>
        <div className="pointer-events-none absolute bottom-12 left-[-10%] h-56 w-56 rounded-full bg-white/5 blur-[130px]"></div>

        <button 
          onClick={() => navigate('/login')} 
          className="flex items-center text-gray-500 dark:text-neutral-500 hover:text-gray-900 dark:hover:text-white transition-colors font-bold mb-12 group"
        >
          <ChevronLeft size={20} className="mr-1 group-hover:-translate-x-1 transition-transform" /> 返回登录
        </button>

        <header className="mb-16">
          <div className="inline-flex items-center rounded-full border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-6">
            球员招募
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter mb-4">
            激活您的
            <br />
            <span className="text-primary">球员档案</span>
          </h1>
          <p className="max-w-2xl text-gray-500 dark:text-neutral-500 font-medium text-base sm:text-lg">
            用统一、克制且更有比赛氛围的界面完成注册，把你的身份、位置与比赛偏好带入同一个竞技体系。
          </p>
        </header>

        <div className="rounded-[2.5rem] border border-gray-200 dark:border-neutral-900 bg-white dark:bg-neutral-950/90 p-6 sm:p-8 shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)] relative z-10">
          <form onSubmit={onFinish} className="space-y-10">
            {/* 第一部分：账户安全 */}
            <section className="space-y-6">
              <div className="flex items-center space-x-2 text-gray-500 dark:text-neutral-400 font-black text-[10px] uppercase tracking-widest border-b border-gray-100 dark:border-neutral-900 pb-4">
                <ShieldCheck size={14} className="text-primary" />
                <span>账户安全凭证</span>
              </div>
              
              <div className="space-y-3">
                <label className="inline-block ml-1 text-[11px] font-black tracking-[0.2em] text-gray-500 dark:text-neutral-500">登录账号</label>
                <div className="group flex h-14 items-center rounded-2xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-black/40 px-5 transition-all duration-300 focus-within:border-primary/40 focus-within:bg-white dark:focus-within:bg-neutral-950">
                  <input
                    value={formValues.username}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        username: event.target.value,
                      }))
                    }
                    placeholder="建议使用手机号或英文名"
                    autoComplete="username"
                    className="auth-input h-full w-full bg-transparent text-base font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-neutral-600 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="inline-block ml-1 text-[11px] font-black tracking-[0.2em] text-gray-500 dark:text-neutral-500">安全密码</label>
                <div className="group flex h-14 items-center rounded-2xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-black/40 px-5 transition-all duration-300 focus-within:border-primary/40 focus-within:bg-white dark:focus-within:bg-neutral-950">
                  <input
                    value={formValues.password}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    type="password"
                    placeholder="请输入 6 位以上密码"
                    autoComplete="new-password"
                    className="auth-input h-full w-full bg-transparent text-base font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-neutral-600 outline-none"
                  />
                </div>
              </div>
            </section>

            {/* 第二部分：球员资料 */}
            <section className="space-y-6">
              <div className="flex items-center space-x-2 text-gray-500 dark:text-neutral-400 font-black text-[10px] uppercase tracking-widest border-b border-gray-100 dark:border-neutral-900 pb-4">
                <UserPlus size={14} className="text-primary" />
                <span>球员基本信息</span>
              </div>

              <div className="space-y-3">
                <label className="inline-block ml-1 text-[11px] font-black tracking-[0.2em] text-gray-500 dark:text-neutral-500">球场昵称</label>
                <div className="group flex h-14 items-center rounded-2xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-black/40 px-5 transition-all duration-300 focus-within:border-primary/40 focus-within:bg-white dark:focus-within:bg-neutral-950">
                  <input
                    value={formValues.nickname}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        nickname: event.target.value,
                      }))
                    }
                    placeholder="队友怎么称呼您？"
                    className="auth-input h-full w-full bg-transparent text-base font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-neutral-600 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="inline-block ml-1 text-[11px] font-black tracking-[0.2em] text-gray-500 dark:text-neutral-500">真实姓名</label>
                <div className="group flex h-14 items-center rounded-2xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-black/40 px-5 transition-all duration-300 focus-within:border-primary/40 focus-within:bg-white dark:focus-within:bg-neutral-950">
                  <input
                    value={formValues.realName}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        realName: event.target.value,
                      }))
                    }
                    placeholder="仅用于行政核对"
                    className="auth-input h-full w-full bg-transparent text-base font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-neutral-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <AuthField label="年龄">
                  <AuthStepper
                    min={10}
                    max={60}
                    value={formValues.age}
                    onChange={(value) =>
                      setFormValues((current) => ({
                        ...current,
                        age: value,
                      }))
                    }
                  />
                </AuthField>

                <AuthField label="擅长脚">
                  <div className="auth-selector">
                    <Selector 
                      value={formValues.preferredFoot}
                      onChange={(value) =>
                        setFormValues((current) => ({
                          ...current,
                          preferredFoot: value,
                        }))
                      }
                      options={preferredFootOptions}
                      style={{ '--border-radius': '16px', '--checked-color': '#1DB954' }}
                    />
                  </div>
                </AuthField>
              </div>

              <AuthField label="擅长位置">
                <div className="auth-selector">
                  <Selector 
                    value={formValues.position}
                    onChange={(value) =>
                      setFormValues((current) => ({
                        ...current,
                        position: value,
                      }))
                    }
                    options={positions}
                    columns={2}
                    style={{ '--border-radius': '16px', '--checked-color': '#1DB954', '--padding': '16px' }}
                  />
                </div>
              </AuthField>
            </section>
          
            <div className="space-y-4 pt-2">
              <button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className="flex h-16 w-full items-center justify-center rounded-[1.75rem] border border-primary/30 bg-primary text-[15px] font-black tracking-[0.2em] text-black shadow-[0_20px_40px_rgba(29,185,84,0.2)] transition-all hover:translate-y-[-2px] hover:shadow-[0_25px_50px_rgba(29,185,84,0.35)] active:translate-y-[0px] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span>{loading ? '激活中...' : '激活球员身份'}</span>
                {!loading && <ShieldCheck className="ml-3" size={18} />}
              </button>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="flex h-14 w-full items-center justify-center rounded-[1.5rem] border border-gray-200 dark:border-neutral-800 bg-gray-100 dark:bg-white/5 text-[12px] font-black tracking-[0.12em] text-gray-500 dark:text-neutral-400 transition-all duration-300 hover:border-gray-300 dark:hover:border-neutral-700 hover:text-gray-900 dark:hover:text-white"
              >
                已有账号？
                <span className="ml-2 text-primary inline-flex items-center">
                  返回登录
                  <ArrowRight className="ml-1" size={14} />
                </span>
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-[1.5rem] border border-gray-200 dark:border-neutral-900 bg-white dark:bg-neutral-950/70 px-4 py-4 text-center">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">Profile</div>
            <div className="text-xs font-bold text-gray-500 dark:text-neutral-400">身份资料更完整</div>
          </div>
          <div className="rounded-[1.5rem] border border-gray-200 dark:border-neutral-900 bg-white dark:bg-neutral-950/70 px-4 py-4 text-center">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">Position</div>
            <div className="text-xs font-bold text-gray-500 dark:text-neutral-400">位置偏好更清晰</div>
          </div>
          <div className="rounded-[1.5rem] border border-gray-200 dark:border-neutral-900 bg-white dark:bg-neutral-950/70 px-4 py-4 text-center">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">Ready</div>
            <div className="text-xs font-bold text-gray-500 dark:text-neutral-400">注册完成即可开赛</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
