import React, { useEffect, useState } from 'react';
import { Card, List, Tag, PullToRefresh, FloatingBubble, Toast } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import apiClient from '../api/client';
import dayjs from 'dayjs';

const MatchList: React.FC = () => {
  const [matches, setMatches] = useState<any[]>([]);
  const navigate = useNavigate();

  const fetchMatches = async () => {
    try {
      const data: any = await apiClient.get('/api/match/list'); 
      setMatches(data);
    } catch (err) {
      // 模拟数据用于初次展示验证
      setMatches([
        { id: 1, title: '老男孩周六虹口巅峰赛', startTime: new Date(), location: '虹口足球场', status: 'SCHEDULED' },
        { id: 2, title: '老男孩周中练习赛 (实时演示)', startTime: new Date(), location: '世纪公园', status: 'ONGOING' },
      ]);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const getStatusTag = (status: string) => {
    const map: any = {
      'SCHEDULED': <Tag color="primary">报名中</Tag>,
      'ONGOING': <Tag color="warning">进行中</Tag>,
      'FINISHED': <Tag color="default">已结束</Tag>,
    };
    return map[status] || <Tag>{status}</Tag>;
  };

  return (
    <div className="pb-20">
      <div className="p-4 flex justify-between items-center sticky top-0 bg-neutral-900 z-10">
        <h2 className="text-xl font-bold">赛事广场</h2>
      </div>

      <PullToRefresh onRefresh={fetchMatches}>
        <List className="px-4">
          {matches.map(match => (
            <Card
              key={match.id}
              title={
                <div className="flex justify-between items-center w-full">
                  <span className="font-bold text-white">{match.title}</span>
                  {getStatusTag(match.status)}
                </div>
              }
              className="mb-4 bg-neutral-800 border-none"
              onClick={() => navigate(`/matches/${match.id}`)}
            >
              <div className="text-neutral-400 text-sm space-y-1 mt-2">
                <p>时间: {dayjs(match.startTime).format('YYYY-MM-DD HH:mm')}</p>
                <p>地点: {match.location}</p>
              </div>
            </Card>
          ))}
        </List>
      </PullToRefresh>

      <FloatingBubble
        axis='xy'
        magnetic='x'
        style={{
          '--initial-position-bottom': '80px',
          '--initial-position-right': '24px',
        }}
        onClick={() => Toast.show('开发中: 发布赛事')}
      >
        <Plus size={24} />
      </FloatingBubble>
    </div>
  );
};

export default MatchList;
