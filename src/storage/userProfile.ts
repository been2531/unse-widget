import AsyncStorage from '@react-native-async-storage/async-storage';

import { deriveSigns } from '../fortune/deriveSigns';
import type { UserProfile } from '../fortune/types';

const STORAGE_KEY = 'unse:userProfile';

export async function loadUserProfile(): Promise<UserProfile | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as UserProfile;
}

export async function saveUserProfile(birthdate: string): Promise<UserProfile> {
  const { diiSign, starSign } = deriveSigns(birthdate);
  const profile: UserProfile = { birthdate, diiSign, starSign, onboardingComplete: true };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  return profile;
}
