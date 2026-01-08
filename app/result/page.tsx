'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { decodeShareToken } from '../../lib/share';
import { formatDuration, formatPercent, getScoringConfig } from '../../lib/scoring';

function ResultPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [copied, setCopied] = useState<string | null>(null);

  const payload = useMemo(() => (token ? decodeShareToken(token) : null), [token]);
  const { T_REF_PER_QUESTION, MIN_TIME_FACTOR } = getScoringConfig();

  if (!payload) {
    return (
      <main>
        <div className="card">
          <h1>Result not found</h1>
          <p className="notice">
            The share token is missing or invalid. Double-check the URL.
          </p>
        </div>
      </main>
    );
  }

  const shareText = `LongMemEval score: ${(payload.accuracy * 100).toFixed(0)}% accuracy in ${formatDuration(
    payload.durationMs
  )} → composite ${payload.composite.toFixed(1)} (seed ${payload.seed}, ${payload.count}Q, ${payload.variant.toUpperCase()}).`;
  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined' || !token) {
      return '';
    }
    return `${window.location.origin}/result?token=${encodeURIComponent(token)}`;
  }, [token]);

  const handleCopy = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(null), 1500);
  };

  return (
    <main>
      <h1>Results</h1>
      <div className="grid two" style={{ marginTop: 24 }}>
        <div className="card">
          <h3>Score summary</h3>
          <p>
            <strong>Accuracy:</strong> {formatPercent(payload.accuracy)}
          </p>
          <p>
            <strong>Time:</strong> {formatDuration(payload.durationMs)}
          </p>
          <p>
            <strong>Composite score:</strong> {payload.composite.toFixed(1)}
          </p>
          <p className="notice">
            Time reference uses {T_REF_PER_QUESTION}s per question (minimum time factor{' '}
            {MIN_TIME_FACTOR}).
          </p>
          <div className="footer-actions">
            <button type="button" onClick={() => router.push('/')}>
              Take test again
            </button>
          </div>
        </div>
        <div className="card">
          <h3>Share your result</h3>
          <p className="notice">Share text</p>
          <textarea className="input" readOnly rows={4} value={shareText} />
          <div className="footer-actions">
            <button type="button" className="secondary" onClick={() => handleCopy('text', shareText)}>
              {copied === 'text' ? 'Copied!' : 'Copy text'}
            </button>
          </div>
          <p className="notice" style={{ marginTop: 16 }}>Share link</p>
          <input className="input" readOnly value={shareUrl} />
          <div className="footer-actions">
            <button type="button" className="secondary" onClick={() => handleCopy('url', shareUrl)}>
              {copied === 'url' ? 'Copied!' : 'Copy link'}
            </button>
          </div>
          <p className="notice">
            Links are informational and not tamper-proof.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <main>
          <p className="notice">Loading results...</p>
        </main>
      }
    >
      <ResultPageContent />
    </Suspense>
  );
}
