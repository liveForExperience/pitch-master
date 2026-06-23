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
  type EventReport,
  type GameReport,
  getEventReport,
  getGameReport,
  REPORT_TOP_N,
  resolveEventId,
} from './report.service.js';
import { loadAdditionalPosterAsset } from './poster-emoji.js';
import { buildDynamicCjkFonts, dynamicCjkToSatoriFonts } from './poster-font.js';

export { estimateEventPosterHeight };

type FontSet = {
  regular: Buffer;
  bold: Buffer;
  mono: Buffer;
  serifItalic: Buffer;
};

let fonts: FontSet | null = null;

function loadFonts(): FontSet {
  if (fonts) return fonts;
  fonts = {
    regular: readAsset('fonts', 'NotoSansSC-Regular-subset.woff'),
    bold: readAsset('fonts', 'NotoSansSC-Bold-subset.woff'),
    mono: readAsset('fonts', 'GeistMono-Medium-subset.woff'),
    serifItalic: readAsset('fonts', 'Newsreader-Italic-subset.woff'),
  };
  return fonts;
}

export function resetPosterFontsForTests(): void {
  fonts = null;
}

type SatoriFont = {
  name: string;
  data: Buffer;
  weight: 400 | 500 | 700;
  style: 'normal' | 'italic';
};

function staticSatoriFonts(): SatoriFont[] {
  const f = loadFonts();
  return [
    { name: 'NotoSC', data: f.regular, weight: 400, style: 'normal' },
    { name: 'NotoSC', data: f.bold, weight: 700, style: 'normal' },
    { name: 'GeistMono', data: f.mono, weight: 500, style: 'normal' },
    { name: 'Newsreader', data: f.serifItalic, weight: 500, style: 'italic' },
  ];
}

function collectEventCjkTexts(report: EventReport): string[] {
  const out: string[] = [report.event.name];
  for (const g of report.games) {
    out.push(g.teamA.name, g.teamB.name);
  }
  for (const s of report.standings) out.push(s.teamName);
  for (const r of report.topScorers) out.push(r.name, r.teamName);
  for (const r of report.topAssists) out.push(r.name, r.teamName);
  if (report.mvp) out.push(report.mvp.name, report.mvp.teamName);
  return out;
}

function collectGameCjkTexts(report: GameReport): string[] {
  const out: string[] = [];
  if (report.game.teamA) out.push(report.game.teamA.name);
  if (report.game.teamB) out.push(report.game.teamB.name);
  for (const g of report.goals) {
    out.push(g.scorerName);
    if (g.assistantName) out.push(g.assistantName);
  }
  if (report.gameMvp) out.push(report.gameMvp.name, report.gameMvp.teamName);
  return out;
}

async function buildFontsForTexts(texts: string[]): Promise<SatoriFont[]> {
  const base = staticSatoriFonts();
  const dyn = dynamicCjkToSatoriFonts(await buildDynamicCjkFonts(texts));
  if (dyn.length === 0) return base;
  return [...dyn, ...base];
}

async function renderSvg(
  element: ReactElement,
  width: number,
  height: number,
  cjkTexts: string[],
): Promise<string> {
  return satori(element, {
    width,
    height,
    fonts: await buildFontsForTexts(cjkTexts),
    loadAdditionalAsset: loadAdditionalPosterAsset,
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
  // v2 prefix forces invalidation of phase-1 era cached PNGs after the redesign
  const cacheKey = `v2:${eventId}:${REPORT_TOP_N}:${lastEventTs}`;

  const cached = getPosterCache(cacheKey);
  if (cached) return cached;

  const report = await getEventReport(db, idOrShortCode);
  const height = estimateEventPosterHeight(report);
  const svg = await renderSvg(
    createElement(EventPosterTemplate, { report }),
    posterWidth,
    height,
    collectEventCjkTexts(report),
  );
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
    [...collectGameCjkTexts(report), context.eventName],
  );
  return svgToPng(svg);
}

/** @internal */
export function isPngBuffer(buf: Buffer): boolean {
  return buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
}
