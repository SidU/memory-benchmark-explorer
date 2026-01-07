import type { CompactDataset, DatasetVariant, SampledQuestion } from './types';
import { shuffleWithSeed } from './random';

export const fetchDataset = async (variant: DatasetVariant) => {
  const response = await fetch(`/data/longmemeval_${variant}.compact.json`);
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
