import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { NavBar, List, Switch, Toast, Tag, Skeleton, Space } from 'antd-mobile';
import { CheckCircle, Circle, User } from 'lucide-react';
import apiClient from '../api/client';

const MatchFinance: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [players, setPlayers] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // 1. 获取所有需计费的报名信息
      const regs: any = await apiClient.get(`/api/match/${id}/registrations`);
      setRegistrations(regs);

      // 2. 获取对应的球员详情（用于显示昵称）
      // 这里可以优化为批量查询接口，暂时循环获取或假设前端已有缓存
      const playerMap: Record<number, any> = {};
      for (const reg of regs) {
        if (!playerMap[reg.playerId]) {
          const p: any = await apiClient.get(`/api/player/${reg.playerId}`);
          playerMap[reg.playerId] = p;
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

  const getPlayerName = (playerId: number) => {
    return players[playerId]?.nickname || `球员ID:${playerId}`;
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <NavBar onBack={() => navigate(-1)} className="bg-neutral-900 border-b border-neutral-800 font-bold">
        费用确认统计
      </NavBar>

      <div className="p-4">
        {loading ? (
          <Space direction='vertical' block>
            <Skeleton.Title animated />
            <Skeleton.Paragraph lineCount={5} animated />
          </Space>
        ) : (
          <div className="bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-800">
            <List header={<span className="text-neutral-500 font-bold">待支付列表 ({registrations.filter(r => r.paymentStatus !== 'PAID').length})</span>}>
              {registrations.map(reg => (
                <List.Item
                  key={reg.id}
                  prefix={<User className="text-neutral-600" size={20} />}
                  extra={
                    <Switch
                      checked={reg.paymentStatus === 'PAID'}
                      onChange={() => togglePayment(reg.playerId, reg.paymentStatus)}
                      style={{ '--checked-color': '#1DB954' }}
                    />
                  }
                  description={
                    <div className="flex space-x-2 mt-1">
                      <Tag color={reg.status === 'NO_SHOW' ? 'danger' : 'success'} fill="outline" size="mini">
                        {reg.status === 'NO_SHOW' ? '补缴(缺席)' : '正常出勤'}
                      </Tag>
                    </div>
                  }
                >
                  <span className={reg.paymentStatus === 'PAID' ? 'text-neutral-500 line-through' : 'text-white font-medium'}>
                    {getPlayerName(reg.playerId)}
                  </span>
                </List.Item>
              ))}
            </List>
          </div>
        )}

        <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-2xl">
          <div className="text-xs text-primary font-bold mb-1 uppercase">Summary</div>
          <div className="flex justify-between items-end">
            <div className="text-2xl font-black text-white">
              {registrations.filter(r => r.paymentStatus === 'PAID').length} / {registrations.length}
            </div>
            <div className="text-sm text-neutral-400">已缴费人数</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchFinance;
