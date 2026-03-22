import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { NavBar, Button, Tag, Toast, SpinLoading, Popup } from 'antd-mobile';
import { useConfirmDialog } from '../components/ConfirmDialog';
import { Wand2, Save, Globe, Play, UserRoundX, Users, Pencil, Check, X } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
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
      className={`w-full flex items-center justify-between px-3 py-2.5 bg-neutral-900/60 rounded-xl
        ${overlay ? 'shadow-2xl ring-1 ring-white/10 rotate-2' : 'active:bg-neutral-800'}
        ${isDragging ? '' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-neutral-400">
          {player.name.slice(0, 1)}
        </div>
        <span className="text-sm font-semibold text-white">{player.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-neutral-500">{player.rating?.toFixed(1)}</span>
        {canDrag && !overlay && (
          <span className="text-[10px] text-neutral-600 select-none">⠿</span>
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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, fetched } = useAuthStore();
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
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    if (fetched && !isAdmin()) {
      Toast.show({ icon: 'fail', content: '权限不足' });
      navigate(`/matches/${id}`, { replace: true });
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
  const canStart = matchStatus === 'REGISTRATION_CLOSED' && allAssigned;
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
      await matchApi.publishGroups(id!);
      await loadGroups();
      Toast.show({ icon: 'success', content: '分组已发布' });
    } catch {}
  };

  const handleStartMatch = async () => {
    const confirmed = await showConfirm({
      title: '正式开赛',
      content: '开赛后分组将无法修改，是否确认？',
      confirmText: '确认开赛',
    });
    if (!confirmed) return;
    try {
      const actualStartTime = new Date().toISOString();
      await matchApi.startMatch(id!, actualStartTime);
      Toast.show({ icon: 'success', content: '比赛已开始！' });
      navigate(`/matches/${id}`, { replace: true });
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
    <div className="min-h-screen bg-black text-white pb-32">
      <NavBar
        onBack={() => navigate(-1)}
        className="bg-neutral-900 border-b border-neutral-800 font-bold"
        right={
          canEdit && !isPublished && !isNotStarted ? (
            <Button
              size="mini"
              fill="none"
              loading={saving}
              onClick={handleSaveDraft}
              className="text-neutral-400 text-xs"
            >
              <Save size={15} className="mr-1 inline" />
              保存草稿
            </Button>
          ) : null
        }
      >
        管理分组
      </NavBar>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <SpinLoading color="primary" />
        </div>
      ) : isNotStarted ? (
        <div className="mx-auto max-w-3xl px-6 py-16 flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center">
              <Users size={28} className="text-neutral-400" />
            </div>
            <p className="text-lg font-black text-white">尚未开始分配</p>
            <p className="text-sm text-neutral-500">
              共 {vo?.unassigned?.length ?? 0} 名球员，{numGroups} 支队伍
            </p>
          </div>
          <div className="w-full space-y-3">
            <Button
              block
              color="primary"
              size="large"
              onClick={handleOpenAutoGroup}
              className="h-13 rounded-2xl font-bold text-sm"
            >
              <Wand2 size={16} className="mr-2 inline" />
              自动分配
            </Button>
            <Button
              block
              fill="outline"
              size="large"
              onClick={handleStartManual}
              className="h-13 rounded-2xl font-bold text-sm border-neutral-700 text-neutral-300"
            >
              手动分配（拖曳）
            </Button>
          </div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="mx-auto max-w-3xl px-6 py-6 sm:px-8 lg:px-10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-widest">
                  {isPublished ? '分组已发布' : '草稿模式（仅你可见）'}
                </p>
                {!allAssigned && (
                  <p className="text-xs text-amber-400 mt-0.5">
                    {vo?.unassigned?.length ?? 0} 名球员未分配
                  </p>
                )}
              </div>
              <Button
                size="small"
                fill="outline"
                onClick={handleOpenAutoGroup}
                className="border-neutral-700 text-neutral-300 rounded-xl text-xs"
              >
                <Wand2 size={13} className="mr-1 inline" />
                自动分配
              </Button>
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
                          className="bg-neutral-800 border border-neutral-600 rounded-lg px-2 py-1 text-sm font-bold text-white w-full min-w-0 outline-none focus:border-primary"
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
                          className="p-1 rounded-lg bg-neutral-800 text-neutral-400 flex-shrink-0"
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
                            className="p-1 rounded-md text-neutral-600 hover:text-neutral-400 flex-shrink-0"
                          >
                            <Pencil size={12} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <Tag
                    fill="outline"
                    className="text-xs rounded-full border-neutral-700 text-neutral-400 flex-shrink-0 ml-2"
                  >
                    {vo?.groups[gIdx]?.length ?? 0} 人
                  </Tag>
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
                    <p className="text-xs text-neutral-700 text-center py-3">拖入球员到此处</p>
                  )}
                </div>
              </DroppableGroup>
            ))}

            {((vo?.unassigned?.length ?? 0) > 0 || canEdit) && (
              <DroppableUnassigned>
                <div className="flex items-center gap-2 mb-3">
                  <UserRoundX size={14} className="text-amber-400" />
                  <span className="font-black text-amber-400 text-sm uppercase tracking-wider">
                    未分配 {vo?.unassigned?.length ? `(${vo.unassigned.length})` : ''}
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
                    <p className="text-xs text-neutral-700 text-center py-3">所有球员已分配</p>
                  )}
                </div>
              </DroppableUnassigned>
            )}
          </div>

          <DragOverlay dropAnimation={null}>
            {activePlayer ? (
              <DraggablePlayerCard
                player={activePlayer.player}
                fromGroup={activePlayer.fromGroup}
                canDrag={false}
                overlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {!isNotStarted && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/95 to-transparent space-y-2">
          {canEdit && !isPublished && (
            <Button
              block
              color="primary"
              size="large"
              disabled={!allAssigned}
              onClick={handlePublish}
              className="h-12 rounded-2xl font-black text-sm disabled:opacity-40"
            >
              <Globe size={16} className="mr-2 inline" />
              发布分组（所有人可见）
            </Button>
          )}
          {canStart && (
            <Button
              block
              size="large"
              onClick={handleStartMatch}
              className="h-12 rounded-2xl font-black text-sm bg-primary text-black border-0"
            >
              <Play size={16} className="mr-2 inline" />
              正式开赛
            </Button>
          )}
        </div>
      )}

      <Popup
        visible={autoGroupVisible}
        onMaskClick={() => !autoGroupLoading && setAutoGroupVisible(false)}
        bodyStyle={{
          backgroundColor: '#171717',
          borderRadius: '16px 16px 0 0',
          padding: '24px 20px 36px',
        }}
      >
        <div className="space-y-5">
          <div>
            <p className="font-black text-base text-white">自动分配</p>
            <p className="text-xs text-neutral-500 mt-0.5">选择分配策略并确认执行方式</p>
          </div>

          <div>
            <p className="text-xs text-neutral-400 mb-2 uppercase tracking-wide font-semibold">分配策略</p>
            <div className="space-y-2">
              {strategies.map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedStrategy(s)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-colors ${
                    selectedStrategy === s
                      ? 'border-green-500 bg-green-500/10 text-green-400'
                      : 'border-neutral-700 bg-neutral-800/60 text-neutral-300'
                  }`}
                >
                  <span className="font-medium">{STRATEGY_LABELS[s] ?? s}</span>
                  {selectedStrategy === s && (
                    <span className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-[9px] text-black font-bold">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {hasAnyGrouped && (
            <div>
              <p className="text-xs text-neutral-400 mb-2 uppercase tracking-wide font-semibold">处理方式</p>
              <div className="space-y-2">
                {[
                  { value: false, title: '重新开始', desc: '清空全部分配，对所有球员重新分组' },
                  { value: true, title: '保留已分配', desc: '仅对未分配的球员自动分组' },
                ].map(opt => (
                  <button
                    key={String(opt.value)}
                    onClick={() => setKeepExisting(opt.value)}
                    className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl border text-sm transition-colors text-left ${
                      keepExisting === opt.value
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-neutral-700 bg-neutral-800/60'
                    }`}
                  >
                    <span
                      className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${
                        keepExisting === opt.value ? 'border-green-500 bg-green-500' : 'border-neutral-500 bg-transparent'
                      }`}
                    />
                    <div>
                      <p className={`font-semibold ${keepExisting === opt.value ? 'text-green-400' : 'text-neutral-300'}`}>
                        {opt.title}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button
              fill="outline"
              size="large"
              disabled={autoGroupLoading}
              onClick={() => setAutoGroupVisible(false)}
              className="flex-1 rounded-2xl border-neutral-700 text-neutral-300"
            >
              取消
            </Button>
            <Button
              color="primary"
              size="large"
              loading={autoGroupLoading}
              onClick={handleConfirmAutoGroup}
              className="flex-1 rounded-2xl font-bold"
            >
              开始分配
            </Button>
          </div>
        </div>
      </Popup>

      {/* Confirm Dialog */}
      <DialogComponent />
    </div>
  );
};

export default MatchGrouping;
