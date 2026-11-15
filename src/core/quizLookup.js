/**
 * Finds the quiz for a mission. Returns null when there is none or it has no questions,
 * so the caller can hide the "Test what you learned" button.
 *
 * @param {object[]} quizzes
 * @param {string} missionId
 * @returns {{ missionId: string, questions: object[] } | null}
 */
export function findQuiz(quizzes, missionId) {
  if (!Array.isArray(quizzes)) return null;
  const quiz = quizzes.find((q) => q && q.missionId === missionId);
  return quiz && Array.isArray(quiz.questions) && quiz.questions.length > 0 ? quiz : null;
}
