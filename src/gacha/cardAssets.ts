import type { ImageRequireSource } from 'react-native';

export const CARD_IMAGES: Record<string, ImageRequireSource> = {
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
};

export function cardImageFor(element: string, rarity: string): ImageRequireSource | undefined {
  const stage = rarity === 'mythic' ? '4' :
                (rarity === 'legendary' || rarity === 'epic') ? '3' :
                rarity === 'rare' ? '2' : '1';
  return CARD_IMAGES[`${element}_${stage}`] ?? CARD_IMAGES[`${element}_3`];
}
