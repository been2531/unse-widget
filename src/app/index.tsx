import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { CHARACTER_ASSET_MAP } from '@/character/assetMap';
import { applyFeed, applyPet, formatRemaining, getFeedAvailability, getPetAvailability } from '@/character/careActions';
import { computeEffectiveAffection, computeMonthsSinceAdoption, computeNeglectDays } from '@/character/state';
import type { CharacterState } from '@/character/types';
import { STAGE_LABELS_KO } from '@/character/types';
import { deriveValence } from '@/fortune/deriveValence';
import { selectDailyFortune } from '@/fortune/selectFortune';
import type { DailyFortune, UserProfile } from '@/fortune/types';
import { deriveMood } from '@/character/mood';
import { getTodayDateString } from '@/shared/dateUtils';
import { loadCharacterState, saveCharacterState } from '@/storage/characterState';
import { loadUserProfile } from '@/storage/userProfile';
import { refreshFortuneWidget } from '@/widgets/scheduleDailyRefresh';

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [character, setCharacter] = useState<CharacterState | null>(null);
  const [fortune, setFortune] = useState<DailyFortune | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    (async () => {
      const loadedProfile = await loadUserProfile();
      if (!loadedProfile) {
        setLoading(false);
        return;
      }
      const today = getTodayDateString();
      const [loadedCharacter] = await Promise.all([loadCharacterState()]);
      setProfile(loadedProfile);
      setCharacter(loadedCharacter);
      setFortune(selectDailyFortune(today, loadedProfile.diiSign, loadedProfile.starSign));
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!profile) {
    return <Redirect href="/onboarding" />;
  }

  if (!character || !fortune) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const today = getTodayDateString();
  const valence = deriveValence(today, profile.diiSign, profile.starSign);
  const neglectDays = computeNeglectDays(character, today);
  const affection = computeEffectiveAffection(character, today);
  const mood = deriveMood({ affection, neglectDays, fortuneValence: valence });
  const monthsSinceAdoption = computeMonthsSinceAdoption(character, today);

  const characterImage = CHARACTER_ASSET_MAP[character.stage][mood];

  const feedAvailability = getFeedAvailability(character, nowMs);
  const petAvailability = getPetAvailability(character, today, nowMs);

  async function handleFeed() {
    const next = applyFeed(character!, today, nowMs);
    setCharacter(await saveCharacterState(next));
    await refreshFortuneWidget();
  }

  async function handlePet() {
    const next = applyPet(character!, today, nowMs);
    setCharacter(await saveCharacterState(next));
    await refreshFortuneWidget();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.dateLabel}>{fortune.date}</Text>

      <View style={styles.characterArea}>
        <Image source={characterImage} style={styles.characterImage} />
      </View>

      <Text style={styles.ageLabel}>
        {STAGE_LABELS_KO[character.stage]} · 함께한 지 {monthsSinceAdoption}개월째
      </Text>

      <View style={styles.careRow}>
        <Pressable
          style={[styles.careButton, !feedAvailability.available && styles.careButtonDisabled]}
          onPress={handleFeed}
          disabled={!feedAvailability.available}
        >
          <Text style={styles.careButtonText}>
            {feedAvailability.available ? '먹이 주기' : `먹이 주기 (${formatRemaining(feedAvailability.remainingMs)})`}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.careButton, !petAvailability.available && styles.careButtonDisabled]}
          onPress={handlePet}
          disabled={!petAvailability.available}
        >
          <Text style={styles.careButtonText}>
            {petAvailability.available
              ? '쓰다듬기'
              : petAvailability.capReached
                ? '충분히 쓰다듬었어요'
                : `쓰다듬기 (${formatRemaining(petAvailability.remainingMs)})`}
          </Text>
        </Pressable>
      </View>

      <View style={styles.fortuneCard}>
        <Text style={styles.fortuneCategory}>오늘의 운세</Text>
        <Text style={styles.fortuneText}>{fortune.general.text}</Text>
        <Text style={styles.fortuneText}>{fortune.dii.text}</Text>
        <Text style={styles.fortuneText}>{fortune.star.text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, gap: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dateLabel: { fontSize: 14, color: '#888' },
  characterArea: { width: 240, height: 240, alignItems: 'center', justifyContent: 'center' },
  characterImage: { width: 240, height: 240, position: 'absolute' },
  ageLabel: { fontSize: 13, color: '#999' },
  careRow: { flexDirection: 'row', gap: 12 },
  careButton: { backgroundColor: '#4f8ef7', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 20 },
  careButtonDisabled: { backgroundColor: '#ccc' },
  careButtonText: { color: '#fff', fontWeight: '600' },
  fortuneCard: { backgroundColor: '#f5f5f8', borderRadius: 16, padding: 16, width: '100%', gap: 8 },
  fortuneCategory: { fontWeight: '700', fontSize: 15 },
  fortuneText: { fontSize: 14, color: '#333' },
});
