import {
  CARD_POOL, CATEGORY_WEIGHTS, RARITY_WEIGHTS,
  type CardCategory, type PulledCard, type Rarity,
} from './types';

function weightedRandom<T extends string>(weights: Record<T, number>): T {
  const total = Object.values<number>(weights as Record<string, number>).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const [key, w] of Object.entries<number>(weights as Record<string, number>)) {
    r -= w;
    if (r <= 0) return key as T;
  }
  return Object.keys(weights)[0] as T;
}

function pickCard(category: CardCategory, rarity: Rarity): PulledCard {
  const pool = CARD_POOL.filter(c => c.category === category && c.rarity === rarity);
  const fallback = CARD_POOL.filter(c => c.category === category);
  const candidates = pool.length > 0 ? pool : fallback;
  const def = candidates[Math.floor(Math.random() * candidates.length)];
  return {
    ...def,
    uid: `${def.id}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    pulledAt: new Date().toISOString(),
  };
}

export function pullOne(): PulledCard {
  const category = weightedRandom(CATEGORY_WEIGHTS);
  const rarity   = weightedRandom(RARITY_WEIGHTS);
  return pickCard(category, rarity);
}

// 10연차 — 최소 1장 Rare 이상 보장
export function pullTen(): PulledCard[] {
  const results = Array.from({ length: 9 }, () => pullOne());
  const hasRareOrAbove = results.some(c => c.rarity === 'rare' || c.rarity === 'epic' || c.rarity === 'legendary' || c.rarity === 'mythic');
  const last = hasRareOrAbove
    ? pullOne()
    : pickCard(weightedRandom(CATEGORY_WEIGHTS), 'rare');
  return [...results, last];
}
