import type { ScoreEvent } from '../types/domain.js';

export function deriveScore(events: ScoreEvent[]): { scoreA: number; scoreB: number } {
  const undone = new Set(
    events.filter((e) => e.type === 'UNDO' && e.undoTargetEventId).map((e) => e.undoTargetEventId!),
  );
  let scoreA = 0;
  let scoreB = 0;
  for (const e of events) {
    if (undone.has(e.id)) continue;
    if (e.type === 'GOAL') {
      if (e.teamSide === 'A') scoreA++;
      else if (e.teamSide === 'B') scoreB++;
    }
    if (e.type === 'OWN_GOAL') {
      if (e.teamSide === 'A') scoreB++;
      else if (e.teamSide === 'B') scoreA++;
    }
  }
  return { scoreA, scoreB };
}
