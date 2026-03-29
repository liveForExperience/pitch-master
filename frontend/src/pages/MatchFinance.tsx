import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { NavBar, Switch, Toast, Tag, Skeleton, Space } from 'antd-mobile';
import { User, CheckCircle, Save, Calculator } from 'lucide-react';
import apiClient from '../api/client';
import { matchApi } from '../api/match';
import useAuthStore from '../store/useAuthStore';
import { useConfirmDialog } from '../components/ConfirmDialog';

interface LocalReg {
  id: number;
  playerId: number;
  paymentAmount: string | number;
  isExempt: boolean;
  paymentStatus: string;
  status: string;
}

const MatchFinance: React.FC = () => {
  const { id, tournamentId } = useParams<{ id: string; tournamentId: string }>();
  const navigate = useNavigate();
  const { isAdmin, isTournamentAdmin, fetched } = useAuthStore();
  const basePath = `/tournaments/${tournamentId}/matches`;
  const { show: showConfirm, DialogComponent } = useConfirmDialog();

  useEffect(() => {
    if (fetched && !isAdmin() && !(tournamentId && isTournamentAdmin(Number(tournamentId)))) {
      Toast.show({ icon: 'fail', content: '权限不足' });
      navigate(`${basePath}/${id}`, { replace: true });
    }
  }, [fetched, isAdmin, navigate, id]);

  const [match, setMatch] = useState<any>(null);
  const [registrations, setRegistrations] = useState<LocalReg[]>([]);
  const [players, setPlayers] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const [totalCost, setTotalCost] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const matchData: any = await apiClient.get(`/api/match/${id}`);
      setMatch(matchData);
      setTotalCost(matchData.totalCost ? matchData.totalCost.toString() : '');

      const regs: any = await apiClient.get(`/api/match/${id}/registrations`);
      setRegistrations(regs.map((r: any) => ({
        ...r,
        paymentAmount: r.paymentAmount ?? '',
        isExempt: r.isExempt ?? false,
      })));

      const playerMap: Record<number, any> = { ...players };
      for (const reg of regs) {
        if (!playerMap[reg.playerId]) {
          try {
            const p: any = await apiClient.get(`/api/player/${reg.playerId}`);
            playerMap[reg.playerId] = p;
          } catch (e) {
            playerMap[reg.playerId] = { nickname: `球员 #${reg.playerId}` };
          }
        }
      }
      setPlayers(playerMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const isPublished = match?.settlementPublished;

  const autoSplit = () => {
    const cost = parseFloat(totalCost);
    if (isNaN(cost) || cost <= 0) {
      Toast.show('请输入有效的总金额');
      return;
    }
    const eligibleRegs = registrations.filter(r => !r.isExempt);
    if (eligibleRegs.length === 0) {
      Toast.show('没有可参与分摊的人员');
      return;
    }

    const perPerson = Math.ceil(cost / eligibleRegs.length);

    setRegistrations(prev => prev.map((reg) => {
      if (reg.isExempt) {
        return { ...reg, paymentAmount: 0 };
      }
      // 不做精确到分的削减，按向上取整，以确保总额大于等于cost
      return { ...reg, paymentAmount: perPerson };
    }));
  };

  const currentTotalCalculated = useMemo(() => {
    return registrations.reduce((sum, r) => sum + (parseFloat(r.paymentAmount as string) || 0), 0);
  }, [registrations]);

  const handleRegUpdate = (playerId: number, field: keyof LocalReg, value: any) => {
    setRegistrations(prev => prev.map(r => {
      if (r.playerId === playerId) {
        const next = { ...r, [field]: value };
        if (field === 'isExempt' && value === true) {
          next.paymentAmount = 0;
        }
        return next;
      }
      return r;
    }));
  };

  const togglePayment = async (playerId: number, currentStatus: string) => {
    if (!isPublished) {
      Toast.show('请先发布结算信息再修改支付状态');
      return;
    }
    const nextStatus = currentStatus === 'PAID' ? 'UNPAID' : 'PAID';
    try {
      await apiClient.post(`/api/match/${id}/payment`, null, {
        params: { playerId, status: nextStatus }
      });
      setRegistrations(prev => prev.map(reg =>
        reg.playerId === playerId ? { ...reg, paymentStatus: nextStatus } : reg
      ));
    } catch (err) { }
  };

  const handleBatchPay = async () => {
    const confirmed = await showConfirm({
      title: '批量确认',
      content: '是否将所有未支付的人员(不含豁免)一键标记为已支付？'
    });
    if (!confirmed) return;

    try {
      await matchApi.batchUpdatePayment(id!);
      Toast.show({ icon: 'success', content: '批量更新成功' });
      fetchData();
    } catch (e) { }
  };

  const handleSaveAndPublish = async () => {
    if (!totalCost || isNaN(parseFloat(totalCost))) {
      Toast.show('请输入总费用');
      return;
    }

    const confirmed = await showConfirm({
      title: isPublished ? '更新结算' : '确认发布结算',
      content: isPublished
        ? '修改金额会使相关人员支付状态变回未支付，确定继续？'
        : '确定后，所有球员将看到自己的应付金额。'
    });
    if (!confirmed) return;

    setSaving(true);
    try {
      await matchApi.settlement(id!, {
        totalCost: parseFloat(totalCost),
        publish: true,
        registrations: registrations.map(r => ({
          playerId: r.playerId,
          paymentAmount: parseFloat(r.paymentAmount as string) || 0,
          isExempt: r.isExempt
        }))
      });
      Toast.show({ icon: 'success', content: '发布成功' });
      fetchData();
    } catch (e) { } finally {
      setSaving(false);
    }
  };

  const getPlayerDisplay = (playerId: number) => {
    const p = players[playerId];
    if (!p) return <span className="text-gray-400 dark:text-neutral-600 italic">加载中...</span>;
    return (
      <div className="flex flex-col">
        <span className="font-bold text-gray-900 dark:text-white text-sm">{p.nickname}</span>
        {p.clubName && (
          <span className="text-[10px] text-primary font-black uppercase tracking-widest mt-0.5">
            {p.clubName}
          </span>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 p-4">
        <Space direction='vertical' block>
          <Skeleton.Title animated />
          <Skeleton.Paragraph lineCount={8} animated />
        </Space>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 text-gray-900 dark:text-white pb-24">
      <NavBar onBack={() => navigate(-1)} className="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 font-bold sticky top-0 z-10">
        结算管理中心
      </NavBar>
      <DialogComponent />

      <div className="p-4 space-y-6">

        {/* Total Cost Card */}
        <div className="bg-white dark:bg-gradient-to-br dark:from-neutral-900 dark:to-neutral-800 border border-gray-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="text-xs font-black tracking-widest uppercase text-neutral-500">实际总费用</div>
            <div className={`px-2 py-1 rounded-md text-[10px] font-bold ${isPublished ? 'bg-primary/20 text-primary' : 'bg-amber-500/20 text-amber-500'}`}>
              {isPublished ? '已发布' : '未发布'}
            </div>
          </div>
          <div className="flex items-end gap-3 mb-4">
            <span className="text-2xl font-black text-neutral-400 mb-1">¥</span>
            <input
              type="number"
              value={totalCost}
              onChange={e => setTotalCost(e.target.value)}
              className="bg-transparent text-4xl font-black text-gray-900 dark:text-white w-full outline-none"
              placeholder="0.00"
            />
          </div>
          <div className="flex justify-between items-center text-xs">
            <div className="text-neutral-500">
              各人分摊之和: <span className={`font-bold ${currentTotalCalculated < parseFloat(totalCost || '0') ? 'text-amber-500' : 'text-primary'}`}>¥{currentTotalCalculated.toFixed(2)}</span>
            </div>
            <button
              onClick={autoSplit}
              className="flex items-center gap-1 text-primary bg-primary/10 px-3 py-1.5 rounded-full font-bold transition-colors hover:bg-primary/20"
            >
              <Calculator size={14} /> 一键均摊
            </button>
          </div>
        </div>

        {isPublished && (
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-gray-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-sm font-black dark:text-white mb-1">支付进度</div>
              <div className="text-2xl font-black text-primary">
                {registrations.filter(r => r.paymentStatus === 'PAID' || r.isExempt).length} / {registrations.length}
              </div>
            </div>
            <button
              onClick={handleBatchPay}
              className="flex items-center gap-1.5 bg-neutral-800 text-white dark:bg-white dark:text-black px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:opacity-90 active:scale-95 transition-all"
            >
              <CheckCircle size={16} /> 全部标为已付
            </button>
          </div>
        )}

        <div className="bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden border border-gray-200 dark:border-neutral-800 shadow-sm">
          <div className="px-4 py-3 bg-gray-50 dark:bg-neutral-900 border-b border-gray-100 dark:border-neutral-800 text-xs font-bold text-gray-500 dark:text-neutral-400">
            应付账单明细 ({registrations.length}人)
          </div>
          <div className="divide-y divide-gray-100 dark:divide-neutral-800">
            {registrations.map(reg => (
              <div key={reg.id} className="p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${reg.isExempt ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-primary/10'}`}>
                      <User size={18} className={reg.isExempt ? 'text-amber-500' : 'text-primary'} />
                    </div>
                    <div>
                      {getPlayerDisplay(reg.playerId)}
                      <div className="mt-1 flex gap-2">
                        <Tag color={reg.status === 'NO_SHOW' ? 'danger' : 'default'} fill="outline" className="text-[10px]">
                          {reg.status === 'NO_SHOW' ? '缺席' : '正常'}
                        </Tag>
                        {reg.isExempt && <Tag color="warning" fill="outline" className="text-[10px]">豁免</Tag>}
                      </div>
                    </div>
                  </div>

                  {isPublished && !reg.isExempt && (
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-bold text-neutral-500">已支付</span>
                      <Switch
                        checked={reg.paymentStatus === 'PAID'}
                        onChange={() => togglePayment(reg.playerId, reg.paymentStatus)}
                        style={{ '--checked-color': '#1DB954', '--width': '36px', '--height': '20px' }}
                      />
                    </div>
                  )}
                  {isPublished && reg.isExempt && (
                    <div className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md">
                      免责
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-1 bg-gray-50 dark:bg-neutral-800/50 p-2 rounded-xl border border-gray-100 dark:border-white/5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-neutral-400">
                    <input
                      type="checkbox"
                      checked={reg.isExempt}
                      onChange={e => handleRegUpdate(reg.playerId, 'isExempt', e.target.checked)}
                      className="accent-primary rounded-sm w-3.5 h-3.5"
                    /> 豁免
                  </label>
                  <div className="flex-1 flex justify-end items-center gap-2">
                    <span className="text-xs font-bold text-neutral-500">¥</span>
                    <input
                      type="number"
                      value={reg.paymentAmount}
                      onChange={e => handleRegUpdate(reg.playerId, 'paymentAmount', e.target.value)}
                      disabled={reg.isExempt}
                      className="w-20 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg px-2 py-1 text-right font-black text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-t border-gray-200 dark:border-neutral-800 z-20">
        <button
          onClick={handleSaveAndPublish}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-black py-3.5 rounded-2xl font-black text-sm tracking-widest uppercase transition-all shadow-lg shadow-primary/20 active:scale-[0.98] disabled:opacity-70"
        >
          {saving ? <span className="animate-spin border-2 border-black border-t-transparent rounded-full w-5 h-5" /> : <Save size={18} />}
          {isPublished ? '保存并更新发布' : '保存并确认发布'}
        </button>
      </div>
    </div>
  );
};

export default MatchFinance;
