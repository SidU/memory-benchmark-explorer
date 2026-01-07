'use client';

import type { Question } from '../lib/types';

type Props = {
  question: Question;
  value: string;
  onChange: (value: string) => void;
};

export default function QuestionPrompt({ question, value, onChange }: Props) {
  if (question.type === 'multiple_choice' && question.options) {
    return (
      <div>
        {question.options.map((option) => (
          <label key={option} style={{ display: 'block', marginBottom: 8 }}>
            <input
              type="radio"
              name={question.id}
              value={option}
              checked={value === option}
              onChange={(event) => onChange(event.target.value)}
            />{' '}
            {option}
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
          <label key={option} style={{ display: 'block', marginBottom: 8 }}>
            <input
              type="radio"
              name={question.id}
              value={option}
              checked={value === option}
              onChange={(event) => onChange(event.target.value)}
            />{' '}
            {option}
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
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
