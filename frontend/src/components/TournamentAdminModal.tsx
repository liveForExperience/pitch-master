import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Popup, Toast } from 'antd-mobile';
import { X, ShieldCheck, Trash2, Search, UserPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { tournamentApi, type AdminUser } from '../api/tournament';
import { adminApi, type PageResult } from '../api/admin';

interface Props {
  tournamentId: number | null;
  tournamentName: string;
  onClose: () => void;
}

const PAGE_SIZE = 10;

function UserLabel({ user }: { user: AdminUser }) {
  const primary = user.playerNickname || user.username;
  const secondary = [user.playerNickname ? user.username : null, user.realName]
    .filter(Boolean).join(' · ');
  return (
    <div>
      <div className="text-sm font-bold">{primary}</div>
      {secondary && <div className="text-[11px] text-gray-400 dark:text-neutral-600">{secondary}</div>}
    </div>
  );
}

const TournamentAdminModal: React.FC<Props> = ({ tournamentId, tournamentName, onClose }) => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [userPage, setUserPage] = useState<PageResult<AdminUser> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searching, setSearching] = useState(false);
  const [actionUserId, setActionUserId] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadAdmins = useCallback(async () => {
    if (!tournamentId) return;
    setLoadingAdmins(true);
    try {
      const list = await tournamentApi.getAdmins(tournamentId);
      setAdmins(list);
    } catch {
    } finally {
      setLoadingAdmins(false);
    }
  }, [tournamentId]);

  const fetchUsers = useCallback(async (q: string, page: number) => {
    setSearching(true);
    try {
      const result = await adminApi.searchUsers(q, page, PAGE_SIZE);
      setUserPage(result);
      setCurrentPage(page);
    } catch {
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (tournamentId) {
      loadAdmins();
      setSearchQuery('');
      setCurrentPage(1);
      fetchUsers('', 1);
    }
  }, [tournamentId]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchUsers(val, 1), 300);
  };

  const handleAdd = async (user: AdminUser) => {
    if (!tournamentId) return;
    setActionUserId(user.id);
    try {
      await tournamentApi.addAdmin(tournamentId, user.id);
      Toast.show({ icon: 'success', content: `已任命 ${user.playerNickname || user.username} 为管理员` });
      await loadAdmins();
    } catch {
    } finally {
      setActionUserId(null);
    }
  };

  const handleRemove = async (user: AdminUser) => {
    if (!tournamentId) return;
    setActionUserId(user.id);
    try {
      await tournamentApi.removeAdmin(tournamentId, user.id);
      Toast.show({ icon: 'success', content: `已移除 ${user.playerNickname || user.username} 的管理员权限` });
      await loadAdmins();
    } catch {
    } finally {
      setActionUserId(null);
    }
  };

  const adminIds = new Set(admins.map(a => a.id));
  const totalPages = userPage ? Math.ceil(userPage.total / PAGE_SIZE) : 0;

  return (
    <Popup
      visible={!!tournamentId}
      onMaskClick={onClose}
      position="bottom"
      bodyStyle={{ borderRadius: '20px 20px 0 0', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      <div className="flex flex-col h-full max-h-[85vh] bg-white dark:bg-neutral-950 text-gray-900 dark:text-white">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-neutral-800 shrink-0">
          <div>
            <div className="text-[9px] font-black tracking-[0.25em] text-primary uppercase mb-0.5">Tournament Admin</div>
            <h3 className="text-base font-black truncate max-w-[240px]">{tournamentName}</h3>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-100 dark:bg-neutral-900 text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

          {/* Current admins */}
          <section>
            <div className="text-[10px] font-black tracking-[0.2em] text-gray-400 dark:text-neutral-600 uppercase mb-3">
              当前管理员 ({admins.length})
            </div>
            {loadingAdmins ? (
              <div className="text-sm text-gray-400 dark:text-neutral-600 py-2">加载中…</div>
            ) : admins.length === 0 ? (
              <div className="text-sm text-gray-400 dark:text-neutral-600 italic py-2">暂无管理员</div>
            ) : (
              <div className="space-y-2">
                {admins.map(admin => (
                  <div key={admin.id} className="flex items-center justify-between rounded-2xl border border-gray-100 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                        <ShieldCheck size={14} className="text-primary" />
                      </div>
                      <UserLabel user={admin} />
                    </div>
                    <button onClick={() => handleRemove(admin)} disabled={actionUserId === admin.id}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-40" title="移除管理员">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Search & add */}
          <section>
            <div className="text-[10px] font-black tracking-[0.2em] text-gray-400 dark:text-neutral-600 uppercase mb-3">
              添加管理员
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 px-4 py-3 mb-3 focus-within:border-primary/40">
              <Search size={14} className="text-gray-400 dark:text-neutral-600 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="搜索球场名 / 用户名 / 真实姓名…"
                className="flex-1 bg-transparent text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-neutral-600 outline-none"
              />
              {searching && <span className="text-[10px] text-gray-400 dark:text-neutral-600 shrink-0">搜索中…</span>}
            </div>

            {/* User list */}
            {userPage && userPage.list.length > 0 && (
              <div className="space-y-2">
                {userPage.list.map(user => {
                  const isAlreadyAdmin = adminIds.has(user.id);
                  return (
                    <div key={user.id} className="flex items-center justify-between rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-3">
                      <UserLabel user={user} />
                      {isAlreadyAdmin ? (
                        <span className="text-[10px] font-black tracking-wide text-primary/60 uppercase shrink-0">已是管理员</span>
                      ) : (
                        <button onClick={() => handleAdd(user)} disabled={actionUserId === user.id}
                          className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-[11px] font-black text-primary hover:bg-primary/20 transition-colors disabled:opacity-40 shrink-0">
                          <UserPlus size={12} />
                          任命
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {userPage && userPage.list.length === 0 && !searching && (
              <div className="text-sm text-gray-400 dark:text-neutral-600 italic py-2">未找到匹配用户</div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-3">
                <button onClick={() => fetchUsers(searchQuery, currentPage - 1)} disabled={currentPage <= 1 || searching}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 dark:border-neutral-800 text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 transition-colors">
                  <ChevronLeft size={14} />
                </button>
                <span className="text-[11px] font-bold text-gray-400 dark:text-neutral-600">
                  {currentPage} / {totalPages}
                  <span className="ml-2 text-gray-300 dark:text-neutral-700">({userPage?.total} 人)</span>
                </span>
                <button onClick={() => fetchUsers(searchQuery, currentPage + 1)} disabled={currentPage >= totalPages || searching}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 dark:border-neutral-800 text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 transition-colors">
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </Popup>
  );
};

export default TournamentAdminModal;
