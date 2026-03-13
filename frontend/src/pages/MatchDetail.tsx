import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { NavBar, Card, Button, Tag, Toast, Space, Stepper } from 'antd-mobile';
import { Edit, Save, X, Trophy, Clock } from 'lucide-react';
import apiClient from '../api/client';
import dayjs from 'dayjs';

const MatchDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<any>(null);
  const [games, setGames] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingGameId, setEditingGameId] = useState<number | null>(null);
  const [tempScores, setTempScores] = useState({ scoreA: 0, scoreB: 0 });

  const fetchData = async () => {
    try {
      // 1. 获取赛事详情
      const matchData: any = await apiClient.get(`/api/match/${id}`);
      setMatch(matchData);
      
      // 2. 获取该赛事下的场次列表
      const gamesData: any = await apiClient.get(`/api/game/list?matchId=${id}`);
      setGames(gamesData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // 尝试加锁并进入编辑模式
  const handleStartEdit = async (game: any) => {
    try {
      await apiClient.post(`/api/game/${game.id}/lock`);
      setEditingGameId(game.id);
      setTempScores({ scoreA: game.scoreA, scoreB: game.scoreB });
      setIsEditing(true);
      Toast.show('已锁定该场次，您可以开始录入比分');
    } catch (err) {
      // 锁定失败
    }
  };

  // 保存比分并释放锁
  const handleSaveScore = async () => {
    if (!editingGameId) return;
    try {
      await apiClient.post(`/api/game/${editingGameId}/score`, null, {
        params: { scoreA: tempScores.scoreA, scoreB: tempScores.scoreB }
      });
      Toast.show({ icon: 'success', content: '比分已保存' });
      setIsEditing(false);
      setEditingGameId(null);
      fetchData();
    } catch (err) {}
  };

  // 取消编辑并手动释放锁
  const handleCancelEdit = async () => {
    if (!editingGameId) return;
    try {
      await apiClient.post(`/api/game/${editingGameId}/unlock`);
      setIsEditing(false);
      setEditingGameId(null);
    } catch (err) {}
  };

  if (!match) return <div className="p-10 text-center text-neutral-500">加载中...</div>;

  return (
    <div className="pb-10">
      <NavBar onBack={() => navigate(-1)} className="sticky top-0 bg-neutral-900 border-b border-neutral-800">
        赛事详情
      </NavBar>

      {/* 赛事基础信息卡片 */}
      <div className="p-4">
        <div className="bg-gradient-to-br from-primary to-green-700 rounded-3xl p-6 shadow-lg mb-6">
          <h1 className="text-2xl font-bold mb-2">{match.title}</h1>
          <div className="flex items-center text-green-100 text-sm space-x-4">
            <span className="flex items-center"><Clock size={14} className="mr-1" /> {dayjs(match.startTime).format('MM-DD HH:mm')}</span>
            <span>📍 {match.location}</span>
          </div>
          <div className="mt-4 flex justify-between items-end">
            <div className="bg-black/20 px-3 py-1 rounded-full text-xs text-white">
              人均: ¥{match.perPersonCost || '--'}
            </div>
            <Button size="mini" color="primary" fill="solid" className="bg-white text-green-700 rounded-full font-bold">
              一键报名
            </Button>
          </div>
        </div>

        <h3 className="text-lg font-bold mb-4 flex items-center">
          <Trophy size={18} className="mr-2 text-yellow-500" /> 对阵实况
        </h3>

        {/* 场次列表 */}
        {games.map((game) => (
          <Card key={game.id} className="mb-4 bg-neutral-800 border-none rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <div className="text-center flex-1">
                <div className="w-12 h-12 bg-neutral-700 rounded-full mx-auto mb-2 flex items-center justify-center font-bold text-xl">A</div>
                <div className="text-xs text-neutral-400">队 {game.teamAIndex + 1}</div>
              </div>

              <div className="flex flex-col items-center px-4">
                {isEditing && editingGameId === game.id ? (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="flex items-center space-x-2">
                      <Stepper value={tempScores.scoreA} onChange={v => setTempScores(s => ({...s, scoreA: v}))} />
                      <span className="text-2xl font-black">:</span>
                      <Stepper value={tempScores.scoreB} onChange={v => setTempScores(s => ({...s, scoreB: v}))} />
                    </div>
                    <Space>
                      <Button color="primary" size="mini" onClick={handleSaveScore} className="flex items-center">
                        <Save size={14} className="mr-1" /> 保存
                      </Button>
                      <Button size="mini" onClick={handleCancelEdit} className="flex items-center">
                        <X size={14} className="mr-1" /> 取消
                      </Button>
                    </Space>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-4xl font-black mb-1">{game.scoreA} : {game.scoreB}</div>
                    {game.status === 'PLAYING' && <Tag color="success" fill="outline">进行中</Tag>}
                    {game.status === 'FINISHED' && <Tag color="default">已结束</Tag>}
                    <Button 
                      size="mini" 
                      fill="none" 
                      className="mt-2 text-primary flex items-center"
                      onClick={() => handleStartEdit(game)}
                      disabled={isEditing}
                    >
                      <Edit size={14} className="mr-1" /> 修改比分
                    </Button>
                  </div>
                )}
              </div>

              <div className="text-center flex-1">
                <div className="w-12 h-12 bg-neutral-700 rounded-full mx-auto mb-2 flex items-center justify-center font-bold text-xl">B</div>
                <div className="text-xs text-neutral-400">队 {game.teamBIndex + 1}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MatchDetail;
