import { apiRequest } from './client';
import type { EventReport, GameReport } from './types';

export const fetchEventReport = (idOrShortCode: string) =>
  apiRequest<EventReport>(
    `/api/events/${encodeURIComponent(idOrShortCode)}/report`,
  );

export const fetchGameReport = (gameId: string) =>
  apiRequest<GameReport>(`/api/games/${gameId}/report`);
