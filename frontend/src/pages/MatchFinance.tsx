import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { NavBar, List, Switch, Toast, Tag, Skeleton, Space } from 'antd-mobile';
import { User } from 'lucide-react';
import apiClient from '../api/client';
import useAuthStore from '../store/useAuthStore';

const MatchFinance: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, fetched } = useAuthStore();

  useEffect(() => {
    if (fetched && !isAdmin()) {
      Toast.show({ icon: 'fail', content: '权限不足' });
      navigate(`/matches/${id}`, { replace: true });
    }
  }, [fetched, isAdmin, navigate, id]);

  const [registrations, setRegistrations] = useState<any[]>([]);
  const [players, setPlayers] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // 1. 获取所有需计费的报名信息
      const regs: any = await apiClient.get(`/api/match/${id}/registrations`);
      setRegistrations(regs);

      // 2. 批量或按需获取对应的球员详情
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

  const togglePayment = async (playerId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'PAID' ? 'UNPAID' : 'PAID';
    try {
      await apiClient.post(`/api/match/${id}/payment`, null, {
        params: { playerId, status: nextStatus }
      });
      setRegistrations(prev => prev.map(reg => 
        reg.playerId === playerId ? { ...reg, paymentStatus: nextStatus } : reg
      ));
      Toast.show({
        icon: nextStatus === 'PAID' ? 'success' : 'fail',
        content: nextStatus === 'PAID' ? '已标记为已支付' : '已标记为未支付',
      });
    } catch (err) {}
  };

  const getPlayerDisplay = (playerId: number) => {
    const p = players[playerId];
    if (!p) return <span className="text-neutral-600 italic">加载中...</span>;
    return (
      <div className="flex flex-col">
        <span className="font-bold text-white text-base">{p.nickname}</span>
        {p.clubName && (
          <span className="text-[10px] text-primary font-black uppercase tracking-widest mt-0.5">
            {p.clubName}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <NavBar onBack={() => navigate(-1)} className="bg-neutral-900 border-b border-neutral-800 font-bold">
        费用确认统计
      </NavBar>

      <div className="p-4">
        {loading ? (
          <Space direction='vertical' block className="mt-4">
            <Skeleton.Title animated />
            <Skeleton.Paragraph lineCount={8} animated />
          </Space>
        ) : (
          <div className="bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-800">
            <List header={<span className="text-neutral-500 font-bold px-2">待支付列表 ({registrations.filter(r => r.paymentStatus !== 'PAID').length})</span>}>
              {registrations.map(reg => (
                <List.Item
                  key={reg.id}
                  prefix={<div className="bg-neutral-800 p-2 rounded-full"><User className="text-primary" size={18} /></div>}
                  extra={
                    <Switch
                      checked={reg.paymentStatus === 'PAID'}
                      onChange={() => togglePayment(reg.playerId, reg.paymentStatus)}
                      style={{ '--checked-color': '#1DB954' }}
                    />
                  }
                  description={
                    <div className="flex space-x-2 mt-1">
                      <Tag color={reg.status === 'NO_SHOW' ? 'danger' : 'success'} fill="outline" className="text-[10px] scale-90 origin-left">
                        {reg.status === 'NO_SHOW' ? '补缴(缺席)' : '正常出勤'}
                      </Tag>
                    </div>
                  }
                >
                  <div className={reg.paymentStatus === 'PAID' ? 'opacity-40 grayscale pointer-events-none' : ''}>
                    {getPlayerDisplay(reg.playerId)}
                  </div>
                </List.Item>
              ))}
            </List>
          </div>
        )}

        {!loading && (
          <div className="mt-6 p-6 bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-800 rounded-3xl shadow-2xl">
            <div className="text-[10px] text-primary font-black mb-2 uppercase tracking-widest">Financial Summary</div>
            <div className="flex justify-between items-end">
              <div>
                <div className="text-3xl font-black text-white tracking-tighter">
                  {registrations.filter(r => r.paymentStatus === 'PAID').length} / {registrations.length}
                </div>
                <div className="text-xs text-neutral-500 mt-1 font-medium">已完成缴费确认</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-primary">
                  {Math.round((registrations.filter(r => r.paymentStatus === 'PAID').length / (registrations.length || 1)) * 100)}%
                </div>
                <div className="text-[10px] text-neutral-600 uppercase font-bold">Progress</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchFinance;
