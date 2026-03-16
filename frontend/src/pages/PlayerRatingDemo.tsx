import React, { useEffect, useState } from 'react';
import { Card, Spin, Alert, Button, Space } from 'antd';
import PlayerRatingDisplay from '../components/PlayerRatingDisplay';
import { getPlayerRating, type PlayerRatingData } from '../api/player';

/**
 * 球员评分展示Demo页面
 * 演示如何集成PlayerRatingDisplay组件
 */
const PlayerRatingDemo: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ratingData, setRatingData] = useState<PlayerRatingData | null>(null);
  const [viewMode, setViewMode] = useState<'full' | 'compact'>('full');

  // 示例：加载球员ID=1的评分数据
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
    loadPlayerRating(1); // 默认加载球员ID=1
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert
          message="加载失败"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => loadPlayerRating(1)}>
              重试
            </Button>
          }
        />
      </div>
    );
  }

  if (!ratingData) {
    return <Alert message="暂无数据" type="info" />;
  }

  return (
    <div className="p-4 space-y-4">
      <Card title="球员评分展示组件 Demo">
        <Space direction="vertical" size="large" className="w-full">
          {/* 切换展示模式 */}
          <div>
            <Space>
              <Button 
                type={viewMode === 'full' ? 'primary' : 'default'}
                onClick={() => setViewMode('full')}
              >
                完整卡片模式
              </Button>
              <Button 
                type={viewMode === 'compact' ? 'primary' : 'default'}
                onClick={() => setViewMode('compact')}
              >
                紧凑模式
              </Button>
            </Space>
          </div>

          {/* 完整卡片模式 */}
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

          {/* 紧凑模式 */}
          {viewMode === 'compact' && (
            <Card size="small">
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
            </Card>
          )}
        </Space>
      </Card>

      {/* 集成说明 */}
      <Card title="如何在现有页面中使用">
        <div className="space-y-2 text-sm">
          <p><strong>1. 在比赛详情页展示球员评分：</strong></p>
          <pre className="bg-gray-100 p-2 rounded">
{`import PlayerRatingDisplay from '@/components/PlayerRatingDisplay';

// 在球员列表中展示紧凑模式
{participants.map(p => (
  <PlayerRatingDisplay
    key={p.playerId}
    compact={true}
    {...p.ratingData}
  />
))}`}
          </pre>

          <p><strong>2. 在球员详情页展示完整评分卡片：</strong></p>
          <pre className="bg-gray-100 p-2 rounded">
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
      </Card>
    </div>
  );
};

export default PlayerRatingDemo;
