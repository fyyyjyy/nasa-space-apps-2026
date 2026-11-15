// Checks asset budgets (Requirement 13.9): textures <= 2048 px wide, models <= 5 MB.
// Texture paths come from src/data/site.json, model paths from src/data/missions.json,
// both relative to public/. Missing files are skipped with a note. Exits 1 on violation.
import { readFileSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { validateAssetBudget } from '../src/core/dataValidator.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const readJson = (rel) => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));

/** Reads image width from PNG, JPEG or WebP header bytes. Returns null if unknown. */
export function imageWidth(buf) {
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) return buf.readUInt32BE(16);
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) {
        i += 1;
        continue;
      }
      const marker = buf[i + 1];
      if (marker === 0xff) {
        i += 1;
        continue;
      }
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        i += 2;
        continue;
      }
      // SOF0..SOF15 except DHT (c4), JPG (c8), DAC (cc)
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return buf.readUInt16BE(i + 7);
      }
      i += 2 + buf.readUInt16BE(i + 2);
    }
    return null;
  }
  if (buf.length > 30 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = buf.toString('ascii', 12, 16);
    if (chunk === 'VP8X') return 1 + buf.readUIntLE(24, 3);
    if (chunk === 'VP8L') return 1 + (buf.readUInt16LE(21) & 0x3fff);
    if (chunk === 'VP8 ') return buf.readUInt16LE(26) & 0x3fff;
  }
  return null;
}

const site = readJson('src/data/site.json');
const missions = readJson('src/data/missions.json');
const assets = [];
let problems = 0;

for (const [body, b] of Object.entries(site.bodies ?? {})) {
  const rel = b?.texture;
  if (typeof rel !== 'string') {
    console.error(`ERROR site.json: bodies.${body}.texture is missing`);
    problems += 1;
    continue;
  }
  const file = path.join(publicDir, rel);
  if (!existsSync(file)) {
    console.warn(`SKIP  texture ${rel}: file not present`);
    continue;
  }
  const w = imageWidth(readFileSync(file));
  if (w === null) {
    console.error(`ERROR texture ${rel}: cannot read image width (unsupported format)`);
    problems += 1;
    continue;
  }
  console.log(`CHECK texture ${rel}: ${w} px`);
  assets.push({ kind: 'texture', path: rel, widthPx: w });
}

for (const m of Array.isArray(missions) ? missions : []) {
  const rel = m?.model?.path;
  if (typeof rel !== 'string') {
    console.warn(`SKIP  model for ${m?.id}: no model path in missions.json yet`);
    continue;
  }
  const file = path.join(publicDir, rel);
  if (!existsSync(file)) {
    console.warn(`SKIP  model ${rel}: file not present`);
    continue;
  }
  const bytes = statSync(file).size;
  console.log(`CHECK model ${rel}: ${bytes} bytes`);
  assets.push({ kind: 'model', path: rel, bytes });
}

const res = validateAssetBudget(assets);
for (const err of res.errors) console.error(`ERROR ${err}`);
if (problems > 0 || !res.ok) {
  console.error('\nAsset check failed.');
  process.exit(1);
}
console.log('\nAsset check passed.');
