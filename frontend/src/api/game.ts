import apiClient from './client';

export interface ParticipantInfo {
  participantId: number;
  playerId: number;
  playerName: string;
  position: string | null;
  goals: number;
  assists: number;
  isMvp: boolean;
}

export interface GoalInfo {
  goalId: number;
  teamIndex: number;
  scorerId: number | null;
  scorerName: string | null;
  assistantId: number | null;
  assistantName: string | null;
  type: 'NORMAL' | 'OWN_GOAL';
  occurredAt: string | null;
}

export interface GameDetailVO {
  gameId: number;
  matchId: number;
  teamAIndex: number;
  teamBIndex: number;
  teamNames: Record<number, string> | null;
  scoreA: number | null;
  scoreB: number | null;
  status: 'READY' | 'PLAYING' | 'FINISHED';
  startTime: string | null;
  endTime: string | null;
  overtimeMinutes: number | null;
  gameIndex: number;
  matchStartTime: string | null;
  durationPerGame: number | null;
  teamAParticipants: ParticipantInfo[];
  teamBParticipants: ParticipantInfo[];
  goals: GoalInfo[];
}

export interface RecordGoalRequest {
  gameId: number;
  teamIndex: number;
  scorerId: number | null;
  assistantId: number | null;
  type: 'NORMAL' | 'OWN_GOAL';
  occurredAt: string | null;
}

export const gameApi = {
  getDetail: (gameId: number | string): Promise<GameDetailVO> =>
    apiClient.get(`/api/game/${gameId}`),

  startGame: (gameId: number | string): Promise<void> =>
    apiClient.post(`/api/game/${gameId}/start`),

  finishGame: (gameId: number | string): Promise<void> =>
    apiClient.post(`/api/game/${gameId}/finish`),

  addOvertime: (gameId: number | string, extraMinutes: number): Promise<void> =>
    apiClient.post(`/api/game/${gameId}/overtime`, null, { params: { extraMinutes } }),

  recordGoal: (goal: RecordGoalRequest): Promise<void> =>
    apiClient.post('/api/game/goal', goal),

  listParticipants: (gameId: number | string): Promise<ParticipantInfo[]> =>
    apiClient.get(`/api/game/${gameId}/participants`),

  addParticipant: (gameId: number | string, playerId: number): Promise<void> =>
    apiClient.post(`/api/game/${gameId}/participants/${playerId}`),

  removeParticipant: (gameId: number | string, playerId: number): Promise<void> =>
    apiClient.delete(`/api/game/${gameId}/participants/${playerId}`),
};
