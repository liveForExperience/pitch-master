import React from 'react';
import { Card, Progress, Tag, Tooltip } from 'antd';
import { TrophyOutlined, RiseOutlined, HeartOutlined } from '@ant-design/icons';

interface PlayerRatingDisplayProps {
  playerId: number;
  playerName: string;
  totalRating: number;
  skillRating: number;
  performanceRating: number;
  engagementRating: number;
  provisionalMatches?: number;
  appearanceCount?: number;
  activeStreakWeeks?: number;
  compact?: boolean;
}

/**
 * 球员评分展示组件
 * FM风格三维评分可视化展示
 */
const PlayerRatingDisplay: React.FC<PlayerRatingDisplayProps> = ({
  playerName,
  totalRating,
  skillRating,
  performanceRating,
  engagementRating,
  provisionalMatches = 0,
  appearanceCount = 0,
  activeStreakWeeks = 0,
  compact = false,
}) => {
  // 评分颜色映射 (FM风格：1-20分制)
  const getRatingColor = (rating: number): string => {
    if (rating >= 16) return '#52c41a'; // 优秀：绿色
    if (rating >= 12) return '#1890ff'; // 良好：蓝色
    if (rating >= 8) return '#faad14';  // 中等：橙色
    if (rating >= 4) return '#ff7875';  // 较差：浅红
    return '#cf1322';                   // 差：红色
  };

  // 评分等级文字
  const getRatingLevel = (rating: number): string => {
    if (rating >= 16) return '优秀';
    if (rating >= 12) return '良好';
    if (rating >= 8) return '中等';
    if (rating >= 4) return '及格';
    return '待提升';
  };

  // 进度条百分比 (1-20映射到0-100)
  const getProgressPercent = (rating: number): number => {
    return ((rating - 1) / 19) * 100;
  };

  // 紧凑模式
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color: getRatingColor(totalRating) }}>
            {totalRating.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500">总评</div>
        </div>
        <div className="flex-1 grid grid-cols-3 gap-2 text-xs">
          <Tooltip title="技术能力">
            <div className="text-center">
              <div className="font-semibold">{skillRating.toFixed(1)}</div>
              <div className="text-gray-400">技术</div>
            </div>
          </Tooltip>
          <Tooltip title="比赛表现">
            <div className="text-center">
              <div className="font-semibold">{performanceRating.toFixed(1)}</div>
              <div className="text-gray-400">表现</div>
            </div>
          </Tooltip>
          <Tooltip title="参与度">
            <div className="text-center">
              <div className="font-semibold">{engagementRating.toFixed(1)}</div>
              <div className="text-gray-400">参与</div>
            </div>
          </Tooltip>
        </div>
      </div>
    );
  }

  // 完整卡片模式
  return (
    <Card 
      title={
        <div className="flex items-center justify-between">
          <span>{playerName} - 评分档案</span>
          <div className="flex gap-2">
            {provisionalMatches < 3 && (
              <Tag color="blue">保护期 ({provisionalMatches}/3)</Tag>
            )}
            {activeStreakWeeks >= 3 && (
              <Tag color="green">活跃 {activeStreakWeeks}周</Tag>
            )}
          </div>
        </div>
      }
      className="w-full"
    >
      {/* 总评分 */}
      <div className="text-center mb-6">
        <div className="text-5xl font-bold mb-2" style={{ color: getRatingColor(totalRating) }}>
          {totalRating.toFixed(2)}
        </div>
        <Tag color={getRatingColor(totalRating)} className="text-sm">
          {getRatingLevel(totalRating)}
        </Tag>
        <div className="text-gray-500 text-sm mt-2">
          出场 {appearanceCount} 次
        </div>
      </div>

      {/* 三维评分详情 */}
      <div className="space-y-4">
        {/* 技术能力 Skill */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrophyOutlined style={{ color: '#faad14' }} />
              <span className="font-medium">技术能力 (Skill)</span>
            </div>
            <span className="font-bold" style={{ color: getRatingColor(skillRating) }}>
              {skillRating.toFixed(2)}
            </span>
          </div>
          <Progress
            percent={getProgressPercent(skillRating)}
            strokeColor={getRatingColor(skillRating)}
            showInfo={false}
            size="small"
          />
          <div className="text-xs text-gray-500 mt-1">
            长期能力评估，受进球、助攻、MVP影响
          </div>
        </div>

        {/* 比赛表现 Performance */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <RiseOutlined style={{ color: '#1890ff' }} />
              <span className="font-medium">比赛表现 (Performance)</span>
            </div>
            <span className="font-bold" style={{ color: getRatingColor(performanceRating) }}>
              {performanceRating.toFixed(2)}
            </span>
          </div>
          <Progress
            percent={getProgressPercent(performanceRating)}
            strokeColor={getRatingColor(performanceRating)}
            showInfo={false}
            size="small"
          />
          <div className="text-xs text-gray-500 mt-1">
            单场结果和数据表现，受胜负、进球、助攻影响
          </div>
        </div>

        {/* 参与度 Engagement */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HeartOutlined style={{ color: '#52c41a' }} />
              <span className="font-medium">参与度 (Engagement)</span>
            </div>
            <span className="font-bold" style={{ color: getRatingColor(engagementRating) }}>
              {engagementRating.toFixed(2)}
            </span>
          </div>
          <Progress
            percent={getProgressPercent(engagementRating)}
            strokeColor={getRatingColor(engagementRating)}
            showInfo={false}
            size="small"
          />
          <div className="text-xs text-gray-500 mt-1">
            活跃度和互评参与，受出勤、连续活跃、互评完成影响
          </div>
        </div>
      </div>

      {/* 评分说明 */}
      <div className="mt-6 p-3 bg-gray-50 rounded text-xs text-gray-600">
        <div className="font-medium mb-1">评分规则</div>
        <ul className="list-disc list-inside space-y-1">
          <li>评分范围：1.00 - 20.00 (FM风格)</li>
          <li>总评 = 技术×40% + 表现×40% + 参与×20%</li>
          <li>新球员前3场享受保护期（变动更平滑）</li>
          <li>30天未参赛将开始衰减（每周-0.1），参赛恢复并获奖励</li>
        </ul>
      </div>
    </Card>
  );
};

export default PlayerRatingDisplay;
