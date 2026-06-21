import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'ad_rewards_v1';
const COINS_KEY = 'coins_v1';
export const COINS_PER_AD = 10;
export const MAX_ADS_PER_DAY = 5;

export async function getAdsRemaining(today: string): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return MAX_ADS_PER_DAY;
    const { date, watched } = JSON.parse(raw);
    return date === today ? Math.max(0, MAX_ADS_PER_DAY - watched) : MAX_ADS_PER_DAY;
  } catch {
    return MAX_ADS_PER_DAY;
  }
}

export async function recordAdReward(today: string): Promise<number> {
  try {
    const [adRaw, coinRaw] = await Promise.all([
      AsyncStorage.getItem(KEY),
      AsyncStorage.getItem(COINS_KEY),
    ]);
    const adState = adRaw ? JSON.parse(adRaw) : { date: '', watched: 0 };
    const watched = adState.date === today ? adState.watched + 1 : 1;

    const coinState = coinRaw ? JSON.parse(coinRaw) : { balance: 0, lastDailyDate: '' };
    const newBalance = coinState.balance + COINS_PER_AD;

    await Promise.all([
      AsyncStorage.setItem(KEY, JSON.stringify({ date: today, watched })),
      AsyncStorage.setItem(COINS_KEY, JSON.stringify({ ...coinState, balance: newBalance })),
    ]);
    return newBalance;
  } catch {
    return 0;
  }
}
