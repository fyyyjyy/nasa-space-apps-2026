// Validates content at load time (Requirements 6.3, 9.2). Pure: no DOM, no logging.
import { validateMissions, validateQuizzes, validateAudio } from './dataValidator.js';

const CHAPTER_ERR = /^mission (\S+) chapter\[(\d+)\]/;

/**
 * Validates the loaded data files.
 * Returns { errors, missions, unavailable }:
 *  - errors: every validation message
 *  - missions: copy of the missions with invalid chapters removed
 *  - unavailable: ids of missions that cannot be shown (a mission-level error,
 *    or fewer chapters left than the validator allows)
 */
export function checkContent({ missions, quizzes, audio }) {
  const errors = [];
  const m = validateMissions(missions);
  errors.push(...m.errors);
  if (quizzes !== undefined) errors.push(...validateQuizzes(quizzes, missions).errors);
  if (audio !== undefined) errors.push(...validateAudio(audio, missions).errors);

  const list = Array.isArray(missions) ? missions : [];
  const badChapters = new Map(); // missionId -> Set(index)
  for (const e of m.errors) {
    const hit = CHAPTER_ERR.exec(e);
    if (!hit) continue;
    if (!badChapters.has(hit[1])) badChapters.set(hit[1], new Set());
    badChapters.get(hit[1]).add(Number(hit[2]));
  }

  const unavailable = [];
  const cleaned = list.map((mission) => {
    const bad = badChapters.get(mission?.id);
    const chapters = Array.isArray(mission?.chapters)
      ? mission.chapters.filter((_, i) => !bad?.has(i))
      : [];
    const missionLevel = m.errors.some(
      (e) => e.startsWith(`mission ${mission?.id}:`) && !/ chapter has | chapters \(/.test(e),
    );
    if (chapters.length === 0 || missionLevel) unavailable.push(mission?.id);
    return { ...mission, chapters };
  });

  return { errors, missions: cleaned, unavailable };
}

/** Dev: throws with a readable list. Production: returns the cleaned data and the unavailable ids. */
export function loadContent(data, { isDev = false, log = console.error } = {}) {
  const res = checkContent(data);
  if (res.errors.length === 0) return res;
  const text = `Content validation failed (${res.errors.length}):\n${res.errors.map((e) => `  - ${e}`).join('\n')}`;
  if (isDev) throw new Error(text);
  log(text);
  return res;
}
