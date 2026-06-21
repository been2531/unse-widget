import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Animated, Pressable,
  ScrollView, Share, StatusBar, StyleSheet, Text, View,
} from 'react-native';

import { showRewardedAd } from '@/ads/admob';
import { fnv1aHash } from '@/fortune/hash';
import { spend } from '@/storage/coins';
import { hasRemovedAds } from '@/storage/purchases';
import { deriveLuckyInfo, type LuckyInfo } from '@/fortune/luckyInfo';
import type { DailyFortune, DiiSign, StarSign } from '@/fortune/types';
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

function deriveScore(date: string, diiSign: DiiSign, starSign: StarSign, category: string): number {
  return 30 + (fnv1aHash(`${date}:${diiSign}:${starSign}:score:${category}`) % 61);
}

function scoreLabel(score: number): string {
  if (score >= 80) return '최고';
  if (score >= 65) return '좋음';
  if (score >= 50) return '보통';
  if (score >= 35) return '주의';
  return '힘듦';
}

function ScoreBar({ score, color, label, emoji, delay }: {
  score: number; color: string; label: string; emoji: string; delay: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: score / 100,
      duration: 900,
      delay,
      useNativeDriver: false,
    }).start();
  }, [score]);

  return (
    <View style={barStyles.row}>
      <Text style={barStyles.emoji}>{emoji}</Text>
      <Text style={barStyles.label}>{label}</Text>
      <View style={barStyles.track}>
        <Animated.View style={[
          barStyles.fill,
          {
            backgroundColor: color,
            width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          },
        ]} />
      </View>
      <Text style={[barStyles.num, { color }]}>{score}</Text>
      <Text style={barStyles.tag}>{scoreLabel(score)}</Text>
    </View>
  );
}

const barStyles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  emoji: { fontSize: 15, width: 20 },
  label: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '600', width: 36 },
  track: { flex: 1, height: 5, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' },
  fill:  { height: '100%', borderRadius: 3 },
  num:   { fontSize: 13, fontWeight: '900', width: 28, textAlign: 'right' },
  tag:   { color: 'rgba(255,255,255,0.30)', fontSize: 10, width: 26 },
});

export default function FortuneScreen() {
  const [loading, setLoading]       = useState(true);
  const [fortune, setFortune]       = useState<DailyFortune | null>(null);
  const [unlocked, setUnlocked]     = useState<string[]>([]);
  const [adLoading, setAdLoading]   = useState<CategoryKey | null>(null);
  const [adsRemoved, setAdsRemoved] = useState(false);
  const [activeBuff, setActiveBuff] = useState<FortuneBuff | null>(null);
  const [luckyInfo, setLuckyInfo]   = useState<LuckyInfo | null>(null);
  const [scores, setScores]         = useState<Record<CategoryKey, number> | null>(null);
  const [overall, setOverall]       = useState(0);

  useEffect(() => {
    (async () => {
      const p = await loadUserProfile();
      if (!p) { setLoading(false); return; }
      const today = getTodayDateString();

      setFortune(selectDailyFortune(today, p.diiSign, p.starSign));
      setLuckyInfo(deriveLuckyInfo(today, p.diiSign, p.starSign));

      const s: Record<CategoryKey, number> = {
        wealth: deriveScore(today, p.diiSign, p.starSign, 'wealth'),
        love:   deriveScore(today, p.diiSign, p.starSign, 'love'),
        health: deriveScore(today, p.diiSign, p.starSign, 'health'),
        work:   deriveScore(today, p.diiSign, p.starSign, 'work'),
      };
      setScores(s);
      setOverall(Math.round((s.wealth + s.love + s.health + s.work) / 4));

      const [todayUnlocked, noAds, todayBuff] = await Promise.all([
        getTodayUnlocked(today),
        hasRemovedAds(),
        getTodayFortuneBuff(today),
      ]);
      setUnlocked(todayUnlocked);
      setAdsRemoved(noAds);
      if (todayBuff) setActiveBuff(getActiveBuff(todayBuff.cardId));
      setLoading(false);
    })();
  }, []);

  async function watchAdForCategory(key: CategoryKey) {
    if (adLoading) return;
    setAdLoading(key);
    const today = getTodayDateString();
    if (adsRemoved) {
      try {
        await spend(50);
        setUnlocked(await unlockCategory(today, key));
      } catch {
        Alert.alert('코인 부족', '코인이 부족해요.\n코인샵에서 충전하거나 광고 제거를 해제해 보세요.', [
          { text: '코인샵 가기', onPress: () => router.push('/coin-shop') },
          { text: '닫기', style: 'cancel' },
        ]);
      }
    } else {
      const result = await showRewardedAd();
      if (result === 'earned') {
        setUnlocked(await unlockCategory(today, key));
      }
    }
    setAdLoading(null);
  }

  async function shareFortuneResult() {
    if (!fortune || !scores) return;
    const msg = `[UNSE 오늘의 운세]\n${fortune.date}\n\n종합 운세: ${overall}점 (${scoreLabel(overall)})\n\n✨ ${fortune.general.text}`;
    try { await Share.share({ message: msg }); } catch {}
  }

  if (loading) return (
    <View style={styles.center}>
      <StatusBar barStyle="light-content" backgroundColor="#080B18" />
      <ActivityIndicator color="#FFE500" />
    </View>
  );
  if (!fortune) return (
    <View style={styles.center}>
      <StatusBar barStyle="light-content" backgroundColor="#080B18" />
      <Text style={styles.err}>운세를 불러올 수 없어요</Text>
    </View>
  );

  const overallColor = overall >= 70 ? '#FFD700' : overall >= 50 ? '#88AAFF' : '#FF6B9D';

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#080B18" />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text style={styles.title}>오늘의 운세</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* 종합 점수 */}
        <View style={styles.overallCard}>
          <View style={styles.overallLeft}>
            <Text style={styles.overallDate}>{fortune.date}</Text>
            <Text style={[styles.overallScore, { color: overallColor }]}>{overall}</Text>
            <Text style={[styles.overallGrade, { color: overallColor }]}>{scoreLabel(overall)}</Text>
            <Text style={styles.overallLabel}>종합 운세</Text>
          </View>
          <View style={styles.overallRight}>
            {scores && CATEGORIES.map(({ key, emoji, label, color }, i) => (
              <ScoreBar key={key} score={scores[key]} color={color} label={label} emoji={emoji} delay={i * 130} />
            ))}
          </View>
        </View>

        {/* 행운 정보 */}
        {luckyInfo && (
          <View style={styles.luckyCard}>
            <Text style={styles.sectionTitle}>오늘의 행운</Text>
            <View style={styles.luckyGrid}>
              <View style={styles.luckyCell}>
                <View style={[styles.luckyDot, { backgroundColor: luckyInfo.color.hex }]} />
                <Text style={styles.luckyCellLabel}>행운색</Text>
                <Text style={styles.luckyCellVal}>{luckyInfo.color.name}</Text>
              </View>
              <View style={styles.luckyDivider} />
              <View style={styles.luckyCell}>
                <Text style={styles.luckyCellIcon}>🔢</Text>
                <Text style={styles.luckyCellLabel}>행운 숫자</Text>
                <Text style={styles.luckyCellVal}>{luckyInfo.number}</Text>
              </View>
              <View style={styles.luckyDivider} />
              <View style={styles.luckyCell}>
                <Text style={styles.luckyCellIcon}>🧭</Text>
                <Text style={styles.luckyCellLabel}>행운 방향</Text>
                <Text style={styles.luckyCellVal}>{luckyInfo.direction}</Text>
              </View>
              <View style={styles.luckyDivider} />
              <View style={styles.luckyCell}>
                <Text style={styles.luckyCellIcon}>🕐</Text>
                <Text style={styles.luckyCellLabel}>행운 시간</Text>
                <Text style={styles.luckyCellVal}>{luckyInfo.hour.split('(')[0]}</Text>
              </View>
            </View>
          </View>
        )}

        {/* 카드 버프 배너 */}
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
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardEmoji}>✨</Text>
            <Text style={styles.cardLabel}>총운</Text>
            <View style={styles.freeBadge}><Text style={styles.freeBadgeText}>무료</Text></View>
          </View>
          <Text style={styles.cardText}>{fortune.general.text}</Text>
        </View>

        {/* 유료 카테고리 */}
        {CATEGORIES.map(({ key, label, emoji, color }) => {
          const isUnlocked = unlocked.includes(key);
          const isBoosted = activeBuff &&
            (activeBuff.affectedCategory === key || activeBuff.affectedCategory === 'all');
          return (
            <View key={key} style={[
              styles.card,
              isBoosted && { borderColor: `${activeBuff!.color}44` },
            ]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardEmoji}>{emoji}</Text>
                <Text style={styles.cardLabel}>{label}</Text>
                {scores && (
                  <Text style={[styles.inlineScore, { color }]}>{scores[key]}점</Text>
                )}
                {isBoosted && (
                  <View style={[styles.badge, { backgroundColor: `${activeBuff!.color}20`, borderColor: `${activeBuff!.color}55` }]}>
                    <Text style={[styles.badgeText, { color: activeBuff!.color }]}>{activeBuff!.emoji} 버프</Text>
                  </View>
                )}
                {isUnlocked ? (
                  <View style={[styles.badge, { backgroundColor: `${color}22`, borderColor: `${color}44` }]}>
                    <Text style={[styles.badgeText, { color }]}>해금</Text>
                  </View>
                ) : (
                  <Text style={styles.lockIcon}>🔒</Text>
                )}
              </View>

              {isUnlocked ? (
                <>
                  <Text style={styles.cardText}>{fortune[key].text}</Text>
                  {isBoosted && (
                    <View style={[styles.buffInline, { backgroundColor: `${activeBuff!.color}10`, borderColor: `${activeBuff!.color}30` }]}>
                      <Text style={[styles.buffInlineText, { color: activeBuff!.color }]}>
                        {activeBuff!.emoji} {activeBuff!.bonusText}
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <Pressable
                  style={[styles.watchAdBtn, { borderColor: `${color}44`, opacity: adLoading === key ? 0.5 : 1 }]}
                  onPress={() => watchAdForCategory(key)}
                  disabled={adLoading !== null}
                >
                  {adLoading === key
                    ? <ActivityIndicator color={color} size="small" />
                    : <Text style={[styles.watchAdText, { color }]}>
                        {adsRemoved ? `💰 50코인으로 ${label} 보기` : `📺 광고 보고 ${label} 보기`}
                      </Text>
                  }
                </Pressable>
              )}
            </View>
          );
        })}

        <Pressable style={styles.shareBtn} onPress={shareFortuneResult}>
          <Text style={styles.shareBtnText}>↗  오늘의 운세 공유하기</Text>
        </Pressable>

        <Text style={styles.footNote}>
          {adsRemoved ? '카테고리당 50코인 차감 · 자정에 초기화됩니다.' : '광고 시청은 카테고리당 1회 · 자정에 초기화됩니다.'}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#080B18' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#080B18' },
  err: { color: 'rgba(255,255,255,0.5)' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 52, paddingHorizontal: 20, paddingBottom: 16,
  },
  backBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
  },
  backIcon: { color: '#fff', fontSize: 28, lineHeight: 32, marginTop: -2 },
  title: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },

  scroll: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },

  overallCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row', gap: 16, alignItems: 'center',
  },
  overallLeft: { alignItems: 'center', justifyContent: 'center', width: 68 },
  overallDate: { color: 'rgba(255,255,255,0.28)', fontSize: 9, letterSpacing: 0.3, marginBottom: 2 },
  overallScore: { fontSize: 46, fontWeight: '900', lineHeight: 50 },
  overallGrade: { fontSize: 13, fontWeight: '800', marginTop: 2 },
  overallLabel: { color: 'rgba(255,255,255,0.30)', fontSize: 10, marginTop: 4 },
  overallRight: { flex: 1, gap: 10 },

  luckyCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    gap: 12,
  },
  sectionTitle: { color: 'rgba(255,255,255,0.40)', fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  luckyGrid: { flexDirection: 'row', alignItems: 'center' },
  luckyCell: { flex: 1, alignItems: 'center', gap: 4 },
  luckyDot: { width: 20, height: 20, borderRadius: 10, marginBottom: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)' },
  luckyCellIcon: { fontSize: 18, marginBottom: 2 },
  luckyCellLabel: { color: 'rgba(255,255,255,0.30)', fontSize: 9, fontWeight: '600' },
  luckyCellVal: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  luckyDivider: { width: 1, height: 44, backgroundColor: 'rgba(255,255,255,0.07)' },

  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    gap: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardEmoji: { fontSize: 18 },
  cardLabel: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', flex: 1 },
  inlineScore: { fontSize: 13, fontWeight: '900' },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  freeBadge: {
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8,
    backgroundColor: 'rgba(255,220,0,0.12)', borderWidth: 1, borderColor: 'rgba(255,220,0,0.35)',
  },
  freeBadgeText: { fontSize: 10, fontWeight: '700', color: '#FFE500' },
  lockIcon: { fontSize: 14 },
  cardText: { fontSize: 14, color: 'rgba(255,255,255,0.72)', lineHeight: 22 },

  watchAdBtn: {
    borderWidth: 1, borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  watchAdText: { fontSize: 14, fontWeight: '600' },

  footNote: { fontSize: 11, color: 'rgba(255,255,255,0.18)', textAlign: 'center', marginTop: 4 },

  buffBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderWidth: 1, borderRadius: 14, padding: 12,
  },
  buffEmoji: { fontSize: 22, marginTop: 1 },
  buffTitle: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
  buffDesc: { fontSize: 12, color: 'rgba(255,255,255,0.50)', lineHeight: 17 },
  buffInline: { borderWidth: 1, borderRadius: 10, padding: 8, marginTop: 4 },
  buffInlineText: { fontSize: 12, lineHeight: 18 },

  shareBtn: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', borderRadius: 16,
    paddingVertical: 12, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  shareBtnText: { color: 'rgba(255,255,255,0.55)', fontSize: 14, fontWeight: '600' },
});
