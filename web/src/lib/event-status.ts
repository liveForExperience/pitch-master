import type { EventDetail } from '../api/types';

/** 活动是否已结束（仅管理员手动结束后为 true） */
export function isEventEnded(event: EventDetail): boolean {
  return event.status === 'FINISHED';
}
