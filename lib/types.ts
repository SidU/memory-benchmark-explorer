export type DatasetVariant = 's' | 'm';

export type Turn = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type Session = {
  id: string;
  title?: string;
  turns: Turn[];
};

export type QuestionType = 'multiple_choice' | 'boolean' | 'short_text';

export type Question = {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: string[];
  answer: string;
  aliases?: string[];
};

export type DatasetItem = {
  id: string;
  sessions: Session[];
  questions: Question[];
};

export type CompactDataset = {
  version: string;
  items: DatasetItem[];
};

export type SampledQuestion = Question & {
  datasetId: string;
  sessions: Session[];
};

export type ScoreResult = {
  accuracy: number;
  total: number;
  correct: number;
  durationMs: number;
  composite: number;
  timeFactor: number;
};
