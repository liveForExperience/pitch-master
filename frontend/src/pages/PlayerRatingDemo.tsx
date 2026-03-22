import React, { useEffect, useState } from 'react';
import { Button, SpinLoading, ErrorBlock, NavBar } from 'antd-mobile';
import { LayoutList, LayoutGrid } from 'lucide-react';
import PlayerRatingDisplay from '../components/PlayerRatingDisplay';
import { getPlayerRating, type PlayerRatingData } from '../api/player';

/**
 * 球员评分展示Demo页面
 * 演示如何集成PlayerRatingDisplay组件 - 暗黑Apple风格
 */
const PlayerRatingDemo: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ratingData, setRatingData] = useState<PlayerRatingData | null>(null);
  const [viewMode, setViewMode] = useState<'full' | 'compact'>('full');

  const loadPlayerRating = async (playerId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPlayerRating(playerId);
      setRatingData(data);
    } catch (err: any) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayerRating(1);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <SpinLoading color="primary" style={{ '--size': '48px' }} />
        <div className="mt-4 text-gray-400">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <ErrorBlock
          status="default"
          title="加载失败"
          description={error}
        />
        <Button 
          block 
          color="primary" 
          className="mt-4"
          onClick={() => loadPlayerRating(1)}
        >
          重试
        </Button>
      </div>
    );
  }

  if (!ratingData) {
    return (
      <div className="p-4">
        <ErrorBlock status="empty" title="暂无数据" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-6">
      <NavBar back={null}>球员评分组件 Demo</NavBar>
      
      <div className="p-4 space-y-4">
        {/* 模式切换器 */}
        <div className="glass rounded-xl p-4 border border-white/10">
          <div className="text-sm text-gray-400 mb-3">展示模式</div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setViewMode('full')}
              className={`
                flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                transition-all duration-200 font-medium
                ${viewMode === 'full' 
                  ? 'bg-[#1DB954] text-white shadow-lg shadow-[#1DB954]/30' 
                  : 'bg-white/5 text-gray-400 border border-white/10'
                }
              `}
            >
              <LayoutGrid size={18} />
              <span>完整卡片</span>
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`
                flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                transition-all duration-200 font-medium
                ${viewMode === 'compact' 
                  ? 'bg-[#1DB954] text-white shadow-lg shadow-[#1DB954]/30' 
                  : 'bg-white/5 text-gray-400 border border-white/10'
                }
              `}
            >
              <LayoutList size={18} />
              <span>紧凑模式</span>
            </button>
          </div>
        </div>

        {/* 评分组件展示 */}
        {viewMode === 'full' && (
          <PlayerRatingDisplay
            playerId={ratingData.playerId}
            playerName={ratingData.playerName}
            totalRating={ratingData.totalRating}
            skillRating={ratingData.skillRating}
            performanceRating={ratingData.performanceRating}
            engagementRating={ratingData.engagementRating}
            provisionalMatches={ratingData.provisionalMatches}
            appearanceCount={ratingData.appearanceCount}
            activeStreakWeeks={ratingData.activeStreakWeeks}
            compact={false}
          />
        )}

        {viewMode === 'compact' && (
          <div className="glass rounded-xl border border-white/10 overflow-hidden">
            <PlayerRatingDisplay
              playerId={ratingData.playerId}
              playerName={ratingData.playerName}
              totalRating={ratingData.totalRating}
              skillRating={ratingData.skillRating}
              performanceRating={ratingData.performanceRating}
              engagementRating={ratingData.engagementRating}
              provisionalMatches={ratingData.provisionalMatches}
              appearanceCount={ratingData.appearanceCount}
              activeStreakWeeks={ratingData.activeStreakWeeks}
              compact={true}
            />
          </div>
        )}

        {/* 集成说明 */}
        <div className="glass rounded-xl p-5 border border-white/10">
          <div className="text-white font-semibold mb-4">💡 集成指南</div>
          
          <div className="space-y-4 text-sm">
            <div>
              <div className="text-gray-300 font-medium mb-2">1. 比赛详情页 - 紧凑模式</div>
              <pre className="bg-black/40 p-3 rounded-lg text-xs text-gray-300 overflow-x-auto border border-white/10">
{`import PlayerRatingDisplay from '@/components/PlayerRatingDisplay';

{participants.map(p => (
  <PlayerRatingDisplay
    key={p.playerId}
    compact={true}
    {...p.ratingData}
  />
))}`}
              </pre>
            </div>

            <div>
              <div className="text-gray-300 font-medium mb-2">2. 球员详情页 - 完整卡片</div>
              <pre className="bg-black/40 p-3 rounded-lg text-xs text-gray-300 overflow-x-auto border border-white/10">
{`<PlayerRatingDisplay
  playerId={player.id}
  playerName={player.nickname}
  totalRating={player.rating}
  skillRating={profile.skillRating}
  performanceRating={profile.performanceRating}
  engagementRating={profile.engagementRating}
  compact={false}
/>`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerRatingDemo;
