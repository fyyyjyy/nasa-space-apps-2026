import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { buildQuizSession } from '../src/core/quizLogic.js';

// Feature: nasa-space-apps-2026, Property 20: Quiz session preserves content and correct answers
// **Validates: Requirements 7.2, 7.6**

const text = fc.string({ minLength: 1, maxLength: 20 });

const questionArb = (qid) =>
  fc
    .tuple(text, text, fc.array(text, { minLength: 4, maxLength: 4 }), fc.integer({ min: 0, max: 3 }))
    .map(([prompt, explanation, texts, correctIdx]) => ({
      id: `q${qid}`,
      prompt,
      explanation,
      choices: texts.map((t, i) => ({ id: `q${qid}-c${i}`, text: t, correct: i === correctIdx })),
    }));

const quizArb = fc
  .tuple(questionArb(1), questionArb(2), questionArb(3), text)
  .map(([a, b, c, missionId]) => ({ missionId, questions: [a, b, c] }));

// Arbitrary random source: a sequence of floats in [0, 1).
const rngArb = fc.array(fc.double({ min: 0, max: 1, noNaN: true, maxExcluded: true }), {
  minLength: 1,
  maxLength: 30,
});

function makeRng(values) {
  let i = 0;
  return () => values[i++ % values.length];
}

describe('Property 20: Quiz session preserves content and correct answers', () => {
  it('keeps ids, texts and correct choice, does not mutate the source, and starts unanswered', () => {
    fc.assert(
      fc.property(quizArb, rngArb, (quiz, values) => {
        const snapshot = JSON.parse(JSON.stringify(quiz));
        const session = buildQuizSession(quiz, makeRng(values));

        expect(quiz).toEqual(snapshot);
        expect(session.missionId).toBe(quiz.missionId);
        expect(session.questions).toHaveLength(3);
        expect(session.questions.map((q) => q.id).sort()).toEqual(quiz.questions.map((q) => q.id).sort());

        for (const q of session.questions) {
          const src = quiz.questions.find((s) => s.id === q.id);
          expect(q.choices).toHaveLength(4);
          const byId = (a, b) => (a.id < b.id ? -1 : 1);
          expect([...q.choices].sort(byId).map((c) => [c.id, c.text])).toEqual(
            [...src.choices].sort(byId).map((c) => [c.id, c.text]),
          );
          const correct = q.choices.filter((c) => c.correct);
          expect(correct).toHaveLength(1);
          expect(correct[0].id).toBe(src.choices.find((c) => c.correct).id);
          expect(q.explanation).toBe(src.explanation);
          expect(q.prompt).toBe(src.prompt);
        }

        expect(Object.keys(session.answers).sort()).toEqual(quiz.questions.map((q) => q.id).sort());
        for (const v of Object.values(session.answers)) expect(v).toBeNull();
      }),
      { numRuns: 100 },
    );
  });

  it('also holds with the default Math.random source', () => {
    fc.assert(
      fc.property(quizArb, (quiz) => {
        const session = buildQuizSession(quiz);
        for (const q of session.questions) {
          const src = quiz.questions.find((s) => s.id === q.id);
          expect(q.choices.find((c) => c.correct).id).toBe(src.choices.find((c) => c.correct).id);
        }
      }),
      { numRuns: 50 },
    );
  });
});
