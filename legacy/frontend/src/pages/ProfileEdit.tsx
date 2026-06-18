import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toast, Selector } from 'antd-mobile';
import { updatePlayerProfile, type ProfileUpdateData } from '../api/player';
import useAuthStore from '../store/useAuthStore';
import { UserCircle, Ruler, Activity, ChevronLeft, Loader2 } from 'lucide-react';

const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

const Field: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className }) => (
  <div className={cn('space-y-2', className)}>
    <label className="inline-block ml-1 text-[11px] font-black tracking-[0.2em] text-gray-500 dark:text-neutral-500 uppercase">{label}</label>
    {children}
  </div>
);

const TextInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => (
  <div className="group flex h-14 items-center rounded-2xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-black/40 px-5 transition-all duration-300 focus-within:border-primary/40 focus-within:bg-white dark:focus-within:bg-neutral-950">
    <input
      {...props}
      className={cn(
        'h-full w-full bg-transparent text-base font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-neutral-600 outline-none',
        className,
      )}
    />
  </div>
);

const ProfileEdit: React.FC = () => {
  const navigate = useNavigate();
  const { me, loading, fetched, fetchMe } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);

  const [nickname, setNickname] = useState('');
  const [realName, setRealName] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [preferredFoot, setPreferredFoot] = useState<string[]>([]);
  const [position, setPosition] = useState<string[]>([]);

  useEffect(() => {
    if (!fetched) {
      fetchMe();
    }
  }, [fetched, fetchMe]);

  useEffect(() => {
    if (me?.player || me?.user) {
      setNickname(me.player?.nickname || '');
      setRealName(me.user?.realName || '');
      setAge(me.player?.age ? String(me.player.age) : '');
      setHeight(me.player?.height ? String(me.player.height) : '');
      setPreferredFoot(me.player?.preferredFoot ? [me.player.preferredFoot] : []);
      setPosition(me.player?.position ? [me.player.position] : []);
    }
  }, [me]);

  const handleSubmit = async () => {
    if (!nickname.trim()) {
      Toast.show({ icon: 'fail', content: '请填写球场展示名' });
      return;
    }
    const data: ProfileUpdateData = {
      nickname: nickname.trim(),
      realName: realName.trim() || undefined,
      position: position[0],
      preferredFoot: preferredFoot[0],
      age: age ? parseInt(age, 10) : undefined,
      height: height ? parseInt(height, 10) : undefined,
    };

    setSubmitting(true);
    try {
      await updatePlayerProfile(data);
      Toast.show({ icon: 'success', content: '更新成功' });
      await fetchMe();
      navigate(-1);
    } catch (error) {
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-neutral-950">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-[100px] text-gray-900 selection:bg-primary selection:text-black dark:bg-neutral-950 dark:text-white transition-colors duration-200">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-gray-200 bg-white/80 px-4 py-4 backdrop-blur-md dark:border-white/10 dark:bg-black/80 sm:px-6">
        <button
          onClick={() => navigate(-1)}
          className="group flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-gray-50 transition-all hover:border-gray-300 hover:bg-gray-100 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/20 dark:hover:bg-white/[0.04]"
        >
          <ChevronLeft
            size={20}
            className="text-gray-600 transition-transform group-hover:-translate-x-0.5 dark:text-neutral-400"
          />
        </button>
        <h1 className="text-sm font-black tracking-widest text-gray-900 dark:text-white">个人信息设置</h1>
        <div className="h-10 w-10" />
      </nav>

      {/* ── Main Content ── */}
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="rounded-[1.25rem] border border-gray-200 bg-white px-6 pt-6 pb-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-5">
          {/* Identity */}
          <div className="flex items-center gap-2">
            <UserCircle size={15} className="text-blue-500" />
            <span className="text-xs font-bold tracking-widest text-gray-400 dark:text-neutral-500 uppercase">身份信息</span>
          </div>
          <Field label="球场展示名 *">
            <TextInput
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="输入昵称 (e.g., 梅老板)"
            />
          </Field>
          <Field label="真实姓名">
            <TextInput
              value={realName}
              onChange={e => setRealName(e.target.value)}
              placeholder="仅用于内部管理，可选"
            />
          </Field>

          {/* Divider */}
          <div className="border-t border-gray-100 dark:border-neutral-800" />

          {/* Body Stats */}
          <div className="flex items-center gap-2">
            <Ruler size={15} className="text-orange-500" />
            <span className="text-xs font-bold tracking-widest text-gray-400 dark:text-neutral-500 uppercase">身体与经验</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="年龄">
              <TextInput
                type="number"
                value={age}
                onChange={e => setAge(e.target.value)}
                placeholder="岁"
              />
            </Field>
            <Field label="身高 (cm)">
              <TextInput
                type="number"
                value={height}
                onChange={e => setHeight(e.target.value)}
                placeholder="cm"
              />
            </Field>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 dark:border-neutral-800" />

          {/* Technical Specs */}
          <div className="flex items-center gap-2">
            <Activity size={15} className="text-primary" />
            <span className="text-xs font-bold tracking-widest text-gray-400 dark:text-neutral-500 uppercase">技术偏好</span>
          </div>
          <Field label="惯用脚">
            <Selector
              columns={3}
              value={preferredFoot}
              onChange={setPreferredFoot}
              options={[
                { label: '左脚', value: 'LEFT' },
                { label: '右脚', value: 'RIGHT' },
                { label: '双足', value: 'BOTH' },
              ]}
              className="profile-selector [&_.adm-selector-item]:rounded-xl [&_.adm-selector-item]:font-semibold"
            />
          </Field>
          <Field label="擅长位置">
            <Selector
              columns={4}
              value={position}
              onChange={setPosition}
              options={[
                { label: 'FW 前锋', value: 'FW' },
                { label: 'MF 中场', value: 'MF' },
                { label: 'DF 后卫', value: 'DF' },
                { label: 'GK 门将', value: 'GK' },
              ]}
              className="profile-selector [&_.adm-selector-item]:rounded-xl [&_.adm-selector-item]:font-semibold text-[13px]"
            />
          </Field>
        </div>
      </main>

      {/* ── Sticky Bottom Action Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/80 px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/80 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-500 dark:text-neutral-400">完善档案</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">更新您的信息</span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-black tracking-widest text-black shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                保存中...
              </>
            ) : (
              '保存更改'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;
