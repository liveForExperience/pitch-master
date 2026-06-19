import { asc, eq, max } from 'drizzle-orm';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { createElement, type ReactElement } from 'react';
import type { AppDb } from '../db/client.js';
import { events, gameEvents, games } from '../db/schema.js';
import { readAsset } from '../lib/assets.js';
import { getPosterCache, setPosterCache } from '../lib/poster-cache.js';
import { NotFoundError } from '../lib/errors.js';
import { EventPosterTemplate, estimateEventPosterHeight } from '../poster/EventPosterTemplate.js';
import { GamePosterTemplate } from '../poster/GamePosterTemplate.js';
import { gamePosterHeight, posterWidth } from '../poster/tokens.js';
import {
  getEventReport,
  getGameReport,
  REPORT_TOP_N,
  resolveEventId,
} from './report.service.js';

export { estimateEventPosterHeight };

type FontSet = {
  regular: Buffer;
  bold: Buffer;
};

let fonts: FontSet | null = null;

function loadFonts(): FontSet {
  if (fonts) return fonts;
  fonts = {
    regular: readAsset('fonts', 'NotoSansSC-Regular-subset.woff'),
    bold: readAsset('fonts', 'NotoSansSC-Bold-subset.woff'),
  };
  return fonts;
}

export function resetPosterFontsForTests(): void {
  fonts = null;
}

const satoriFonts = () => {
  const f = loadFonts();
  return [
    { name: 'NotoSC', data: f.regular, weight: 400 as const, style: 'normal' as const },
    { name: 'NotoSC', data: f.bold, weight: 700 as const, style: 'normal' as const },
  ];
};

async function renderSvg(element: ReactElement, width: number, height: number): Promise<string> {
  return satori(element, {
    width,
    height,
    fonts: satoriFonts(),
  });
}

function svgToPng(svg: string): Buffer {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width' as const, value: posterWidth } });
  return Buffer.from(resvg.render().asPng());
}

async function getLastEventTs(db: AppDb, eventId: string): Promise<number> {
  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) throw new NotFoundError('Event not found');

  const [row] = await db
    .select({ ts: max(gameEvents.serverTs) })
    .from(gameEvents)
    .innerJoin(games, eq(games.id, gameEvents.gameId))
    .where(eq(games.eventId, eventId));

  return row?.ts ?? event.finishedAt ?? event.createdAt;
}

async function getGamePosterContext(db: AppDb, gameId: string, eventId: string) {
  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) throw new NotFoundError('Event not found');

  const eventGames = await db
    .select({ id: games.id })
    .from(games)
    .where(eq(games.eventId, eventId))
    .orderBy(asc(games.createdAt));

  const gameNumber = Math.max(
    1,
    eventGames.findIndex((g) => g.id === gameId) + 1,
  );

  return {
    eventName: event.name,
    shortCode: event.shortCode,
    gameNumber,
  };
}

export async function renderEventPosterPng(
  db: AppDb,
  idOrShortCode: string,
): Promise<Buffer> {
  const eventId = await resolveEventId(db, idOrShortCode);
  const lastEventTs = await getLastEventTs(db, eventId);
  const cacheKey = `${eventId}:${REPORT_TOP_N}:${lastEventTs}`;

  const cached = getPosterCache(cacheKey);
  if (cached) return cached;

  const report = await getEventReport(db, idOrShortCode);
  const height = estimateEventPosterHeight(report);
  const svg = await renderSvg(createElement(EventPosterTemplate, { report }), posterWidth, height);
  const png = svgToPng(svg);
  setPosterCache(cacheKey, png);
  return png;
}

export async function renderGamePosterPng(db: AppDb, gameId: string): Promise<Buffer> {
  const report = await getGameReport(db, gameId);
  const context = await getGamePosterContext(db, gameId, report.game.eventId);
  const svg = await renderSvg(
    createElement(GamePosterTemplate, { report, context }),
    posterWidth,
    gamePosterHeight,
  );
  return svgToPng(svg);
}

/** @internal */
export function isPngBuffer(buf: Buffer): boolean {
  return buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
}
