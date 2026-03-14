import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { NavBar, Button, Tag, Toast, Space, Divider, Steps } from 'antd-mobile';
import { Edit, X, Clock, History, User, CircleDollarSign } from 'lucide-react';
import apiClient from '../api/client';
import dayjs from 'dayjs';
import MatchPoster from '../components/MatchPoster';

const { Step } = Steps;

const MatchDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<any>(null);
  const [games, setGames] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingGameId, setEditingGameId] = useState<number | null>(null);
  const [tempScores, setTempScores] = useState({ scoreA: 0, scoreB: 0 });
  const [logs, setLogs] = useState<any[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  
  const sseRef = useRef<EventSource | null>(null);

  const fetchData = async () => {
    try {
      const matchData: any = await apiClient.get(`/api/match/${id}`);
      setMatch(matchData);
      const gamesData: any = await apiClient.get(`/api/game/list?matchId=${id}`);
      setGames(gamesData);
    } catch (err) {}
  };

  const fetchLogs = async (gameId: number) => {
    try {
      const logData: any = await apiClient.get(`/api/game/${gameId}/logs`);
      setLogs(logData);
      setShowLogs(true);
    } catch (err) {}
  };

  useEffect(() => {
    fetchData();

    // 建立 SSE 实时连接
    sseRef.current = new EventSource(`/api/realtime/subscribe/${id}`);
    sseRef.current.onmessage = (event) => {
      const updatedGame = JSON.parse(event.data);
      setGames(prev => prev.map(g => g.id === updatedGame.id ? updatedGame : g));
      Toast.show({ content: '比分已实时更新', duration: 1000 });
    };

    return () => {
      sseRef.current?.close();
    };
  }, [id]);

  const handleStartEdit = async (game: any) => {
    try {
      await apiClient.post(`/api/game/${game.id}/lock`);
      setEditingGameId(game.id);
      setTempScores({ scoreA: game.scoreA, scoreB: game.scoreB });
      setIsEditing(true);
    } catch (err) {}
  };

  const handleSaveScore = async () => {
    if (!editingGameId) return;
    try {
      await apiClient.post(`/api/game/${editingGameId}/score`, null, {
        params: { scoreA: tempScores.scoreA, scoreB: tempScores.scoreB }
      });
      Toast.show({ icon: 'success', content: '更新成功' });
      setIsEditing(false);
      setEditingGameId(null);
      fetchData();
    } catch (err) {}
  };

  if (!match) return null;

  return (
    <div className="pb-10 bg-neutral-950 min-h-screen text-white">
      <NavBar onBack={() => navigate(-1)} className="bg-neutral-900 border-b border-neutral-800">
        赛事详情
      </NavBar>

      <div className="p-4">
        {/* 核心赛事卡片 */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 mb-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-xl font-bold">{match.title}</h1>
            <Tag color="primary" fill="outline" className="rounded-full">
              {match.status === 'ONGOING' ? '进行中' : '报名中'}
            </Tag>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs text-neutral-400 mb-4">
            <div className="flex items-center"><Clock size={12} className="mr-1"/> {dayjs(match.startTime).format('YYYY-MM-DD HH:mm')}</div>
            <div className="flex items-center text-right justify-end">📍 {match.location}</div>
          </div>
          
          <Divider style={{ borderColor: 'rgba(255,255,255,0.05)' }} />
          
          <div className="mt-4 flex justify-between items-end">
            <div className="bg-black/20 px-3 py-1 rounded-full text-xs text-white">
              人均: ¥{match.perPersonCost || '--'}
            </div>
            <Space>
              <Button 
                size="mini" 
                fill="none" 
                className="text-white/80 border border-white/20 rounded-full"
                onClick={() => navigate(`/matches/${id}/finance`)}
              >
                <CircleDollarSign size={14} className="mr-1" /> 费用管理
              </Button>
              <Button size="mini" color="primary" fill="solid" className="bg-white text-green-700 rounded-full font-bold">
                一键报名
              </Button>
            </Space>
          </div>
        </div>

        {/* 现场记分牌模式 */}
        <div className="space-y-6">
          {games.map((game) => (
            <div key={game.id} className="bg-neutral-900 rounded-3xl p-1 border border-neutral-800 overflow-hidden">
              <div className="flex items-center p-6">
                {/* 队 A */}
                <div className="flex-1 text-center">
                  <div className="text-sm text-neutral-500 mb-2 font-medium">队 {game.teamAIndex + 1}</div>
                  {isEditing && editingGameId === game.id ? (
                    <button 
                      onClick={() => setTempScores(s => ({...s, scoreA: s.scoreA + 1}))}
                      className="w-20 h-20 bg-primary/10 border-2 border-primary text-primary rounded-2xl text-3xl font-bold active:scale-95 transition-transform"
                    >
                      {tempScores.scoreA}
                    </button>
                  ) : (
                    <div className="text-5xl font-black">{game.scoreA}</div>
                  )}
                </div>

                {/* 分割线与状态 */}
                <div className="px-4 flex flex-col items-center">
                  <div className="text-2xl font-black text-neutral-700">:</div>
                  {!isEditing && (
                    <Button fill="none" size="mini" onClick={() => fetchLogs(game.id)} className="text-neutral-500 mt-2">
                      <History size={14} />
                    </Button>
                  )}
                </div>

                {/* 队 B */}
                <div className="flex-1 text-center">
                  <div className="text-sm text-neutral-500 mb-2 font-medium">队 {game.teamBIndex + 1}</div>
                  {isEditing && editingGameId === game.id ? (
                    <button 
                      onClick={() => setTempScores(s => ({...s, scoreB: s.scoreB + 1}))}
                      className="w-20 h-20 bg-primary/10 border-2 border-primary text-primary rounded-2xl text-3xl font-bold active:scale-95 transition-transform"
                    >
                      {tempScores.scoreB}
                    </button>
                  ) : (
                    <div className="text-5xl font-black">{game.scoreB}</div>
                  )}
                </div>
              </div>

              {/* 底部控制区 */}
              <div className="bg-neutral-800/50 p-3 flex justify-center">
                {isEditing && editingGameId === game.id ? (
                  <Space>
                    <Button color="primary" onClick={handleSaveScore} className="px-8 rounded-full">保存比分</Button>
                    <Button onClick={() => {setIsEditing(false); apiClient.post(`/api/game/${game.id}/unlock`);}} className="rounded-full">取消</Button>
                  </Space>
                ) : (
                  <Button 
                    fill="none" 
                    color="primary" 
                    onClick={() => handleStartEdit(game)}
                    disabled={isEditing}
                    className="flex items-center text-sm"
                  >
                    <Edit size={14} className="mr-1" /> 录入实况
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 战报卡片生成 */}
        <MatchPoster match={match} games={games} />

        {/* 审计日志抽屉 (简化版) */}
        {showLogs && (
          <div className="mt-10 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center text-neutral-300">
                <History size={18} className="mr-2" /> 比分修正记录
              </h3>
              <Button size="mini" fill="none" onClick={() => setShowLogs(false)}><X size={16}/></Button>
            </div>
            <Steps direction='vertical' className="text-sm">
              {logs.map((log: any) => (
                <Step 
                  key={log.id} 
                  title={`${log.scoreA} : ${log.scoreB}`} 
                  description={
                    <div className="text-neutral-500 flex items-center mt-1">
                      <User size={12} className="mr-1"/> ID:{log.operatorId} · {dayjs(log.createdAt).format('HH:mm:ss')}
                      <Tag className="ml-2">{log.type}</Tag>
                    </div>
                  }
                  status='finish'
                />
              ))}
            </Steps>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchDetail;
