import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Toast } from 'antd-mobile';
import { ChevronLeft, Search, Loader2 } from 'lucide-react';
import { matchApi } from '../api/match';

const positionMeta: Record<string, { label: string; colorClass: string }> = {
  GK: { label: '门将', colorClass: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  DF: { label: '后卫', colorClass: 'bg-sky-500/15 text-sky-400 border-sky-500/20' },
  MF: { label: '中场', colorClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  FW: { label: '前锋', colorClass: 'bg-rose-500/15 text-rose-400 border-rose-500/20' },
};

const MatchAddPlayers: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [eligiblePlayers, setEligiblePlayers] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchPlayers = async () => {
      if (!id) return;
      try {
        const players = await matchApi.getEligiblePlayers(id);
        setEligiblePlayers(players || []);
      } catch (err) {
        console.error('Failed to load eligible players:', err);
        Toast.show({ icon: 'fail', content: '加载球员列表失败' });
      } finally {
        setLoading(false);
      }
    };
    fetchPlayers();
  }, [id]);

  const filteredPlayers = useMemo(() => {
    if (!searchText.trim()) return eligiblePlayers;
    const lowerSearch = searchText.toLowerCase();
    return eligiblePlayers.filter(p => p.nickname?.toLowerCase().includes(lowerSearch));
  }, [eligiblePlayers, searchText]);

  const isAllSelected = filteredPlayers.length > 0 && filteredPlayers.every(p => selectedIds.has(p.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      // 如果已经全选，则在这个过滤结果中反选所有的
      const newSet = new Set(selectedIds);
      filteredPlayers.forEach(p => newSet.delete(p.id));
      setSelectedIds(newSet);
    } else {
      // 否则将当前过滤结果中的全部选中
      const newSet = new Set(selectedIds);
      filteredPlayers.forEach(p => newSet.add(p.id));
      setSelectedIds(newSet);
    }
  };

  const toggleSelect = (playerId: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(playerId)) {
      newSet.delete(playerId);
    } else {
      newSet.add(playerId);
    }
    setSelectedIds(newSet);
  };

  const handleConfirmAdd = async () => {
    if (selectedIds.size === 0) {
      Toast.show({ content: '请先选择需要添加的球员' });
      return;
    }
    if (!id) return;

    setSubmitting(true);
    try {
      await matchApi.adminBatchAddPlayers(id, Array.from(selectedIds));
      Toast.show({ icon: 'success', content: '批量添加成功' });
      navigate(-1);
    } catch (err) {
      console.error('Failed to batch add players:', err);
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
        <h1 className="text-sm font-black tracking-widest text-gray-900 dark:text-white">批量添加球员</h1>
        <div className="h-10 w-10" />
      </nav>

      {/* ── Main Content ── */}
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {/* Search Bar */}
        <div className="mb-6 relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 dark:text-neutral-500">
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="搜索球员昵称..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full rounded-[1.25rem] border border-gray-200 bg-white py-3.5 pl-11 pr-4 text-sm font-medium text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:placeholder-neutral-500"
          />
        </div>

        {/* List Header */}
        {eligiblePlayers.length > 0 && (
          <div className="mb-4 flex items-center justify-between px-2">
            <span className="text-xs font-black tracking-widest text-gray-500 dark:text-neutral-500">
              可选球员 ({filteredPlayers.length})
            </span>
            <button
              onClick={toggleSelectAll}
              className="text-xs font-bold text-primary transition-colors hover:text-primary/80"
            >
              {isAllSelected ? '取消全选' : '全选'}
            </button>
          </div>
        )}

        {/* Players List */}
        <div className="space-y-3">
          {filteredPlayers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-white/[0.02]">
                <Search size={24} className="text-gray-300 dark:text-neutral-600" />
              </div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">未找到匹配的球员</div>
              <div className="mt-1 text-xs text-gray-500 dark:text-neutral-500">
                {searchText ? '请尝试更换关键词' : '当前没有可用球员'}
              </div>
            </div>
          ) : (
            filteredPlayers.map(player => {
              const pos = positionMeta[player.position] || {
                label: '球员',
                colorClass: 'bg-neutral-500/15 text-neutral-400 border-neutral-500/20',
              };
              const isSelected = selectedIds.has(player.id);
              return (
                <button
                  key={player.id}
                  onClick={() => toggleSelect(player.id)}
                  className={`flex w-full items-center gap-4 rounded-[1.25rem] border p-4 text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/[0.08] shadow-[0_0_20px_rgba(29,185,84,0.15)] dark:bg-primary/[0.05]'
                      : 'border-gray-200 bg-white hover:border-gray-300 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/20'
                  }`}
                >
                  {/* Select indicator */}
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors">
                    <div
                      className={`h-3 w-3 rounded-full transition-all ${
                        isSelected ? 'scale-100 bg-primary' : 'scale-0'
                      }`}
                    />
                    <div
                      className={`absolute h-5 w-5 rounded-full border-2 transition-all ${
                        isSelected ? 'border-primary' : 'border-gray-300 dark:border-neutral-600'
                      }`}
                    />
                  </div>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-sm font-black text-gray-500 dark:bg-white/10 dark:text-neutral-300">
                    {(player.nickname || '?')[0]}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-base font-bold text-gray-900 dark:text-white">
                        {player.nickname}
                      </div>
                      <span className={`shrink-0 rounded-lg border px-2 py-0.5 text-[10px] font-bold ${pos.colorClass}`}>
                        {pos.label}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-neutral-400">
                      评分: {player.rating?.toFixed(1) || 'N/A'}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </main>

      {/* ── Sticky Bottom Action Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/80 px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/80 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-500 dark:text-neutral-400">已选择</span>
            <span className="text-lg font-black text-gray-900 dark:text-white">{selectedIds.size}</span>
          </div>
          <button
            onClick={handleConfirmAdd}
            disabled={selectedIds.size === 0 || submitting}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-black tracking-widest text-black shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                提交中...
              </>
            ) : (
              `确认添加 (${selectedIds.size})`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchAddPlayers;
