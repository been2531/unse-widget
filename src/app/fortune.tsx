import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Modal, Pressable,
  ScrollView, StyleSheet, Text, View,
} from 'react-native';

import type { DailyFortune } from '@/fortune/types';
import { selectDailyFortune } from '@/fortune/selectFortune';
import { getActiveBuff, type FortuneBuff } from '@/fortune/fortuneCardBuff';
import { getTodayDateString } from '@/shared/dateUtils';
import { getTodayUnlocked, unlockCategory } from '@/storage/fortuneUnlock';
import { getTodayFortuneBuff } from '@/storage/todayFortuneCard';
import { loadUserProfile } from '@/storage/userProfile';

type CategoryKey = 'wealth' | 'love' | 'health' | 'work';

const CATEGORIES: { key: CategoryKey; label: string; emoji: string; color: string }[] = [
  { key: 'wealth', label: '재물운', emoji: '💰', color: '#FFD700' },
  { key: 'love',   label: '연애운', emoji: '❤️',  color: '#FF6B9D' },
  { key: 'health', label: '건강운', emoji: '💪',  color: '#44DD88' },
  { key: 'work',   label: '직장운', emoji: '💼',  color: '#88AAFF' },
];

const AD_SECONDS = 5;

export default function FortuneScreen() {
  const [loading, setLoading] = useState(true);
  const [fortune, setFortune] = useState<DailyFortune | null>(null);
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [adTarget, setAdTarget] = useState<CategoryKey | null>(null);
  const [countdown, setCountdown] = useState(AD_SECONDS);
  const [activeBuff, setActiveBuff] = useState<FortuneBuff | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const adProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const p = await loadUserProfile();
      if (!p) { setLoading(false); return; }
      const today = getTodayDateString();
      setFortune(selectDailyFortune(today, p.diiSign, p.starSign));
      setUnlocked(await getTodayUnlocked(today));
      const todayBuff = await getTodayFortuneBuff(today);
      if (todayBuff) setActiveBuff(getActiveBuff(todayBuff.cardId));
      setLoading(false);
    })();
  }, []);

  function startAd(key: CategoryKey) {
    setAdTarget(key);
    setCountdown(AD_SECONDS);
    adProgress.setValue(0);
    Animated.timing(adProgress, {
      toValue: 1,
      duration: AD_SECONDS * 1000,
      useNativeDriver: false,
    }).start();
    let n = AD_SECONDS;
    timerRef.current = setInterval(async () => {
      n -= 1;
      setCountdown(n);
      if (n <= 0) {
        clearInterval(timerRef.current!);
        const today = getTodayDateString();
        const next = await unlockCategory(today, key);
        setUnlocked(next);
        setAdTarget(null);
      }
    }, 1000);
  }

  function skipAd() {
    clearInterval(timerRef.current!);
    setAdTarget(null);
  }

  useEffect(() => () => { clearInterval(timerRef.current!); }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator color="#FFE500" /></View>;
  if (!fortune)  return <View style={styles.center}><Text style={styles.err}>운세를 불러올 수 없어요</Text></View>;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <View style={styles.chevron} />
        </Pressable>
        <Text style={styles.title}>오늘의 운세</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* 운세 카드 버프 배너 */}
        {activeBuff && (
          <View style={[styles.buffBanner, { borderColor: `${activeBuff.color}55`, backgroundColor: `${activeBuff.color}12` }]}>
            <Text style={styles.buffEmoji}>{activeBuff.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.buffTitle, { color: activeBuff.color }]}>카드 버프 적용 중</Text>
              <Text style={styles.buffDesc}>{activeBuff.bonusText}</Text>
            </View>
          </View>
        )}

        {/* 총운 — 항상 무료 */}
        <View style={[styles.card, styles.generalCard]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardEmoji}>✨</Text>
            <Text style={styles.cardLabel}>총운</Text>
            <View style={[styles.badge, { backgroundColor: 'rgba(255,220,60,0.15)', borderColor: 'rgba(255,220,60,0.4)' }]}>
              <Text style={[styles.badgeText, { color: '#FFE500' }]}>무료</Text>
            </View>
          </View>
          <Text style={styles.cardText}>{fortune.general.text}</Text>
        </View>

        {/* 유료 카테고리 */}
        {CATEGORIES.map(({ key, label, emoji, color }) => {
          const isUnlocked = unlocked.includes(key);
          const isBoosted = activeBuff && (activeBuff.affectedCategory === key || activeBuff.affectedCategory === 'all');
          return (
            <View key={key} style={[
              styles.card,
              !isUnlocked && styles.lockedCard,
              isBoosted && { borderWidth: 1.5, borderColor: `${activeBuff!.color}66` },
            ]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardEmoji}>{emoji}</Text>
                <Text style={styles.cardLabel}>{label}</Text>
                {isBoosted && (
                  <View style={[styles.badge, { backgroundColor: `${activeBuff!.color}20`, borderColor: `${activeBuff!.color}55`, marginRight: 4 }]}>
                    <Text style={[styles.badgeText, { color: activeBuff!.color }]}>{activeBuff!.emoji} 버프</Text>
                  </View>
                )}
                {isUnlocked ? (
                  <View style={[styles.badge, { backgroundColor: `${color}22`, borderColor: `${color}55` }]}>
                    <Text style={[styles.badgeText, { color }]}>해금됨</Text>
                  </View>
                ) : (
                  <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.15)' }]}>
                    <Text style={[styles.badgeText, { color: '#aaa' }]}>광고 시청</Text>
                  </View>
                )}
              </View>

              {isUnlocked ? (
                <>
                  <Text style={styles.cardText}>{fortune[key].text}</Text>
                  {isBoosted && (
                    <View style={[styles.buffInline, { backgroundColor: `${activeBuff!.color}10`, borderColor: `${activeBuff!.color}30` }]}>
                      <Text style={[styles.buffInlineText, { color: activeBuff!.color }]}>{activeBuff!.emoji} {activeBuff!.bonusText}</Text>
                    </View>
                  )}
                </>
              ) : (
                <Pressable
                  style={[styles.watchAdBtn, { borderColor: `${color}55` }]}
                  onPress={() => startAd(key)}
                >
                  <Text style={[styles.watchAdText, { color }]}>📺  광고 보고 {label} 보기</Text>
                </Pressable>
              )}
            </View>
          );
        })}

        <Text style={styles.footNote}>광고 시청은 하루에 카테고리당 1회, 자정에 초기화됩니다.</Text>
      </ScrollView>

      {/* 광고 모달 */}
      <Modal visible={adTarget !== null} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>광고 재생 중</Text>
            <Text style={styles.modalSub}>잠시 후 {adTarget && CATEGORIES.find(c => c.key === adTarget)?.label}이 열려요</Text>

            {/* 진행 바 */}
            <View style={styles.progressBg}>
              <Animated.View
                style={[styles.progressBar, {
                  width: adProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                }]}
              />
            </View>

            <Text style={styles.countdown}>{countdown}</Text>
            <Pressable style={styles.skipBtn} onPress={skipAd}>
              <Text style={styles.skipText}>취소</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F5F7' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F7' },
  err: { color: '#666' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 52, paddingHorizontal: 20, paddingBottom: 12,
  },
  backBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
  },
  chevron: {
    width: 10, height: 10,
    borderLeftWidth: 2, borderBottomWidth: 2,
    borderColor: '#333',
    transform: [{ rotate: '45deg' }, { translateX: 2 }],
  },
  title: { fontSize: 18, fontWeight: '700', color: '#111' },

  scroll: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },

  card: {
    backgroundColor: 'white',
    borderRadius: 18, padding: 18,
    shadowColor: '#000', shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 8,
    elevation: 2, gap: 10,
  },
  generalCard: { borderWidth: 1.5, borderColor: 'rgba(255,220,60,0.35)' },
  lockedCard: { opacity: 0.85 },

  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardEmoji: { fontSize: 20 },
  cardLabel: { fontSize: 16, fontWeight: '700', color: '#111', flex: 1 },
  badge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 10, borderWidth: 1,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardText: { fontSize: 14, color: '#333', lineHeight: 22 },

  watchAdBtn: {
    borderWidth: 1, borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },
  watchAdText: { fontSize: 14, fontWeight: '600' },

  footNote: { fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 4 },

  buffBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderWidth: 1, borderRadius: 14, padding: 12,
  },
  buffEmoji: { fontSize: 22, marginTop: 1 },
  buffTitle: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
  buffDesc: { fontSize: 12, color: '#555', lineHeight: 17 },
  buffInline: {
    borderWidth: 1, borderRadius: 10, padding: 8, marginTop: 4,
  },
  buffInlineText: { fontSize: 12, lineHeight: 18 },

  // 광고 모달
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center' },
  modalBox: {
    backgroundColor: 'white', borderRadius: 24,
    padding: 28, width: '80%', alignItems: 'center', gap: 14,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111' },
  modalSub: { fontSize: 14, color: '#666' },
  progressBg: { width: '100%', height: 6, backgroundColor: '#eee', borderRadius: 3, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#FFE500', borderRadius: 3 },
  countdown: { fontSize: 36, fontWeight: '900', color: '#111' },
  skipBtn: { paddingVertical: 8, paddingHorizontal: 20 },
  skipText: { color: '#aaa', fontSize: 14 },
});
