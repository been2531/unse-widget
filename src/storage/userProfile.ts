import AsyncStorage from '@react-native-async-storage/async-storage';

import { deriveSigns } from '../fortune/deriveSigns';
import type { UserProfile } from '../fortune/types';

const STORAGE_KEY = 'unse:userProfile';

export async function loadUserProfile(): Promise<UserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export async function saveUserProfile(birthdate: string): Promise<UserProfile> {
  const { diiSign, starSign } = deriveSigns(birthdate);
  const profile: UserProfile = { birthdate, diiSign, starSign, onboardingComplete: true };
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    throw new Error('저장에 실패했습니다. 앱을 재설치 후 다시 시도해주세요.');
  }
  return profile;
}
