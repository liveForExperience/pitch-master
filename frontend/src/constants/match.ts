export const matchStatusMeta: Record<string, { label: string; badgeClass: string; dotClass: string; accentClass: string }> = {
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
    label: '比赛结束',
    badgeClass: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
    dotClass: 'bg-amber-400',
    accentClass: 'from-amber-400/80 to-amber-400/10',
  },
  SETTLED: {
    label: '已结算',
    badgeClass: 'border-teal-500/20 bg-teal-500/10 text-teal-400',
    dotClass: 'bg-teal-400',
    accentClass: 'from-teal-400/80 to-teal-400/10',
  },
  CANCELLED: {
    label: '已取消',
    badgeClass: 'border-red-500/20 bg-red-500/10 text-red-400',
    dotClass: 'bg-red-400',
    accentClass: 'from-red-400/70 to-red-400/5',
  },
};

export const getMatchStatusMeta = (status?: string) =>
  matchStatusMeta[status || ''] || {
    label: '状态待定',
    badgeClass: 'border-neutral-700 bg-neutral-800/80 text-neutral-300',
    dotClass: 'bg-neutral-400',
    accentClass: 'from-neutral-300/70 to-neutral-300/5',
  };

export const positionMeta: Record<string, { label: string; colorClass: string }> = {
  GK: { label: '门将', colorClass: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  DF: { label: '后卫', colorClass: 'bg-sky-500/15 text-sky-400 border-sky-500/20' },
  MF: { label: '中场', colorClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  FW: { label: '前锋', colorClass: 'bg-rose-500/15 text-rose-400 border-rose-500/20' },
};
