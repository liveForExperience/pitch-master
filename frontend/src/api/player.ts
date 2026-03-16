import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export interface PlayerRatingData {
  playerId: number;
  playerName: string;
  totalRating: number;
  skillRating: number;
  performanceRating: number;
  engagementRating: number;
  provisionalMatches?: number;
  appearanceCount?: number;
  activeStreakWeeks?: number;
  lastAttendanceTime?: string;
  lastDecayTime?: string;
  ratingVersion?: number;
}

/**
 * 查询球员评分档案
 */
export const getPlayerRating = async (playerId: number): Promise<PlayerRatingData> => {
  const response = await axios.get(`${API_BASE}/api/player/${playerId}/rating`);
  return response.data.data;
};

/**
 * 查询球员基本信息
 */
export const getPlayer = async (playerId: number) => {
  const response = await axios.get(`${API_BASE}/api/player/${playerId}`);
  return response.data.data;
};
