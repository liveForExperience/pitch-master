#!/usr/bin/env node
/**
 * Render both event + game poster fixtures to /tmp for visual review.
 * Run: cd backend && node --experimental-vm-modules --import tsx scripts/preview-poster.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { createEvent } from '../src/services/event.service.ts';
import {
  addRosterMembers,
  createGame,
  createTeam,
  finishGame,
  recordGameEvent,
  startGame,
} from '../src/services/game-ops.service.ts';
import { renderEventPosterPng, renderGamePosterPng } from '../src/services/poster.service.ts';
import { createTestDb, useDbConnection } from '../src/db/client.ts';
import { runMigrations } from '../src/db/migrate.ts';
import { resetPosterCacheForTests } from '../src/lib/poster-cache.ts';

const conn = createTestDb();
runMigrations(conn.db, conn.sqlite);
useDbConnection(conn);
const db = conn.db;
resetPosterCacheForTests();

const evt = await createEvent(db, '周末足球局');
const red = await createTeam(db, evt.id, { name: '红队', colorHex: '#C44536' });
const blue = await createTeam(db, evt.id, { name: '蓝队', colorHex: '#3964B0' });
const green = await createTeam(db, evt.id, { name: '绿队', colorHex: '#3E8E5A' });

const [r1, r2, r3] = await addRosterMembers(db, red.id, ['张三', '王勇', '李雷']);
const [b1, b2, b3] = await addRosterMembers(db, blue.id, ['韩梅梅', '陈宇', '李四']);
const [g1] = await addRosterMembers(db, green.id, ['王五']);

// Game 1: red 3-2 blue
const g1m = await createGame(db, evt.id, { teamAId: red.id, teamBId: blue.id });
await startGame(db, g1m.id);
const now = Date.now();
const events1 = [
  { type: 'GOAL', teamSide: 'A', scorer: r1, assist: r2, minute: 12 },
  { type: 'GOAL', teamSide: 'B', scorer: b1, assist: b2, minute: 18 },
  { type: 'GOAL', teamSide: 'A', scorer: r2, minute: 28 },
  { type: 'GOAL', teamSide: 'B', scorer: b3, minute: 41 },
  { type: 'GOAL', teamSide: 'A', scorer: r1, assist: r3, minute: 67 },
];
for (const [i, e] of events1.entries()) {
  await recordGameEvent(db, g1m.id, {
    clientEventId: `g1-${i}`,
    type: e.type,
    teamSide: e.teamSide,
    scorerRosterId: e.scorer.id,
    assistantRosterId: e.assist?.id ?? null,
    clientTs: now + i * 1000,
  });
}
await finishGame(db, g1m.id);

// Game 2: red 1-1 green
const g2m = await createGame(db, evt.id, { teamAId: red.id, teamBId: green.id });
await startGame(db, g2m.id);
await recordGameEvent(db, g2m.id, { clientEventId: 'g2-0', type: 'GOAL', teamSide: 'A', scorerRosterId: r3.id, clientTs: now });
await recordGameEvent(db, g2m.id, { clientEventId: 'g2-1', type: 'GOAL', teamSide: 'B', scorerRosterId: g1.id, clientTs: now + 1000 });
await finishGame(db, g2m.id);

// Game 3: blue 2-0 green
const g3m = await createGame(db, evt.id, { teamAId: blue.id, teamBId: green.id });
await startGame(db, g3m.id);
await recordGameEvent(db, g3m.id, { clientEventId: 'g3-0', type: 'GOAL', teamSide: 'A', scorerRosterId: b1.id, assistantRosterId: b3.id, clientTs: now });
await recordGameEvent(db, g3m.id, { clientEventId: 'g3-1', type: 'GOAL', teamSide: 'A', scorerRosterId: b2.id, clientTs: now + 1000 });
await finishGame(db, g3m.id);

const out = tmpdir();
const eventPng = await renderEventPosterPng(db, evt.shortCode);
const gamePng = await renderGamePosterPng(db, g1m.id);

fs.writeFileSync(path.join(out, 'preview-event-poster.png'), eventPng);
fs.writeFileSync(path.join(out, 'preview-game-poster.png'), gamePng);
console.log('Wrote:');
console.log('  ', path.join(out, 'preview-event-poster.png'), `(${eventPng.byteLength}B)`);
console.log('  ', path.join(out, 'preview-game-poster.png'), `(${gamePng.byteLength}B)`);
