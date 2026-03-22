import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toast } from 'antd-mobile';
import { useConfirmDialog } from '../components/ConfirmDialog';
import { ChevronLeft, Trash2, RotateCcw, Loader2 } from 'lucide-react';
import { matchApi } from '../api/match';
import dayjs from 'dayjs';

const matchStatusMeta: Record<string, { label: string; badgeClass: string }> = {
  PREPARING: { label: '筹备中', badgeClass: 'border-neutral-500/20 bg-neutral-500/10 text-neutral-400' },
  PUBLISHED: { label: '报名中', badgeClass: 'border-primary/20 bg-primary/10 text-primary' },
  REGISTRATION_CLOSED: { label: '报名已截止', badgeClass: 'border-sky-500/20 bg-sky-500/10 text-sky-400' },
  GROUPING_DRAFT: { label: '分组中', badgeClass: 'border-violet-500/20 bg-violet-500/10 text-violet-400' },
  ONGOING: { label: '比赛中', badgeClass: 'border-orange-500/20 bg-orange-500/10 text-orange-400' },
  MATCH_FINISHED: { label: '待核算', badgeClass: 'border-amber-500/20 bg-amber-500/10 text-amber-400' },
  SETTLED: { label: '已完结', badgeClass: 'border-neutral-700 bg-neutral-800/80 text-neutral-300' },
  CANCELLED: { label: '已取消', badgeClass: 'border-red-500/20 bg-red-500/10 text-red-400' },
};

const MatchTrash: React.FC = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [operating, setOperating] = useState<number | null>(null);
  const { show: showConfirm, DialogComponent } = useConfirmDialog();

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const data = await matchApi.listTrash();
      setMatches(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrash(); }, []);

  const handleRestore = async (matchId: number) => {
    const result = await showConfirm({
      title: '恢复赛事',
      content: '确定要恢复此赛事吗？恢复后将重新出现在赛事列表中。',
    });
    if (!result) return;

    setOperating(matchId);
    try {
      await matchApi.restore(matchId);
      Toast.show({ icon: 'success', content: '赛事已恢复' });
      fetchTrash();
    } catch { /* handled by interceptor */ }
    finally { setOperating(null); }
  };

  const handlePermanentDelete = async (matchId: number) => {
    const result = await showConfirm({
      title: '永久删除',
      content: (
        <div className="space-y-2">
          <div className="text-red-400 font-bold">此操作无法撤销！</div>
          <div className="text-sm text-neutral-500">将彻底删除赛事及所有关联数据（报名、场次、比分等）。</div>
        </div>
      ),
    });
    if (!result) return;

    setOperating(matchId);
    try {
      await matchApi.permanentDelete(matchId);
      Toast.show({ icon: 'success', content: '已永久删除' });
      fetchTrash();
    } catch { /* handled by interceptor */ }
    finally { setOperating(null); }
  };

  const getStatusMeta = (status?: string) => {
    return matchStatusMeta[status || ''] || {
      label: '状态待定',
      badgeClass: 'border-neutral-700 bg-neutral-800/80 text-neutral-300',
    };
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-neutral-800 bg-[#0a0a0a]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-white/5"
          >
            <ChevronLeft size={20} className="text-neutral-400" />
          </button>
          <h1 className="flex-1 text-lg font-black text-white">赛事回收站</h1>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary" />
            <div className="mt-4 text-sm text-neutral-500">加载中...</div>
          </div>
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Trash2 size={48} className="text-neutral-700" />
            <div className="mt-4 text-sm font-bold text-neutral-500">回收站为空</div>
            <div className="mt-2 text-xs text-neutral-600">已删除的赛事会出现在这里</div>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => {
              const statusMeta = getStatusMeta(match.status);
              const isOperating = operating === match.id;
              
              return (
                <div
                  key={match.id}
                  className="rounded-2xl border border-neutral-800 bg-[linear-gradient(180deg,rgba(24,24,27,0.98)_0%,rgba(10,10,10,1)_100%)] p-6"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusMeta.badgeClass}`}>
                          {statusMeta.label}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-white">{match.title}</h3>
                      <div className="mt-2 space-y-1 text-xs text-neutral-500">
                        <div>开始时间：{dayjs(match.startTime).format('YYYY-MM-DD HH:mm')}</div>
                        <div>删除时间：{dayjs(match.deletedAt).format('YYYY-MM-DD HH:mm')}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleRestore(match.id)}
                      disabled={isOperating}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-3 text-sm font-bold text-emerald-400 transition-all hover:bg-emerald-500/15 active:scale-[0.98] disabled:opacity-50"
                    >
                      {isOperating ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                      恢复
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(match.id)}
                      disabled={isOperating}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-3 text-sm font-bold text-red-400 transition-all hover:bg-red-500/15 active:scale-[0.98] disabled:opacity-50"
                    >
                      {isOperating ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      永久删除
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <DialogComponent />
    </div>
  );
};

export default MatchTrash;
