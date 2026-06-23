import { Hono } from 'hono';
import { getDb } from '../db/client.js';
import { fail, ok } from '../lib/api-response.js';
import { readJson } from '../lib/http.js';
import { mapServiceError } from '../lib/route-errors.js';
import { createPerson, listPersons, renamePerson } from '../services/person.service.js';

export const personsRoute = new Hono();

personsRoute.get('/persons', async (c) => {
  const db = getDb();
  const data = await listPersons(db);
  return ok(c, { persons: data });
});

personsRoute.post('/persons', async (c) => {
  const db = getDb();
  const body = await readJson<{ displayName?: string }>(c);
  if (!body.displayName?.trim()) {
    return fail(c, 'validation_error', 'displayName is required', 400);
  }
  try {
    const data = await createPerson(db, body.displayName);
    return ok(c, data, 201);
  } catch (err) {
    const mapped = mapServiceError(c, err);
    if (mapped) return mapped;
    throw err;
  }
});

personsRoute.patch('/persons/:id', async (c) => {
  const db = getDb();
  const body = await readJson<{ displayName?: string }>(c);
  if (!body.displayName?.trim()) {
    return fail(c, 'validation_error', 'displayName is required', 400);
  }
  try {
    const data = await renamePerson(db, c.req.param('id'), body.displayName);
    return ok(c, data);
  } catch (err) {
    const mapped = mapServiceError(c, err);
    if (mapped) return mapped;
    throw err;
  }
});
