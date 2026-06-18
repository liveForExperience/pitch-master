import { Hono } from 'hono';

const startedAt = Date.now();

export const healthRoute = new Hono().get('/health', (c) =>
  c.json({
    status: 'ok',
    service: 'pitchmaster-backend',
    version: '0.1.0',
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    serverTime: new Date().toISOString(),
  }),
);
