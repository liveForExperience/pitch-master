export function buildGameRecordHref(
  gameId: string,
  ctx: { shortCode: string; eventId: string },
): string {
  const params = new URLSearchParams({
    shortCode: ctx.shortCode,
    eventId: ctx.eventId,
  });
  return `/games/${gameId}/record?${params.toString()}`;
}
