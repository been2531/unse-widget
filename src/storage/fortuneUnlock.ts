import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'fortune_unlock_v1';

interface UnlockState {
  date: string;
  unlocked: string[];
}

export async function getTodayUnlocked(today: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const state: UnlockState = JSON.parse(raw);
    return state.date === today ? state.unlocked : [];
  } catch {
    return [];
  }
}

export async function unlockCategory(today: string, category: string): Promise<string[]> {
  const current = await getTodayUnlocked(today);
  const next = Array.from(new Set([...current, category]));
  await AsyncStorage.setItem(KEY, JSON.stringify({ date: today, unlocked: next }));
  return next;
}
