import {
  BlurMask, Canvas, Circle, Group, Image as SkiaImage, LinearGradient,
  Path, RadialGradient, Rect, RoundedRect, Skia, vec, useImage,
} from '@shopify/react-native-skia';
import { Redirect, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View,
  useWindowDimensions, StatusBar,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing, useAnimatedStyle, useSharedValue,
  withRepeat, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';

import { F } from '@/shared/fonts';
import { SkeletonBox } from '@/shared/Skeleton';
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
  '용':    'water', '돼지': 'water',   // 용 → 용녀(물) 캐릭터와 일치
  '쥐':    'lightning', '원숭이': 'lightning',
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

// 홀로그램 A — 대각 방향 (↘)
const HOLO = [
  'rgba(255,255,255,0.02)',
  'rgba(240,160,255,0.52)', 'rgba(160,200,255,0.48)',
  'rgba(140,255,220,0.44)', 'rgba(255,240,140,0.50)',
  'rgba(255,170,200,0.46)', 'rgba(190,160,255,0.52)',
  'rgba(255,255,255,0.08)',
  'rgba(160,235,255,0.44)', 'rgba(255,195,220,0.46)',
  'rgba(210,255,200,0.42)', 'rgba(255,255,255,0.02)',
];
// 홀로그램 B — 교차 방향 (↗) — 드래그 각도에 따라 다른 무지개 띠 생성
const HOLO2 = [
  'rgba(255,255,255,0.01)',
  'rgba(255,200,140,0.46)', 'rgba(200,255,160,0.42)',
  'rgba(140,220,255,0.44)', 'rgba(255,140,200,0.42)',
  'rgba(255,255,255,0.06)',
  'rgba(200,140,255,0.44)', 'rgba(255,220,140,0.40)',
  'rgba(140,255,210,0.42)', 'rgba(210,140,255,0.44)',
  'rgba(255,255,255,0.01)',
];

function makeSparkles(n: number, w: number, h: number) {
  return Array.from({ length: n }, (_, i) => ({
    x: (i * 79 + 23) % w,
    y: (i * 113 + 47) % h,
    r: 1.1 + (i % 3) * 0.8,
  }));
}

const TOTAL_CHAR_CARDS = CARD_POOL.filter(c => c.category === 'character').length;

// ─── 컴포넌트 ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const CARD_W = Math.min(screenW * 0.84, 310);
  const CARD_H = CARD_W * 1.38;
  const CHAR_H = CARD_H * 0.63;
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
  const [collectedCount, setCollectedCount] = useState(0);

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

  const R    = RARITY[rarity];
  const E    = ELEM[element];

  // 현재 원소+등급에 해당하는 캐릭터명
  const charStage = rarity === 'mythic' ? 4 : (rarity === 'legendary' || rarity === 'epic') ? 3 : rarity === 'rare' ? 2 : 1;
  const charCard = CARD_POOL.find(c => c.id === `${element}_${charStage}`);
  const charNameKo = charCard?.nameKo ?? E.label;
  const cardImg = cardImageFor(element, rarity, charCard?.id);
  const charSkiaImg = useImage(cardImg ?? null);

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

  // 전경 파티클 — 원소별 분포 특성 다름
  const fgParticles = useMemo(() => {
    const W = CARD_W - 16, H = CHAR_H - 6;
    return Array.from({ length: 10 }, (_, i) => {
      const base = { r: 1.5 + (i % 4) * 0.9, blur: i % 3 === 0 ? 3 : 1.2 };
      switch (element) {
        case 'fire':      return { ...base, x: (i * 61 + 20) % W, y: H * (0.1 + (i % 4) * 0.12) }; // 상단 불씨
        case 'water':     return { ...base, x: (i * 71 + 10) % W, y: (i * 83 + 30) % H };           // 전체 분산 거품
        case 'lightning': return { ...base, r: 1.0 + (i % 3) * 0.5, x: (i * 97 + 15) % W, y: (i * 53 + 20) % H }; // 스파크
        case 'nature':    return { ...base, x: (i * 67 + 25) % W, y: H * (0.3 + (i % 5) * 0.12) }; // 중간 떠다니는 잎
        case 'dark':      return { ...base, r: 2.5 + (i % 3) * 1.2, blur: 6, x: (i * 89 + 8) % W, y: (i * 61 + 15) % H }; // 그림자
        case 'light':     return { ...base, x: (i * 73 + 18) % W, y: (i * 59 + 12) % H };           // 빛 별
      }
    });
  }, [element, CARD_W, CHAR_H]);

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

  const bgStars = useMemo(() => Array.from({ length: 22 }, (_, i) => ({
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

      const coll = await getCollection();
      const charIdSet = new Set(CARD_POOL.filter(c => c.category === 'character').map(c => c.id));
      setCollectedCount(new Set(coll.filter(c => charIdSet.has(c.id)).map(c => c.id)).size);

      setLoading(false);
    })();
  }, []);


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

  // 홀로그램 A — 대각↘ 이동 / 틸트 크기에 따라 opacity 증가 (포켓몬 TCG 효과)
  const foilStyle = useAnimatedStyle(() => {
    const mag = Math.min(Math.sqrt(tiltX.value ** 2 + tiltY.value ** 2), 1);
    return {
      transform: [
        { translateX: tiltX.value * R.foilShift },
        { translateY: tiltY.value * (R.foilShift * 0.55) },
      ],
      opacity: R.foilOpacity * (0.12 + mag * 0.88),
    };
  });

  // 홀로그램 B — 교차↗ 이동 (X↔Y 교환) — 두 레이어가 엇갈려 포켓몬 TCG 무지개 생성
  const foil2Style = useAnimatedStyle(() => {
    const mag = Math.min(Math.sqrt(tiltX.value ** 2 + tiltY.value ** 2), 1);
    return {
      transform: [
        { translateX: tiltY.value * R.foilShift * 0.9 },
        { translateY: tiltX.value * (R.foilShift * 0.55) },
      ],
      opacity: R.foilOpacity * 0.55 * mag,
    };
  });

  // 스페큘러 하이라이트 — 반대 방향 (거울 반사), 틸트 시 더 선명
  const specStyle = useAnimatedStyle(() => {
    const mag = Math.min(Math.sqrt(tiltX.value ** 2 + tiltY.value ** 2), 1);
    return {
      transform: [
        { translateX: -tiltX.value * 100 },
        { translateY: -tiltY.value * 72 },
      ],
      opacity: R.specOpacity * (0.15 + mag * 0.85),
    };
  });

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

  // 캐릭터 parallax — 배경(정지) < 캐릭터 < 전경파티클 < 홀로 순 깊이 분리
  const charParallaxStyle = useAnimatedStyle(() => {
    const mag = Math.sqrt(tiltX.value ** 2 + tiltY.value ** 2);
    return {
      transform: [
        { translateX: tiltX.value * 32 },
        { translateY: tiltY.value * 20 },
        { scale: 1 + mag * 0.038 }, // 틸트 시 미세 확대 → 튀어나오는 느낌
      ],
    };
  });

  // 전경 파티클 parallax — 캐릭터보다 빠름 (앞 레이어)
  const fxParallaxStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tiltX.value * 54 },
      { translateY: tiltY.value * 34 },
    ],
  }));

  // ── 렌더 ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#080B18" />
      <View style={skStyles.header}>
        <SkeletonBox style={{ width: 80, height: 20 }} />
        <SkeletonBox style={{ width: 60, height: 28 }} />
      </View>
      <View style={skStyles.body}>
        <SkeletonBox style={{ width: '55%', height: 320, borderRadius: 22 }} />
        <SkeletonBox style={{ width: '90%', height: 52, borderRadius: 14 }} />
        <SkeletonBox style={{ width: '90%', height: 44, borderRadius: 14 }} />
      </View>
    </View>
  );
  if (!profile) return <Redirect href="/onboarding" />;
  if (!fortune) return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#080B18" />
      <View style={skStyles.body}>
        <SkeletonBox style={{ width: '55%', height: 320, borderRadius: 22 }} />
      </View>
    </View>
  );

  const cardBorderColor = rarity === 'mythic' ? `${E.color}50`
    : rarity === 'legendary' ? `${E.color}3A`
    : rarity === 'epic' ? 'rgba(255,255,255,0.16)'
    : 'rgba(255,255,255,0.10)';
  const cardBorderWidth = rarity === 'mythic' ? 2.5 : rarity === 'legendary' ? 2 : 1.5;

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
          {streak.currentStreak >= 1 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 {streak.currentStreak}일째</Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable style={styles.coinBadge} onPress={() => router.push('/gacha')} accessibilityLabel={`코인 ${balance.toLocaleString()}개`}>
            <Text style={styles.coinText}>💰 {balance.toLocaleString()}</Text>
          </Pressable>
          <Pressable style={styles.gachaBtn} onPress={() => router.push('/gacha')} accessibilityLabel="카드 뽑기">
            <Text style={styles.gachaBtnText}>✦ 뽑기</Text>
          </Pressable>
        </View>
      </View>

      {/* 스크롤 가능한 본문 */}
      <ScrollView
        style={{ flex: 1, width: '100%' }}
        contentContainerStyle={{ alignItems: 'center', paddingBottom: 28, gap: 12 }}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
      >
      {/* 카드 도착 배너 */}
      {isNewDay && (
        <Animated.View style={[styles.arrivalBanner, arrivalBannerStyle]}>
          <Text style={styles.arrivalText}>
            {streak.currentStreak >= 7 ? '🔥 ' : ''}오늘의 운명 카드가 도착했습니다
            {streak.currentStreak >= 7 ? ` — ${streak.currentStreak}일 연속 등급 UP!` : ''}
          </Text>
        </Animated.View>
      )}

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
              {/* 카드 내부 대각 원소 그라디언트 — 깊이감 */}
              <RoundedRect x={0} y={0} width={CARD_W} height={CARD_H} r={CORNER}>
                <LinearGradient
                  start={vec(0, 0)} end={vec(CARD_W, CARD_H)}
                  colors={[`${E.color}1C`, 'rgba(0,0,0,0)', `${E.color}0E`]}
                />
              </RoundedRect>

              {/* ── 아트워크 창 내부 배경 (내부 프레임 안에만 국한) ── */}
              <Group clip={Skia.RRectXY(Skia.XYWHRect(8, 8, CARD_W - 16, CHAR_H - 6), 14, 14)}>
                {/* 아트워크 창 배경: 상단 원소 톤 → 하단 완전 검정 */}
                <Rect x={8} y={8} width={CARD_W - 16} height={CHAR_H - 6}>
                  <LinearGradient
                    start={vec(CARD_W / 2, 8)}
                    end={vec(CARD_W / 2, CHAR_H - 6)}
                    colors={[E.bgTop, '#010104']}
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

                {/* 아트 창 주변 비네트 — 중앙 집중 조명 */}
                <Rect x={8} y={8} width={CARD_W - 16} height={CHAR_H - 6}>
                  <RadialGradient
                    c={vec(CARD_W * 0.5, CHAR_H * 0.38)}
                    r={CARD_W * 0.70}
                    colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.40)']}
                    positions={[0, 0.48, 1]}
                  />
                </Rect>
              </Group>

              {/* ── 이펙트: Rare 이상부터, 카드 전체 영역에 표출 ── */}
              {rarity !== 'common' && <>

                {/* 원소 발광 — 3레이어 글로우 (넓은 앰비언트 + 중간 + 집중 핵심) */}
                <Circle cx={CARD_W / 2} cy={CHAR_H * 0.52} r={glowR * 2.0} color={`${E.color}07`}>
                  <BlurMask blur={90} style="normal" />
                </Circle>
                <Circle cx={CARD_W / 2} cy={CHAR_H * 0.55} r={glowR} color={E.glow}>
                  <BlurMask blur={42} style="normal" />
                </Circle>
                <Circle cx={CARD_W / 2} cy={CHAR_H * 0.60} r={glowR * 0.40} color={`${E.color}2A`}>
                  <BlurMask blur={14} style="normal" />
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

                {/* Legendary/Mythic: 별 방사 스파클 */}
                {R.sparkles && (
                  <Group opacity={sparkleA}>
                    {sparkles.map((s, i) => {
                      const cx = s.x + 10; const cy = s.y + 10;
                      const streak = s.r * (i % 5 === 0 ? 5.5 : 3.0);
                      return (
                        <Group key={i}>
                          {/* 핵심 빛점 */}
                          <Circle cx={cx} cy={cy} r={s.r * 1.3}
                            color={`rgba(255,255,255,${0.80 + (i % 3) * 0.07})`}>
                            <BlurMask blur={1.2} style="normal" />
                          </Circle>
                          {/* 수평 + 수직 방사선 (별 모양) */}
                          {i % 3 === 0 && <>
                            <Rect x={cx - streak} y={cy - 0.4} width={streak * 2} height={0.8}
                              color={`rgba(255,255,255,0.38)`}>
                              <BlurMask blur={0.7} style="normal" />
                            </Rect>
                            <Rect x={cx - 0.4} y={cy - streak} width={0.8} height={streak * 2}
                              color={`rgba(255,255,255,0.38)`}>
                              <BlurMask blur={0.7} style="normal" />
                            </Rect>
                          </>}
                        </Group>
                      );
                    })}
                  </Group>
                )}
              </>}

              {/* 아트워크 창 내부 프레임 — 4면 모두 동일한 원소 컬러 */}
              <RoundedRect x={8} y={8} width={CARD_W - 16} height={CHAR_H - 6} r={10}
                color={E.color} style="stroke" strokeWidth={2} />

              {/* 캐릭터 발 아래 어두운 그림자 — 원소 컬러 제거로 하단 일관성 유지 */}
              <Rect x={0} y={CHAR_H - 50} width={CARD_W} height={56}>
                <LinearGradient
                  start={vec(CARD_W / 2, CHAR_H - 50)}
                  end={vec(CARD_W / 2, CHAR_H + 6)}
                  colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.80)']}
                />
              </Rect>

              {/* 구분선 */}
              <Rect x={10} y={CHAR_H + 10} width={CARD_W - 20} height={1}
                color={`${E.color}66`} />

            </Canvas>

            {/* Layer 4: 캐릭터 — Skia Image + RRectXY clip으로 모서리 정확히 클리핑 */}
            <Animated.View
              style={[charParallaxStyle, {
                position: 'absolute',
                top: 8, left: 8,
                width: CARD_W - 16, height: CHAR_H - 6,
              }]}
              pointerEvents="none"
            >
              <Canvas style={{ width: CARD_W - 16, height: CHAR_H - 6 }}>
                <Group clip={Skia.RRectXY(Skia.XYWHRect(0, 0, CARD_W - 16, CHAR_H - 6), 14, 14)}>
                  {charSkiaImg && (
                    <SkiaImage
                      image={charSkiaImg}
                      x={0} y={0}
                      width={CARD_W - 16} height={CHAR_H - 6}
                      fit="cover"
                    />
                  )}
                </Group>
              </Canvas>
            </Animated.View>

            {/* Layer 4b: 전경 원소 파티클 — 캐릭터(32/20)보다 빠른 시차(54/34) → 앞 레이어 입체감 */}
            <Animated.View
              style={[fxParallaxStyle, {
                position: 'absolute', top: 8, left: 8, right: 8,
                height: CHAR_H - 6, borderRadius: 10, overflow: 'hidden',
              }]}
              pointerEvents="none"
            >
              <Canvas style={{ width: CARD_W - 16, height: CHAR_H - 6 }} pointerEvents="none">
                <Group opacity={rarity === 'common' ? 0.5 : 0.85}>
                  {fgParticles.map((p, i) => (
                    <Group key={i}>
                      <Circle cx={p.x} cy={p.y} r={p.r}
                        color={element === 'dark'
                          ? `rgba(0,0,0,${0.55 + (i % 3) * 0.12})`
                          : `${E.color}${i % 2 === 0 ? 'CC' : '88'}`}>
                        <BlurMask blur={p.blur} style="normal" />
                      </Circle>
                      {/* light/lightning: 별 방사선 */}
                      {(element === 'light' || element === 'lightning') && i % 3 === 0 && (
                        <>
                          <Rect x={p.x - p.r * 3} y={p.y - 0.3} width={p.r * 6} height={0.6}
                            color={`${E.color}55`} />
                          <Rect x={p.x - 0.3} y={p.y - p.r * 3} width={0.6} height={p.r * 6}
                            color={`${E.color}55`} />
                        </>
                      )}
                    </Group>
                  ))}
                </Group>
              </Canvas>
            </Animated.View>

            {/* Layer 2: 홀로그램 A — 대각↘, 틸트 크기에 비례해 나타남 */}
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

            {/* Layer 2b: 홀로그램 B — 교차↗ (X↔Y 교환) — 두 레이어가 엇갈려 포켓몬 TCG 무지개 생성 */}
            <Animated.View style={[StyleSheet.absoluteFill, foil2Style]} pointerEvents="none">
              <Canvas style={{ width: FOIL_W, height: FOIL_H, marginLeft: -CARD_W, marginTop: -CARD_H }}>
                <Rect x={0} y={0} width={FOIL_W} height={FOIL_H}>
                  <LinearGradient
                    start={vec(0, FOIL_H)} end={vec(FOIL_W, 0)}
                    colors={HOLO2}
                  />
                </Rect>
              </Canvas>
            </Animated.View>

            {/* Layer 3: 스페큘러 하이라이트 — 반대 방향, 틸트 시 선명 */}
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

              {/* 이름 행 */}
              <View style={{ marginBottom: 4, gap: 1 }}>
                <Text style={{ fontFamily: F.bk, color: E.color, fontSize: 15, letterSpacing: 0.4, textShadowColor: `${E.glow}`, textShadowRadius: 8 }} numberOfLines={1}>
                  {charNameKo}
                </Text>
                <Text style={{ fontFamily: F.sb, color: E.color2, fontSize: 9, letterSpacing: 1.0, opacity: 0.75 }}>
                  {E.label} · UNSE CARD
                </Text>
              </View>

              {/* 오늘의 운세 텍스트 */}
              <Text style={{
                fontFamily: F.r, color: 'rgba(255,255,255,0.88)', fontSize: 11, lineHeight: 17,
                letterSpacing: 0.1,
              }} numberOfLines={4}>{fortune.general.text}</Text>

              {/* 하단 행: 희귀도 + 버프 */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, paddingBottom: 6, paddingTop: 3 }}>
                <Text style={{ fontFamily: F.b, color: R.starColor, fontSize: 12, letterSpacing: 1, textShadowColor: R.starColor, textShadowRadius: 6 }}>{R.stars}</Text>
                {activeBuff && (
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', gap: 3,
                    backgroundColor: `${activeBuff.color}25`, borderRadius: 6,
                    borderWidth: 1, borderColor: `${activeBuff.color}60`,
                    paddingHorizontal: 6, paddingVertical: 2,
                  }}>
                    <Text style={{ fontFamily: F.eb, fontSize: 8, color: activeBuff.color }}>
                      {activeBuff.emoji} BUFF
                    </Text>
                  </View>
                )}
              </View>
            </View>

          </View>{/* end overflow:hidden */}

          {/* Layer 6: 외부 테두리 — 캐릭터 위에 렌더링, 카드가 캐릭터를 담는 느낌 */}
          <Canvas style={[StyleSheet.absoluteFill, { zIndex: 15 }]} pointerEvents="none">
            <RoundedRect x={0} y={0} width={CARD_W} height={CARD_H} r={CORNER}
              color={cardBorderColor} style="stroke" strokeWidth={cardBorderWidth} />
          </Canvas>
        </Animated.View>
      </GestureDetector>
      </Animated.View>

      {/* 오늘의 행운 정보 — 색상/숫자/방향 */}
      {/* 행운 + 이번 주 — 통합 bento 카드 */}
      {(luckyInfo || (profile && weekDays)) && (
        <View style={[styles.infoCard, { width: CARD_W }]}>
          {luckyInfo && (
            <View style={styles.infoLeft}>
              <Text style={styles.infoTitle}>오늘의 행운</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 8 }}>
                <View style={[styles.luckyColorSwatch, { backgroundColor: luckyInfo.color.hex, shadowColor: luckyInfo.color.hex }]} />
                <Text style={styles.luckyChipText}>{luckyInfo.color.name}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 5, marginTop: 8 }}>
                <View style={styles.luckyChip}>
                  <Text style={styles.luckyChipLabel}>숫자</Text>
                  <Text style={styles.luckyChipVal}>{luckyInfo.number}</Text>
                </View>
                <View style={styles.luckyChip}>
                  <Text style={styles.luckyChipLabel}>방향</Text>
                  <Text style={styles.luckyChipVal}>{luckyInfo.direction}</Text>
                </View>
                <View style={styles.luckyChip}>
                  <Text style={styles.luckyChipLabel}>시간</Text>
                  <Text style={styles.luckyChipVal}>{luckyInfo.hour.split('(')[0]}</Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.infoCardDivider} />

          {profile && weekDays && (
            <View style={styles.infoRight}>
              <Text style={styles.infoTitle}>이번 주 흐름</Text>
              <View style={styles.weekDotsRow}>
                {weekDays.map(({ date: d, dayLabel, isToday }) => {
                  const v = deriveValence(d, profile.diiSign, profile.starSign);
                  const dotColor = v === 'good' ? '#FFD700' : v === 'neutral' ? '#88AAFF' : '#FF6B9D';
                  return (
                    <View key={d} style={[styles.weekDotCol, isToday && styles.weekDotColToday]}>
                      <View style={[styles.weekDot, {
                        backgroundColor: isToday ? dotColor : `${dotColor}28`,
                        borderColor: isToday ? dotColor : `${dotColor}44`,
                        borderWidth: isToday ? 0 : 1,
                        shadowColor: dotColor,
                        shadowOpacity: isToday ? 0.9 : 0,
                        shadowRadius: 4,
                        elevation: isToday ? 4 : 0,
                      }]} />
                      <Text style={[styles.weekDayLabel, isToday && styles.weekDayLabelToday]}>{dayLabel}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      )}

      {/* 수집 진행도 */}
      <Pressable
        style={[styles.collBadge, { width: CARD_W }]}
        onPress={() => router.push('/collection')}
        accessibilityLabel={`카드 수집 현황 ${collectedCount}/${TOTAL_CHAR_CARDS}`}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
              <Text style={styles.collBadgeLabel}>카드 수집</Text>
              <Text style={styles.collBadgeCount}>{collectedCount} / {TOTAL_CHAR_CARDS}</Text>
            </View>
            <View style={styles.collProgressTrack}>
              <View style={[styles.collProgressFill, {
                width: `${Math.round((collectedCount / TOTAL_CHAR_CARDS) * 100)}%`,
                backgroundColor: E.color,
                shadowColor: E.color, shadowOpacity: 0.6, shadowRadius: 4, elevation: 3,
              }]} />
            </View>
          </View>
          <View style={[styles.collPctBadge, { backgroundColor: `${E.color}18`, borderColor: `${E.color}35` }]}>
            <Text style={[styles.collPctText, { color: E.color }]}>{Math.round((collectedCount / TOTAL_CHAR_CARDS) * 100)}%</Text>
          </View>
        </View>
      </Pressable>

      {/* 주요 액션 — 운세 보기 */}
      <Pressable
        style={[styles.primaryBtn, { width: CARD_W, backgroundColor: E.color, shadowColor: E.color }]}
        onPress={() => router.push('/fortune')}
        accessibilityLabel="오늘의 운세 보기"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={styles.primaryBtnText}>오늘의 운세 보기</Text>
          <Text style={styles.primaryBtnArrow}>→</Text>
        </View>
      </Pressable>

      {/* 보조 액션 — 컬렉션 | 뽑기 */}
      <View style={{ flexDirection: 'row', gap: 10, width: CARD_W }}>
        <Pressable
          style={[styles.secondaryBtn, { borderColor: `${E.color}40`, backgroundColor: `${E.color}12` }]}
          onPress={() => router.push('/collection')}
          accessibilityLabel="컬렉션"
        >
          <Text style={[styles.secondaryBtnText, { color: E.color }]}>컬렉션</Text>
          <Text style={[styles.secondaryBtnArrow, { color: `${E.color}BB` }]}>›</Text>
        </Pressable>
        <Pressable
          style={[styles.secondaryBtn, { borderColor: 'rgba(255,220,0,0.35)', backgroundColor: 'rgba(255,220,0,0.09)' }]}
          onPress={() => router.push('/gacha')}
          accessibilityLabel="카드 뽑기"
        >
          <Text style={[styles.secondaryBtnText, { color: '#FFE500' }]}>카드 뽑기</Text>
          <Text style={[styles.secondaryBtnArrow, { color: 'rgba(255,229,0,0.65)' }]}>›</Text>
        </Pressable>
      </View>

      </ScrollView>
    </View>
  );
}

const skStyles = StyleSheet.create({
  header: { width: '100%', paddingTop: 52, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, width: '100%', paddingHorizontal: 20 },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#080B18', alignItems: 'center', paddingTop: 0, paddingBottom: 24, gap: 0 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#080B18' },
  topBar: { width: '100%', paddingTop: 52, paddingBottom: 4, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  appTitle: { fontFamily: F.bk, fontSize: 22, color: '#FFFFFF', letterSpacing: 3.5 },
  coinBadge: {
    backgroundColor: 'rgba(255,220,0,0.12)', borderWidth: 1, borderColor: 'rgba(255,220,0,0.30)',
    paddingVertical: 5, paddingHorizontal: 10, borderRadius: 12,
  },
  coinText: { fontFamily: F.b, color: '#FFE500', fontSize: 12 },
  gachaBtn: {
    backgroundColor: '#FFE500', borderRadius: 16,
    paddingVertical: 7, paddingHorizontal: 14,
    shadowColor: '#FFE500', shadowOpacity: 0.4, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 5,
  },
  gachaBtnText: { fontFamily: F.bk, color: '#111', fontSize: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardName: { fontFamily: F.eb, fontSize: 17, letterSpacing: 0.3 },
  cardType: { fontFamily: F.sb, fontSize: 12, opacity: 0.85 },
  cardFortune: { fontFamily: F.r, color: 'rgba(255,255,255,0.70)', fontSize: 12, lineHeight: 18 },
  rarityText: { fontFamily: F.b, fontSize: 13, letterSpacing: 0.8 },
  primaryBtn: {
    borderRadius: 26,
    paddingVertical: 17, alignItems: 'center',
    shadowOpacity: 0.45, shadowOffset: { width: 0, height: 4 }, shadowRadius: 14, elevation: 8,
  },
  primaryBtnText: { fontFamily: F.bk, fontSize: 16, letterSpacing: 0.3, color: 'rgba(0,0,0,0.82)' },
  primaryBtnArrow: { fontFamily: F.bk, fontSize: 18, color: 'rgba(0,0,0,0.72)' },
  secondaryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    borderWidth: 1, borderRadius: 18, paddingVertical: 13,
  },
  secondaryBtnText: { fontFamily: F.b, fontSize: 14 },
  secondaryBtnArrow: { fontFamily: F.bk, fontSize: 18, lineHeight: 20 },
  streakBadge: {
    backgroundColor: 'rgba(255,120,0,0.18)', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,120,0,0.40)',
    paddingVertical: 3, paddingHorizontal: 8,
  },
  streakText: { fontFamily: F.b, color: '#FF8800', fontSize: 12 },
  arrivalBanner: {
    backgroundColor: 'rgba(255,220,0,0.10)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,220,0,0.25)',
    paddingVertical: 6, paddingHorizontal: 14,
  },
  arrivalText: { fontFamily: F.b, color: '#FFE500', fontSize: 12, letterSpacing: 0.3 },
  // ── 통합 bento 카드 ──────────────────────────────────────────────────────
  infoCard: {
    flexDirection: 'row', alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderRadius: 20, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    gap: 12,
  },
  infoLeft: { flex: 1 },
  infoRight: { flex: 1 },
  infoCardDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 1 },
  infoTitle: { fontFamily: F.sb, color: 'rgba(255,255,255,0.35)', fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' },
  luckyColorSwatch: { width: 14, height: 14, borderRadius: 7, shadowOpacity: 0.8, shadowRadius: 5, elevation: 3 },
  luckyChipText: { fontFamily: F.b, color: '#FFFFFF', fontSize: 13 },
  luckyChip: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 10, paddingVertical: 5, paddingHorizontal: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
  },
  luckyChipLabel: { fontFamily: F.r, color: 'rgba(255,255,255,0.35)', fontSize: 9, marginBottom: 2 },
  luckyChipVal: { fontFamily: F.b, color: '#FFFFFF', fontSize: 12 },
  weekDotsRow: { flexDirection: 'row', marginTop: 8, justifyContent: 'space-between' },
  weekDotCol: { alignItems: 'center', gap: 5, flex: 1, paddingVertical: 3, borderRadius: 8 },
  weekDotColToday: { backgroundColor: 'rgba(255,255,255,0.08)' },
  weekDayLabel: { fontFamily: F.r, color: 'rgba(255,255,255,0.30)', fontSize: 9 },
  weekDayLabelToday: { fontFamily: F.b, color: '#FFFFFF' },
  weekDot: { width: 13, height: 13, borderRadius: 7 },
  collBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 18, paddingVertical: 12, paddingHorizontal: 14,
  },
  collBadgeLabel: { fontFamily: F.sb, color: 'rgba(255,255,255,0.40)', fontSize: 11, letterSpacing: 0.6 },
  collBadgeCount: { fontFamily: F.b, color: 'rgba(255,255,255,0.72)', fontSize: 12 },
  collPctBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1, minWidth: 40, alignItems: 'center' },
  collPctText: { fontFamily: F.b, fontSize: 12 },
  collProgressTrack: { height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)' },
  collProgressFill: { height: 5, borderRadius: 3 },
});
