import type { FortuneValence } from '../fortune/deriveValence';
import type { Mood } from './types';

export interface MoodInput {
  affection: number; // effective (post-decay) affection, 0-100
  neglectDays: number;
  fortuneValence: FortuneValence;
}

export function deriveMood({ affection, neglectDays, fortuneValence }: MoodInput): Mood {
  if (neglectDays >= 3) return 'lonely';

  let score = affection >= 60 ? 1 : affection >= 25 ? 0 : -1;

  if (fortuneValence === 'good') score += 1;
  if (fortuneValence === 'bad') score -= 1;
  if (neglectDays >= 1) score -= 1;

  score = Math.max(-1, Math.min(1, score));
  if (score >= 1) return 'joyful';
  if (score <= -1) return 'lonely';
  return 'neutral';
}
