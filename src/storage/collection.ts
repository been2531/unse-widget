import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PulledCard } from '@/gacha/types';

const KEY = 'collection_v1';

export async function getCollection(): Promise<PulledCard[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addToCollection(cards: PulledCard[]): Promise<void> {
  const existing = await getCollection();
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify([...existing, ...cards]));
  } catch {
    // ignore
  }
}

// cardId를 가진 카드가 몇 장인지
export async function getCardCount(cardId: string): Promise<number> {
  const col = await getCollection();
  return col.filter(c => c.id === cardId).length;
}

// cardId 카드 n장 제거 (앞에서부터)
export async function removeCards(cardId: string, count: number): Promise<void> {
  const col = await getCollection();
  let removed = 0;
  const next = col.filter(c => {
    if (c.id === cardId && removed < count) { removed++; return false; }
    return true;
  });
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}
