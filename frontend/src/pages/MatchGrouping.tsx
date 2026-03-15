import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { NavBar, List, Button, Tag, Toast, Card } from 'antd-mobile';
import { ArrowRightLeft, CheckCircle2 } from 'lucide-react';
import apiClient from '../api/client';
import useAuthStore from '../store/useAuthStore';

const MatchGrouping: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, fetched } = useAuthStore();

  useEffect(() => {
    if (fetched && !isAdmin()) {
      Toast.show({ icon: 'fail', content: '权限不足' });
      navigate(`/matches/${id}`, { replace: true });
    }
  }, [fetched, isAdmin, navigate, id]);

  const [allocation, setAllocation] = useState<Record<number, any[]>>({});

  const fetchAllocation = async () => {
    try {
      // 触发后端生成初步分组 (Draft)
      const data: any = await apiClient.post(`/api/match/${id}/group`);
      // 后端目前返回的是 Map<Integer, List<Long>>，即 { "0": [1,2], "1": [3,4] }
      // 我们需要将其转化为带球员详情的结构，或者在前端进行二次查询
      setAllocation(data);
    } catch (err) {}
  };

  useEffect(() => {
    fetchAllocation();
  }, [id]);

  // 处理球员组间移动逻辑
  const movePlayer = (fromGroup: number, toGroup: number, playerId: number) => {
    const newAllocation = { ...allocation };
    newAllocation[fromGroup] = newAllocation[fromGroup].filter(pid => pid !== playerId);
    newAllocation[toGroup] = [...newAllocation[toGroup], playerId];
    setAllocation(newAllocation);
  };

  const handleStartMatch = async () => {
    try {
      // 提交最终分组并正式开赛
      await apiClient.post(`/api/match/${id}/start-with-groups`, allocation);
      Toast.show({ icon: 'success', content: '分组成功，比赛已开始' });
      navigate(`/matches/${id}`);
    } catch (err) {}
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <NavBar onBack={() => navigate(-1)} className="bg-neutral-900 border-b border-neutral-800 font-bold">
        手动微调分组
      </NavBar>

      <div className="p-6 max-w-4xl mx-auto space-y-8">
        <header className="mb-10">
          <div className="text-primary font-black text-[10px] uppercase tracking-widest mb-2">Smart Allocation</div>
          <h2 className="text-3xl font-black">微调对阵阵容</h2>
          <p className="text-neutral-500 text-sm mt-2">基于能力值自动生成的建议，您可以点击球员进行组间调整。</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(allocation).map(([groupIndex, playerIds]) => (
            <Card
              key={groupIndex}
              title={
                <div className="flex justify-between items-center py-2">
                  <span className="text-lg font-black uppercase italic tracking-tighter">Team {parseInt(groupIndex) + 1}</span>
                  <Tag color="primary" fill="outline" className="rounded-full px-3">{playerIds.length} 人</Tag>
                </div>
              }
              className="bg-neutral-900 border border-neutral-800 rounded-[2rem] overflow-hidden"
            >
              <List className="bg-transparent">
                {playerIds.map(playerId => (
                  <List.Item
                    key={playerId}
                    prefix={<div className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center text-xs font-bold text-neutral-500">{playerId}</div>}
                    description={<span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Player Profile</span>}
                    extra={
                      <Button 
                        size="mini" 
                        fill="none" 
                        onClick={() => movePlayer(parseInt(groupIndex), (parseInt(groupIndex) + 1) % Object.keys(allocation).length, playerId)}
                        className="text-primary hover:bg-primary/10 rounded-lg p-2"
                      >
                        <ArrowRightLeft size={16} />
                      </Button>
                    }
                  >
                    <span className="font-bold text-white">球员 #{playerId}</span>
                  </List.Item>
                ))}
              </List>
            </Card>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent backdrop-blur-sm">
          <Button
            block
            color="primary"
            size="large"
            onClick={handleStartMatch}
            className="h-14 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20"
          >
            确认阵容并正式开赛 <CheckCircle2 className="ml-2" size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MatchGrouping;
