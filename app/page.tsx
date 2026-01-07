'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const QUESTION_OPTIONS = [5, 10, 20, 50];

const makeSeed = () => Math.random().toString(36).slice(2, 10);

export default function HomePage() {
  const router = useRouter();
  const [variant, setVariant] = useState<'s' | 'm'>('s');
  const [count, setCount] = useState(10);
  const [seed, setSeed] = useState('');

  const effectiveSeed = useMemo(() => seed || makeSeed(), [seed]);

  const handleStart = () => {
    const params = new URLSearchParams({
      variant,
      count: String(count),
      seed: effectiveSeed
    });
    router.push(`/test?${params.toString()}`);
  };

  return (
    <main>
      <h1>LongMemEval Human Scoring</h1>
      <p>
        Experience long-context memory tasks with a shareable score. Choose a dataset split and
        question count to begin.
      </p>
      <div className="grid two" style={{ marginTop: 24 }}>
        <div className="card">
          <div style={{ marginBottom: 16 }}>
            <div className="label">Dataset variant</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                type="button"
                className={variant === 's' ? '' : 'secondary'}
                onClick={() => setVariant('s')}
              >
                S (short)
              </button>
              <button
                type="button"
                className={variant === 'm' ? '' : 'secondary'}
                onClick={() => setVariant('m')}
              >
                M (medium)
              </button>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div className="label">Question count</div>
            <select
              className="input"
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
            >
              {QUESTION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option} questions
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div className="label">Seed (optional)</div>
            <input
              className="input"
              placeholder={effectiveSeed}
              value={seed}
              onChange={(event) => setSeed(event.target.value)}
            />
            <p className="notice">Leave blank to use an auto-generated seed.</p>
          </div>
          <button type="button" onClick={handleStart}>
            Start Test
          </button>
        </div>
        <div className="card">
          <h3>How scoring works</h3>
          <ul>
            <li>Accuracy is the share of correct answers.</li>
            <li>Time factor is based on 60 seconds per question.</li>
            <li>Composite score = Accuracy × Time Factor.</li>
          </ul>
          <p className="notice">
            Your results are encoded into a shareable link with no server-side validation.
          </p>
        </div>
      </div>
    </main>
  );
}
