import { fnv1aHash } from './hash';
import type { DiiSign, StarSign } from './types';

export type FortuneValence = 'good' | 'neutral' | 'bad';

// Independent of which sentence is shown — decoupling "what mood it implies"
// from "which fortune text is selected" so the ~200-entry content bank never
// needs hand-tagged valence labels. Roughly even thirds.
export function deriveValence(date: string, diiSign: DiiSign, starSign: StarSign): FortuneValence {
  const roll = fnv1aHash(`${date}:${diiSign}:${starSign}:valence`) % 100;
  if (roll < 33) return 'bad';
  if (roll < 67) return 'neutral';
  return 'good';
}
