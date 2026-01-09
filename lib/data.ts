import type { CompactDataset, DatasetVariant, SampledQuestion } from './types';
import { shuffleWithSeed } from './random';

const DATASET_FILES: Record<DatasetVariant, string> = {
  s: 'longmemeval_s.compact.json',
  m: 'longmemeval_m.compact.json',
  l: 'locomo.compact.json'
};

export const fetchDataset = async (variant: DatasetVariant) => {
  const filename = DATASET_FILES[variant];
  const response = await fetch(`/data/${filename}`);
  if (!response.ok) {
    throw new Error('Failed to load dataset');
  }
  const data = (await response.json()) as CompactDataset;
  return data;
};

export const sampleQuestions = (
  dataset: CompactDataset,
  count: number,
  seed: string
): SampledQuestion[] => {
  const allQuestions = dataset.items.flatMap((item) =>
    item.questions.map((question) => ({
      ...question,
      datasetId: item.id,
      sessions: item.sessions
    }))
  );

  const shuffled = shuffleWithSeed(allQuestions, seed);
  return shuffled.slice(0, Math.min(count, shuffled.length));
};
