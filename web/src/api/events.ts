import { apiRequest } from './client';
import type { AdminSession, CreatedEvent, EventDetail, GameDetail } from './types';

export const fetchServerTime = () => apiRequest<{ serverNow: number }>('/api/time');

export const createEvent = (name: string) =>
  apiRequest<CreatedEvent>('/api/events', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });

export const fetchEvent = (shortCode: string) =>
  apiRequest<EventDetail>(`/api/events/${shortCode.trim().toUpperCase()}`);

export const fetchAdminSession = (shortCode: string, adminToken?: string | null) =>
  apiRequest<AdminSession>(`/api/events/${encodeURIComponent(shortCode.trim().toUpperCase())}/admin-session`, {
    adminToken: adminToken ?? undefined,
  });

export const createTeam = (
  eventId: string,
  name: string,
  adminToken: string,
) =>
  apiRequest<{ id: string; name: string; colorHex: string }>(`/api/events/${eventId}/teams`, {
    method: 'POST',
    body: JSON.stringify({ name }),
    adminToken,
  });

export const addRoster = (
  teamId: string,
  input: { names?: string[]; personIds?: string[] },
  adminToken: string,
) =>
  apiRequest<{ added: Array<{ id: string; personId: string; name: string }> }>(
    `/api/teams/${teamId}/roster`,
    {
      method: 'POST',
      body: JSON.stringify(input),
      adminToken,
    },
  );

export const updateTeamName = (teamId: string, name: string, adminToken: string) =>
  apiRequest<{ id: string; name: string; colorHex: string }>(`/api/teams/${teamId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
    adminToken,
  });

export const deleteTeam = (teamId: string, adminToken: string) =>
  apiRequest<{ id: string; eventId: string; name: string }>(`/api/teams/${teamId}`, {
    method: 'DELETE',
    adminToken,
  });

export const removeRosterMember = (rosterId: string, adminToken: string) =>
  apiRequest<{ id: string; teamId: string; name: string }>(`/api/roster/${rosterId}`, {
    method: 'DELETE',
    adminToken,
  });

export const createGame = (
  eventId: string,
  teamAId: string,
  teamBId: string,
  adminToken: string,
  plannedDurationMs?: number,
) =>
  apiRequest<{ id: string }>(`/api/events/${eventId}/games`, {
    method: 'POST',
    body: JSON.stringify({ teamAId, teamBId, plannedDurationMs }),
    adminToken,
  });

export const restoreAdminToken = (eventId: string, pin: string) =>
  apiRequest<{ restored: boolean; adminToken?: string }>(
    `/api/events/${eventId}/restore-token?pin=${encodeURIComponent(pin)}`,
    { method: 'POST' },
  );

export const finishEvent = (eventId: string, adminToken: string) =>
  apiRequest<{ eventId: string; finishedAt: number }>(`/api/events/${eventId}/finish`, {
    method: 'POST',
    adminToken,
  });

export const deleteEvent = (eventId: string, adminToken: string) =>
  apiRequest<{ eventId: string; shortCode: string }>(`/api/events/${eventId}`, {
    method: 'DELETE',
    adminToken,
  });

export const fetchGame = (gameId: string) => apiRequest<GameDetail>(`/api/games/${gameId}`);

export const fetchGameState = (gameId: string) =>
  apiRequest<{ scoreA: number; scoreB: number; timer: GameDetail['timer']; status: string }>(
    `/api/games/${gameId}/state`,
  );

export const startGame = (gameId: string, adminToken: string) =>
  apiRequest<unknown>(`/api/games/${gameId}/start`, { method: 'POST', adminToken });

export const pauseGame = (gameId: string, adminToken: string) =>
  apiRequest<unknown>(`/api/games/${gameId}/pause`, { method: 'POST', adminToken });

export const resumeGame = (gameId: string, adminToken: string) =>
  apiRequest<unknown>(`/api/games/${gameId}/resume`, { method: 'POST', adminToken });

export const finishGame = (gameId: string, adminToken: string) =>
  apiRequest<unknown>(`/api/games/${gameId}/finish`, { method: 'POST', adminToken });

export const deleteGame = (gameId: string, adminToken: string) =>
  apiRequest<{ gameId: string; eventId: string }>(`/api/games/${gameId}`, {
    method: 'DELETE',
    adminToken,
  });

export const recordGoal = (
  gameId: string,
  payload: {
    clientEventId: string;
    teamSide: 'A' | 'B';
    scorerRosterId: string;
    assistantRosterId?: string;
    clientTs: number;
  },
  adminToken: string,
) =>
  apiRequest<{ scoreA: number; scoreB: number }>(`/api/games/${gameId}/events`, {
    method: 'POST',
    body: JSON.stringify({ ...payload, type: 'GOAL' }),
    adminToken,
  });

export const undoEvent = (gameId: string, eventId: string, adminToken: string) =>
  apiRequest<{ scoreA: number; scoreB: number }>(`/api/games/${gameId}/events/${eventId}`, {
    method: 'DELETE',
    adminToken,
  });

export type BatchReplayResult = {
  applied: number;
  scoreA: number;
  scoreB: number;
  idempotentHits: number;
};

export const batchGameEvents = (
  gameId: string,
  events: Array<{
    clientEventId: string;
    type: 'GOAL' | 'OWN_GOAL' | 'UNDO';
    teamSide?: 'A' | 'B';
    scorerRosterId?: string;
    assistantRosterId?: string;
    undoTargetEventId?: string;
    undoTargetClientEventId?: string;
    clientTs: number;
  }>,
  adminToken: string,
) =>
  apiRequest<BatchReplayResult>(`/api/games/${gameId}/events/batch`, {
    method: 'POST',
    body: JSON.stringify({ events }),
    adminToken,
  });
