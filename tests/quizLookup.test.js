import { describe, it, expect } from 'vitest';
import { findQuiz } from '../src/core/quizLookup.js';
import quizzes from '../src/data/quizzes.json';

describe('findQuiz', () => {
  it('finds the quiz by mission id', () => {
    expect(findQuiz(quizzes, 'surveyor3')?.missionId).toBe('surveyor3');
  });
  it('returns null for unknown, empty or malformed input', () => {
    expect(findQuiz(quizzes, 'nope')).toBeNull();
    expect(findQuiz([{ missionId: 'a', questions: [] }], 'a')).toBeNull();
    expect(findQuiz([{ missionId: 'a' }], 'a')).toBeNull();
    expect(findQuiz(undefined, 'a')).toBeNull();
  });
});
