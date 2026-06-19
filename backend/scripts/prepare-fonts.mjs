#!/usr/bin/env node
/**
 * Subset poster/UI fonts:
 *   - Noto Sans SC (Chinese body)
 *   - Geist Mono (numerals, eyebrows, mono labels)
 *   - Newsreader Italic (hero serif accents)
 *
 * Output: backend/src/assets/fonts/*.woff
 * Run: cd backend && npm run fonts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '../src/assets/fonts');
const repoRoot = path.join(__dirname, '../..');

const notoPkg = path.join(repoRoot, 'node_modules/@fontsource/noto-sans-sc/files');
const geistPkg = path.join(repoRoot, 'node_modules/@fontsource/geist-mono/files');
const newsreaderPkg = path.join(repoRoot, 'node_modules/@fontsource/newsreader/files');

const CN_SUBSET = [
  '0123456789',
  'PitchMaster',
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  ' ·:-/|·\'"（）()[]【】+',
  '活动战报单场比分积分榜射手榜助攻榜场次结果进球流水本场',
  '胜平负已结束进行中暂停待开始未结束乌龙助攻分钟全场',
  '想下次也来踢吗进主页红蓝绿队赛分进失排名队伍',
  '一二三四五六七八九十百千万年月日时分秒',
  '陈宇王勇李雷韩梅梅张三李四王五甲乙丙丁',
  '球助场队',
].join('');

// Latin-only subset for Geist Mono: digits + caps eyebrows + minimal punctuation
const MONO_SUBSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz :·.-/|+\'';

// Latin-only italic subset for Newsreader: enough for "win/draw" verdict + hero serif accents
const SERIF_SUBSET = 'WinDrawLossWeekendLeagueMatchabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789·.';

const MAX_BYTES_PER_FILE = 250 * 1024;
const TOTAL_BUDGET = 500 * 1024;

async function subset(label, sourcePath, charset, outFile) {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(
      `Missing ${sourcePath}. Run: npm install (from repo root) to fetch fontsource packages.`,
    );
  }
  const source = fs.readFileSync(sourcePath);
  const subsetted = await subsetFont(source, charset, { targetFormat: 'woff' });
  if (subsetted.byteLength > MAX_BYTES_PER_FILE) {
    console.warn(
      `  warn: ${label} is ${subsetted.byteLength}B (> ${MAX_BYTES_PER_FILE}); still writing`,
    );
  }
  fs.writeFileSync(outFile, Buffer.from(subsetted));
  console.log(`  ${label.padEnd(28)} ${subsetted.byteLength.toString().padStart(7)}B  ${path.basename(outFile)}`);
  return subsetted.byteLength;
}

fs.mkdirSync(outDir, { recursive: true });
console.log('Subsetting fonts to', outDir);

let total = 0;
total += await subset(
  'NotoSC Regular',
  path.join(notoPkg, 'noto-sans-sc-chinese-simplified-400-normal.woff'),
  CN_SUBSET,
  path.join(outDir, 'NotoSansSC-Regular-subset.woff'),
);
total += await subset(
  'NotoSC Bold',
  path.join(notoPkg, 'noto-sans-sc-chinese-simplified-700-normal.woff'),
  CN_SUBSET,
  path.join(outDir, 'NotoSansSC-Bold-subset.woff'),
);
total += await subset(
  'GeistMono Medium',
  path.join(geistPkg, 'geist-mono-latin-500-normal.woff'),
  MONO_SUBSET,
  path.join(outDir, 'GeistMono-Medium-subset.woff'),
);
total += await subset(
  'Newsreader Italic',
  path.join(newsreaderPkg, 'newsreader-latin-500-italic.woff'),
  SERIF_SUBSET,
  path.join(outDir, 'Newsreader-Italic-subset.woff'),
);

console.log(`Total: ${total}B  (budget ${TOTAL_BUDGET}B)`);
if (total > TOTAL_BUDGET) {
  console.error(`Font budget exceeded by ${total - TOTAL_BUDGET}B`);
  process.exit(1);
}
