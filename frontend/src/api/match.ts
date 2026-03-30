import apiClient from './client';

export interface MatchGame {
  id: number;
  matchId: number;
  teamAIndex: number;
  teamBIndex: number;
  scoreA: number | null;
  scoreB: number | null;
  status: 'READY' | 'PLAYING' | 'FINISHED';
  startTime: string | null;
  endTime: string | null;
}

export interface PlayerItem {
  id: number;
  name: string;
  rating: number;
}

export interface GroupsVO {
  groupsPublished: boolean;
  groups: Record<number, PlayerItem[]>;
  unassigned: PlayerItem[];
  teamNames?: Record<number, string>;
}

export interface GroupingRequest {
  strategyName?: string;
  keepExisting?: boolean;
}

export interface TeamStanding {
  teamIndex: number;
  teamName: string;
  rank: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface StandingsVO {
  gameFormat: string;
  standings: TeamStanding[];
}

export interface PlayerStats {
  playerId: number;
  playerName: string;
  goals: number;
  assists: number;
}

export interface MatchStatsVO {
  topScorers: PlayerStats[];
  topAssisters: PlayerStats[];
}

export interface SettlementRequest {
  totalCost: number;
  publish: boolean;
  registrations: {
    playerId: number;
    paymentAmount: number;
    isExempt: boolean;
  }[];
}

export const matchApi = {
  getGroups: (matchId: string | number): Promise<GroupsVO | null> =>
    apiClient.get(`/api/match/${matchId}/groups`),

  autoGroup: (matchId: string | number, request?: GroupingRequest): Promise<GroupsVO> =>
    apiClient.post(`/api/match/${matchId}/group`, request ?? {}),

  listStrategies: (): Promise<string[]> =>
    apiClient.get('/api/match/grouping/strategies'),

  saveGroupDraft: (matchId: string | number, groups: Record<number, number[]>): Promise<void> =>
    apiClient.put(`/api/match/${matchId}/groups`, groups),

  publishGroups: (matchId: string | number): Promise<void> =>
    apiClient.post(`/api/match/${matchId}/groups/publish`),

  closeRegistration: (matchId: string | number): Promise<void> =>
    apiClient.post(`/api/match/${matchId}/close-registration`),

  startMatch: (matchId: string | number, actualStartTime: string): Promise<void> =>
    apiClient.post(`/api/match/${matchId}/start`, { actualStartTime }),

  rollbackStatus: (matchId: string | number, targetStatus: string): Promise<void> =>
    apiClient.post(`/api/match/${matchId}/rollback?targetStatus=${targetStatus}`),

  updateActualStartTime: (matchId: string | number, actualStartTime: string): Promise<void> =>
    apiClient.put(`/api/match/${matchId}/actual-start-time`, { actualStartTime }),

  updateTeamName: (matchId: string | number, groupIndex: number, name: string): Promise<void> =>
    apiClient.put(`/api/match/${matchId}/teams/${groupIndex}/name`, { name }),

  getStandings: (matchId: string | number): Promise<StandingsVO> =>
    apiClient.get(`/api/match/${matchId}/standings`),

  getStats: (matchId: string | number): Promise<MatchStatsVO> =>
    apiClient.get(`/api/match/${matchId}/stats`),

  softDelete: (matchId: string | number): Promise<void> =>
    apiClient.delete(`/api/match/${matchId}/soft`),

  listTrash: (tournamentId: string | number): Promise<any[]> =>
    apiClient.get(`/api/match/trash?tournamentId=${tournamentId}`),

  permanentDelete: (matchId: string | number): Promise<void> =>
    apiClient.delete(`/api/match/${matchId}/permanent`),

  restore: (matchId: string | number): Promise<void> =>
    apiClient.post(`/api/match/${matchId}/restore`),

  getEligiblePlayers: (matchId: string | number): Promise<any[]> =>
    apiClient.get(`/api/match/${matchId}/eligible-players`),

  adminAddPlayer: (matchId: string | number, playerId: number): Promise<void> =>
    apiClient.post(`/api/match/${matchId}/admin/add-player?playerId=${playerId}`),

  adminBatchAddPlayers: (matchId: string | number, playerIds: number[]): Promise<void> =>
    apiClient.post(`/api/match/${matchId}/admin/batch-add-players`, playerIds),

  adminCancelPlayer: (matchId: string | number, playerId: number): Promise<void> =>
    apiClient.post(`/api/match/${matchId}/admin/cancel-player?playerId=${playerId}`),

  settlement: (matchId: string | number, request: SettlementRequest): Promise<void> =>
    apiClient.post(`/api/match/${matchId}/settlement`, request),

  batchUpdatePayment: (matchId: string | number): Promise<void> =>
    apiClient.post(`/api/match/${matchId}/payment/batch`),
};
