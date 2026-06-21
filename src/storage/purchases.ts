import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'purchases_v1';

interface PurchaseState {
  removeAds: boolean;
  removeAdsPurchasedAt?: string;
}

async function load(): Promise<PurchaseState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { removeAds: false };
}

export async function hasRemovedAds(): Promise<boolean> {
  return (await load()).removeAds;
}

export async function grantRemoveAds(): Promise<void> {
  const state = await load();
  await AsyncStorage.setItem(KEY, JSON.stringify({
    ...state,
    removeAds: true,
    removeAdsPurchasedAt: new Date().toISOString(),
  }));
}
