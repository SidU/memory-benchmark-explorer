import type { Question, ScoreResult } from './types';

const T_REF_PER_QUESTION = 60;
const MIN_TIME_FACTOR = 0.5;

const normalize = (value: string) => value.trim().toLowerCase();

export const isAnswerCorrect = (question: Question, response: string) => {
  const normalized = normalize(response);
  const answers = [question.answer, ...(question.aliases ?? [])].map(normalize);
  return answers.includes(normalized);
};

export const scoreResponses = (
  questions: Question[],
  answers: Record<string, string>,
  durationMs: number
): ScoreResult => {
  const total = questions.length;
  const correct = questions.filter((question) => {
    const response = answers[question.id] ?? '';
    return isAnswerCorrect(question, response);
  }).length;
  const accuracy = total === 0 ? 0 : correct / total;
  const durationSeconds = Math.max(durationMs / 1000, 1);
  const tRef = T_REF_PER_QUESTION * total;
  const timeFactor = Math.min(1, Math.max(MIN_TIME_FACTOR, Math.sqrt(tRef / durationSeconds)));
  const composite = accuracy * timeFactor * 100;

  return {
    accuracy,
    total,
    correct,
    durationMs,
    composite,
    timeFactor
  };
};

export const scoreJudgments = (
  questions: Question[],
  judgments: Record<string, boolean>,
  durationMs: number
): ScoreResult => {
  const total = questions.length;
  const correct = questions.filter((question) => judgments[question.id]).length;
  const accuracy = total === 0 ? 0 : correct / total;
  const durationSeconds = Math.max(durationMs / 1000, 1);
  const tRef = T_REF_PER_QUESTION * total;
  const timeFactor = Math.min(1, Math.max(MIN_TIME_FACTOR, Math.sqrt(tRef / durationSeconds)));
  const composite = accuracy * timeFactor * 100;

  return {
    accuracy,
    total,
    correct,
    durationMs,
    composite,
    timeFactor
  };
};

export const formatDuration = (durationMs: number) => {
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

export const getScoringConfig = () => ({
  T_REF_PER_QUESTION,
  MIN_TIME_FACTOR
});
