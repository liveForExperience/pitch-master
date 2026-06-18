import { apiRequest } from './client';
import type { CreatedEvent, EventDetail, GameDetail } from './types';

export const fetchServerTime = () => apiRequest<{ serverNow: number }>('/api/time');

export const createEvent = (name: string) =>
  apiRequest<CreatedEvent>('/api/events', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });

export const fetchEvent = (shortCode: string) =>
  apiRequest<EventDetail>(`/api/events/${shortCode}`);

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

export const addRoster = (teamId: string, names: string[], adminToken: string) =>
  apiRequest<{ added: Array<{ id: string; name: string }> }>(`/api/teams/${teamId}/roster`, {
    method: 'POST',
    body: JSON.stringify({ names }),
    adminToken,
  });

export const createGame = (
  eventId: string,
  teamAId: string,
  teamBId: string,
  adminToken: string,
) =>
  apiRequest<{ id: string }>(`/api/events/${eventId}/games`, {
    method: 'POST',
    body: JSON.stringify({ teamAId, teamBId }),
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

export const recordGoal = (
  gameId: string,
  payload: {
    clientEventId: string;
    teamSide: 'A' | 'B';
    scorerRosterId: string;
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
