export type OutboxItemStatus = 'PENDING' | 'SENDING' | 'FAILED';

export type OutboxGameEventPayload = {
  clientEventId: string;
  type: 'GOAL' | 'UNDO';
  teamSide?: 'A' | 'B';
  scorerRosterId?: string;
  assistantRosterId?: string;
  undoTargetEventId?: string;
  undoTargetClientEventId?: string;
};

export type OutboxItem = {
  id: string;
  gameId: string;
  /** Parent event id — used to resolve admin token during flush */
  eventId: string;
  payload: OutboxGameEventPayload;
  clientTs: number;
  status: OutboxItemStatus;
  retryCount: number;
  lastError?: string;
};

export type BatchGameEventInput = OutboxGameEventPayload & { clientTs: number };
