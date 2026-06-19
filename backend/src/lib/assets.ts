import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

/** Resolve backend assets from src/ or dist/ at runtime. */
export function assetPath(...segments: string[]): string {
  return path.join(moduleDir, '..', 'assets', ...segments);
}

export function readAsset(...segments: string[]): Buffer {
  const full = assetPath(...segments);
  if (!fs.existsSync(full)) {
    throw new Error(
      `Missing asset ${full}. Run: cd backend && node scripts/prepare-fonts.mjs`,
    );
  }
  return fs.readFileSync(full);
}
