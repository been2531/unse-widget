import {
  BlurMask, Canvas, Circle, Group, LinearGradient,
  Path, RadialGradient, Rect, RoundedRect, Skia, vec,
} from '@shopify/react-native-skia';
import { Redirect, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View,
  useWindowDimensions, StatusBar,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing, useAnimatedStyle, useSharedValue,
  withRepeat, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';

import { cardImageFor } from '@/gacha/cardAssets';
import { deriveMood } from '@/character/mood';
import { type Mood } from '@/character/types';
import { deriveValence, type FortuneValence } from '@/fortune/deriveValence';
import { getActiveBuff, type FortuneBuff } from '@/fortune/fortuneCardBuff';
import { fnv1aHash } from '@/fortune/hash';
import { deriveLuckyInfo, type LuckyInfo } from '@/fortune/luckyInfo';
import { selectDailyFortune } from '@/fortune/selectFortune';
import type { DailyFortune, DiiSign, UserProfile } from '@/fortune/types';
import { CARD_POOL, type ElementType } from '@/gacha/types';
import { getTodayDateString } from '@/shared/dateUtils';
import { loadCharacterState } from '@/storage/characterState';
import { claimDaily, getBalance } from '@/storage/coins';
import { getCollection } from '@/storage/collection';
import { checkInStreak, streakRarityBoost, type StreakState } from '@/storage/streak';
import { getTodayFortuneBuff } from '@/storage/todayFortuneCard';
import { loadUserProfile } from '@/storage/userProfile';

function deriveRarity(date: string, diiSign: DiiSign, valence: FortuneValence): Rarity {
  const roll = fnv1aHash(`${date}:${diiSign}:rarity`) % 100;
  if (valence === 'good') {
    if (roll < 5)  return 'mythic';
    if (roll < 25) return 'legendary';
    if (roll < 55) return 'epic';
    return 'rare';
  }
  if (valence === 'neutral') {
    if (roll < 5)  return 'epic';
    if (roll < 30) return 'rare';
    return 'common';
  }
  // bad
  if (roll < 10) return 'rare';
  return 'common';
}

// ─── 원소 타입 ─────────────────────────────────────────────────────────────

// 원소별 한국어 이름 (카드 메인 캐릭터명에 사용)
const ELEM_NAME: Record<ElementType, string> = {
  fire: '화염', water: '물', lightning: '번개',
  nature: '자연', dark: '암흑', light: '빛',
};

// 띠 → 원소 매핑 (12간지 × 6원소)
const DII_ELEMENT: Record<DiiSign, ElementType> = {
  '호랑이': 'fire',  '말': 'fire',
  '쥐':    'water', '돼지': 'water',
  '용':    'lightning', '원숭이': 'lightning',
  '소':    'nature', '개': 'nature',
  '뱀':    'dark',  '닭': 'dark',
  '토끼':  'light', '양': 'light',
};

const ELEM: Record<ElementType, {
  label: string; color: string; color2: string; glow: string;
  bgTop: string; bgBot: string;
}> = {
  fire:      { label: '🔥 화염', color: '#FF6600', color2: '#FFB800', glow: 'rgba(255,100,0,0.40)',   bgTop: '#2a0800', bgBot: '#180400' },
  water:     { label: '💧 물',   color: '#00AAFF', color2: '#00FFEE', glow: 'rgba(0,160,255,0.38)',   bgTop: '#001828', bgBot: '#000e18' },
  lightning: { label: '⚡ 번개', color: '#FFE500', color2: '#FFFFFF', glow: 'rgba(255,220,0,0.35)',   bgTop: '#12103a', bgBot: '#0c1e3e' },
  nature:    { label: '🌿 자연', color: '#44FF88', color2: '#AAFFCC', glow: 'rgba(0,255,120,0.30)',   bgTop: '#082010', bgBot: '#041008' },
  dark:      { label: '🌑 암흑', color: '#CC44FF', color2: '#FF88FF', glow: 'rgba(180,0,255,0.35)',   bgTop: '#100820', bgBot: '#080412' },
  light:     { label: '✨ 빛',   color: '#FFD700', color2: '#FFFFFF', glow: 'rgba(255,220,80,0.38)',  bgTop: '#1a1400', bgBot: '#100c00' },
};

// ─── 원소별 이펙트 경로 생성 ────────────────────────────────────────────────

// 불: 위로 올라가는 넘실거리는 불꽃
function makeFirePath(cx: number, seed: number, charH: number) {
  const path = Skia.Path.Make();
  const SEGS = 6;
  path.moveTo(cx, charH - 10);
  for (let i = 0; i < SEGS; i++) {
    const t0 = i / SEGS;
    const t1 = (i + 1) / SEGS;
    const y0 = charH - 10 - t0 * (charH - 20);
    const y1 = charH - 10 - t1 * (charH - 20);
    const wave = Math.sin((t0 + seed * 0.4) * Math.PI * 2.5) * 13 * (1 - t0 * 0.6);
    path.cubicTo(cx + wave, y0 - 10, cx - wave * 0.7, y1 + 8, cx + wave * 0.3, y1);
  }
  return path;
}

// 물: 수평 파동
function makeWaterPath(baseY: number, seed: number, cardW: number) {
  const path = Skia.Path.Make();
  const SEGS = 14;
  path.moveTo(0, baseY);
  for (let i = 1; i <= SEGS; i++) {
    const t = i / SEGS;
    path.lineTo(t * cardW, baseY + Math.sin(t * Math.PI * 5 + seed) * 10);
  }
  return path;
}

// 번개: 지그재그 볼트
function makeLightningPath(cx: number, seed: number, charH: number) {
  const path = Skia.Path.Make();
  const STEPS = 7;
  const stepH = (charH - 30) / STEPS;
  path.moveTo(cx, 15);
  for (let i = 1; i <= STEPS; i++) {
    const sign = (i + seed) % 2 === 0 ? 1 : -1;
    path.lineTo(cx + sign * (10 + (i * 13 + seed * 7) % 20), 15 + stepH * i);
  }
  return path;
}

// 자연: 덩굴 곡선
function makeNaturePath(startX: number, seed: number, charH: number) {
  const path = Skia.Path.Make();
  path.moveTo(startX, charH - 10);
  const SEGS = 5;
  for (let i = 0; i < SEGS; i++) {
    const t = (i + 1) / SEGS;
    const x = startX + Math.sin(t * Math.PI * 2 + seed) * 20;
    const y = charH - 10 - t * (charH - 20);
    path.cubicTo(startX + 18, y + 15, x - 12, y - 10, x, y);
  }
  return path;
}

// 암흑: 소용돌이 나선
function makeDarkPath(cx: number, cy: number, seed: number, r: number) {
  const path = Skia.Path.Make();
  const STEPS = 40;
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS;
    const angle = t * Math.PI * 4 + seed;
    const radius = r * (0.1 + t * 0.9);
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius * 0.6;
    if (i === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  }
  return path;
}

// 빛: 방사형 광선
function makeLightPaths(cx: number, cy: number, seed: number, len: number) {
  return Array.from({ length: 8 }, (_, i) => {
    const path = Skia.Path.Make();
    const angle = (i / 8) * Math.PI * 2 + seed * 0.3;
    const r0 = len * 0.22;
    const r1 = len * (0.55 + (i % 3) * 0.12);
    path.moveTo(cx + Math.cos(angle) * r0, cy + Math.sin(angle) * r0);
    path.lineTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
    return path;
  });
}

// ─── 희귀도 ────────────────────────────────────────────────────────────────
type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

const RARITY: Record<Rarity, {
  label: string; stars: string; starColor: string;
  borderW: number; foilOpacity: number; foilShift: number;
  specOpacity: number; sparkles: boolean;
}> = {
  common:    { label: 'Common',    stars: '★',      starColor: '#999',    borderW: 1.5, foilOpacity: 0.18, foilShift: 50,  specOpacity: 0.14, sparkles: false },
  rare:      { label: 'Rare',      stars: '★★',     starColor: '#4DBEFF', borderW: 2,   foilOpacity: 0.48, foilShift: 110, specOpacity: 0.36, sparkles: false },
  epic:      { label: 'Epic',      stars: '★★★',    starColor: '#CC44FF', borderW: 2.5, foilOpacity: 0.70, foilShift: 160, specOpacity: 0.55, sparkles: false },
  legendary: { label: 'Legendary', stars: '★★★★',   starColor: '#FF8800', borderW: 3.5, foilOpacity: 0.85, foilShift: 195, specOpacity: 0.70, sparkles: true  },
  mythic:    { label: 'Mythic',    stars: '★★★★★',  starColor: '#FFD700', borderW: 4.5, foilOpacity: 0.95, foilShift: 240, specOpacity: 0.85, sparkles: true  },
};

// 홀로그램 조밀한 무지개 (포켓몬 카드 벤치마크)
const HOLO = [
  'rgba(255,0,100,0.85)', 'rgba(255,80,0,0.80)', 'rgba(255,210,0,0.80)',
  'rgba(60,255,80,0.80)', 'rgba(0,210,255,0.80)', 'rgba(20,60,255,0.80)',
  'rgba(160,0,255,0.80)', 'rgba(255,0,100,0.85)', 'rgba(255,80,0,0.80)',
  'rgba(255,210,0,0.80)', 'rgba(60,255,80,0.80)', 'rgba(0,210,255,0.80)',
];

function makeSparkles(n: number, w: number, h: number) {
  return Array.from({ length: n }, (_, i) => ({
    x: (i * 79 + 23) % w,
    y: (i * 113 + 47) % h,
    r: 1.1 + (i % 3) * 0.8,
  }));
}

// ─── 컴포넌트 ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const CARD_W = Math.min(screenW * 0.84, 310);
  const CARD_H = CARD_W * 1.42;
  const CHAR_H = CARD_H * 0.58;
  const CHAR_BLEED = Math.round(CHAR_H * 0.14); // 캐릭터가 아트워크 창 아래로 돌출되는 픽셀
  const CORNER = 16;
  const FOIL_W = CARD_W * 3;
  const FOIL_H = CARD_H * 3;

  const [loading, setLoading]     = useState(true);
  const [profile, setProfile]     = useState<UserProfile | null>(null);
  const [fortune, setFortune]     = useState<DailyFortune | null>(null);
  const [mood, setMood]           = useState<Mood>('neutral');
  const [element, setElement]     = useState<ElementType>('lightning');
  const [rarity, setRarity]       = useState<Rarity>('common');
  const [balance, setBalance]     = useState(0);
  const [activeBuff, setActiveBuff] = useState<FortuneBuff | null>(null);
  const [streak, setStreak]       = useState<StreakState>({ currentStreak: 0, lastDate: '', longestStreak: 0 });
  const [luckyInfo, setLuckyInfo] = useState<LuckyInfo | null>(null);
  const [isNewDay, setIsNewDay]   = useState(false);

  // 카드 도착 연출 애니메이션
  const cardRevealA = useSharedValue(0);
  const arrivalBannerA = useSharedValue(0);

  const tiltX    = useSharedValue(0);
  const tiltY    = useSharedValue(0);
  const lightA1  = useSharedValue(0);
  const lightA2  = useSharedValue(0);
  const glowR    = useSharedValue(CARD_W * 0.18);
  const sparkleA = useSharedValue(0);
  const bgPulse  = useSharedValue(0.55);
  const floatY   = useSharedValue(0);

  const R    = RARITY[rarity];
  const E    = ELEM[element];

  // 현재 원소+등급에 해당하는 캐릭터명
  const charStage = rarity === 'mythic' ? 4 : (rarity === 'legendary' || rarity === 'epic') ? 3 : rarity === 'rare' ? 2 : 1;
  const charCard = CARD_POOL.find(c => c.id === `${element}_${charStage}`);
  const charNameKo = charCard?.nameKo ?? E.label;
  const cardImg = cardImageFor(element, rarity);

  // 원소별 이펙트 경로 (메모이제이션)
  const effectPaths = useMemo(() => {
    switch (element) {
      case 'fire':      return [makeFirePath(CARD_W * 0.40, 3, CHAR_H), makeFirePath(CARD_W * 0.60, 7, CHAR_H)];
      case 'water':     return [makeWaterPath(CHAR_H * 0.35, 2, CARD_W), makeWaterPath(CHAR_H * 0.60, 5, CARD_W), makeWaterPath(CHAR_H * 0.80, 8, CARD_W)];
      case 'lightning': return [makeLightningPath(CARD_W * 0.38, 3, CHAR_H), makeLightningPath(CARD_W * 0.62, 7, CHAR_H)];
      case 'nature':    return [makeNaturePath(CARD_W * 0.35, 2, CHAR_H), makeNaturePath(CARD_W * 0.65, 5, CHAR_H)];
      case 'dark':      return [makeDarkPath(CARD_W / 2, CHAR_H / 2, 0, CARD_W * 0.35)];
      case 'light':     return makeLightPaths(CARD_W / 2, CHAR_H / 2, 0, CARD_W * 0.4);
    }
  }, [element, CARD_W, CHAR_H]);

  const sparkles = useMemo(() => makeSparkles(24, CARD_W - 20, CHAR_H - 20), [CARD_W, CHAR_H]);

  const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
  const weekDays = useMemo(() => {
    const today = getTodayDateString();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().slice(0, 10);
      return { date: dateStr, dayLabel: DAY_NAMES[d.getDay()], isToday: dateStr === today };
    });
  }, []);

  const bgStars = useMemo(() => Array.from({ length: 60 }, (_, i) => ({
    x: (i * 137 + 29) % screenW,
    y: (i * 211 + 71) % screenH,
    r: 0.4 + (i % 6) * 0.28,
    a: 0.15 + (i % 8) * 0.07,
  })), [screenW, screenH]);

  // ── 데이터 로드 ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const p = await loadUserProfile();
      if (!p) { setLoading(false); return; }
      const today = getTodayDateString();
      await loadCharacterState();
      const valence = deriveValence(today, p.diiSign, p.starSign);
      setMood(deriveMood({ affection: 100, neglectDays: 0, fortuneValence: valence }));
      setElement(DII_ELEMENT[p.diiSign] ?? 'lightning');

      const streakState = await checkInStreak(today);
      setStreak(streakState);
      const baseRarity = deriveRarity(today, p.diiSign, valence);
      setRarity(streakRarityBoost(baseRarity, streakState.currentStreak) as Rarity);

      setFortune(selectDailyFortune(today, p.diiSign, p.starSign));
      setLuckyInfo(deriveLuckyInfo(today, p.diiSign, p.starSign));
      setProfile(p);

      const { balance: b, claimed } = await claimDaily(today);
      setBalance(b);
      if (claimed) {
        setIsNewDay(true);
        cardRevealA.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.back(1.2)) });
        arrivalBannerA.value = withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(1, { duration: 1800 }),
          withTiming(0, { duration: 400 }),
        );
      }

      const todayBuff = await getTodayFortuneBuff(today);
      if (todayBuff) setActiveBuff(getActiveBuff(todayBuff.cardId));
      setLoading(false);
    })();
  }, []);

  // ── 캐릭터 부유 애니메이션 ────────────────────────────────────────────────
  useEffect(() => {
    const FLOAT = { joyful: { amplitude: 8, duration: 800 }, neutral: { amplitude: 5, duration: 2200 }, lonely: { amplitude: 2, duration: 4500 } };
    const { amplitude, duration } = FLOAT[mood];
    floatY.value = withRepeat(
      withSequence(
        withTiming(-amplitude, { duration, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration, easing: Easing.inOut(Easing.sin) }),
      ), -1, false,
    );
  }, [mood]);

  // ── 이펙트 애니메이션 ────────────────────────────────────────────────────
  useEffect(() => {
    const dur = mood === 'joyful' ? 430 : 820;
    lightA1.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 50 }),
        withTiming(0,   { duration: 65 }),
        withTiming(0.6, { duration: 40 }),
        withTiming(0,   { duration: dur }),
      ), -1, false,
    );
    lightA2.value = withRepeat(
      withSequence(
        withTiming(0,    { duration: 230 }),
        withTiming(0.75, { duration: 50 }),
        withTiming(0,    { duration: 65 }),
        withTiming(0,    { duration: dur }),
      ), -1, false,
    );
    glowR.value = withRepeat(
      withSequence(
        withTiming(CARD_W * 0.24, { duration: 920, easing: Easing.inOut(Easing.sin) }),
        withTiming(CARD_W * 0.14, { duration: 920, easing: Easing.inOut(Easing.sin) }),
      ), -1, true,
    );
    if (R.sparkles) {
      sparkleA.value = withRepeat(
        withSequence(
          withTiming(1,   { duration: 1100, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.1, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
        ), -1, true,
      );
    }
    bgPulse.value = withRepeat(
      withSequence(
        withTiming(0.80, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.40, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
      ), -1, true,
    );
  }, [mood, rarity, CARD_W]);

  // ── 제스처 ───────────────────────────────────────────────────────────────
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      tiltX.value = Math.max(-1, Math.min(1, (e.x - CARD_W / 2) / (CARD_W / 2)));
      tiltY.value = Math.max(-1, Math.min(1, (e.y - CARD_H / 2) / (CARD_H / 2)));
    })
    .onEnd(() => {
      tiltX.value = withSpring(0, { damping: 10, stiffness: 200 });
      tiltY.value = withSpring(0, { damping: 10, stiffness: 200 });
    });

  // ── 애니메이션 스타일 ────────────────────────────────────────────────────
  const cardTiltStyle = useAnimatedStyle(() => {
    const mag = Math.min(Math.sqrt(tiltX.value ** 2 + tiltY.value ** 2), 1);
    return {
      transform: [
        { perspective: 900 },
        { rotateX: `${-tiltY.value * 24}deg` },
        { rotateY: `${tiltX.value * 24}deg` },
        { scale: 1 + mag * 0.04 },
      ],
    };
  });

  // 홀로그램 foil — 크게 이동 (포켓몬 카드 효과)
  const foilStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tiltX.value * R.foilShift },
      { translateY: tiltY.value * (R.foilShift * 0.65) },
    ],
    opacity: R.foilOpacity,
  }));

  // 스페큘러 하이라이트 — 반대 방향 (거울 반사)
  const specStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -tiltX.value * 85 },
      { translateY: -tiltY.value * 60 },
    ],
    opacity: R.specOpacity,
  }));

  // 카드 뒤 배경 글로우
  const bgGlowStyle = useAnimatedStyle(() => ({ opacity: bgPulse.value }));

  // 카드 도착 연출
  const cardRevealStyle = useAnimatedStyle(() => ({
    opacity: isNewDay ? cardRevealA.value : 1,
    transform: [{ scale: isNewDay ? (0.88 + cardRevealA.value * 0.12) : 1 }],
  }));
  const arrivalBannerStyle = useAnimatedStyle(() => ({
    opacity: arrivalBannerA.value,
    transform: [{ translateY: (1 - arrivalBannerA.value) * -12 }],
  }));

  // 캐릭터 부유
  const charFloatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  // 캐릭터 parallax — 틸트 시 배경보다 더 많이 이동해 Z-depth 생성
  const charParallaxStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tiltX.value * 14 },
      { translateY: tiltY.value * 8 },
    ],
  }));

  // ── 렌더 ─────────────────────────────────────────────────────────────────
  if (loading)  return <View style={styles.center}><StatusBar barStyle="light-content" backgroundColor="#080B18" /><ActivityIndicator color="#FFE500" /></View>;
  if (!profile) return <Redirect href="/onboarding" />;
  if (!fortune) return <View style={styles.center}><StatusBar barStyle="light-content" backgroundColor="#080B18" /><ActivityIndicator color="#FFE500" /></View>;

  const borderColor = rarity === 'legendary' ? `${E.color}EE` : RARITY[rarity].starColor === '#AAA' ? 'rgba(180,180,180,0.5)' : `${E.color}CC`;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#080B18" />

      {/* ── 전체 화면 배경: TCG 진열장 스타일 ── */}
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* 기본 어두운 그라디언트 */}
        <Rect x={0} y={0} width={screenW} height={screenH}>
          <LinearGradient
            start={vec(screenW * 0.4, 0)}
            end={vec(screenW * 0.6, screenH)}
            colors={['#0E0B22', '#080B1A', '#060A16']}
          />
        </Rect>

        {/* 상단 앰비언트 보라빛 */}
        <Circle cx={screenW * 0.5} cy={screenH * 0.08} r={screenW * 0.7}
          color="rgba(60,30,120,0.22)">
          <BlurMask blur={80} style="normal" />
        </Circle>

        {/* 하단 앰비언트 원소 컬러 */}
        <Circle cx={screenW * 0.5} cy={screenH * 0.92} r={screenW * 0.5}
          color={`${E.color}12`}>
          <BlurMask blur={70} style="normal" />
        </Circle>

        {/* 별 필드 */}
        {bgStars.map((s, i) => (
          <Circle key={i} cx={s.x} cy={s.y} r={s.r}
            color={`rgba(255,255,255,${s.a})`} />
        ))}
      </Canvas>

      {/* 상단 바 — 고정 */}
      <View style={styles.topBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.appTitle}>UNSE</Text>
          {streak.currentStreak >= 2 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 {streak.currentStreak}일째</Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable style={styles.coinBadge} onPress={() => router.push('/gacha')}>
            <Text style={styles.coinText}>💰 {balance.toLocaleString()}</Text>
          </Pressable>
          <Pressable style={styles.gachaBtn} onPress={() => router.push('/gacha')}>
            <Text style={styles.gachaBtnText}>✦ 뽑기</Text>
          </Pressable>
        </View>
      </View>

      {/* 스크롤 가능한 본문 */}
      <ScrollView
        style={{ flex: 1, width: '100%' }}
        contentContainerStyle={{ alignItems: 'center', paddingBottom: 32, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
      {/* 날짜 + 카드 도착 배너 */}
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Text style={styles.dateLabel}>{fortune.date}</Text>
        {isNewDay && (
          <Animated.View style={[styles.arrivalBanner, arrivalBannerStyle]}>
            <Text style={styles.arrivalText}>
              {streak.currentStreak >= 7 ? '🔥 ' : ''}오늘의 운명 카드가 도착했습니다
              {streak.currentStreak >= 7 ? ` — ${streak.currentStreak}일 연속 등급 UP!` : ''}
            </Text>
          </Animated.View>
        )}
      </View>

      {/* 카드 + 배경 글로우 (래퍼) */}
      <Animated.View style={[{ alignItems: 'center' }, cardRevealStyle]}>

        {/* 카드 뒤 원소 글로우 — overflow:hidden 밖에 위치 */}
        <Animated.View
          style={[bgGlowStyle, { position: 'absolute', zIndex: 0, top: -30, left: -50 }]}
          pointerEvents="none"
        >
          <Canvas style={{ width: CARD_W + 100, height: CARD_H + 60 }}>
            <Circle cx={(CARD_W + 100) / 2} cy={(CARD_H + 60) / 2}
              r={CARD_W * 0.52} color={E.glow}>
              <BlurMask blur={60} style="normal" />
            </Circle>
          </Canvas>
        </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[cardTiltStyle, { zIndex: 1, width: CARD_W, height: CARD_H }]}>
          {/* overflow:hidden → 배경/holo/이펙트/info 클리핑 (캐릭터는 밖에 위치) */}
          <View style={{ width: CARD_W, height: CARD_H, borderRadius: CORNER, overflow: 'hidden' }}>

            {/* Layer 1: 정적 Skia — 배경 + 원소 이펙트 + 테두리 */}
            <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">

              {/* 카드 전체 베이스: 매우 어두운 솔리드 */}
              <Rect x={0} y={0} width={CARD_W} height={CARD_H} color={E.bgBot} />

              {/* ── 아트워크 창 내부 배경 (내부 프레임 안에만 국한) ── */}
              <Group clip={Skia.RRectXY(Skia.XYWHRect(8, 8, CARD_W - 16, CHAR_H - 6), 10, 10)}>
                {/* 아트워크 창 원소 그라디언트 */}
                <Rect x={8} y={8} width={CARD_W - 16} height={CHAR_H - 6}>
                  <LinearGradient
                    start={vec(CARD_W * 0.2, 8)}
                    end={vec(CARD_W * 0.8, CHAR_H)}
                    colors={[E.bgTop, E.bgBot]}
                  />
                </Rect>

                {/* Legendary/Mythic: 별 배경 (창 내부) */}
                {(rarity === 'legendary' || rarity === 'mythic') && Array.from({ length: 35 }, (_, i) => (
                  <Circle key={i}
                    cx={8 + (i * 71 + 11) % (CARD_W - 16)}
                    cy={8 + (i * 109 + 31) % (CHAR_H - 14)}
                    r={0.7 + (i % 4) * 0.55}
                    color={`rgba(255,255,255,${0.25 + (i % 5) * 0.10})`}
                  />
                ))}

                {/* Epic+: 네뷸라 (창 내부) */}
                {(rarity === 'epic' || rarity === 'legendary' || rarity === 'mythic') && <>
                  <Circle cx={CARD_W * 0.28} cy={CHAR_H * 0.4} r={CARD_W * 0.3}
                    color={`${E.color}18`}>
                    <BlurMask blur={26} style="normal" />
                  </Circle>
                  <Circle cx={CARD_W * 0.74} cy={CHAR_H * 0.65} r={CARD_W * 0.22}
                    color={`${E.color2}12`}>
                    <BlurMask blur={20} style="normal" />
                  </Circle>
                </>}
              </Group>

              {/* ── 이펙트: Rare 이상부터, 카드 전체 영역에 표출 ── */}
              {rarity !== 'common' && <>

                {/* 원소 발광 — 카드 전반 */}
                <Circle cx={CARD_W / 2} cy={CARD_H * 0.35} r={glowR} color={E.glow}>
                  <BlurMask blur={55} style="normal" />
                </Circle>

                {/* 원소별 파티클 이펙트 */}
                {element === 'water' ? (
                  <>
                    {effectPaths.map((p, i) => (
                      <Group key={i} opacity={i === 1 ? lightA1 : lightA2}>
                        <Path path={p} color={E.color} style="stroke" strokeWidth={2.2} strokeCap="round">
                          <BlurMask blur={4} style="solid" />
                        </Path>
                        <Path path={p} color={E.color2} style="stroke" strokeWidth={0.9} strokeCap="round" />
                      </Group>
                    ))}
                  </>
                ) : element === 'light' ? (
                  <Group opacity={lightA1}>
                    {effectPaths.map((p, i) => (
                      <Path key={i} path={p} color={i % 2 === 0 ? E.color : E.color2}
                        style="stroke" strokeWidth={1.8} strokeCap="round">
                        <BlurMask blur={5} style="solid" />
                      </Path>
                    ))}
                  </Group>
                ) : (
                  <>
                    <Group opacity={lightA1}>
                      <Path path={effectPaths[0]}
                        color={E.color} style="stroke"
                        strokeWidth={element === 'fire' ? 3.5 : 2.8}
                        strokeCap="round">
                        <BlurMask blur={element === 'fire' ? 8 : 5} style="solid" />
                      </Path>
                      <Path path={effectPaths[0]}
                        color={E.color2} style="stroke" strokeWidth={1.2} strokeCap="round" />
                    </Group>
                    {effectPaths.length > 1 && (
                      <Group opacity={lightA2}>
                        <Path path={effectPaths[1]}
                          color={E.color} style="stroke" strokeWidth={2.2} strokeCap="round">
                          <BlurMask blur={4} style="solid" />
                        </Path>
                      </Group>
                    )}
                  </>
                )}

                {/* Legendary/Mythic: 스파클 — 카드 전반 */}
                {R.sparkles && (
                  <Group opacity={sparkleA}>
                    {sparkles.map((s, i) => (
                      <Circle key={i} cx={s.x + 10} cy={s.y + 10} r={s.r}
                        color={`rgba(255,255,255,${0.45 + (i % 4) * 0.13})`} />
                    ))}
                  </Group>
                )}
              </>}

              {/* 아트워크 창 내부 프레임 — 원소 컬러로 선명하게 */}
              <RoundedRect x={8} y={8} width={CARD_W - 16} height={CHAR_H - 6} r={10}
                color={E.color} style="stroke" strokeWidth={2} />
              {/* 창 상단 하이라이트 */}
              <RoundedRect x={9} y={9} width={CARD_W - 18} height={CHAR_H - 8} r={9}
                color="rgba(255,255,255,0.20)" style="stroke" strokeWidth={0.8} />

              {/* 캐릭터 팝아웃 그림자 */}
              <Rect x={CARD_W * 0.08} y={CHAR_H - 28} width={CARD_W * 0.84} height={36}>
                <LinearGradient
                  start={vec(CARD_W / 2, CHAR_H - 28)}
                  end={vec(CARD_W / 2, CHAR_H + 8)}
                  colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.70)']}
                />
              </Rect>

              {/* 구분선 */}
              <Rect x={10} y={CHAR_H + 10} width={CARD_W - 20} height={1}
                color={`${E.color}66`} />

            </Canvas>

            {/* Layer 2: 홀로그램 foil — 3배 캔버스, 틸트로 이동 */}
            <Animated.View style={[StyleSheet.absoluteFill, foilStyle]} pointerEvents="none">
              <Canvas style={{ width: FOIL_W, height: FOIL_H, marginLeft: -CARD_W, marginTop: -CARD_H }}>
                <Rect x={0} y={0} width={FOIL_W} height={FOIL_H}>
                  <LinearGradient
                    start={vec(0, 0)} end={vec(FOIL_W, FOIL_H)}
                    colors={HOLO}
                  />
                </Rect>
              </Canvas>
            </Animated.View>

            {/* Layer 3: 스페큘러 하이라이트 — 반대 방향 */}
            <Animated.View style={[StyleSheet.absoluteFill, specStyle]} pointerEvents="none">
              <Canvas style={{ width: CARD_W * 2, height: CARD_H * 2, marginLeft: -CARD_W / 2, marginTop: -CARD_H * 0.3 }}>
                <Circle cx={CARD_W} cy={CARD_H * 0.5} r={CARD_W * 0.42} color="rgba(255,255,255,1)">
                  <BlurMask blur={65} style="normal" />
                </Circle>
              </Canvas>
            </Animated.View>

            {/* Layer 5: 카드 정보 — TCG 스타일, 캐릭터 위에 표시 */}
            <View style={{ position: 'absolute', top: CHAR_H + 1, left: 0, right: 0, bottom: 0, paddingHorizontal: 12, zIndex: 8 }}
              pointerEvents="none">

              {/* 상단 구분선 */}
              <Canvas style={{ width: CARD_W - 24, height: 12 }} pointerEvents="none">
                <Rect x={0} y={6} width={CARD_W - 24} height={0.8} color={`${E.color}55`} />
              </Canvas>

              {/* 이름 + 원소 뱃지 행 */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <View style={{ flex: 1, gap: 1 }}>
                  {/* 캐릭터명 (원소+등급 기반) */}
                  <Text style={{ color: E.color, fontSize: 15, fontWeight: '900', letterSpacing: 0.4, textShadowColor: `${E.glow}`, textShadowRadius: 8 }} numberOfLines={1}>
                    {charNameKo}
                  </Text>
                  {/* 원소 타입 */}
                  <Text style={{ color: E.color2, fontSize: 9, letterSpacing: 1.0, fontWeight: '600', opacity: 0.75 }}>
                    {E.label} · UNSE CARD
                  </Text>
                </View>
                {/* 원소 뱃지 */}
                <View style={{
                  backgroundColor: `${E.color}28`, borderRadius: 8,
                  borderWidth: 1, borderColor: `${E.color}77`,
                  paddingHorizontal: 7, paddingVertical: 3,
                }}>
                  <Text style={{ color: E.color, fontSize: 10, fontWeight: '800', textShadowColor: E.glow, textShadowRadius: 6 }}>{E.label}</Text>
                </View>
              </View>

              {/* 오늘의 운세 텍스트 */}
              <Text style={{
                color: 'rgba(255,255,255,0.88)', fontSize: 11, lineHeight: 16,
                fontStyle: 'italic', letterSpacing: 0.1,
              }} numberOfLines={3}>{fortune.general.text}</Text>

              {/* 하단 행: 희귀도 + 버프 */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' as any, paddingBottom: 10, paddingTop: 4 }}>
                <Text style={{ color: R.starColor, fontSize: 12, fontWeight: '700', letterSpacing: 1, textShadowColor: R.starColor, textShadowRadius: 6 }}>{R.stars}</Text>
                {activeBuff && (
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', gap: 3,
                    backgroundColor: `${activeBuff.color}25`, borderRadius: 6,
                    borderWidth: 1, borderColor: `${activeBuff.color}60`,
                    paddingHorizontal: 6, paddingVertical: 2,
                  }}>
                    <Text style={{ fontSize: 8, color: activeBuff.color, fontWeight: '800' }}>
                      {activeBuff.emoji} BUFF
                    </Text>
                  </View>
                )}
              </View>
            </View>

          </View>{/* end overflow:hidden */}

          {/* Layer 4: 캐릭터 — overflow:hidden 밖, 내부 프레임 위아래 팝아웃 + parallax
              top:0 → 카드 경계 안에서 시작, 내부 프레임(y=8)보다 위로 자연스럽게 겹침 */}
          {cardImg && (
            <Animated.View
              style={[charFloatStyle, charParallaxStyle, {
                position: 'absolute',
                top: 0,
                left: 0, right: 0,
                height: CHAR_H + CHAR_BLEED,
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
              }]}
              pointerEvents="none"
            >
              <Image source={cardImg}
                style={{ width: CARD_W - 8, height: CHAR_H + CHAR_BLEED - 4 }}
                resizeMode="contain"
              />
            </Animated.View>
          )}

          {/* Layer 6: 외부 테두리 — 캐릭터 위에 렌더링, 카드가 캐릭터를 담는 느낌 */}
          <Canvas style={[StyleSheet.absoluteFill, { zIndex: 15 }]} pointerEvents="none">
            <RoundedRect x={0} y={0} width={CARD_W} height={CARD_H} r={CORNER}
              color={borderColor} style="stroke" strokeWidth={R.borderW + 0.5} />
          </Canvas>
        </Animated.View>
      </GestureDetector>
      </Animated.View>

      {/* 오늘의 카드 등급 — 카드 바로 아래 얇은 한 줄 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Text style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11 }}>오늘의 카드</Text>
        <Text style={{ color: R.starColor, fontSize: 11, fontWeight: '800' }}>{R.stars} {R.label}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.20)', fontSize: 11 }}>·</Text>
        <Text style={{ color: E.color, fontSize: 11, fontWeight: '700' }}>{E.label}</Text>
      </View>

      {/* 오늘의 행운 정보 — 색상/숫자/방향 */}
      {luckyInfo && (
        <View style={styles.luckyRow}>
          <View style={[styles.luckyColorDot, { backgroundColor: luckyInfo.color.hex }]} />
          <Text style={styles.luckyItem}>행운의 색 <Text style={styles.luckyVal}>{luckyInfo.color.name}</Text></Text>
          <Text style={styles.luckySep}>·</Text>
          <Text style={styles.luckyItem}>숫자 <Text style={styles.luckyVal}>{luckyInfo.number}</Text></Text>
          <Text style={styles.luckySep}>·</Text>
          <Text style={styles.luckyItem}>방향 <Text style={styles.luckyVal}>{luckyInfo.direction}</Text></Text>
        </View>
      )}

      {/* 이번 주 운세 흐름 캘린더 */}
      {profile && weekDays && (
        <View style={styles.weekStrip}>
          {weekDays.map(({ date: d, dayLabel, isToday }) => {
            const v = deriveValence(d, profile.diiSign, profile.starSign);
            const dotColor = v === 'good' ? '#FFD700' : v === 'neutral' ? '#88AAFF' : '#FF6B9D';
            return (
              <View key={d} style={styles.weekCell}>
                <Text style={[styles.weekDayLabel, isToday && { color: '#FFFFFF', fontWeight: '700' }]}>{dayLabel}</Text>
                <View style={[
                  styles.weekDot,
                  { backgroundColor: isToday ? dotColor : `${dotColor}55`, borderColor: dotColor },
                  isToday && styles.weekDotToday,
                ]} />
                {isToday && <View style={[styles.weekDotGlow, { backgroundColor: dotColor }]} />}
              </View>
            );
          })}
        </View>
      )}

      {/* 주요 액션 — 운세 보기 (1순위) */}
      <Pressable
        style={[styles.primaryBtn, { borderColor: `${E.color}88`, shadowColor: E.color }]}
        onPress={() => router.push('/fortune')}
      >
        <Text style={[styles.primaryBtnText, { color: E.color }]}>✦ 오늘의 운세 보기</Text>
      </Pressable>

      {/* 보조 액션 — 컬렉션 | 뽑기 */}
      <View style={{ flexDirection: 'row', gap: 10, width: '100%', paddingHorizontal: 20 }}>
        <Pressable style={styles.secondaryBtn} onPress={() => router.push('/collection')}>
          <Text style={styles.secondaryBtnIcon}>📚</Text>
          <Text style={styles.secondaryBtnText}>컬렉션</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={() => router.push('/gacha')}>
          <Text style={styles.secondaryBtnIcon}>✦</Text>
          <Text style={styles.secondaryBtnText}>카드 뽑기</Text>
        </Pressable>
      </View>

      <Text style={styles.hintText}>카드를 드래그하면 홀로그램이 빛납니다</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#080B18', alignItems: 'center', paddingTop: 0, paddingBottom: 24, gap: 18 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#080B18' },
  topBar: { width: '100%', paddingTop: 52, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  appTitle: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', letterSpacing: 3.5 },
  dateLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 12, letterSpacing: 0.5 },
  coinBadge: {
    backgroundColor: 'rgba(255,220,0,0.12)', borderWidth: 1, borderColor: 'rgba(255,220,0,0.30)',
    paddingVertical: 5, paddingHorizontal: 10, borderRadius: 12,
  },
  coinText: { color: '#FFE500', fontWeight: '700', fontSize: 12 },
  gachaBtn: {
    backgroundColor: '#FFE500', borderRadius: 16,
    paddingVertical: 7, paddingHorizontal: 14,
    shadowColor: '#FFE500', shadowOpacity: 0.4, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 5,
  },
  gachaBtnText: { color: '#111', fontWeight: '900', fontSize: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardName: { fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
  cardType: { fontSize: 12, fontWeight: '600', opacity: 0.85 },
  cardFortune: { color: 'rgba(255,255,255,0.70)', fontSize: 12, lineHeight: 18 },
  rarityText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.8 },
  primaryBtn: {
    alignSelf: 'stretch', marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1.5, borderRadius: 28,
    paddingVertical: 16, alignItems: 'center',
    shadowOpacity: 0.25, shadowOffset: { width: 0, height: 3 }, shadowRadius: 12, elevation: 6,
  },
  primaryBtnText: { fontWeight: '900', fontSize: 16, letterSpacing: 0.4 },
  secondaryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18, paddingVertical: 12,
  },
  secondaryBtnIcon: { fontSize: 15 },
  secondaryBtnText: { color: 'rgba(255,255,255,0.65)', fontWeight: '700', fontSize: 14 },
  hintText: { color: 'rgba(255,255,255,0.18)', fontSize: 11 },
  streakBadge: {
    backgroundColor: 'rgba(255,120,0,0.18)', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,120,0,0.40)',
    paddingVertical: 3, paddingHorizontal: 8,
  },
  streakText: { color: '#FF8800', fontWeight: '700', fontSize: 12 },
  arrivalBanner: {
    backgroundColor: 'rgba(255,220,0,0.10)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,220,0,0.25)',
    paddingVertical: 6, paddingHorizontal: 14,
  },
  arrivalText: { color: '#FFE500', fontWeight: '700', fontSize: 12, letterSpacing: 0.3 },
  luckyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14, paddingVertical: 8, paddingHorizontal: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  luckyColorDot: { width: 10, height: 10, borderRadius: 5, marginRight: 2 },
  luckyItem: { color: 'rgba(255,255,255,0.40)', fontSize: 11 },
  luckyVal: { color: 'rgba(255,255,255,0.80)', fontWeight: '700' },
  luckySep: { color: 'rgba(255,255,255,0.18)', fontSize: 11 },
  weekStrip: {
    flexDirection: 'row', alignSelf: 'stretch',
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16, paddingVertical: 10, paddingHorizontal: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    justifyContent: 'space-between',
  },
  weekCell: { alignItems: 'center', gap: 6, flex: 1 },
  weekDayLabel: { color: 'rgba(255,255,255,0.28)', fontSize: 10, fontWeight: '600' },
  weekDot: {
    width: 10, height: 10, borderRadius: 5,
    borderWidth: 1,
  },
  weekDotToday: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  weekDotGlow: {
    position: 'absolute', bottom: -2, width: 14, height: 4, borderRadius: 3, opacity: 0.4,
  },
});
