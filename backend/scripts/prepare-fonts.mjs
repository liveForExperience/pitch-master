#!/usr/bin/env node
/**
 * Subset Noto Sans SC for poster rendering (ARCH §7.4).
 * Sources: @fontsource/noto-sans-sc (hoisted from workspace root).
 * Run: node scripts/prepare-fonts.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '../src/assets/fonts');
const repoRoot = path.join(__dirname, '../..');
const fontPkg = path.join(repoRoot, 'node_modules/@fontsource/noto-sans-sc/files');

const SOURCES = {
  regular: path.join(fontPkg, 'noto-sans-sc-chinese-simplified-400-normal.woff'),
  bold: path.join(fontPkg, 'noto-sans-sc-chinese-simplified-700-normal.woff'),
};

const SUBSET_TEXT = [
  '0123456789',
  'PitchMaster',
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  ' ·:-—/|·\'"（）()[]【】',
  '活动战报单场比分积分榜射手榜助攻榜场次结果进球流水本场MVP',
  '胜平负已结束进行中暂停待开始未结束乌龙助攻分钟',
  '想下次也来踢吗进主页红蓝绿队赛分进失排名队伍',
  '一二三四五六七八九十百千万年月日时分秒',
  '陈宇王勇李雷韩梅梅张三李四王五甲乙丙丁',
].join('');

const MAX_BYTES = 250 * 1024;

async function subset(name, sourcePath, outFile) {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(
      `Missing ${sourcePath}. Run: npm install @fontsource/noto-sans-sc (from repo root)`,
    );
  }
  console.log(`→ ${name}…`);
  const source = fs.readFileSync(sourcePath);
  const subsetted = await subsetFont(source, SUBSET_TEXT, { targetFormat: 'woff' });
  if (subsetted.byteLength > MAX_BYTES) {
    console.warn(
      `  warn: ${name} is ${subsetted.byteLength} bytes (> ${MAX_BYTES}); still writing`,
    );
  }
  fs.writeFileSync(outFile, Buffer.from(subsetted));
  console.log(`  ✓ ${path.basename(outFile)} (${subsetted.byteLength} bytes)`);
}

fs.mkdirSync(outDir, { recursive: true });

await subset('Regular', SOURCES.regular, path.join(outDir, 'NotoSansSC-Regular-subset.woff'));
await subset('Bold', SOURCES.bold, path.join(outDir, 'NotoSansSC-Bold-subset.woff'));

console.log('Fonts ready in', outDir);
