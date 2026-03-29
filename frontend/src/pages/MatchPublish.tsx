import React, { useEffect, useState, useMemo } from 'react';
import { Toast } from 'antd-mobile';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Trophy,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Send,
  ArrowRight,
  Zap,
  CalendarDays,
  Timer,
} from 'lucide-react';
import apiClient from '../api/client';
import useAuthStore from '../store/useAuthStore';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn');

const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

/* ─── 表单字段组件（严格复用现有设计语言） ─── */

const SectionHeader: React.FC<{ icon: React.ElementType; title: string }> = ({ icon: Icon, title }) => (
  <div className="flex items-center space-x-2 text-gray-500 dark:text-neutral-400 font-black text-[10px] uppercase tracking-widest border-b border-gray-100 dark:border-neutral-900 pb-4">
    <Icon size={14} className="text-primary" />
    <span>{title}</span>
  </div>
);

const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode; className?: string }> = ({
  label,
  hint,
  children,
  className,
}) => (
  <div className={cn('space-y-3', className)}>
    <div className="flex items-baseline justify-between">
      <label className="inline-block ml-1 text-[11px] font-black tracking-[0.2em] text-gray-500 dark:text-neutral-500">{label}</label>
      {hint && <span className="text-[10px] font-medium text-gray-400 dark:text-neutral-600">{hint}</span>}
    </div>
    {children}
  </div>
);

const TextInput: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ElementType }
> = ({ className, icon: Icon, ...props }) => (
  <div className="group flex h-14 items-center rounded-2xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-black/40 px-5 transition-all duration-300 focus-within:border-primary/40 focus-within:bg-white dark:focus-within:bg-neutral-950">
    {Icon && <Icon size={18} className="mr-4 text-gray-400 dark:text-neutral-600 transition-colors duration-300 group-focus-within:text-primary" />}
    <input
      {...props}
      className={cn(
        'auth-input h-full w-full bg-transparent text-base font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-neutral-600 outline-none',
        className,
      )}
    />
  </div>
);

/* ─── 快捷选项 Chip 组件 ─── */

const Chip: React.FC<{
  label: string;
  subLabel?: string;
  selected?: boolean;
  onClick: () => void;
}> = ({ label, subLabel, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'relative flex flex-col items-center justify-center rounded-2xl border px-3 py-2.5 text-center transition-all duration-200 active:scale-95',
      selected
        ? 'border-primary/40 bg-primary/[0.12] text-primary shadow-[0_0_20px_rgba(29,185,84,0.1)]'
        : 'border-gray-200 dark:border-neutral-800 bg-gray-100 dark:bg-black/40 text-gray-500 dark:text-neutral-400 hover:border-gray-300 dark:hover:border-neutral-600 hover:text-gray-700 dark:hover:text-neutral-200',
    )}
  >
    <span className="text-[13px] font-black leading-tight">{label}</span>
    {subLabel && (
      <span className={cn('mt-0.5 text-[10px] font-semibold', selected ? 'text-primary/70' : 'text-gray-400 dark:text-neutral-600')}>
        {subLabel}
      </span>
    )}
  </button>
);

const TimeChip: React.FC<{
  label: string;
  selected?: boolean;
  onClick: () => void;
}> = ({ label, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'flex h-11 items-center justify-center rounded-xl border text-[13px] font-black tabular-nums transition-all duration-200 active:scale-95',
      selected
        ? 'border-primary/40 bg-primary/[0.12] text-primary'
        : 'border-gray-200 dark:border-neutral-800 bg-gray-100 dark:bg-black/40 text-gray-500 dark:text-neutral-400 hover:border-gray-300 dark:hover:border-neutral-600 hover:text-gray-700 dark:hover:text-neutral-200',
    )}
  >
    {label}
  </button>
);

const Stepper: React.FC<{
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  unit?: string;
}> = ({ value, onChange, min = 1, max = 99, unit }) => (
  <div className="flex items-center gap-3">
    <button
      type="button"
      onClick={() => onChange(Math.max(min, value - 1))}
      disabled={value <= min}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-100 dark:bg-black/40 text-gray-600 dark:text-neutral-300 transition-all hover:border-gray-300 dark:hover:border-neutral-600 hover:text-gray-900 dark:hover:text-white active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
    >
      <span className="text-lg font-bold leading-none">−</span>
    </button>
    <span className="min-w-[3rem] text-center text-lg font-black text-gray-900 dark:text-white tabular-nums">{value}</span>
    <button
      type="button"
      onClick={() => onChange(Math.min(max, value + 1))}
      disabled={value >= max}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-100 dark:bg-black/40 text-gray-600 dark:text-neutral-300 transition-all hover:border-gray-300 dark:hover:border-neutral-600 hover:text-gray-900 dark:hover:text-white active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
    >
      <span className="text-lg font-bold leading-none">+</span>
    </button>
    {unit && <span className="text-sm font-semibold text-gray-500 dark:text-neutral-500">{unit}</span>}
  </div>
);

/* ─── 页面主体 ─── */

const MatchPublish: React.FC = () => {
  const navigate = useNavigate();
  const { id, tournamentId } = useParams<{ id: string; tournamentId: string }>();
  const isEditMode = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEditMode);
  const { fetchMe, fetched, isAdmin, isTournamentAdmin } = useAuthStore();
  const basePath = `/tournaments/${tournamentId}/matches`;

  useEffect(() => {
    if (!fetched) {
      fetchMe();
    } else if (fetched && !isAdmin() && !(tournamentId && isTournamentAdmin(Number(tournamentId)))) {
      Toast.show({ icon: 'fail', content: '仅管理员可发布赛事' });
      navigate(basePath, { replace: true });
    }
  }, [fetched, isAdmin, fetchMe, navigate]);

  // 编辑模式：加载现有赛事数据
  useEffect(() => {
    if (isEditMode && id) {
      setPageLoading(true);
      apiClient.get(`/api/match/${id}`)
        .then((match: any) => {
          if (match.status !== 'PREPARING') {
            Toast.show({ icon: 'fail', content: '只能编辑筹备中的赛事' });
            navigate(basePath, { replace: true });
            return;
          }
          const startDayjs = dayjs(match.startTime);
          const endDayjs = dayjs(match.endTime);
          const regDeadlineDayjs = dayjs(match.registrationDeadline);
          const cancelDeadlineDayjs = dayjs(match.cancelDeadline);

          setForm({
            title: match.title || '',
            location: match.location || '',
            startDateMode: startDayjs.format('YYYY-MM-DD'),
            startDateCustom: '',
            startTimeMode: startDayjs.format('HH:mm'),
            startTimeCustom: '',
            endTimeMode: 'custom',
            endTimeCustom: endDayjs.format('YYYY-MM-DDTHH:mm'),
            regDeadlineMode: 'custom',
            regDeadlineCustom: regDeadlineDayjs.format('YYYY-MM-DDTHH:mm'),
            cancelDeadlineMode: 'custom',
            cancelDeadlineCustom: cancelDeadlineDayjs.format('YYYY-MM-DDTHH:mm'),
            numGroups: match.numGroups || 2,
            playersPerGroup: match.playersPerGroup || 5,
            plannedGameCount: match.plannedGameCount || 3,
            durationPerGame: match.durationPerGame || 15,
            totalCost: match.totalCost ? String(match.totalCost) : '',
          });
        })
        .catch(() => {
          Toast.show({ icon: 'fail', content: '加载赛事信息失败' });
          navigate(basePath, { replace: true });
        })
        .finally(() => setPageLoading(false));
    }
  }, [isEditMode, id, navigate]);

  // ─── 日期快捷选项 ───
  const dateOptions = useMemo(() => {
    const now = dayjs();
    const results: { label: string; subLabel: string; value: string }[] = [];
    // 从今天开始往后 14 天，挑出周六和周日
    for (let i = 0; i <= 14; i++) {
      const d = now.add(i, 'day');
      const wd = d.day();
      if (wd === 6 || wd === 0) {
        const weekLabel = d.isSame(now, 'week') || (wd === 0 && d.diff(now, 'day') <= 6)
          ? '本' : '下';
        results.push({
          label: `${weekLabel}周${wd === 6 ? '六' : '日'}`,
          subLabel: d.format('M/D'),
          value: d.format('YYYY-MM-DD'),
        });
      }
      if (results.length >= 4) break;
    }
    return results;
  }, []);

  const timeSlots = ['14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

  const regDeadlineOptions: { label: string; value: number | 'custom' }[] = [
    { label: '开赛前 2 小时', value: 2 },
    { label: '开赛前 4 小时', value: 4 },
    { label: '开赛前 8 小时', value: 8 },
    { label: '开赛前 1 天', value: 24 },
    { label: '自定义', value: 'custom' },
  ];

  const cancelDeadlineOptions: { label: string; value: string }[] = [
    { label: '与报名截止一致', value: 'same' },
    { label: '开赛前 2 小时', value: '2h' },
    { label: '开赛前 4 小时', value: '4h' },
    { label: '自定义', value: 'custom' },
  ];

  // ─── 表单状态 ───
  const [form, setForm] = useState({
    title: '',
    location: '',
    // 拆分：日期 + 时间
    startDateMode: dateOptions[0]?.value as string | 'custom',
    startDateCustom: '',
    startTimeMode: '15:00' as string | 'custom',
    startTimeCustom: '',
    // 结束时间
    endTimeMode: '2h' as '1h' | '2h' | '3h' | 'custom',
    endTimeCustom: '',
    // 报名截止
    regDeadlineMode: 4 as number | 'custom',
    regDeadlineCustom: '',
    // 反悔截止
    cancelDeadlineMode: 'same' as 'same' | '2h' | '4h' | 'custom',
    cancelDeadlineCustom: '',
    numGroups: 2,
    playersPerGroup: 5,
    plannedGameCount: 3,
    durationPerGame: 15,
    totalCost: '',
  });

  const update = (key: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // ─── 计算实际时间 ───
  const actualStartDate = form.startDateMode === 'custom' ? form.startDateCustom : form.startDateMode;
  const actualStartTime = form.startTimeMode === 'custom' ? form.startTimeCustom : form.startTimeMode;

  const startTimeDayjs = useMemo(
    () => dayjs(`${actualStartDate} ${actualStartTime}`, 'YYYY-MM-DD HH:mm'),
    [actualStartDate, actualStartTime],
  );

  // 自定义时间的 max 值（不能晚于开赛时间）
  const customMax = startTimeDayjs.format('YYYY-MM-DDTHH:mm');

  const regDeadlineDayjs = useMemo(() => {
    if (form.regDeadlineMode === 'custom' && form.regDeadlineCustom) {
      return dayjs(form.regDeadlineCustom);
    }
    return startTimeDayjs.subtract(typeof form.regDeadlineMode === 'number' ? form.regDeadlineMode : 4, 'hour');
  }, [startTimeDayjs, form.regDeadlineMode, form.regDeadlineCustom]);

  const cancelDeadlineDayjs = useMemo(() => {
    if (form.cancelDeadlineMode === 'custom' && form.cancelDeadlineCustom) {
      return dayjs(form.cancelDeadlineCustom);
    }
    if (form.cancelDeadlineMode === 'same') return regDeadlineDayjs;
    const h = form.cancelDeadlineMode === '2h' ? 2 : 4;
    return startTimeDayjs.subtract(h, 'hour');
  }, [startTimeDayjs, regDeadlineDayjs, form.cancelDeadlineMode, form.cancelDeadlineCustom]);

  const endTimeDayjs = useMemo(() => {
    if (form.endTimeMode === 'custom' && form.endTimeCustom) {
      return dayjs(form.endTimeCustom);
    }
    const hours = form.endTimeMode === '1h' ? 1 : form.endTimeMode === '2h' ? 2 : 3;
    return startTimeDayjs.add(hours, 'hour');
  }, [startTimeDayjs, form.endTimeMode, form.endTimeCustom]);

  // 计算总时长（分钟）
  const totalDuration = useMemo(() => {
    if (!startTimeDayjs.isValid() || !endTimeDayjs.isValid()) return 0;
    return endTimeDayjs.diff(startTimeDayjs, 'minute');
  }, [startTimeDayjs, endTimeDayjs]);

  // 联动计算逻辑：修改场次时，更新每场时长
  const handleGameCountChange = (newCount: number) => {
    if (totalDuration > 0 && newCount > 0) {
      const newDuration = Math.ceil(totalDuration / newCount);
      setForm(prev => ({ ...prev, plannedGameCount: newCount, durationPerGame: newDuration }));
    } else {
      update('plannedGameCount', newCount);
    }
  };

  // 联动计算逻辑：修改每场时长时，更新场次
  const handleDurationChange = (newDuration: number) => {
    if (totalDuration > 0 && newDuration > 0) {
      const newCount = Math.ceil(totalDuration / newDuration);
      setForm(prev => ({ ...prev, durationPerGame: newDuration, plannedGameCount: newCount }));
    } else {
      update('durationPerGame', newDuration);
    }
  };

  // 联动计算逻辑：修改结束时间时，更新每场时长和场次
  const handleEndTimeModeChange = (mode: '1h' | '2h' | '3h' | 'custom') => {
    update('endTimeMode', mode);
    // 计算新的总时长并联动更新
    setTimeout(() => {
      const newTotalDuration = endTimeDayjs.diff(startTimeDayjs, 'minute');
      if (newTotalDuration > 0 && form.plannedGameCount > 0) {
        const newDuration = Math.ceil(newTotalDuration / form.plannedGameCount);
        setForm(prev => ({ ...prev, durationPerGame: newDuration }));
      }
    }, 0);
  };

  const handleEndTimeCustomChange = (value: string) => {
    if (value && dayjs(value).isBefore(startTimeDayjs)) {
      Toast.show({ icon: 'fail', content: '结束时间必须晚于开始时间' });
      return;
    }
    update('endTimeCustom', value);
    // 计算新的总时长并联动更新
    if (value) {
      const newEndTime = dayjs(value);
      const newTotalDuration = newEndTime.diff(startTimeDayjs, 'minute');
      if (newTotalDuration > 0 && form.plannedGameCount > 0) {
        const newDuration = Math.ceil(newTotalDuration / form.plannedGameCount);
        setForm(prev => ({ ...prev, durationPerGame: newDuration }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      Toast.show({ icon: 'fail', content: '请填写赛事标题' });
      return;
    }
    if (!actualStartDate || !actualStartTime) {
      Toast.show({ icon: 'fail', content: '请设置开赛时间' });
      return;
    }
    if (!form.location.trim()) {
      Toast.show({ icon: 'fail', content: '请填写比赛地点' });
      return;
    }
    if (form.regDeadlineMode === 'custom' && !form.regDeadlineCustom) {
      Toast.show({ icon: 'fail', content: '请设置报名截止时间' });
      return;
    }
    if (form.cancelDeadlineMode === 'custom' && !form.cancelDeadlineCustom) {
      Toast.show({ icon: 'fail', content: '请设置反悔截止时间' });
      return;
    }

    setLoading(true);
    try {
      const startTimeStr = startTimeDayjs.format('YYYY-MM-DDTHH:mm:ss');
      const regDeadlineStr = regDeadlineDayjs.format('YYYY-MM-DDTHH:mm:ss');
      const cancelDeadlineStr = cancelDeadlineDayjs.format('YYYY-MM-DDTHH:mm:ss');

      const endTimeStr = endTimeDayjs.format('YYYY-MM-DDTHH:mm:ss');

      const payload: Record<string, any> = {
        title: form.title.trim(),
        location: form.location.trim(),
        startTime: startTimeStr,
        endTime: endTimeStr,
        registrationDeadline: regDeadlineStr,
        cancelDeadline: cancelDeadlineStr,
        numGroups: form.numGroups,
        playersPerGroup: form.playersPerGroup,
        plannedGameCount: form.plannedGameCount,
        durationPerGame: form.durationPerGame,
        totalCost: form.totalCost ? Number(form.totalCost) : 0,
      };

      if (isEditMode && id) {
        await apiClient.put(`/api/match/${id}`, payload);
        Toast.show({ icon: 'success', content: '赛事更新成功' });
        navigate(`${basePath}/${id}`);
      } else {
        await apiClient.post('/api/match/publish', payload);
        Toast.show({ icon: 'success', content: '赛事发布成功' });
        navigate(basePath);
      }
    } catch {
      // 拦截器已处理错误
    } finally {
      setLoading(false);
    }
  };

  // 信息摘要
  const totalPlayers = form.numGroups * form.playersPerGroup;
  const perPerson = form.totalCost && Number(form.totalCost) > 0
    ? Math.ceil(Number(form.totalCost) / totalPlayers)
    : 0;

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white flex items-center justify-center">
        <div className="text-gray-400 dark:text-neutral-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white overflow-x-hidden">
      <div className="relative mx-auto max-w-3xl px-6 py-8 sm:px-8 lg:px-10 lg:py-12">
        {/* 背景光晕 */}
        <div className="pointer-events-none absolute top-16 right-[-8%] h-64 w-64 rounded-full bg-primary/10 blur-[150px]"></div>
        <div className="pointer-events-none absolute bottom-12 left-[-10%] h-56 w-56 rounded-full bg-white/5 blur-[130px]"></div>

        {/* 返回按钮 */}
        <button
          type="button"
          onClick={() => navigate(basePath)}
          className="flex items-center text-gray-500 dark:text-neutral-500 hover:text-gray-900 dark:hover:text-white transition-colors font-bold mb-12 group"
        >
          <ChevronLeft size={20} className="mr-1 group-hover:-translate-x-1 transition-transform" />
          返回赛事中心
        </button>

        {/* 页面标题 */}
        <header className="mb-16">
          <div className="inline-flex items-center rounded-full border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-6">
            {isEditMode ? '赛事编辑' : '赛事发布'}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter mb-4">
            {isEditMode ? '编辑' : '创建新'}
            <br />
            <span className="text-primary">比赛日程</span>
          </h1>
          <p className="max-w-2xl text-gray-500 dark:text-neutral-500 font-medium text-base sm:text-lg">
            {isEditMode 
              ? '修改赛事的时间、地点、分组规则与费用，仅在筹备阶段可编辑。' 
              : '设定赛事的时间、地点、分组规则与费用，发布后即刻进入报名阶段，球员可在赛事中心中报名参赛。'}
          </p>
        </header>

        {/* 表单卡片 */}
        <div className="rounded-[2.5rem] border border-gray-200 dark:border-neutral-900 bg-white dark:bg-neutral-950/90 p-6 sm:p-8 shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)] relative z-10">
          <form onSubmit={handleSubmit} className="space-y-10">
            {/* ── 第一部分：基础信息 ── */}
            <section className="space-y-6">
              <SectionHeader icon={Trophy} title="赛事基础信息" />

              <Field label="赛事标题">
                <TextInput
                  icon={Zap}
                  value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                  placeholder="例：每周杯"
                />
              </Field>

              <Field label="比赛地点">
                <TextInput
                  icon={MapPin}
                  value={form.location}
                  onChange={(e) => update('location', e.target.value)}
                  placeholder="例：政悦路"
                />
              </Field>
            </section>

            {/* ── 第二部分：时间设定 ── */}
            <section className="space-y-8">
              <SectionHeader icon={Calendar} title="时间设定" />

              {/* 开赛日期：快捷日期 Chips + 自定义 */}
              <Field label="比赛日期" hint={actualStartDate ? dayjs(actualStartDate).format('M月D日 ddd') : '请选择'}>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {dateOptions.map((opt) => (
                    <Chip
                      key={opt.value}
                      label={opt.label}
                      subLabel={opt.subLabel}
                      selected={form.startDateMode === opt.value}
                      onClick={() => update('startDateMode', opt.value)}
                    />
                  ))}
                  <Chip
                    label="自定义"
                    selected={form.startDateMode === 'custom'}
                    onClick={() => update('startDateMode', 'custom')}
                  />
                </div>
                {form.startDateMode === 'custom' && (
                  <div className="mt-3 flex items-center gap-3">
                    <CalendarDays size={14} className="text-gray-400 dark:text-neutral-600 shrink-0" />
                    <input
                      type="date"
                      value={form.startDateCustom}
                      onChange={(e) => update('startDateCustom', e.target.value)}
                      className="h-10 w-full rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-black/40 px-4 text-[13px] font-bold text-gray-900 dark:text-white outline-none transition-all focus:border-primary/40 [color-scheme:dark]"
                    />
                  </div>
                )}
              </Field>

              {/* 开球时间：快捷时段 Chips + 自定义 */}
              <Field label="开球时间" hint={actualStartTime || '请选择'}>
                <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
                  {timeSlots.map((t) => (
                    <TimeChip
                      key={t}
                      label={t}
                      selected={form.startTimeMode === t}
                      onClick={() => update('startTimeMode', t)}
                    />
                  ))}
                  <TimeChip
                    label="自定义"
                    selected={form.startTimeMode === 'custom'}
                    onClick={() => update('startTimeMode', 'custom')}
                  />
                </div>
                {form.startTimeMode === 'custom' && (
                  <div className="mt-3 flex items-center gap-3">
                    <Timer size={14} className="text-gray-400 dark:text-neutral-600 shrink-0" />
                    <input
                      type="time"
                      value={form.startTimeCustom}
                      onChange={(e) => update('startTimeCustom', e.target.value)}
                      className="h-10 w-full rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-black/40 px-4 text-[13px] font-bold text-gray-900 dark:text-white outline-none transition-all focus:border-primary/40 [color-scheme:dark]"
                    />
                  </div>
                )}
              </Field>

              {/* 实时预览：组合后的开赛时间 */}
              <div className="rounded-2xl border border-primary/12 bg-primary/[0.04] px-5 py-3.5 flex items-center gap-3">
                <Timer size={16} className="text-primary shrink-0" />
                <div className="text-sm font-bold text-gray-900 dark:text-white">
                  开赛时间：
                  <span className="text-primary ml-1">{startTimeDayjs.format('YYYY年M月D日 (ddd) HH:mm')}</span>
                </div>
              </div>

              {/* 结束时间：快捷选项 + 自定义 */}
              <Field label="结束时间" hint={endTimeDayjs.format('M/D HH:mm') + ' 结束'}>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Chip
                    label="1 小时后"
                    selected={form.endTimeMode === '1h'}
                    onClick={() => handleEndTimeModeChange('1h')}
                  />
                  <Chip
                    label="2 小时后"
                    selected={form.endTimeMode === '2h'}
                    onClick={() => handleEndTimeModeChange('2h')}
                  />
                  <Chip
                    label="3 小时后"
                    selected={form.endTimeMode === '3h'}
                    onClick={() => handleEndTimeModeChange('3h')}
                  />
                  <Chip
                    label="自定义"
                    selected={form.endTimeMode === 'custom'}
                    onClick={() => handleEndTimeModeChange('custom')}
                  />
                </div>
                {form.endTimeMode === 'custom' && (
                  <div className="mt-3 flex items-center gap-3">
                    <Timer size={14} className="text-gray-400 dark:text-neutral-600 shrink-0" />
                    <input
                      type="datetime-local"
                      value={form.endTimeCustom}
                      min={startTimeDayjs.format('YYYY-MM-DDTHH:mm')}
                      onChange={(e) => handleEndTimeCustomChange(e.target.value)}
                      className="h-10 w-full rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-black/40 px-4 text-[13px] font-bold text-gray-900 dark:text-white outline-none transition-all focus:border-primary/40 [color-scheme:dark]"
                    />
                  </div>
                )}
              </Field>

              {/* 结束时间预览 */}
              <div className="rounded-2xl border border-primary/12 bg-primary/[0.04] px-5 py-3.5 flex items-center gap-3">
                <Timer size={16} className="text-primary shrink-0" />
                <div className="text-sm font-bold text-gray-900 dark:text-white">
                  结束时间：
                  <span className="text-primary ml-1">{endTimeDayjs.format('YYYY年M月D日 (ddd) HH:mm')}</span>
                </div>
              </div>

              {/* 报名截止：相对时间 Chips + 自定义 */}
              <Field label="报名截止" hint={regDeadlineDayjs.format('M/D HH:mm') + ' 截止'}>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {regDeadlineOptions.map((opt) => (
                    <Chip
                      key={String(opt.value)}
                      label={opt.label}
                      selected={form.regDeadlineMode === opt.value}
                      onClick={() => update('regDeadlineMode', opt.value)}
                    />
                  ))}
                </div>
                {form.regDeadlineMode === 'custom' && (
                  <div className="mt-3 flex items-center gap-3">
                    <CalendarDays size={14} className="text-neutral-600 shrink-0" />
                    <input
                      type="datetime-local"
                      value={form.regDeadlineCustom}
                      max={customMax}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v && dayjs(v).isAfter(startTimeDayjs)) {
                          Toast.show({ icon: 'fail', content: '报名截止不能晚于开赛时间' });
                          return;
                        }
                        update('regDeadlineCustom', v);
                      }}
                      className="h-10 w-full rounded-xl border border-neutral-800 bg-black/40 px-4 text-[13px] font-bold text-white outline-none transition-all focus:border-primary/40 [color-scheme:dark]"
                    />
                  </div>
                )}
              </Field>

              {/* 反悔截止：相对 Chips + 自定义 */}
              <Field label="反悔截止" hint={cancelDeadlineDayjs.format('M/D HH:mm') + ' 截止'}>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {cancelDeadlineOptions.map((opt) => (
                    <Chip
                      key={opt.value}
                      label={opt.label}
                      selected={form.cancelDeadlineMode === opt.value}
                      onClick={() => update('cancelDeadlineMode', opt.value)}
                    />
                  ))}
                </div>
                {form.cancelDeadlineMode === 'custom' && (
                  <div className="mt-3 flex items-center gap-3">
                    <CalendarDays size={14} className="text-neutral-600 shrink-0" />
                    <input
                      type="datetime-local"
                      value={form.cancelDeadlineCustom}
                      max={customMax}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v && dayjs(v).isAfter(startTimeDayjs)) {
                          Toast.show({ icon: 'fail', content: '反悔截止不能晚于开赛时间' });
                          return;
                        }
                        update('cancelDeadlineCustom', v);
                      }}
                      className="h-10 w-full rounded-xl border border-neutral-800 bg-black/40 px-4 text-[13px] font-bold text-white outline-none transition-all focus:border-primary/40 [color-scheme:dark]"
                    />
                  </div>
                )}
              </Field>
            </section>

            {/* ── 第三部分：分组配置 ── */}
            <section className="space-y-6">
              <SectionHeader icon={Users} title="分组配置" />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Field label="分组数量">
                  <Stepper
                    value={form.numGroups}
                    onChange={(v) => update('numGroups', v)}
                    min={2}
                    max={8}
                    unit="组"
                  />
                </Field>

                <Field label="每组人数">
                  <Stepper
                    value={form.playersPerGroup}
                    onChange={(v) => update('playersPerGroup', v)}
                    min={1}
                    max={11}
                    unit="人"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Field label="每场时长" hint={`${form.durationPerGame}分钟`}>
                  <Stepper
                    value={form.durationPerGame}
                    onChange={handleDurationChange}
                    min={5}
                    max={120}
                    unit="分钟"
                  />
                </Field>

                <Field label="计划场次" hint={`共${form.plannedGameCount}场`}>
                  <Stepper
                    value={form.plannedGameCount}
                    onChange={handleGameCountChange}
                    min={1}
                    max={20}
                    unit="场"
                  />
                </Field>
              </div>

              {/* 实时摘要条 */}
              <div className="rounded-2xl border border-primary/12 bg-primary/[0.04] px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-black tracking-[0.18em] text-primary/70 mb-1">参赛总人数</div>
                    <div className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                      {totalPlayers}
                      <span className="ml-1 text-sm font-semibold text-gray-500 dark:text-neutral-500">人</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black tracking-[0.18em] text-primary/70 mb-1">生成场次</div>
                    <div className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                      {form.plannedGameCount}
                      <span className="ml-1 text-sm font-semibold text-gray-500 dark:text-neutral-500">场</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ── 第四部分：费用设定 ── */}
            <section className="space-y-6">
              <SectionHeader icon={DollarSign} title="费用设定" />

              <Field label="场地总费用（元）" hint="赛后按人均分摊">
                <TextInput
                  icon={DollarSign}
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.totalCost}
                  onChange={(e) => update('totalCost', e.target.value)}
                  placeholder="0.00"
                />
              </Field>

              {/* 费用预览 */}
              {Number(form.totalCost) > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-gray-200 dark:border-neutral-800/80 bg-gray-50 dark:bg-white/[0.02] px-4 py-3 text-center">
                    <div className="text-[10px] font-black tracking-[0.16em] text-gray-400 dark:text-neutral-600 mb-1">总费用</div>
                    <div className="text-xl font-black italic tracking-tight text-gray-900 dark:text-white">
                      ¥{Number(form.totalCost).toFixed(2)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-primary/12 bg-primary/[0.05] px-4 py-3 text-center">
                    <div className="text-[10px] font-black tracking-[0.16em] text-primary/70 mb-1">预估人均</div>
                    <div className="text-xl font-black italic tracking-tight text-primary">
                      ¥{perPerson.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* ── 提交按钮 ── */}
            <div className="space-y-4 pt-2">
              <button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className="flex h-16 w-full items-center justify-center rounded-[1.75rem] border border-primary/30 bg-primary text-[15px] font-black tracking-[0.2em] text-black shadow-[0_20px_40px_rgba(29,185,84,0.2)] transition-all hover:translate-y-[-2px] hover:shadow-[0_25px_50px_rgba(29,185,84,0.35)] active:translate-y-[0px] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span>{loading ? (isEditMode ? '保存中...' : '发布中...') : (isEditMode ? '保存修改' : '确认发布赛事')}</span>
                {!loading && <Send className="ml-3" size={18} />}
              </button>

              <button
                type="button"
                onClick={() => navigate(basePath)}
                className="flex h-14 w-full items-center justify-center rounded-[1.5rem] border border-gray-200 dark:border-neutral-800 bg-gray-100 dark:bg-white/5 text-[12px] font-black tracking-[0.12em] text-gray-500 dark:text-neutral-400 transition-all duration-300 hover:border-gray-300 dark:hover:border-neutral-700 hover:text-gray-900 dark:hover:text-white"
              >
                放弃编辑
                <span className="ml-2 text-primary inline-flex items-center">
                  返回广场
                  <ArrowRight className="ml-1" size={14} />
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* 底部信息卡片 */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-[1.5rem] border border-gray-200 dark:border-neutral-900 bg-white dark:bg-neutral-950/70 px-4 py-4 text-center">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">Publish</div>
            <div className="text-xs font-bold text-gray-500 dark:text-neutral-400">发布即进入报名阶段</div>
          </div>
          <div className="rounded-[1.5rem] border border-gray-200 dark:border-neutral-900 bg-white dark:bg-neutral-950/70 px-4 py-4 text-center">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">Auto Group</div>
            <div className="text-xs font-bold text-gray-500 dark:text-neutral-400">截止后自动触发分组算法</div>
          </div>
          <div className="rounded-[1.5rem] border border-gray-200 dark:border-neutral-900 bg-white dark:bg-neutral-950/70 px-4 py-4 text-center">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">Settlement</div>
            <div className="text-xs font-bold text-gray-500 dark:text-neutral-400">赛后按参与人数均摩费用</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchPublish;
