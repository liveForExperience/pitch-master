import apiClient from './client';

export interface Tournament {
  id: number;
  name: string;
  description?: string;
  status: number;
  joinMode: 'OPEN' | 'APPROVAL';
  logo?: string;
  maxPlayers?: number;
}

export interface TournamentPlayer {
  id: number;
  tournamentId: number;
  playerId: number;
  clubId?: number;
  rating: number;
  ratingVersion: number;
  joinStatus: 'PENDING' | 'ACTIVE' | 'LEFT';
  status: number;
  playerNickname?: string;
  playerPosition?: string;
  tournamentName?: string;
  clubName?: string;
}

export const tournamentApi = {
  list: (): Promise<Tournament[]> =>
    apiClient.get('/api/tournament/list'),

  getById: (id: number | string): Promise<Tournament> =>
    apiClient.get(`/api/tournament/${id}`),

  create: (tournament: Partial<Tournament>): Promise<Tournament> =>
    apiClient.post('/api/tournament', tournament),

  addAdmin: (tournamentId: number | string, userId: number): Promise<void> =>
    apiClient.post(`/api/tournament/${tournamentId}/admin?userId=${userId}`),

  removeAdmin: (tournamentId: number | string, userId: number): Promise<void> =>
    apiClient.delete(`/api/tournament/${tournamentId}/admin?userId=${userId}`),

  join: (tournamentId: number | string): Promise<TournamentPlayer> =>
    apiClient.post(`/api/tournament/${tournamentId}/join`),

  leave: (tournamentId: number | string): Promise<void> =>
    apiClient.post(`/api/tournament/${tournamentId}/leave`),

  approve: (tournamentId: number | string, playerId: number): Promise<void> =>
    apiClient.post(`/api/tournament/${tournamentId}/players/${playerId}/approve`),

  reject: (tournamentId: number | string, playerId: number): Promise<void> =>
    apiClient.post(`/api/tournament/${tournamentId}/players/${playerId}/reject`),

  adminAddPlayer: (tournamentId: number | string, playerId: number): Promise<TournamentPlayer> =>
    apiClient.post(`/api/tournament/${tournamentId}/players/${playerId}`),

  listPlayers: (tournamentId: number | string): Promise<TournamentPlayer[]> =>
    apiClient.get(`/api/tournament/${tournamentId}/players`),

  listPendingPlayers: (tournamentId: number | string): Promise<TournamentPlayer[]> =>
    apiClient.get(`/api/tournament/${tournamentId}/players/pending`),

  isAdmin: (tournamentId: number | string): Promise<boolean> =>
    apiClient.get(`/api/tournament/${tournamentId}/is-admin`),
};
