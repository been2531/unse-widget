import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'equipped_frame_v1';

export async function getEquippedFrame(): Promise<string | null> {
  try { return await AsyncStorage.getItem(KEY); } catch { return null; }
}

export async function setEquippedFrame(frameId: string | null): Promise<void> {
  try {
    if (frameId) await AsyncStorage.setItem(KEY, frameId);
    else await AsyncStorage.removeItem(KEY);
  } catch {}
}
