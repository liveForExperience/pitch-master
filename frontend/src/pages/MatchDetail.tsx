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

    // 建立 SSE 实时连接 (注意：EventSource 默认不带凭证，需特殊处理或依赖同源代理)
    const sseUrl = `/api/realtime/subscribe/${id}`;
    sseRef.current = new EventSource(sseUrl);
    
    sseRef.current.onmessage = (event) => {
      try {
        const updatedGame = JSON.parse(event.data);
        setGames(prev => prev.map(g => g.id === updatedGame.id ? updatedGame : g));
        // 只有当不是自己在编辑时才弹出提示
        if (!isEditing) {
          Toast.show({ content: '比分已实时更新', duration: 1000 });
        }
      } catch (e) {
        console.error("SSE Parse Error", e);
      }
    };

    sseRef.current.onerror = (err) => {
      console.error("SSE Connection Error", err);
      sseRef.current?.close();
      // 3秒后尝试重连
      setTimeout(() => {
        if (id) fetchData(); // 降级为手动刷新一次
      }, 3000);
    };

    return () => {
      sseRef.current?.close();
    };
  }, [id, isEditing]);

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
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 mb-6 shadow-2xl">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-xl font-bold tracking-tight">{match.title}</h1>
            <Tag color="primary" fill="outline" className="rounded-full px-3">
              {match.status === 'ONGOING' ? '进行中' : '报名中'}
            </Tag>
          </div>
          <div className="grid grid-cols-2 gap-4 text-[11px] text-neutral-500 mb-4 uppercase font-bold tracking-widest">
            <div className="flex items-center"><Clock size={12} className="mr-1 text-primary"/> {dayjs(match.startTime).format('YYYY-MM-DD HH:mm')}</div>
            <div className="flex items-center text-right justify-end">📍 {match.location}</div>
          </div>
          
          <Divider style={{ borderColor: 'rgba(255,255,255,0.03)' }} />
          
          <div className="mt-4 flex justify-between items-end">
            <div className="bg-neutral-800 px-4 py-1.5 rounded-full text-[10px] text-neutral-300 font-bold border border-neutral-700">
              人均: <span className="text-primary">¥{match.perPersonCost || '0.00'}</span>
            </div>
            <Space>
              <Button 
                size="mini" 
                fill="none" 
                className="text-neutral-400 border border-neutral-800 rounded-full bg-neutral-800/30"
                onClick={() => navigate(`/matches/${id}/finance`)}
              >
                <CircleDollarSign size={14} className="mr-1" /> 财务
              </Button>
              <Button size="mini" color="primary" fill="solid" className="rounded-full font-black px-4 shadow-lg shadow-primary/20">
                报名
              </Button>
            </Space>
          </div>
        </div>

        {/* 现场记分牌模式 */}
        <div className="space-y-6">
          {games.map((game) => (
            <div key={game.id} className="bg-neutral-900 rounded-[2.5rem] p-1 border border-neutral-800 shadow-xl overflow-hidden">
              <div className="flex items-center p-8">
                {/* 队 A */}
                <div className="flex-1 text-center">
                  <div className="text-[10px] text-neutral-600 mb-3 font-black uppercase tracking-widest">Team A</div>
                  {isEditing && editingGameId === game.id ? (
                    <button 
                      onClick={() => setTempScores(s => ({...s, scoreA: s.scoreA + 1}))}
                      className="w-24 h-24 bg-primary/5 border-2 border-primary/30 text-primary rounded-[2rem] text-4xl font-black active:scale-90 transition-all shadow-inner"
                    >
                      {tempScores.scoreA}
                    </button>
                  ) : (
                    <div className="text-6xl font-black tracking-tighter text-white">{game.scoreA}</div>
                  )}
                </div>

                {/* VS 分割线 */}
                <div className="px-6 flex flex-col items-center">
                  <div className="text-3xl font-black text-neutral-800 italic">VS</div>
                  {!isEditing && (
                    <Button fill="none" size="mini" onClick={() => fetchLogs(game.id)} className="text-neutral-700 mt-4 hover:text-primary transition-colors">
                      <History size={18} />
                    </Button>
                  )}
                </div>

                {/* 队 B */}
                <div className="flex-1 text-center">
                  <div className="text-[10px] text-neutral-600 mb-3 font-black uppercase tracking-widest">Team B</div>
                  {isEditing && editingGameId === game.id ? (
                    <button 
                      onClick={() => setTempScores(s => ({...s, scoreB: s.scoreB + 1}))}
                      className="w-24 h-24 bg-primary/5 border-2 border-primary/30 text-primary rounded-[2rem] text-4xl font-black active:scale-90 transition-all shadow-inner"
                    >
                      {tempScores.scoreB}
                    </button>
                  ) : (
                    <div className="text-6xl font-black tracking-tighter text-white">{game.scoreB}</div>
                  )}
                </div>
              </div>

              {/* 控制区 */}
              <div className="bg-neutral-800/30 p-4 flex justify-center border-t border-neutral-800/50">
                {isEditing && editingGameId === game.id ? (
                  <Space size="large">
                    <Button color="primary" onClick={handleSaveScore} className="px-10 rounded-full font-bold shadow-lg shadow-primary/20">保存</Button>
                    <Button onClick={() => {setIsEditing(false); apiClient.post(`/api/game/${game.id}/unlock`);}} className="px-6 rounded-full bg-neutral-800 text-neutral-400 border-none">取消</Button>
                  </Space>
                ) : (
                  <Button 
                    fill="none" 
                    color="primary" 
                    onClick={() => handleStartEdit(game)}
                    disabled={isEditing}
                    className="flex items-center text-xs font-bold tracking-widest uppercase opacity-80 hover:opacity-100"
                  >
                    <Edit size={14} className="mr-2" /> Start Scoring
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 战报卡片生成 */}
        <div className="mt-10">
          <MatchPoster match={match} games={games} />
        </div>

        {/* 审计日志抽屉 */}
        {showLogs && (
          <div className="mt-12 animate-in slide-in-from-bottom duration-500 pb-10">
            <div className="flex justify-between items-center mb-6 px-2">
              <h3 className="text-sm font-black flex items-center text-neutral-400 uppercase tracking-widest">
                <History size={16} className="mr-2 text-primary" /> Revision History
              </h3>
              <Button size="mini" fill="none" onClick={() => setShowLogs(false)} className="text-neutral-600"><X size={20}/></Button>
            </div>
            <div className="bg-neutral-900/50 rounded-3xl border border-neutral-800 p-6">
              <Steps direction='vertical' className="custom-steps">
                {logs.map((log: any) => (
                  <Step 
                    key={log.id} 
                    title={<span className="text-xl font-black text-white">{log.scoreA} : {log.scoreB}</span>} 
                    description={
                      <div className="text-[10px] font-bold text-neutral-500 flex items-center mt-2 uppercase tracking-tighter">
                        <User size={10} className="mr-1 text-primary"/> Operator:{log.operatorId} <span className="mx-2 text-neutral-800">|</span> {dayjs(log.createdAt).format('HH:mm:ss')}
                        <Tag size="mini" color="primary" fill="outline" className="ml-3 border-primary/20 text-[9px] uppercase">{log.type}</Tag>
                      </div>
                    }
                    status='finish'
                  />
                ))}
              </Steps>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchDetail;
