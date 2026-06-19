export function eventPosterUrl(idOrShortCode: string): string {
  return `/api/events/${encodeURIComponent(idOrShortCode)}/poster.png`;
}

export function gamePosterUrl(gameId: string): string {
  return `/api/games/${encodeURIComponent(gameId)}/poster.png`;
}
