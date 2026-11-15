// Validates src/data/*.json with src/core/dataValidator.js.
// Usage: npm run validate-data. Exits 1 when any error is found.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { validateMissions, validateQuizzes, validateAudio } from '../src/core/dataValidator.js';

const dataDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/data');
let failed = false;

function load(name, required) {
  const file = path.join(dataDir, name);
  if (!existsSync(file)) {
    if (required) {
      console.error(`ERROR ${name}: file is missing`);
      failed = true;
    } else {
      console.warn(`WARN  ${name}: not yet written (skipped)`);
    }
    return undefined;
  }
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    console.error(`ERROR ${name}: cannot parse JSON (${e.message})`);
    failed = true;
    return undefined;
  }
}

function report(name, res) {
  if (res.ok) {
    console.log(`OK    ${name}`);
    return;
  }
  failed = true;
  console.error(`ERROR ${name}: ${res.errors.length} problem(s)`);
  for (const err of res.errors) console.error(`  - ${err}`);
}

const missions = load('missions.json', true);
load('site.json', true);
const quizzes = load('quizzes.json', false);
const audio = load('audio.json', false);

if (missions !== undefined) {
  if (Array.isArray(missions)) {
    const empty = missions.filter((m) => !Array.isArray(m?.chapters) || m.chapters.length === 0).map((m) => m?.id);
    if (empty.length) console.warn(`NOTE  chapters not yet written for: ${empty.join(', ')}`);
  }
  report('missions.json', validateMissions(missions));
}
if (quizzes !== undefined) report('quizzes.json', validateQuizzes(quizzes, Array.isArray(missions) ? missions : undefined));
if (audio !== undefined) report('audio.json', validateAudio(audio, Array.isArray(missions) ? missions : undefined));

if (failed) {
  console.error('\nData validation failed.');
  process.exit(1);
}
console.log('\nData validation passed.');
