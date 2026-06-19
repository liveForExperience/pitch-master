import { Hono } from 'hono';

const startedAt = Date.now();

export function healthPayload() {
  return {
    status: 'ok' as const,
    service: 'pitchmaster-backend',
    version: '0.1.0',
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    serverTime: new Date().toISOString(),
  };
}

export const healthRoute = new Hono()
  .get('/health', (c) => c.json(healthPayload()))
  .get('/healthz', (c) => c.json(healthPayload()));
