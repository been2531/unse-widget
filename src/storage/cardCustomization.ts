import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ElementType } from '@/gacha/types';

const KEY = 'card_custom_v1';

export type CardRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface CardCustom {
  element: ElementType | null;
  rarity: CardRarity | null;
}

const DEFAULT: CardCustom = { element: null, rarity: null };

export async function getCardCustom(): Promise<CardCustom> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
}

export async function saveCardCustom(c: Partial<CardCustom>): Promise<void> {
  const current = await getCardCustom();
  await AsyncStorage.setItem(KEY, JSON.stringify({ ...current, ...c }));
}
