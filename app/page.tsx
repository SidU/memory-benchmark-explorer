'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchDataset } from '../lib/data';
import type { DatasetVariant } from '../lib/types';

const QUESTION_OPTIONS = [5, 10, 20, 50];

const makeSeed = () => Math.random().toString(36).slice(2, 10);

const VARIANT_LABELS: Record<DatasetVariant, string> = {
  s: 'S (short)',
  m: 'M (medium)',
  l: 'LoCoMo'
};

export default function HomePage() {
  const router = useRouter();
  const [variant, setVariant] = useState<DatasetVariant>('s');
  const [count, setCount] = useState(10);
  const [seed, setSeed] = useState('');
  const [availableCount, setAvailableCount] = useState<number | null>(null);

  const effectiveSeed = useMemo(() => seed || makeSeed(), [seed]);
  const countOptions = useMemo(() => {
    if (!availableCount) {
      return QUESTION_OPTIONS;
    }
    const filtered = QUESTION_OPTIONS.filter((option) => option <= availableCount);
    if (filtered.length === 0 || filtered[filtered.length - 1] !== availableCount) {
      filtered.push(availableCount);
    }
    return filtered;
  }, [availableCount]);

  useEffect(() => {
    let isActive = true;
    const loadCounts = async () => {
      try {
        const dataset = await fetchDataset(variant);
        const total = dataset.items.reduce((sum, item) => sum + item.questions.length, 0);
        if (!isActive) {
          return;
        }
        setAvailableCount(total);
        setCount((prev) => Math.min(prev, total));
      } catch (err) {
        if (isActive) {
          setAvailableCount(null);
        }
      }
    };
    loadCounts();
    return () => {
      isActive = false;
    };
  }, [variant]);

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
      <h1>Memory Benchmark Explorer</h1>
      <p>
        Experience long-context memory tasks with a shareable score. Choose a dataset split and
        question count to begin.
      </p>
      <div className="grid two" style={{ marginTop: 24 }}>
        <div className="card">
          <div style={{ marginBottom: 16 }}>
            <div className="label">Dataset variant</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              {(Object.keys(VARIANT_LABELS) as DatasetVariant[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={variant === key ? '' : 'secondary'}
                  onClick={() => setVariant(key)}
                >
                  {VARIANT_LABELS[key]}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div className="label">Question count</div>
            <select
              className="input"
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
            >
            {countOptions.map((option) => (
              <option key={option} value={option}>
                {option} questions
              </option>
            ))}
          </select>
          {availableCount !== null && (
            <p className="notice">This dataset includes {availableCount} questions.</p>
          )}
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
