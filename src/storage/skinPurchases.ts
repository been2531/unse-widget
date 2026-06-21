import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'shop_skins_v1';

async function load(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export async function getOwnedShopSkins(): Promise<Set<string>> {
  return new Set(await load());
}

export async function addShopSkin(id: string): Promise<void> {
  const owned = await load();
  if (!owned.includes(id)) {
    await AsyncStorage.setItem(KEY, JSON.stringify([...owned, id]));
  }
}
