'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import HistoryViewer from '../../components/HistoryViewer';
import Markdown from '../../components/Markdown';
import QuestionPrompt from '../../components/QuestionPrompt';
import { fetchDataset, sampleQuestions } from '../../lib/data';
import type { DatasetVariant, SampledQuestion } from '../../lib/types';
import { formatDuration, scoreJudgments } from '../../lib/scoring';
import { encodeShareToken, makeSharePayload } from '../../lib/share';

const parseVariant = (value: string | null): DatasetVariant =>
  value === 'm' ? 'm' : 's';

const parseCount = (value: string | null) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 10;
  }
  return parsed;
};

export default function TestPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const variant = parseVariant(searchParams.get('variant'));
  const count = parseCount(searchParams.get('count'));
  const seed = searchParams.get('seed') ?? 'default';

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<SampledQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, boolean>>({});
  const [judgments, setJudgments] = useState<Record<string, boolean>>({});
  const [grading, setGrading] = useState<Record<string, boolean>>({});
  const [gradingError, setGradingError] = useState<Record<string, string>>({});
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const currentQuestion = questions[currentIndex];
  const isSubmitted = currentQuestion ? submittedAnswers[currentQuestion.id] : false;
  const isCorrect = currentQuestion ? judgments[currentQuestion.id] : false;
  const isGrading = currentQuestion ? grading[currentQuestion.id] : false;
  const gradeError = currentQuestion ? gradingError[currentQuestion.id] : '';

  const progressLabel = useMemo(() => {
    if (questions.length === 0) {
      return '0/0';
    }
    return `${currentIndex + 1}/${questions.length}`;
  }, [currentIndex, questions.length]);

  useEffect(() => {
    if (!startedAt) {
      return undefined;
    }
    const interval = window.setInterval(() => {
      setElapsed(Date.now() - startedAt);
    }, 500);
    return () => window.clearInterval(interval);
  }, [startedAt]);

  const handleLoad = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const dataset = await fetchDataset(variant);
      const sampled = sampleQuestions(dataset, count, seed);
      setQuestions(sampled);
    } catch (err) {
      setError('Unable to load dataset. Ensure the data files are available.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBegin = async () => {
    if (questions.length === 0) {
      await handleLoad();
    }
    setStartedAt(Date.now());
  };

  const handleSubmit = () => {
    if (!startedAt) {
      return;
    }
    const confirmSubmit = window.confirm('End the test and submit your answers?');
    if (!confirmSubmit) {
      return;
    }
    const durationMs = Date.now() - startedAt;
    const score = scoreJudgments(questions, judgments, durationMs);
    const payload = makeSharePayload(
      variant,
      seed,
      questions.length,
      score.accuracy,
      durationMs,
      score.composite
    );
    const token = encodeShareToken(payload);
    router.push(`/result?token=${encodeURIComponent(token)}`);
  };

  return (
    <main>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Test Runner</h1>
          <p className="notice">
            Variant {variant.toUpperCase()} · {count} questions · Seed {seed}
          </p>
        </div>
        <div className="timer">{formatDuration(elapsed)}</div>
      </div>

      {!startedAt && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3>Ready to begin?</h3>
          <p className="notice">
            The timer starts immediately when you click “Begin Test”.
          </p>
          <div className="footer-actions">
            <button type="button" onClick={handleBegin} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Begin Test'}
            </button>
            <button type="button" className="secondary" onClick={() => router.push('/')}>
              Back
            </button>
          </div>
          {error && <p style={{ color: '#dc2626' }}>{error}</p>}
        </div>
      )}

      {startedAt && questions.length > 0 && (
        <div className="grid" style={{ marginTop: 24 }}>
          <div className="grid two">
            <div className="card">
              <HistoryViewer sessions={currentQuestion.sessions} />
            </div>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span className="tag">Question {progressLabel}</span>
                <span className="tag">Type: {currentQuestion.type}</span>
              </div>
              {currentQuestion.date && (
                <div className="notice" style={{ marginBottom: 12 }}>
                  Asked on {currentQuestion.date}
                </div>
              )}
              <div className="question-prompt">
                <Markdown content={currentQuestion.prompt} className="markdown" />
              </div>
              <QuestionPrompt
                question={currentQuestion}
                value={answers[currentQuestion.id] ?? ''}
                disabled={isSubmitted}
                onChange={(value) =>
                  setAnswers((prev) => ({
                    ...prev,
                    [currentQuestion.id]: value
                  }))
                }
              />
              {isSubmitted && (
                <div style={{ marginTop: 12 }}>
                  <div className={`answer-result ${isCorrect ? 'correct' : 'incorrect'}`}>
                    {isCorrect ? 'Correct.' : 'Incorrect.'}
                  </div>
                  <div className="label">Correct answer</div>
                  <Markdown content={currentQuestion.answer} className="markdown" />
                </div>
              )}
              {gradeError && <p style={{ color: '#dc2626' }}>{gradeError}</p>}
              <div className="footer-actions">
                <button
                  type="button"
                  className="secondary"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={async () => {
                    if (!currentQuestion) {
                      return;
                    }
                    setGrading((prev) => ({ ...prev, [currentQuestion.id]: true }));
                    setGradingError((prev) => ({ ...prev, [currentQuestion.id]: '' }));
                    try {
                      const response = await fetch('/api/grade', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          question: currentQuestion.prompt,
                          answer: currentQuestion.answer,
                          response: answers[currentQuestion.id] ?? ''
                        })
                      });
                      if (!response.ok) {
                        throw new Error('Unable to grade answer. Try again.');
                      }
                      const data = (await response.json()) as { correct: boolean };
                      setJudgments((prev) => ({ ...prev, [currentQuestion.id]: data.correct }));
                      setSubmittedAnswers((prev) => ({
                        ...prev,
                        [currentQuestion.id]: true
                      }));
                    } catch (err) {
                      setGradingError((prev) => ({
                        ...prev,
                        [currentQuestion.id]: 'Unable to grade answer. Try again.'
                      }));
                    } finally {
                      setGrading((prev) => ({ ...prev, [currentQuestion.id]: false }));
                    }
                  }}
                  disabled={isSubmitted || isGrading}
                >
                  {isGrading ? 'Checking...' : 'Submit Answer'}
                </button>
                <button
                  type="button"
                  className="secondary"
                  disabled={currentIndex === questions.length - 1}
                  onClick={() =>
                    setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1))
                  }
                >
                  {isSubmitted && isCorrect ? 'Next' : 'Skip'}
                </button>
                <button type="button" onClick={handleSubmit}>
                  End Test
                </button>
              </div>
              <div className="question-nav" style={{ marginTop: 16 }}>
                {questions.map((question, index) => (
                  <button
                    key={question.id}
                    type="button"
                    className={index === currentIndex ? 'active' : ''}
                    onClick={() => setCurrentIndex(index)}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
