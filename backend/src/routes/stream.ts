import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { getDb } from '../db/client.js';
import { subscribe } from '../lib/sse-broker.js';
import { getGameState } from '../services/game-ops.service.js';
import { NotFoundError } from '../lib/errors.js';
import { fail } from '../lib/api-response.js';

export const streamRoute = new Hono();

streamRoute.get('/games/:id/stream', async (c) => {
  const gameId = c.req.param('id');
  const db = getDb();

  try {
    await getGameState(db, gameId);
  } catch (err) {
    if (err instanceof NotFoundError) return fail(c, 'not_found', err.message, 404);
    throw err;
  }

  return streamSSE(c, async (stream) => {
    const unsubscribe = subscribe(gameId, (event, data) => {
      void stream.writeSSE({ event, data: JSON.stringify(data) });
    });

    const tick = setInterval(async () => {
      try {
        const state = await getGameState(db, gameId);
        await stream.writeSSE({
          event: 'timer_tick',
          data: JSON.stringify({
            elapsedMs: state.timer.elapsedMs,
            status: state.timer.status,
          }),
        });
      } catch {
        /* game may have been deleted */
      }
    }, 1000);

    stream.onAbort(() => {
      clearInterval(tick);
      unsubscribe();
    });

    // initial snapshot
    const initial = await getGameState(db, gameId);
    await stream.writeSSE({
      event: 'game_update',
      data: JSON.stringify({
        type: 'SNAPSHOT',
        scoreA: initial.scoreA,
        scoreB: initial.scoreB,
        elapsedMs: initial.timer.elapsedMs,
        status: initial.timer.status,
      }),
    });

    // keep alive until client disconnects
    while (true) {
      await stream.sleep(60_000);
      await stream.writeSSE({ event: 'ping', data: '{}' });
    }
  });
});
