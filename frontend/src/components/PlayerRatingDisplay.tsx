import React from 'react';
import { Tag } from 'antd-mobile';
import { Trophy, TrendingUp, Heart } from 'lucide-react';

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
 * FM风格三维评分可视化展示 - 暗黑Apple风格
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
  // 评分颜色映射 (FM风格：1-20分制) - 适配暗黑主题
  const getRatingColor = (rating: number): string => {
    if (rating >= 16) return '#1DB954'; // 优秀：主绿色
    if (rating >= 12) return '#30D158'; // 良好：亮绿
    if (rating >= 8) return '#FFD60A';  // 中等：黄色
    if (rating >= 4) return '#FF9F0A';  // 较差：橙色
    return '#FF453A';                   // 差：红色
  };

  // 评分等级文字
  const getRatingLevel = (rating: number): string => {
    if (rating >= 16) return '优秀';
    if (rating >= 12) return '良好';
    if (rating >= 8) return '中等';
    if (rating >= 4) return '及格';
    return '待提升';
  };

  // 进度条组件（自定义暗黑风格）
  const ProgressBar: React.FC<{ percent: number; color: string }> = ({ percent, color }) => (
    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div 
        className="h-full rounded-full transition-all duration-300"
        style={{ 
          width: `${Math.min(100, Math.max(0, percent))}%`,
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}40`
        }}
      />
    </div>
  );

  // 紧凑模式
  if (compact) {
    return (
      <div className="flex items-center gap-3 px-3 py-2">
        <div className="text-center min-w-[60px]">
          <div className="text-2xl font-bold" style={{ color: getRatingColor(totalRating) }}>
            {totalRating.toFixed(2)}
          </div>
          <div className="text-xs text-gray-400">总评</div>
        </div>
        <div className="flex-1 grid grid-cols-3 gap-3 text-xs">
          <div className="text-center">
            <div className="font-semibold text-white">{skillRating.toFixed(1)}</div>
            <div className="text-gray-400 mt-0.5">技术</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-white">{performanceRating.toFixed(1)}</div>
            <div className="text-gray-400 mt-0.5">表现</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-white">{engagementRating.toFixed(1)}</div>
            <div className="text-gray-400 mt-0.5">参与</div>
          </div>
        </div>
      </div>
    );
  }

  // 完整卡片模式 - 磨砂玻璃风格
  return (
    <div className="glass rounded-2xl p-5 w-full border border-white/10">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/10">
        <span className="text-lg font-semibold text-white">{playerName} · 评分档案</span>
        <div className="flex gap-2">
          {provisionalMatches < 3 && (
            <Tag color="#007AFF" fill="outline" className="text-xs">
              保护期 {provisionalMatches}/3
            </Tag>
          )}
          {activeStreakWeeks >= 3 && (
            <Tag color="#1DB954" fill="outline" className="text-xs">
              活跃 {activeStreakWeeks}周
            </Tag>
          )}
        </div>
      </div>

      {/* 总评分 */}
      <div className="text-center mb-6 py-4">
        <div 
          className="text-6xl font-bold mb-3"
          style={{ 
            color: getRatingColor(totalRating),
            textShadow: `0 0 20px ${getRatingColor(totalRating)}40`
          }}
        >
          {totalRating.toFixed(2)}
        </div>
        <Tag 
          color={getRatingColor(totalRating)} 
          fill="solid"
          className="text-sm font-medium"
        >
          {getRatingLevel(totalRating)}
        </Tag>
        <div className="text-gray-400 text-sm mt-3">
          出场 <span className="text-white font-semibold">{appearanceCount}</span> 次
        </div>
      </div>

      {/* 三维评分详情 */}
      <div className="space-y-5">
        {/* 技术能力 Skill */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Trophy size={18} color="#FFD60A" />
              <span className="font-medium text-white">技术能力</span>
              <span className="text-xs text-gray-500">Skill</span>
            </div>
            <span className="font-bold text-lg" style={{ color: getRatingColor(skillRating) }}>
              {skillRating.toFixed(2)}
            </span>
          </div>
          <ProgressBar 
            percent={((skillRating - 1) / 19) * 100}
            color={getRatingColor(skillRating)}
          />
          <div className="text-xs text-gray-400 mt-2 leading-relaxed">
            长期能力评估，受进球、助攻、MVP影响
          </div>
        </div>

        {/* 比赛表现 Performance */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} color="#007AFF" />
              <span className="font-medium text-white">比赛表现</span>
              <span className="text-xs text-gray-500">Performance</span>
            </div>
            <span className="font-bold text-lg" style={{ color: getRatingColor(performanceRating) }}>
              {performanceRating.toFixed(2)}
            </span>
          </div>
          <ProgressBar 
            percent={((performanceRating - 1) / 19) * 100}
            color={getRatingColor(performanceRating)}
          />
          <div className="text-xs text-gray-400 mt-2 leading-relaxed">
            单场结果和数据表现，受胜负、进球、助攻影响
          </div>
        </div>

        {/* 参与度 Engagement */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Heart size={18} color="#1DB954" />
              <span className="font-medium text-white">参与度</span>
              <span className="text-xs text-gray-500">Engagement</span>
            </div>
            <span className="font-bold text-lg" style={{ color: getRatingColor(engagementRating) }}>
              {engagementRating.toFixed(2)}
            </span>
          </div>
          <ProgressBar 
            percent={((engagementRating - 1) / 19) * 100}
            color={getRatingColor(engagementRating)}
          />
          <div className="text-xs text-gray-400 mt-2 leading-relaxed">
            活跃度和互评参与，受出勤、连续活跃、互评完成影响
          </div>
        </div>
      </div>

      {/* 评分说明 */}
      <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
        <div className="font-medium text-white mb-2 text-sm">📊 评分规则</div>
        <ul className="space-y-1.5 text-xs text-gray-400 leading-relaxed">
          <li>• 评分范围：1.00 - 20.00 (FM风格)</li>
          <li>• 总评 = 技术×40% + 表现×40% + 参与×20%</li>
          <li>• 新球员前3场享受保护期（变动更平滑）</li>
          <li>• 30天未参赛将开始衰减（每周-0.1），参赛恢复并获奖励</li>
        </ul>
      </div>
    </div>
  );
};

export default PlayerRatingDisplay;
