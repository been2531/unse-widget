import { CARD_POOL, type Rarity } from './types';

// ─── 합성에 필요한 카드 수 ──────────────────────────────────────────────────────
export const SYNTHESIS_REQUIRED: Record<Rarity, number> = {
  common:    4,   // 4장 → rare 시도
  rare:      4,   // 4장 → epic 시도
  epic:      5,   // 5장 → legendary 시도
  legendary: 5,   // 5장 → mythic 시도
  mythic:    0,   // 합성 불가
};

// ─── 합성 성공 확률 ────────────────────────────────────────────────────────────
export const SYNTHESIS_RATES: Record<Rarity, number> = {
  common:    0.65,  // 65%
  rare:      0.40,  // 40%
  epic:      0.20,  // 20%
  legendary: 0.10,  // 10%
  mythic:    0,
};

// id에서 패밀리 추출: 'gumiho_2' → 'gumiho', 'fire_1' → 'fire'
export function getCardFamily(id: string): string {
  return id.replace(/_\d+$/, '');
}

// 같은 패밀리의 다음 등급 카드 ID 반환
export function getSynthesisTarget(cardId: string): string | null {
  const card = CARD_POOL.find(c => c.id === cardId);
  if (!card || card.rarity === 'legendary') return null;

  const family = getCardFamily(cardId);
  const nextRarity: Record<Rarity, Rarity | null> = {
    common: 'rare', rare: 'epic', epic: 'legendary', legendary: 'mythic', mythic: null,
  };
  const targetRarity = nextRarity[card.rarity];
  if (!targetRarity) return null;

  const target = CARD_POOL.find(
    c => getCardFamily(c.id) === family && c.rarity === targetRarity,
  );
  return target?.id ?? null;
}

// 합성 주사위 굴리기
export function rollSynthesis(rarity: Rarity): boolean {
  return Math.random() < (SYNTHESIS_RATES[rarity] ?? 0);
}

// 합성 가능 여부 (보유 수 ≥ 필요 수 + 다음 등급 존재)
export function canSynthesize(cardId: string, ownedIds: string[]): boolean {
  const card = CARD_POOL.find(c => c.id === cardId);
  if (!card) return false;
  const required = SYNTHESIS_REQUIRED[card.rarity];
  if (!required) return false;
  const count = ownedIds.filter(id => id === cardId).length;
  if (count < required) return false;
  return getSynthesisTarget(cardId) !== null;
}
