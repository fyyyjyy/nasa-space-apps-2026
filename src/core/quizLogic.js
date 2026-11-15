// Pure quiz logic. No DOM, no Three.js, no UI imports.

export const QUIZ_TOTAL = 3;

// Defined here (not imported from ui/strings.js) so core has no UI dependency.
export const SCORE_MESSAGES = [
  'Every explorer starts somewhere. Read the story again and give it another try.',
  'Good start. You picked up some of the mission details.',
  'Great work. You remember most of this mission.',
  'Perfect score. You are a true silent explorer.',
];

const FALLBACK_EXPLANATION = 'See the mission story for the details.';

/** Fisher-Yates shuffle. Returns a new array and never mutates the input. */
export function shuffle(array, rng = Math.random) {
  const out = array.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.floor(rng() * (i + 1)));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Builds a runtime session with shuffled questions and choices.
 * Choices keep their ids and `correct` flags. The source quiz is not mutated.
 */
export function buildQuizSession(quiz, rng = Math.random) {
  const questions = shuffle(quiz.questions, rng).map((q) => ({
    id: q.id,
    prompt: q.prompt,
    choices: shuffle(q.choices, rng).map((c) => ({ ...c })),
    explanation: q.explanation,
  }));
  const answers = {};
  for (const q of questions) answers[q.id] = null;
  return { missionId: quiz.missionId, questions, answers };
}

/** Correct if and only if chosenId is the id of the correct choice. */
export function scoreAnswer(question, chosenId) {
  const correctChoice = question.choices.find((c) => c.correct);
  const correct = !!correctChoice && chosenId != null && chosenId === correctChoice.id;
  const explanation =
    typeof question.explanation === 'string' && question.explanation.trim() !== ''
      ? question.explanation
      : FALLBACK_EXPLANATION;
  return { correct, explanation };
}

/** Message for a score 0..3. Out-of-range values are clamped. Always non-empty. */
export function messageForScore(score) {
  const n = Number.isFinite(score) ? Math.round(score) : 0;
  return SCORE_MESSAGES[Math.max(0, Math.min(QUIZ_TOTAL, n))];
}

/**
 * Scores a list of answer results. Each entry is a boolean or `{ correct }`
 * (the value returned by `scoreAnswer`).
 */
export function scoreSession(answers) {
  const list = Array.isArray(answers) ? answers : [];
  const raw = list.filter((a) => (typeof a === 'boolean' ? a : !!(a && a.correct))).length;
  const score = Math.min(QUIZ_TOTAL, raw);
  return { score, total: QUIZ_TOTAL, message: messageForScore(score) };
}
