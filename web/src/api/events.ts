import { apiRequest } from './client';
import type { CreatedEvent, EditorState, EventDetail, GameDetail } from './types';
import { getOrCreateDeviceId } from '../lib/device-id';

export const fetchServerTime = () => apiRequest<{ serverNow: number }>('/api/time');

export const createEvent = (name: string) =>
  apiRequest<CreatedEvent>('/api/events', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });

export const fetchEvent = (shortCode: string) =>
  apiRequest<EventDetail>(`/api/events/${shortCode.trim().toUpperCase()}`);

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

type GameRequestOpts = { adminToken?: string; deviceId?: string };

function gameDeviceId(deviceId?: string) {
  return deviceId ?? getOrCreateDeviceId();
}

export const fetchGame = (gameId: string, deviceId?: string) =>
  apiRequest<GameDetail>(`/api/games/${gameId}`, {
    deviceId: gameDeviceId(deviceId),
  });

export const fetchGameState = (gameId: string) =>
  apiRequest<{ scoreA: number; scoreB: number; timer: GameDetail['timer']; status: string }>(
    `/api/games/${gameId}/state`,
  );

export const claimEditorLease = (
  gameId: string,
  adminToken: string,
  opts?: { force?: boolean; deviceId?: string },
) =>
  apiRequest<{ deviceId: string; expiresAt: number }>(`/api/games/${gameId}/editor`, {
    method: 'POST',
    body: JSON.stringify({
      deviceId: gameDeviceId(opts?.deviceId),
      force: Boolean(opts?.force),
    }),
    adminToken,
    deviceId: gameDeviceId(opts?.deviceId),
  });

export const releaseEditorLease = (
  gameId: string,
  adminToken: string,
  deviceId?: string,
) => {
  const id = gameDeviceId(deviceId);
  return apiRequest<{ released: boolean }>(
    `/api/games/${gameId}/editor?deviceId=${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      adminToken,
      deviceId: id,
    },
  );
};

export const startGame = (
  gameId: string,
  adminToken: string,
  opts?: GameRequestOpts & { version?: number },
) =>
  apiRequest<unknown>(`/api/games/${gameId}/start`, {
    method: 'POST',
    body: JSON.stringify({ version: opts?.version }),
    adminToken,
    deviceId: gameDeviceId(opts?.deviceId),
  });

export const pauseGame = (
  gameId: string,
  adminToken: string,
  opts?: GameRequestOpts & { version?: number },
) =>
  apiRequest<unknown>(`/api/games/${gameId}/pause`, {
    method: 'POST',
    body: JSON.stringify({ version: opts?.version }),
    adminToken,
    deviceId: gameDeviceId(opts?.deviceId),
  });

export const resumeGame = (
  gameId: string,
  adminToken: string,
  opts?: GameRequestOpts & { version?: number },
) =>
  apiRequest<unknown>(`/api/games/${gameId}/resume`, {
    method: 'POST',
    body: JSON.stringify({ version: opts?.version }),
    adminToken,
    deviceId: gameDeviceId(opts?.deviceId),
  });

export const finishGame = (
  gameId: string,
  adminToken: string,
  opts?: GameRequestOpts & { version?: number },
) =>
  apiRequest<unknown>(`/api/games/${gameId}/finish`, {
    method: 'POST',
    body: JSON.stringify({ version: opts?.version }),
    adminToken,
    deviceId: gameDeviceId(opts?.deviceId),
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
  deviceId?: string,
) =>
  apiRequest<{ scoreA: number; scoreB: number }>(`/api/games/${gameId}/events`, {
    method: 'POST',
    body: JSON.stringify({ ...payload, type: 'GOAL' }),
    adminToken,
    deviceId: gameDeviceId(deviceId),
  });

export const undoEvent = (
  gameId: string,
  eventId: string,
  adminToken: string,
  deviceId?: string,
) =>
  apiRequest<{ scoreA: number; scoreB: number }>(`/api/games/${gameId}/events/${eventId}`, {
    method: 'DELETE',
    adminToken,
    deviceId: gameDeviceId(deviceId),
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
  deviceId?: string,
) =>
  apiRequest<BatchReplayResult>(`/api/games/${gameId}/events/batch`, {
    method: 'POST',
    body: JSON.stringify({ events }),
    adminToken,
    deviceId: gameDeviceId(deviceId),
  });

export type { EditorState };
