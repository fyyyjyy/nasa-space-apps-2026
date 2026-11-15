import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { scoreAnswer, scoreSession, messageForScore } from '../src/core/quizLogic.js';

// Feature: nasa-space-apps-2026, Property 21: Quiz scoring
// **Validates: Requirements 7.3, 7.4**

const questionArb = fc
  .record({
    ids: fc.uniqueArray(fc.string({ minLength: 1, maxLength: 6 }), { minLength: 2, maxLength: 4 }),
    correctIdx: fc.nat(3),
    explanation: fc.oneof(fc.string(), fc.constant(undefined)),
  })
  .map(({ ids, correctIdx, explanation }) => ({
    id: 'q',
    prompt: 'p',
    explanation,
    choices: ids.map((id, i) => ({ id, text: id, correct: i === correctIdx % ids.length })),
  }));

describe('Property 21: Quiz scoring', () => {
  it('scoreAnswer is correct iff chosen id is the correct id, with non-empty explanation', () => {
    fc.assert(
      fc.property(questionArb, fc.option(fc.string({ maxLength: 6 }), { nil: null }), (q, extra) => {
        const correctId = q.choices.find((c) => c.correct).id;
        for (const c of q.choices) {
          const r = scoreAnswer(q, c.id);
          expect(r.correct).toBe(c.id === correctId);
          expect(r.explanation.trim().length).toBeGreaterThan(0);
        }
        const r = scoreAnswer(q, extra);
        expect(r.correct).toBe(extra === correctId);
        expect(r.explanation.trim().length).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });

  it('scoreSession returns the count of correct answers, total 3, non-empty message', () => {
    fc.assert(
      fc.property(fc.array(fc.boolean(), { minLength: 3, maxLength: 3 }), (flags) => {
        const expected = flags.filter(Boolean).length;
        for (const input of [flags, flags.map((correct) => ({ correct, explanation: 'x' }))]) {
          const r = scoreSession(input);
          expect(Number.isInteger(r.score)).toBe(true);
          expect(r.score).toBeGreaterThanOrEqual(0);
          expect(r.score).toBeLessThanOrEqual(3);
          expect(r.score).toBe(expected);
          expect(r.total).toBe(3);
          expect(r.message.trim().length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('messageForScore is non-empty for 0 to 3', () => {
    for (const s of [0, 1, 2, 3]) expect(messageForScore(s).trim().length).toBeGreaterThan(0);
  });
});
