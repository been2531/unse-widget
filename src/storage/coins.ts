import AsyncStorage from '@react-native-async-storage/async-storage';
import { DAILY_COINS, MULTI_PULL_COST, PULL_COST } from '@/gacha/types';

const KEY = 'coins_v1';

interface CoinState {
  balance: number;
  lastDailyDate: string; // YYYY-MM-DD
}

async function load(): Promise<CoinState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { balance: 0, lastDailyDate: '' };
}

async function save(state: CoinState): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(state));
}

export async function getBalance(): Promise<number> {
  return (await load()).balance;
}

// today: YYYY-MM-DD. Returns new balance and whether bonus was freshly claimed.
export async function claimDaily(today: string): Promise<{ balance: number; claimed: boolean }> {
  const state = await load();
  if (state.lastDailyDate === today) return { balance: state.balance, claimed: false };
  const next = { balance: state.balance + DAILY_COINS, lastDailyDate: today };
  await save(next);
  return { balance: next.balance, claimed: true };
}

// Returns new balance, or throws if insufficient.
export async function spend(amount: number): Promise<number> {
  const state = await load();
  if (state.balance < amount) throw new Error('코인 부족');
  const next = { ...state, balance: state.balance - amount };
  await save(next);
  return next.balance;
}

export { PULL_COST, MULTI_PULL_COST };
