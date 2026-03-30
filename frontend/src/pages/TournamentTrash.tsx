import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toast } from 'antd-mobile';
import { useConfirmDialog } from '../components/ConfirmDialog';
import { ChevronLeft, Trash2, RotateCcw, Loader2 } from 'lucide-react';
import { tournamentApi, type Tournament } from '../api/tournament';
import dayjs from 'dayjs';

const TournamentTrash: React.FC = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [operating, setOperating] = useState<number | null>(null);
  const { show: showConfirm, DialogComponent } = useConfirmDialog();

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const data = await tournamentApi.listTrash();
      setTournaments(data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrash(); }, []);

  const handleRestore = async (id: number) => {
    const result = await showConfirm({
      title: '恢复 Tournament',
      content: '确定要恢复此 Tournament 吗？恢复后将重新出现在列表中。',
    });
    if (!result) return;
    setOperating(id);
    try {
      await tournamentApi.restore(id);
      Toast.show({ icon: 'success', content: 'Tournament 已恢复' });
      fetchTrash();
    } catch {
    } finally {
      setOperating(null);
    }
  };

  const handlePermanentDelete = async (t: Tournament) => {
    const result = await showConfirm({
      title: '永久删除',
      content: (
        <div className="space-y-2">
          <div className="text-red-400 font-bold">此操作无法撤销！</div>
          <div className="text-sm text-neutral-500">
            将彻底删除「{t.name}」及其所有关联数据（赛事、球员、评分、战绩等）。
          </div>
        </div>
      ),
    });
    if (!result) return;
    setOperating(t.id);
    try {
      await tournamentApi.permanentDelete(t.id);
      Toast.show({ icon: 'success', content: '已永久删除' });
      fetchTrash();
    } catch {
    } finally {
      setOperating(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200 dark:border-neutral-800 bg-gray-50/95 dark:bg-[#0a0a0a]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-white/5"
          >
            <ChevronLeft size={20} className="text-gray-500 dark:text-neutral-400" />
          </button>
          <h1 className="flex-1 text-lg font-black text-gray-900 dark:text-white">Tournament 回收站</h1>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary" />
            <div className="mt-4 text-sm text-gray-500 dark:text-neutral-500">加载中...</div>
          </div>
        ) : tournaments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Trash2 size={48} className="text-gray-300 dark:text-neutral-700" />
            <div className="mt-4 text-sm font-bold text-gray-500 dark:text-neutral-500">回收站为空</div>
            <div className="mt-2 text-xs text-gray-400 dark:text-neutral-600">已删除的 Tournament 会出现在这里</div>
          </div>
        ) : (
          <div className="space-y-4">
            {tournaments.map((t) => {
              const isOperating = operating === t.id;
              return (
                <div
                  key={t.id}
                  className="rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[linear-gradient(180deg,rgba(24,24,27,0.98)_0%,rgba(10,10,10,1)_100%)] p-6 shadow-sm dark:shadow-none"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-black text-gray-900 dark:text-white">{t.name}</h3>
                      {t.description && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-neutral-500 line-clamp-2">{t.description}</p>
                      )}
                      <div className="mt-2 space-y-1 text-xs text-gray-500 dark:text-neutral-500">
                        {t.deletedAt && (
                          <div>删除时间：{dayjs(t.deletedAt).format('YYYY-MM-DD HH:mm')}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleRestore(t.id)}
                      disabled={isOperating}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-3 text-sm font-bold text-emerald-400 transition-all hover:bg-emerald-500/15 active:scale-[0.98] disabled:opacity-50"
                    >
                      {isOperating ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                      恢复
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(t)}
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

      <DialogComponent />
    </div>
  );
};

export default TournamentTrash;
