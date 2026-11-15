// Prints Flesch-Kincaid grade levels for narratives and quiz text (Requirement 6.3).
// An aid, not a gate: flags passages above grade 7 but always exits 0.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const GRADE_LIMIT = 7;

/** Counts syllables in one word with a vowel-group heuristic. */
export function countSyllables(word) {
  let w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const groups = w.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 0);
}

/** Flesch-Kincaid grade: 0.39*(words/sentences) + 11.8*(syllables/words) - 15.59. */
export function fleschKincaidGrade(text) {
  const words = (String(text).match(/[A-Za-z][A-Za-z'’-]*/g) || []);
  if (words.length === 0) return 0;
  const sentences = Math.max(1, (String(text).match(/[.!?]+(?=\s|$)/g) || []).length);
  const syllables = words.reduce((n, w) => n + countSyllables(w), 0);
  return 0.39 * (words.length / sentences) + 11.8 * (syllables / words.length) - 15.59;
}

/** Collects { mission, label, text } passages from missions and quizzes data. */
export function collectPassages(missions, quizzes) {
  const out = [];
  for (const m of missions) {
    for (const c of m.chapters || []) out.push({ mission: m.id, label: `${c.id} narrative`, text: c.narrative });
  }
  for (const qm of quizzes) {
    for (const q of qm.questions || []) {
      out.push({ mission: qm.missionId, label: `${q.id} prompt`, text: q.prompt });
      out.push({ mission: qm.missionId, label: `${q.id} explanation`, text: q.explanation });
    }
  }
  return out.filter((p) => typeof p.text === 'string' && p.text.trim());
}

function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const read = (f) => JSON.parse(readFileSync(path.join(root, 'src/data', f), 'utf8'));
  const passages = collectPassages(read('missions.json'), read('quizzes.json'));
  const byMission = new Map();
  const flagged = [];
  for (const p of passages) {
    const g = fleschKincaidGrade(p.text);
    if (!byMission.has(p.mission)) byMission.set(p.mission, []);
    byMission.get(p.mission).push(g);
    if (g > GRADE_LIMIT) flagged.push({ ...p, grade: g });
  }
  console.log('Mean / max Flesch-Kincaid grade per mission:');
  for (const [id, gs] of byMission) {
    const mean = gs.reduce((a, b) => a + b, 0) / gs.length;
    console.log(`  ${id}: mean ${mean.toFixed(1)}, max ${Math.max(...gs).toFixed(1)} (${gs.length} passages)`);
  }
  console.log(`\nPassages above grade ${GRADE_LIMIT}: ${flagged.length}`);
  for (const f of flagged) console.log(`  [${f.grade.toFixed(1)}] ${f.mission} ${f.label}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
