import { describe, expect, it, beforeEach } from 'vitest';
import { createApp } from '../src/app.js';
import { setupTestDb } from './helpers/test-db.js';

type ApiOk<T> = { ok: true; data: T };
type ApiFail = { ok: false; error: { code: string; message: string } };

describe('events routes', () => {
  beforeEach(() => setupTestDb());

  it('POST /api/events returns shortCode, adminToken, and pin', async () => {
    const app = createApp();
    const res = await app.request('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '周二夜场' }),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as ApiOk<{
      id: string;
      shortCode: string;
      adminToken: string;
      pin: string;
    }>;
    expect(body.ok).toBe(true);
    expect(body.data.shortCode).toHaveLength(6);
    expect(body.data.adminToken.startsWith('tok_')).toBe(true);
    expect(body.data.pin).toMatch(/^\d{6}$/);
  });

  it('POST /api/events rejects empty name', async () => {
    const app = createApp();
    const res = await app.request('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '  ' }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as ApiFail;
    expect(body.error.code).toBe('validation_error');
  });

  it('POST /api/events/:id/finish marks event finished for admin', async () => {
    const app = createApp();
    const created = await app.request('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '结束测试' }),
    });
    const { data } = (await created.json()) as ApiOk<{
      id: string;
      shortCode: string;
      adminToken: string;
    }>;

    const finish = await app.request(`/api/events/${data.id}/finish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${data.adminToken}` },
    });
    expect(finish.status).toBe(200);
    const finishBody = (await finish.json()) as ApiOk<{ eventId: string; finishedAt: number }>;
    expect(finishBody.data.eventId).toBe(data.id);

    const detail = await app.request(`/api/events/${data.shortCode}`);
    const detailBody = (await detail.json()) as ApiOk<{ status: string; finishedAt: number | null }>;
    expect(detailBody.data.status).toBe('FINISHED');
    expect(detailBody.data.finishedAt).not.toBeNull();
  });

  it('POST /api/events/:id/finish rejects duplicate finish', async () => {
    const app = createApp();
    const created = await app.request('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '重复结束' }),
    });
    const { data } = (await created.json()) as ApiOk<{ id: string; adminToken: string }>;

    await app.request(`/api/events/${data.id}/finish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${data.adminToken}` },
    });
    const again = await app.request(`/api/events/${data.id}/finish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${data.adminToken}` },
    });
    expect(again.status).toBe(409);
  });

  it('POST /api/events/:id/restore-token rotates admin token when pin matches', async () => {
    const app = createApp();
    const created = await app.request('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'PIN 恢复' }),
    });
    const { data } = (await created.json()) as ApiOk<{
      id: string;
      adminToken: string;
      pin: string;
    }>;

    const restore = await app.request(
      `/api/events/${data.id}/restore-token?pin=${data.pin}`,
      { method: 'POST' },
    );
    expect(restore.status).toBe(200);
    const restoreBody = (await restore.json()) as ApiOk<{
      restored: boolean;
      adminToken: string;
    }>;
    expect(restoreBody.data.restored).toBe(true);
    expect(restoreBody.data.adminToken).toMatch(/^tok_/);
    expect(restoreBody.data.adminToken).not.toBe(data.adminToken);
  });

  it('POST /api/events/:id/restore-token rejects wrong pin', async () => {
    const app = createApp();
    const created = await app.request('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'PIN 错误' }),
    });
    const { data } = (await created.json()) as ApiOk<{ id: string }>;

    const restore = await app.request(
      `/api/events/${data.id}/restore-token?pin=000000`,
      { method: 'POST' },
    );
    expect(restore.status).toBe(401);
  });
});
