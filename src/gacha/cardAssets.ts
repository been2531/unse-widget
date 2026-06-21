import type { ImageRequireSource } from 'react-native';

export const CARD_IMAGES: Record<string, ImageRequireSource> = {
  // ── 기존 원소 시리즈 ─────────────────────────────────────────────────────
  fire_1:        require('../assets/character/fire_1.png'),
  fire_2:        require('../assets/character/fire_2.png'),
  fire_3:        require('../assets/character/fire_3.png'),
  fire_4:        require('../assets/character/fire_4.png'),
  water_1:       require('../assets/character/water_1.png'),
  water_2:       require('../assets/character/water_2.png'),
  water_3:       require('../assets/character/water_3.png'),
  water_4:       require('../assets/character/water_4.png'),
  lightning_1:   require('../assets/character/lightning_1.png'),
  lightning_2:   require('../assets/character/lightning_2.png'),
  lightning_3:   require('../assets/character/lightning_3.png'),
  lightning_4:   require('../assets/character/lightning_4.png'),
  nature_1:      require('../assets/character/nature_1.png'),
  nature_2:      require('../assets/character/nature_2.png'),
  nature_3:      require('../assets/character/nature_3.png'),
  nature_4:      require('../assets/character/nature_4.png'),
  dark_1:        require('../assets/character/dark_1.png'),
  dark_2:        require('../assets/character/dark_2.png'),
  dark_3:        require('../assets/character/dark_3.png'),
  dark_4:        require('../assets/character/dark_4.png'),
  light_1:       require('../assets/character/light_1.png'),
  light_2:       require('../assets/character/light_2.png'),
  light_3:       require('../assets/character/light_3.png'),
  light_4:       require('../assets/character/light_4.png'),
  // ── 신규: 구미호 시리즈 (fire) ─────────────────────────────────────────
  gumiho_1:      require('../assets/character/gumiho_1.png'),
  gumiho_2:      require('../assets/character/gumiho_2.png'),
  gumiho_3:      require('../assets/character/gumiho_3.png'),
  // ── 신규: 이무기 시리즈 (water) ────────────────────────────────────────
  imugi_1:       require('../assets/character/imugi_1.png'),
  imugi_2:       require('../assets/character/imugi_2.png'),
  imugi_3:       require('../assets/character/imugi_3.png'),
  // ── 신규: 삼족오 시리즈 (lightning) ────────────────────────────────────
  samjogo_1:     require('../assets/character/samjogo_1.png'),
  samjogo_2:     require('../assets/character/samjogo_2.png'),
  samjogo_3:     require('../assets/character/samjogo_3.png'),
};

// id로 직접 조회 → 없으면 element_stage 패턴으로 폴백
export function cardImageFor(
  element: string,
  rarity: string,
  id?: string,
): ImageRequireSource | undefined {
  if (id && CARD_IMAGES[id]) return CARD_IMAGES[id];
  const stage = rarity === 'mythic' ? '4' :
                (rarity === 'legendary' || rarity === 'epic') ? '3' :
                rarity === 'rare' ? '2' : '1';
  return CARD_IMAGES[`${element}_${stage}`] ?? CARD_IMAGES[`${element}_3`];
}
