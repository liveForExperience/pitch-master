import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

describe('health endpoints', () => {
  it('GET /api/health returns ok status with service metadata', async () => {
    const app = createApp();
    const res = await app.request('/api/health');

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      status: string;
      service: string;
      version: string;
      uptimeSeconds: number;
      serverTime: string;
    };
    expect(body.status).toBe('ok');
    expect(body.service).toBe('pitchmaster-backend');
    expect(body.version).toBe('0.1.0');
    expect(typeof body.uptimeSeconds).toBe('number');
    expect(body.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(Number.isNaN(new Date(body.serverTime).getTime())).toBe(false);
  });

  it('GET /api/healthz mirrors /api/health for uptime probes', async () => {
    const app = createApp();
    const res = await app.request('/api/healthz');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; service: string };
    expect(body.status).toBe('ok');
    expect(body.service).toBe('pitchmaster-backend');
  });

  it('returns 404 for unknown paths', async () => {
    const app = createApp();
    const res = await app.request('/api/does-not-exist');
    expect(res.status).toBe(404);
  });
});
