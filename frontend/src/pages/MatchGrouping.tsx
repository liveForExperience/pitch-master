import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Toast } from 'antd-mobile';
import { useConfirmDialog } from '../components/ConfirmDialog';
import { Wand2, Save, Globe, UserRoundX, Users, Pencil, Check, X, ChevronLeft, Loader2 } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import apiClient from '../api/client';
import { matchApi } from '../api/match';
import type { GroupsVO, PlayerItem, GroupingRequest } from '../api/match';
import useAuthStore from '../store/useAuthStore';

const GROUP_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];
const GROUP_COLORS = [
  'border-sky-500/30 bg-sky-500/5',
  'border-violet-500/30 bg-violet-500/5',
  'border-emerald-500/30 bg-emerald-500/5',
  'border-orange-500/30 bg-orange-500/5',
  'border-rose-500/30 bg-rose-500/5',
  'border-amber-500/30 bg-amber-500/5',
];
const GROUP_COLORS_OVER = [
  'border-sky-400/60 bg-sky-500/15',
  'border-violet-400/60 bg-violet-500/15',
  'border-emerald-400/60 bg-emerald-500/15',
  'border-orange-400/60 bg-orange-500/15',
  'border-rose-400/60 bg-rose-500/15',
  'border-amber-400/60 bg-amber-500/15',
];
const GROUP_DOT = ['bg-sky-400', 'bg-violet-400', 'bg-emerald-400', 'bg-orange-400', 'bg-rose-400', 'bg-amber-400'];

const STRATEGY_LABELS: Record<string, string> = {
  SIMPLE_SKILL_BALANCE: '实力平衡（蛇形）',
  ADVANCED_WEIGHTED: '进阶加权平衡',
};

interface DraggablePlayerCardProps {
  player: PlayerItem;
  fromGroup: number;
  canDrag: boolean;
  overlay?: boolean;
}

const DraggablePlayerCard: React.FC<DraggablePlayerCardProps> = ({ player, fromGroup, canDrag, overlay }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(player.id),
    data: { player, fromGroup },
    disabled: !canDrag,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    touchAction: canDrag ? 'none' : undefined,
    opacity: isDragging ? 0.35 : 1,
    cursor: canDrag ? 'grab' : 'default',
    zIndex: isDragging ? 999 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={overlay ? { cursor: 'grabbing' } : style}
      {...attributes}
      {...(canDrag ? listeners : {})}
      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 bg-white dark:bg-white/[0.05] shadow-[0_1px_2px_rgba(0,0,0,0.05)] ring-1 ring-gray-950/5 dark:ring-white/10 transition-all
        ${overlay ? 'rotate-2 scale-105 shadow-[0_8px_30px_rgb(0,0,0,0.12)]' : 'active:bg-gray-50 dark:active:bg-white/[0.02]'}
        ${isDragging ? 'opacity-30' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-gray-500 dark:text-neutral-400">
          {player.name.slice(0, 1)}
        </div>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{player.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 dark:text-neutral-500">{player.rating?.toFixed(1)}</span>
        {canDrag && !overlay && (
          <span className="text-[10px] text-gray-400 dark:text-neutral-600 select-none">⠇</span>
        )}
      </div>
    </div>
  );
};

interface DroppableGroupProps {
  groupIdx: number;
  children: React.ReactNode;
}

const DroppableGroup: React.FC<DroppableGroupProps> = ({ groupIdx, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id: `group-${groupIdx}` });
  const colorClass = isOver
    ? GROUP_COLORS_OVER[groupIdx % GROUP_COLORS_OVER.length]
    : GROUP_COLORS[groupIdx % GROUP_COLORS.length];

  return (
    <div ref={setNodeRef} className={`rounded-2xl border p-4 transition-colors ${colorClass}`}>
      {children}
    </div>
  );
};

const DroppableUnassigned: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setNodeRef, isOver } = useDroppable({ id: 'unassigned' });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border p-4 transition-colors ${
        isOver ? 'border-amber-400/60 bg-amber-500/15' : 'border-amber-500/20 bg-amber-500/5'
      }`}
    >
      {children}
    </div>
  );
};

const MatchGrouping: React.FC = () => {
  const { id, tournamentId } = useParams<{ id: string; tournamentId: string }>();
  const navigate = useNavigate();
  const { isAdmin, isTournamentAdmin, fetched } = useAuthStore();
  const basePath = `/tournaments/${tournamentId}/matches`;
  const { show: showConfirm, DialogComponent } = useConfirmDialog();

  const [vo, setVo] = useState<GroupsVO | null>(null);
  const [matchStatus, setMatchStatus] = useState<string>('');
  const [numGroups, setNumGroups] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [strategies, setStrategies] = useState<string[]>([]);

  const [autoGroupVisible, setAutoGroupVisible] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');
  const [keepExisting, setKeepExisting] = useState<boolean>(false);
  const [autoGroupLoading, setAutoGroupLoading] = useState(false);

  const [activePlayer, setActivePlayer] = useState<{ player: PlayerItem; fromGroup: number } | null>(null);

  const [editingGroupIdx, setEditingGroupIdx] = useState<number | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  useEffect(() => {
    if (fetched && !isAdmin() && !(tournamentId && isTournamentAdmin(Number(tournamentId)))) {
      Toast.show({ icon: 'fail', content: '权限不足' });
      navigate(`${basePath}/${id}`, { replace: true });
    }
  }, [fetched, isAdmin, navigate, id]);

  const loadGroups = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [data, matchData, strategyList]: [GroupsVO | null, any, string[]] = await Promise.all([
        matchApi.getGroups(id),
        apiClient.get(`/api/match/${id}`),
        matchApi.listStrategies(),
      ]);
      setVo(data);
      setMatchStatus(matchData?.status ?? '');
      setNumGroups(matchData?.numGroups ?? 0);
      setStrategies(strategyList ?? []);
      setSelectedStrategy(prev => prev || strategyList?.[0] || '');
    } catch {
      setVo(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const groupKeys = vo ? Object.keys(vo.groups).map(Number).sort() : [];
  const hasAnyGrouped = Object.values(vo?.groups ?? {}).some(g => g.length > 0);
  const allAssigned = (vo?.unassigned?.length ?? 0) === 0 && groupKeys.length > 0;
  const isPublished = vo?.groupsPublished === true;
  const canEdit = matchStatus === 'PUBLISHED' || matchStatus === 'REGISTRATION_CLOSED';
  const isNotStarted = !loading && vo !== null && groupKeys.length === 0;

  const getTeamLabel = (gIdx: number) =>
    vo?.teamNames?.[gIdx] || `Team ${GROUP_LABELS[gIdx] ?? gIdx + 1}`;

  const handleStartManual = () => {
    if (!vo || numGroups <= 0) return;
    const emptyGroups: Record<number, PlayerItem[]> = {};
    for (let i = 0; i < numGroups; i++) emptyGroups[i] = [];
    setVo({ ...vo, groups: emptyGroups });
  };

  const handleOpenAutoGroup = () => {
    setKeepExisting(false);
    setAutoGroupVisible(true);
  };

  const handleConfirmAutoGroup = async () => {
    setAutoGroupLoading(true);
    try {
      const request: GroupingRequest = {
        strategyName: selectedStrategy || undefined,
        keepExisting,
      };
      const data = await matchApi.autoGroup(id!, request);
      setVo(data);
      setAutoGroupVisible(false);
      Toast.show({ icon: 'success', content: '自动分组完成，已保存为草稿' });
    } catch {
    } finally {
      setAutoGroupLoading(false);
    }
  };

  const buildGroupsMap = (): Record<number, number[]> => {
    if (!vo) return {};
    const result: Record<number, number[]> = {};
    Object.entries(vo.groups).forEach(([key, players]) => {
      result[Number(key)] = players.map(p => p.id);
    });
    return result;
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await matchApi.saveGroupDraft(id!, buildGroupsMap());
      Toast.show({ icon: 'success', content: '草稿已保存' });
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if ((vo?.unassigned?.length ?? 0) > 0) {
      Toast.show({ icon: 'fail', content: `还有 ${vo!.unassigned.length} 名球员未分配` });
      return;
    }
    const confirmed = await showConfirm({
      title: '发布分组',
      content: '发布后所有人均可看到分组情况，是否确认？',
      confirmText: '确认发布',
    });
    if (!confirmed) return;
    try {
      await matchApi.saveGroupDraft(id!, buildGroupsMap());
      await matchApi.publishGroups(id!);
      await loadGroups();
      Toast.show({ icon: 'success', content: '分组已发布' });
    } catch {}
  };

  const movePlayer = (player: PlayerItem, fromGroup: number, toDropId: string) => {
    if (!vo) return;
    if (toDropId === `group-${fromGroup}`) return;

    const newGroups = { ...vo.groups };
    let newUnassigned = [...(vo.unassigned ?? [])];

    if (fromGroup >= 0) {
      newGroups[fromGroup] = (newGroups[fromGroup] ?? []).filter(p => p.id !== player.id);
    } else {
      newUnassigned = newUnassigned.filter(p => p.id !== player.id);
    }

    if (toDropId === 'unassigned') {
      newUnassigned = [...newUnassigned, player];
    } else {
      const toGroup = parseInt(toDropId.replace('group-', ''), 10);
      newGroups[toGroup] = [...(newGroups[toGroup] ?? []), player];
    }

    setVo({ ...vo, groups: newGroups, unassigned: newUnassigned });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActivePlayer(event.active.data.current as { player: PlayerItem; fromGroup: number });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActivePlayer(null);
    const { active, over } = event;
    if (!over || !active.data.current) return;
    const { player, fromGroup } = active.data.current as { player: PlayerItem; fromGroup: number };
    movePlayer(player, fromGroup, String(over.id));
  };

  const handleStartEditName = (gIdx: number) => {
    setEditingGroupIdx(gIdx);
    setEditingName(vo?.teamNames?.[gIdx] ?? '');
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  const handleCancelEditName = () => {
    setEditingGroupIdx(null);
    setEditingName('');
  };

  const handleConfirmEditName = async (gIdx: number) => {
    try {
      await matchApi.updateTeamName(id!, gIdx, editingName);
      setVo(prev => prev ? {
        ...prev,
        teamNames: { ...(prev.teamNames ?? {}), [gIdx]: editingName },
      } : prev);
      Toast.show({ icon: 'success', content: '队伍名称已更新' });
    } catch {
      Toast.show({ icon: 'fail', content: '更新失败' });
    } finally {
      setEditingGroupIdx(null);
      setEditingName('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-[130px] text-gray-900 selection:bg-primary selection:text-black dark:bg-neutral-950 dark:text-white transition-colors duration-200">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-gray-200 bg-white/80 px-4 py-4 backdrop-blur-md dark:border-white/10 dark:bg-neutral-950/80 sm:px-6">
        <button
          onClick={() => navigate(-1)}
          className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 transition-all hover:border-gray-300 hover:bg-gray-100 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/20 dark:hover:bg-white/[0.04]"
        >
          <ChevronLeft
            size={20}
            className="text-gray-600 transition-transform group-hover:-translate-x-0.5 dark:text-neutral-400"
          />
        </button>
        <h1 className="text-sm font-black tracking-widest text-gray-900 dark:text-white">管理分组</h1>
        <div className="flex h-10 min-w-[40px] shrink-0 items-center justify-end">
          {canEdit && !isPublished && !isNotStarted ? (
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:text-neutral-300 dark:hover:bg-white/10"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              保存
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">

      {loading ? (
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : isNotStarted ? (
        <div className="flex flex-col items-center gap-8 py-16">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-white/[0.02]">
              <Users size={28} className="text-gray-400 dark:text-neutral-500" />
            </div>
            <p className="text-lg font-black text-gray-900 dark:text-white">尚未开始分配</p>
            <p className="text-sm font-medium text-gray-500 dark:text-neutral-400">
              共 {vo?.unassigned?.length ?? 0} 名球员，{numGroups} 支队伍
            </p>
          </div>
          <div className="w-full space-y-3">
            <button
              onClick={handleOpenAutoGroup}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-black tracking-widest text-black shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Wand2 size={18} />
              自动分配
            </button>
            <button
              onClick={handleStartManual}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-4 text-sm font-black tracking-widest text-gray-900 transition-colors hover:bg-gray-50 active:scale-[0.98] dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:hover:bg-white/[0.06]"
            >
              手动分配（拖曳）
            </button>
          </div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-4">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-neutral-500 uppercase tracking-widest">
                  {isPublished ? '分组已发布' : '草稿模式（仅你可见）'}
                </p>
                {!allAssigned && (
                  <p className="text-xs text-amber-400 mt-0.5">
                    {vo?.unassigned?.length ?? 0} 名球员未分配
                  </p>
                )}
              </div>
              <button
                onClick={handleOpenAutoGroup}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-neutral-300 dark:hover:bg-white/[0.06]"
              >
                <Wand2 size={14} />
                自动分配
              </button>
            </div>

            {groupKeys.map(gIdx => (
              <DroppableGroup key={gIdx} groupIdx={gIdx}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${GROUP_DOT[gIdx % GROUP_DOT.length]}`} />
                    {editingGroupIdx === gIdx ? (
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <input
                          ref={nameInputRef}
                          value={editingName}
                          onChange={e => setEditingName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleConfirmEditName(gIdx);
                            if (e.key === 'Escape') handleCancelEditName();
                          }}
                          placeholder={`Team ${GROUP_LABELS[gIdx] ?? gIdx + 1}`}
                          className="bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg px-2 py-1 text-sm font-bold text-gray-900 dark:text-white w-full min-w-0 outline-none focus:border-primary"
                          maxLength={20}
                        />
                        <button
                          onClick={() => handleConfirmEditName(gIdx)}
                          className="p-1 rounded-lg bg-primary/20 text-primary flex-shrink-0"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={handleCancelEditName}
                          className="p-1 rounded-lg bg-gray-200 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 flex-shrink-0"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-black uppercase tracking-wider text-sm truncate">
                          {getTeamLabel(gIdx)}
                        </span>
                        {canEdit && !isPublished && (
                          <button
                            onClick={() => handleStartEditName(gIdx)}
                            className="p-1 rounded-md text-gray-400 dark:text-neutral-600 hover:text-gray-600 dark:hover:text-neutral-400 flex-shrink-0"
                          >
                            <Pencil size={12} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="shrink-0 ml-2 rounded-full border border-gray-200 bg-white/50 px-2 py-0.5 text-[10px] font-bold text-gray-500 dark:border-white/10 dark:bg-black/20 dark:text-neutral-400">
                    {vo?.groups[gIdx]?.length ?? 0} 人
                  </span>
                </div>
                <div className="space-y-1 min-h-[40px]">
                  {(vo?.groups[gIdx] ?? []).map(player => (
                    <DraggablePlayerCard
                      key={player.id}
                      player={player}
                      fromGroup={gIdx}
                      canDrag={canEdit && !isPublished}
                    />
                  ))}
                  {(vo?.groups[gIdx]?.length ?? 0) === 0 && (
                    <p className="text-xs text-gray-300 dark:text-neutral-700 text-center py-3">拖入球员到此处</p>
                  )}
                </div>
              </DroppableGroup>
            ))}

            {((vo?.unassigned?.length ?? 0) > 0 || canEdit) && (
              <DroppableUnassigned>
                <div className="flex items-center gap-2 mb-3">
                  <UserRoundX size={14} className="text-amber-400" />
                  <span className="font-black text-amber-400 text-sm uppercase tracking-wider">
                    未分配 {vo?.unassigned?.length ? `(${vo?.unassigned?.length})` : ''}
                  </span>
                </div>
                <div className="space-y-1 min-h-[40px]">
                  {(vo?.unassigned ?? []).map(player => (
                    <DraggablePlayerCard
                      key={player.id}
                      player={player}
                      fromGroup={-1}
                      canDrag={canEdit && !isPublished}
                    />
                  ))}
                  {(vo?.unassigned?.length ?? 0) === 0 && (
                    <p className="text-xs text-gray-300 dark:text-neutral-700 text-center py-3">所有球员已分配</p>
                  )}
                </div>
              </DroppableUnassigned>
            )}
          </div>

          <DragOverlay dropAnimation={null}>
            {activePlayer ? (
              <DraggablePlayerCard
                player={activePlayer?.player!}
                fromGroup={activePlayer?.fromGroup ?? -1}
                canDrag={false}
                overlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      </main>

      {!isNotStarted && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/80 px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/80 sm:px-6">
          <div className="mx-auto flex max-w-3xl flex-col gap-3">
            {canEdit && !isPublished && (
              <button
                disabled={!allAssigned}
                onClick={handlePublish}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-4 text-sm font-black tracking-widest text-gray-900 shadow-sm transition-all hover:bg-gray-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:hover:bg-white/[0.06]"
              >
                <Globe size={18} />
                发布分组（所有人可见）
              </button>
            )}
          </div>
        </div>
      )}

      {autoGroupVisible && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:items-center sm:justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => !autoGroupLoading && setAutoGroupVisible(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-full max-w-md transform overflow-hidden rounded-t-[2rem] bg-white px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 shadow-2xl transition-all dark:bg-[#111111] dark:ring-1 dark:ring-white/10 sm:rounded-[2rem] sm:p-8 sm:pb-8">
            <div className="mx-auto mb-6 h-1 w-12 rounded-full bg-gray-200 dark:bg-neutral-800 sm:hidden" />

            <div className="space-y-6">
              <div>
                <p className="font-black text-lg text-gray-900 dark:text-white">自动分配</p>
                <p className="mt-1 text-xs font-medium text-gray-500 dark:text-neutral-500">选择分配策略并确认执行方式</p>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black tracking-widest text-gray-400 dark:text-neutral-500 uppercase">分配策略</p>
                <div className="space-y-2">
                  {strategies.map(s => (
                    <button
                      key={s}
                      onClick={() => setSelectedStrategy(s)}
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-sm transition-all ${
                        selectedStrategy === s
                          ? 'border-primary bg-primary/10 text-primary dark:bg-primary/[0.08]'
                          : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-white/10 dark:bg-white/[0.03] dark:text-neutral-300 dark:hover:bg-white/[0.06]'
                      }`}
                    >
                      <span className="font-bold">{STRATEGY_LABELS[s] ?? s}</span>
                      {selectedStrategy === s && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-black text-black">
                          ✓
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {hasAnyGrouped && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black tracking-widest text-gray-400 dark:text-neutral-500 uppercase">处理方式</p>
                  <div className="space-y-2">
                    {[
                      { value: false, title: '重新开始', desc: '清空全部分配，对所有球员重新分组' },
                      { value: true, title: '保留已分配', desc: '仅对未分配的球员自动分组' },
                    ].map(opt => (
                      <button
                        key={String(opt.value)}
                        onClick={() => setKeepExisting(opt.value)}
                        className={`group flex w-full items-start gap-4 rounded-2xl border px-4 py-3.5 text-left text-sm transition-all hover:bg-gray-50 dark:hover:bg-white/[0.02] ${
                          keepExisting === opt.value
                            ? 'border-primary bg-primary/10 dark:bg-primary/[0.08]'
                            : 'border-gray-200 bg-white dark:border-white/10 dark:bg-transparent'
                        }`}
                      >
                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors relative">
                          <div className={`absolute h-5 w-5 rounded-full border-2 transition-all ${keepExisting === opt.value ? 'border-primary' : 'border-gray-300 dark:border-neutral-600'}`} />
                          <div className={`h-3 w-3 rounded-full transition-all ${keepExisting === opt.value ? 'scale-100 bg-primary' : 'scale-0'}`} />
                        </div>
                        <div>
                          <p className={`font-bold transition-colors ${keepExisting === opt.value ? 'text-primary' : 'text-gray-900 dark:text-white group-hover:text-primary/80'}`}>
                            {opt.title}
                          </p>
                          <p className="mt-1 text-xs font-medium text-gray-500 dark:text-neutral-500">{opt.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  disabled={autoGroupLoading}
                  onClick={() => setAutoGroupVisible(false)}
                  className="w-1/3 rounded-2xl border border-gray-200 bg-white py-3.5 text-sm font-black text-gray-900 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:hover:bg-white/[0.06]"
                >
                  取消
                </button>
                <button
                  disabled={autoGroupLoading}
                  onClick={handleConfirmAutoGroup}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-black text-black shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                >
                  {autoGroupLoading && <Loader2 size={16} className="animate-spin" />}
                  确认分配
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <DialogComponent />
    </div>
  );
};

export default MatchGrouping;
