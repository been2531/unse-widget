import type { FortuneValence } from '../fortune/deriveValence';
import type { Mood } from './types';

export interface MoodInput {
  affection: number; // effective (post-decay) affection, 0-100
  neglectDays: number;
  fortuneValence: FortuneValence;
}

const MOOD_BY_SCORE: Record<number, Mood> = {
  2: 'joyful',
  1: 'content',
  0: 'neutral',
  [-1]: 'down',
  [-2]: 'down',
};

// Fortune nudges, affection anchors, severe neglect overrides everything —
// this is what lets a well-loved character still read as "lonely" if it's
// been ignored for days, while a single bad-fortune day never tanks an
// otherwise thriving bond by more than one notch.
export function deriveMood({ affection, neglectDays, fortuneValence }: MoodInput): Mood {
  if (neglectDays >= 3) return 'lonely';

  let score = affection >= 80 ? 2 : affection >= 55 ? 1 : affection >= 30 ? 0 : affection >= 10 ? -1 : -2;

  if (fortuneValence === 'good') score += 1;
  if (fortuneValence === 'bad') score -= 1;
  if (neglectDays >= 1) score -= 1;

  score = Math.max(-2, Math.min(2, score));
  return MOOD_BY_SCORE[score];
}
