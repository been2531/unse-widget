import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'free_pulls_v1';
const FREE_PER_DAY = 1;

export async function getFreePullsRemaining(today: string): Promise<number> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return FREE_PER_DAY;
  const { date, used } = JSON.parse(raw);
  return date === today ? Math.max(0, FREE_PER_DAY - used) : FREE_PER_DAY;
}

export async function consumeFreePull(today: string): Promise<void> {
  const raw = await AsyncStorage.getItem(KEY);
  const prev = raw ? JSON.parse(raw) : { date: '', used: 0 };
  const used = prev.date === today ? prev.used + 1 : 1;
  await AsyncStorage.setItem(KEY, JSON.stringify({ date: today, used }));
}
