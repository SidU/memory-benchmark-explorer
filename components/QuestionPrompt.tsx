'use client';

import type { Question } from '../lib/types';
import Markdown from './Markdown';

type Props = {
  question: Question;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export default function QuestionPrompt({ question, value, onChange, disabled }: Props) {
  if (question.type === 'multiple_choice' && question.options) {
    return (
      <div>
        {question.options.map((option) => (
          <label key={option} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              type="radio"
              name={question.id}
              value={option}
              checked={value === option}
              disabled={disabled}
              onChange={(event) => onChange(event.target.value)}
            />
            <span className="option-text">
              <Markdown content={option} inline className="markdown" />
            </span>
          </label>
        ))}
      </div>
    );
  }

  if (question.type === 'boolean') {
    const options = ['True', 'False'];
    return (
      <div>
        {options.map((option) => (
          <label key={option} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              type="radio"
              name={question.id}
              value={option}
              checked={value === option}
              disabled={disabled}
              onChange={(event) => onChange(event.target.value)}
            />
            <span className="option-text">{option}</span>
          </label>
        ))}
      </div>
    );
  }

  return (
    <input
      className="input"
      placeholder="Type your answer"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
