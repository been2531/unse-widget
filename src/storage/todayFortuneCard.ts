import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'today_fortune_card_v1';

export interface ActiveFortuneBuff {
  date: string;
  cardId: string;
  cardNameKo: string;
  element: string;
  rarity: string;
}

export async function saveFortuneCardBuff(
  today: string,
  cardId: string,
  cardNameKo: string,
  element: string,
  rarity: string,
): Promise<void> {
  const data: ActiveFortuneBuff = { date: today, cardId, cardNameKo, element, rarity };
  await AsyncStorage.setItem(KEY, JSON.stringify(data));
}

export async function getTodayFortuneBuff(today: string): Promise<ActiveFortuneBuff | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const data: ActiveFortuneBuff = JSON.parse(raw);
    return data.date === today ? data : null;
  } catch {
    return null;
  }
}
