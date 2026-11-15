import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateQuizzes } from '../src/core/dataValidator.js';

const load = (f) => JSON.parse(readFileSync(resolve(process.cwd(), 'src/data', f), 'utf8'));
const quizzes = load('quizzes.json');
const missions = load('missions.json');
const missionIds = new Set(missions.map((m) => m.id));

describe('quizzes.json structure', () => {
  it('passes the data validator (without requiring every mission yet)', () => {
    const res = validateQuizzes(quizzes);
    expect(res.errors).toEqual([]);
    expect(res.ok).toBe(true);
  });

  it('has at most one quiz per known mission', () => {
    const ids = quizzes.map((q) => q.missionId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(missionIds.has(id)).toBe(true);
  });

  it('has a quiz for every mission', () => {
    const ids = new Set(quizzes.map((q) => q.missionId));
    expect(missionIds.size).toBe(6);
    for (const id of missionIds) expect(ids.has(id)).toBe(true);
  });
  for (const quiz of quizzes) {
    describe(quiz.missionId, () => {
      it('has 3 questions with 4 choices and exactly one correct', () => {
        expect(quiz.questions).toHaveLength(3);
        for (const q of quiz.questions) {
          expect(q.choices).toHaveLength(4);
          expect(q.choices.filter((c) => c.correct)).toHaveLength(1);
          expect(new Set(q.choices.map((c) => c.id)).size).toBe(4);
          expect(q.prompt.trim()).not.toBe('');
          expect(q.explanation.trim()).not.toBe('');
        }
      });

      it('has unique question ids and nasa.gov source urls', () => {
        expect(new Set(quiz.questions.map((q) => q.id)).size).toBe(3);
        for (const q of quiz.questions) {
          expect(new URL(q.sourceUrl).hostname).toMatch(/(^|\.)nasa\.gov$/);
        }
      });
    });
  }
});
