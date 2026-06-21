import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'streak_v1';

export interface StreakState {
  currentStreak: number;
  lastDate: string;
  longestStreak: number;
}

export async function getStreak(): Promise<StreakState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { currentStreak: 0, lastDate: '', longestStreak: 0 };
    return JSON.parse(raw);
  } catch {
    return { currentStreak: 0, lastDate: '', longestStreak: 0 };
  }
}

export async function checkInStreak(today: string): Promise<StreakState> {
  const state = await getStreak();
  if (state.lastDate === today) return state;

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().slice(0, 10);

  const currentStreak = state.lastDate === yStr ? state.currentStreak + 1 : 1;
  const longestStreak = Math.max(state.longestStreak, currentStreak);
  const next: StreakState = { currentStreak, lastDate: today, longestStreak };
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

// 스트릭이 7일 이상이면 카드 등급 한 단계 상승
export function streakRarityBoost(rarity: string, streak: number): string {
  if (streak < 7) return rarity;
  const order = ['common', 'rare', 'epic', 'legendary', 'mythic'];
  const idx = order.indexOf(rarity);
  return idx >= 0 && idx < order.length - 1 ? order[idx + 1] : rarity;
}
