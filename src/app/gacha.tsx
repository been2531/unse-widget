import {
  BlurMask, Canvas, Circle, Group, LinearGradient, Path,
  Rect, RoundedRect, Skia, vec,
} from '@shopify/react-native-skia';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, FlatList, Image, Pressable, ScrollView,
  StyleSheet, Text, View, useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing, interpolate, useAnimatedStyle, useSharedValue,
  withRepeat, withSequence, withSpring, withTiming,
  Extrapolation,
} from 'react-native-reanimated';

import { showRewardedAd } from '@/ads/admob';
import { makeElementEffects } from '@/character/elementEffects';
import { cardImageFor } from '@/gacha/cardAssets';
import {
  CARD_POOL, CATEGORY_LABEL, MULTI_PULL_COST, PULL_COST,
  RARITY_COLOR, RARITY_LABEL,
  type PulledCard, type Rarity,
} from '@/gacha/types';
import { pullOne, pullTen } from '@/gacha/pull';
import {
  SYNTHESIS_RATES, SYNTHESIS_REQUIRED,
  canSynthesize, getSynthesisTarget, rollSynthesis,
} from '@/gacha/synthesis';
import { claimDaily, getBalance, spend } from '@/storage/coins';
import { addToCollection, getCollection, removeCards } from '@/storage/collection';
import { getAdsRemaining, recordAdReward, COINS_PER_AD, MAX_ADS_PER_DAY } from '@/storage/adRewards';
import { getFreePullsRemaining, consumeFreePull } from '@/storage/freePulls';
import { getTodayDateString } from '@/shared/dateUtils';
import { saveFortuneCardBuff } from '@/storage/todayFortuneCard';
import { SkeletonBox } from '@/shared/Skeleton';

// 원소 컬러 (gacha 화면용)
const ELEM_COLOR: Record<string, string> = {
  fire: '#FF6600', water: '#00AAFF', lightning: '#FFE500',
  nature: '#44FF88', dark: '#CC44FF', light: '#FFD700',
};
const ELEM_LABEL: Record<string, string> = {
  fire: '🔥 화염', water: '💧 물', lightning: '⚡ 번개',
  nature: '🌿 자연', dark: '🌑 암흑', light: '✨ 빛',
};

// 카드 배경 그라디언트 per element
const ELEM_BG: Record<string, [string, string]> = {
  fire:      ['#2a0800', '#180400'],
  water:     ['#001828', '#000e18'],
  lightning: ['#12103a', '#0c1e3e'],
  nature:    ['#082010', '#041008'],
  dark:      ['#100820', '#080412'],
  light:     ['#1a1400', '#100c00'],
};

// 홀로그램 foil 색
const HOLO = [
  'rgba(255,0,100,0.85)', 'rgba(255,80,0,0.80)', 'rgba(255,210,0,0.80)',
  'rgba(60,255,80,0.80)', 'rgba(0,210,255,0.80)', 'rgba(20,60,255,0.80)',
  'rgba(160,0,255,0.80)', 'rgba(255,0,100,0.85)', 'rgba(255,80,0,0.80)',
  'rgba(255,210,0,0.80)', 'rgba(60,255,80,0.80)', 'rgba(0,210,255,0.80)',
];

const RARITY_FOIL_OP: Record<Rarity, number> = {
  common: 0.12, rare: 0.45, epic: 0.72, legendary: 0.92, mythic: 0.98,
};
const RARITY_BORDER: Record<Rarity, number> = {
  common: 1.5, rare: 2, epic: 3, legendary: 4, mythic: 5,
};
const CORNER = 14;

// ─── 단일 카드 결과 뷰 ─────────────────────────────────────────────────────
function ResultCard({ card, cardW, onReveal }: { card: PulledCard; cardW: number; onReveal?: () => void }) {
  const cardH = cardW * 1.42;
  const charH = cardH * 0.58;
  const foilW = cardW * 3;
  const foilH = cardH * 3;
  const flipP  = useSharedValue(0);
  const glowR  = useSharedValue(cardW * 0.18);
  const shakeX = useSharedValue(0);
  const revealed = useRef(false);

  const elemColor = ELEM_COLOR[card.element] ?? '#FFE500';
  const [bgTop, bgBot] = ELEM_BG[card.element] ?? ['#12103a', '#0c1e3e'];
  const foilOp  = RARITY_FOIL_OP[card.rarity];
  const borderW = RARITY_BORDER[card.rarity];

  useEffect(() => {
    // 빌드업 흔들기
    shakeX.value = withRepeat(
      withSequence(
        withTiming(5,  { duration: 80 }),
        withTiming(-5, { duration: 80 }),
        withTiming(0,  { duration: 80 }),
      ), 3, false,
    );
    // 자동 플립 (1.2초 후)
    const t = setTimeout(() => {
      if (!revealed.current) doFlip();
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    glowR.value = withRepeat(
      withSequence(
        withTiming(cardW * 0.28, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(cardW * 0.16, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      ), -1, true,
    );
  }, [cardW]);

  function doFlip() {
    if (revealed.current) return;
    revealed.current = true;
    flipP.value = withTiming(1, { duration: 560, easing: Easing.bezier(0.22, 1, 0.36, 1) });
    onReveal?.();
  }

  // 뒷면 (flipP < 0.5)
  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateY: `${interpolate(flipP.value, [0, 0.5], [0, 90], Extrapolation.CLAMP)}deg` },
      { translateX: shakeX.value },
    ],
    opacity: flipP.value < 0.5 ? 1 : 0,
  }));

  // 앞면 (flipP >= 0.5)
  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateY: `${interpolate(flipP.value, [0.5, 1], [-90, 0], Extrapolation.CLAMP)}deg` },
    ],
    opacity: flipP.value >= 0.5 ? 1 : 0,
    position: 'absolute',
  }));

  const foilStyle = useAnimatedStyle(() => ({
    opacity: foilOp * interpolate(flipP.value, [0.5, 1], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <Pressable onPress={doFlip} style={{ alignItems: 'center' }}>
      {/* 뒷면 */}
      <Animated.View style={backStyle}>
        <View style={{ width: cardW, height: cardH, borderRadius: CORNER, overflow: 'hidden' }}>
          <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* 배경 — 중앙 밝고 가장자리 어두운 방사형 */}
            <Rect x={0} y={0} width={cardW} height={cardH}>
              <LinearGradient start={vec(cardW * 0.5, 0)} end={vec(cardW * 0.5, cardH)}
                colors={['#0A0020', '#180040', '#0A0020']} />
            </Rect>
            {/* 별 흩뿌리기 */}
            {Array.from({ length: 40 }, (_, i) => (
              <Circle key={i}
                cx={(i * 127 + 41) % cardW}
                cy={(i * 193 + 71) % cardH}
                r={0.4 + (i % 5) * 0.25}
                color={`rgba(255,255,255,${0.10 + (i % 7) * 0.04})`} />
            ))}
            {/* 중앙 글로우 */}
            <Circle cx={cardW / 2} cy={cardH / 2} r={cardW * 0.44} color="rgba(120,50,220,0.18)">
              <BlurMask blur={30} style="normal" />
            </Circle>
            {/* 12방향 방사선 (12간지 상징) */}
            {Array.from({ length: 12 }, (_, i) => {
              const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
              const r0 = cardW * 0.14; const r1 = cardW * 0.44;
              const p = Skia.Path.Make();
              p.moveTo(cardW / 2 + Math.cos(angle) * r0, cardH / 2 + Math.sin(angle) * r0);
              p.lineTo(cardW / 2 + Math.cos(angle) * r1, cardH / 2 + Math.sin(angle) * r1);
              return <Path key={i} path={p} color={i % 2 === 0 ? 'rgba(255,210,80,0.22)' : 'rgba(180,100,255,0.18)'}
                style="stroke" strokeWidth={i % 2 === 0 ? 1.4 : 0.8} />;
            })}
            {/* 외곽 원 */}
            <Circle cx={cardW / 2} cy={cardH / 2} r={cardW * 0.44}
              color="rgba(255,210,80,0.28)" style="stroke" strokeWidth={1.2} />
            {/* 내부 원 */}
            <Circle cx={cardW / 2} cy={cardH / 2} r={cardW * 0.28}
              color="rgba(180,100,255,0.30)" style="stroke" strokeWidth={0.8} />
            {/* 가장 안쪽 원 */}
            <Circle cx={cardW / 2} cy={cardH / 2} r={cardW * 0.13}
              color="rgba(255,210,80,0.22)" style="stroke" strokeWidth={1} />
            {/* 코너 장식 — 4방향 꺾쇠 */}
            {[
              [CORNER + 4, CORNER + 4, 1, 1],
              [cardW - CORNER - 4, CORNER + 4, -1, 1],
              [CORNER + 4, cardH - CORNER - 4, 1, -1],
              [cardW - CORNER - 4, cardH - CORNER - 4, -1, -1],
            ].map(([cx, cy, sx, sy], i) => {
              const L = cardW * 0.06;
              const p = Skia.Path.Make();
              p.moveTo(cx + sx * L, cy); p.lineTo(cx, cy); p.lineTo(cx, cy + sy * L);
              return <Path key={i} path={p} color="rgba(255,210,80,0.55)" style="stroke" strokeWidth={1.5} strokeCap="square" />;
            })}
            {/* 외부 이중 테두리 */}
            <RoundedRect x={1} y={1} width={cardW - 2} height={cardH - 2} r={CORNER}
              color="rgba(255,210,80,0.55)" style="stroke" strokeWidth={1.5} />
            <RoundedRect x={4} y={4} width={cardW - 8} height={cardH - 8} r={CORNER - 2}
              color="rgba(160,80,255,0.35)" style="stroke" strokeWidth={0.8} />
          </Canvas>
          {/* 중앙 텍스트 */}
          <View style={{ ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Text style={{ color: 'rgba(255,210,80,0.90)', fontSize: 11, fontWeight: '700', letterSpacing: 4, opacity: 0.7 }}>✦ ✦ ✦</Text>
            <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 28, fontWeight: '900', letterSpacing: 7, textShadowColor: 'rgba(200,140,255,0.8)', textShadowRadius: 14 }}>UNSE</Text>
            <Text style={{ color: 'rgba(200,150,255,0.65)', fontSize: 9, fontWeight: '700', letterSpacing: 3 }}>운 세 카 드</Text>
            <Text style={{ color: 'rgba(255,210,80,0.50)', fontSize: 10, fontWeight: '700', letterSpacing: 4, marginTop: 2, opacity: 0.7 }}>✦ ✦ ✦</Text>
          </View>
        </View>
      </Animated.View>

      {/* 앞면 */}
      <Animated.View style={frontStyle}>
        <View style={{ width: cardW, height: cardH, borderRadius: CORNER, overflow: 'hidden' }}>
          {/* 배경 */}
          <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
            <Rect x={0} y={0} width={cardW} height={cardH}>
              <LinearGradient start={vec(0, 0)} end={vec(cardW, cardH)} colors={[bgTop, bgBot]} />
            </Rect>
            {/* Legendary 별 */}
            {card.rarity === 'legendary' && Array.from({ length: 30 }, (_, i) => (
              <Circle key={i}
                cx={(i * 71 + 11) % cardW} cy={(i * 109 + 31) % charH}
                r={0.7 + (i % 4) * 0.5} color={`rgba(255,255,255,${0.2 + (i % 5) * 0.1})`} />
            ))}
            <Circle cx={cardW / 2} cy={charH / 2} r={glowR} color={`${elemColor}40`}>
              <BlurMask blur={36} style="normal" />
            </Circle>
            <Rect x={10} y={charH + 10} width={cardW - 20} height={1} color={`${elemColor}66`} />
            <RoundedRect x={0} y={0} width={cardW} height={cardH} r={CORNER}
              color={`${elemColor}CC`} style="stroke" strokeWidth={borderW} />
          </Canvas>
          {/* 홀로그램 foil */}
          <Animated.View style={[StyleSheet.absoluteFill, foilStyle]} pointerEvents="none">
            <Canvas style={{ width: foilW, height: foilH, marginLeft: -cardW, marginTop: -cardH }}>
              <Rect x={0} y={0} width={foilW} height={foilH}>
                <LinearGradient start={vec(0, 0)} end={vec(foilW, foilH)} colors={HOLO} />
              </Rect>
            </Canvas>
          </Animated.View>
          {/* 원소 이펙트 (캐릭터 카드만) */}
          {card.category === 'character' && (() => {
            const fx = makeElementEffects(card.element, cardW, charH);
            return (
              <Canvas style={{ position: 'absolute', top: 8, left: 0, right: 0, height: charH }} pointerEvents="none">
                {fx.paths.map((p, i) => (
                  <Path key={i} path={p} color={fx.color} style="stroke" strokeWidth={fx.strokeWidth} />
                ))}
              </Canvas>
            );
          })()}
          {/* 캐릭터 또는 아이콘 */}
          <View style={{ position: 'absolute', top: 8, left: 8, right: 8, height: charH, alignItems: 'center', justifyContent: 'center' }}>
            {card.category === 'character'
              ? (() => {
                  const img = cardImageFor(card.element, card.rarity, card.id);
                  return img
                    ? <Image source={img}
                        style={{ width: charH, height: charH, transform: [{ scale: 1.15 }, { translateY: -6 }] }}
                        resizeMode="contain" />
                    : <Text style={{ fontSize: cardW * 0.22 }}>🐲</Text>;
                })()
              : <Text style={{ fontSize: cardW * 0.25 }}>
                  {card.category === 'skin' ? '🎨' : '🔮'}
                </Text>
            }
          </View>
          {/* 카드 정보 */}
          <View style={{ position: 'absolute', top: charH + 14, left: 0, right: 0, paddingHorizontal: 12, gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: elemColor, fontSize: 15, fontWeight: '800' }} numberOfLines={1}>{card.nameKo}</Text>
              <Text style={{ color: elemColor, fontSize: 10, fontWeight: '600' }}>{ELEM_LABEL[card.element]}</Text>
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, lineHeight: 16 }} numberOfLines={2}>{card.description}</Text>
            <Text style={{ color: RARITY_COLOR[card.rarity], fontSize: 12, fontWeight: '700', letterSpacing: 0.8 }}>
              ★ {RARITY_LABEL[card.rarity]}
            </Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ─── 10연차 미니 카드 그리드 ───────────────────────────────────────────────
function MultiResultGrid({ cards, miniW }: { cards: PulledCard[]; miniW: number }) {
  const miniH = miniW * 1.42;
  const delayIdx = useRef(0);

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
      {cards.map((card, i) => {
        const elemColor = ELEM_COLOR[card.element] ?? '#888';
        const [bgTop, bgBot] = ELEM_BG[card.element] ?? ['#12103a', '#0c1e3e'];
        const enterA = useSharedValue(0);
        useEffect(() => {
          enterA.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.back(1.5)) });
        }, []);
        const aStyle = useAnimatedStyle(() => ({
          opacity: enterA.value,
          transform: [{ scale: interpolate(enterA.value, [0, 1], [0.6, 1]) }],
        }));
        return (
          <Animated.View key={card.uid} style={aStyle}>
            <View style={{ width: miniW, height: miniH, borderRadius: 10, overflow: 'hidden' }}>
              <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
                <Rect x={0} y={0} width={miniW} height={miniH}>
                  <LinearGradient start={vec(0, 0)} end={vec(miniW, miniH)} colors={[bgTop, bgBot]} />
                </Rect>
                <RoundedRect x={0} y={0} width={miniW} height={miniH} r={10}
                  color={`${elemColor}BB`} style="stroke" strokeWidth={RARITY_BORDER[card.rarity]} />
              </Canvas>
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                {card.category === 'character' && cardImageFor(card.element, card.rarity, card.id)
                  ? <Image source={cardImageFor(card.element, card.rarity, card.id)!}
                      style={{ width: miniW - 4, height: miniW - 4 }} resizeMode="contain" />
                  : <Text style={{ fontSize: miniW * 0.28 }}>
                      {card.category === 'character' ? '🐲' : card.category === 'skin' ? '🎨' : '🔮'}
                    </Text>
                }
                <Text style={{ color: elemColor, fontSize: 8, fontWeight: '700', letterSpacing: 0.5 }}>
                  {RARITY_LABEL[card.rarity]}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 7, textAlign: 'center', paddingHorizontal: 2 }} numberOfLines={2}>
                  {card.nameKo}
                </Text>
              </View>
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

// ─── 메인 화면 ──────────────────────────────────────────────────────────────
type Phase = 'lobby' | 'single_result' | 'multi_result';

export default function GachaScreen() {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const CARD_W = Math.min(screenW * 0.72, 260);
  const MINI_W = (screenW - 64) / 5 - 6;

  const [loading, setLoading]       = useState(true);
  const [balance, setBalance]       = useState(0);
  const [phase, setPhase]           = useState<Phase>('lobby');
  const [result, setResult]         = useState<PulledCard | null>(null);
  const [multiResult, setMulti]     = useState<PulledCard[]>([]);
  const [spinning, setSpinning]     = useState(false);
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [freePulls, setFreePulls]   = useState(0);
  const [adsLeft, setAdsLeft]       = useState(0);

  // ── 합성 관련 state ───────────────────────────────────────────────────────
  const [synthCard, setSynthCard]       = useState<PulledCard | null>(null);
  const [synthPhase, setSynthPhase]     = useState<'idle' | 'confirm' | 'rolling' | 'success' | 'fail'>('idle');
  const [ownedCount, setOwnedCount]     = useState(0);
  const synthRollA = useSharedValue(0);

  const packGlowA = useSharedValue(0.5);

  useEffect(() => {
    (async () => {
      const today = getTodayDateString();
      const [{ balance: b, claimed }, free, ads] = await Promise.all([
        claimDaily(today),
        getFreePullsRemaining(today),
        getAdsRemaining(today),
      ]);
      setBalance(b);
      setDailyClaimed(claimed);
      setFreePulls(free);
      setAdsLeft(ads);
      setLoading(false);
    })();
    packGlowA.value = withRepeat(
      withSequence(
        withTiming(1,   { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.35, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
      ), -1, true,
    );
  }, []);

  const packGlowStyle = useAnimatedStyle(() => ({ opacity: packGlowA.value }));
  const synthRollStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${synthRollA.value * 360}deg` }],
    opacity: synthPhase === 'rolling' ? 0.8 : 1,
  }));

  async function maybeStoreFortuneBuff(cards: PulledCard[], today: string) {
    const fortuneCard = cards.find(c => c.category === 'fortune');
    if (fortuneCard) {
      await saveFortuneCardBuff(today, fortuneCard.id, fortuneCard.nameKo, fortuneCard.element, fortuneCard.rarity);
    }
  }

  // 단일 뽑기 후 합성 가능 여부 확인 → 가능하면 synthCard 세팅
  async function checkSynthesisAfterPull(card: PulledCard) {
    const col = await getCollection();
    const ownedIds = col.map(c => c.id);
    if (canSynthesize(card.id, ownedIds)) {
      setSynthCard(card);
      setOwnedCount(ownedIds.filter(id => id === card.id).length);
      setSynthPhase('confirm');
    }
  }

  async function doSynthesis() {
    if (!synthCard) return;
    setSynthPhase('rolling');
    const required = SYNTHESIS_REQUIRED[synthCard.rarity];

    // 주사위 굴리기 애니메이션
    synthRollA.value = withRepeat(
      withTiming(1, { duration: 150, easing: Easing.linear }), 6, true,
    );

    await new Promise(r => setTimeout(r, 1000));

    const success = rollSynthesis(synthCard.rarity);
    // 재료 카드 n장 제거
    await removeCards(synthCard.id, required);

    if (success) {
      const targetId = getSynthesisTarget(synthCard.id)!;
      const targetDef = CARD_POOL.find(c => c.id === targetId)!;
      const upgraded: PulledCard = {
        ...targetDef, uid: `${targetId}_synth_${Date.now()}`, pulledAt: new Date().toISOString(),
      };
      await addToCollection([upgraded]);
      setResult(upgraded);
      setSynthPhase('success');
    } else {
      setSynthPhase('fail');
    }
  }

  function closeSynthesis() {
    setSynthCard(null);
    setSynthPhase('idle');
  }

  async function handleAdReward() {
    if (spinning || adsLeft <= 0) return;
    setSpinning(true);
    const result = await showRewardedAd('gacha_free_pull');
    if (result === 'earned') {
      const today = getTodayDateString();
      const newBalance = await recordAdReward(today);
      setBalance(newBalance);
      setAdsLeft(prev => Math.max(0, prev - 1));
    }
    setSpinning(false);
  }

  async function handleFreePull() {
    if (spinning || freePulls <= 0) return;
    setSpinning(true);
    try {
      const today = getTodayDateString();
      await consumeFreePull(today);
      setFreePulls(0);
      const card = pullOne();
      await addToCollection([card]);
      await maybeStoreFortuneBuff([card], today);
      setResult(card);
      setPhase('single_result');
      await checkSynthesisAfterPull(card);
    } catch {}
    setSpinning(false);
  }

  async function handlePull(multi: boolean) {
    if (spinning) return;
    const cost = multi ? MULTI_PULL_COST : PULL_COST;
    if (balance < cost) return;
    setSpinning(true);
    try {
      const newBal = await spend(cost);
      setBalance(newBal);
      const today = getTodayDateString();
      if (multi) {
        const cards = pullTen();
        await addToCollection(cards);
        await maybeStoreFortuneBuff(cards, today);
        setMulti(cards);
        setPhase('multi_result');
      } else {
        const card = pullOne();
        await addToCollection([card]);
        await maybeStoreFortuneBuff([card], today);
        setResult(card);
        setPhase('single_result');
        await checkSynthesisAfterPull(card);
      }
    } catch (e: any) {
      // 코인 부족 — balance 표시로 알 수 있음
    }
    setSpinning(false);
  }

  function backToLobby() {
    setPhase('lobby');
    setResult(null);
    setMulti([]);
  }

  if (loading) return (
    <View style={styles.screen}>
      <View style={{ paddingTop: 52, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <SkeletonBox style={{ width: 60, height: 20 }} />
        <SkeletonBox style={{ width: 80, height: 28, borderRadius: 14 }} />
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, paddingHorizontal: 20 }}>
        <SkeletonBox style={{ width: 220, height: 300, borderRadius: 22 }} />
        <SkeletonBox style={{ width: '100%', height: 52, borderRadius: 16 }} />
        <SkeletonBox style={{ width: '100%', height: 52, borderRadius: 16 }} />
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      {/* 배경 */}
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        <Rect x={0} y={0} width={screenW} height={screenH}>
          <LinearGradient start={vec(screenW * 0.4, 0)} end={vec(screenW * 0.6, screenH)}
            colors={['#0E0B22', '#080B1A', '#060A16']} />
        </Rect>
        <Circle cx={screenW * 0.5} cy={screenH * 0.15} r={screenW * 0.65} color="rgba(60,20,140,0.25)">
          <BlurMask blur={80} style="normal" />
        </Circle>
        {Array.from({ length: 50 }, (_, i) => (
          <Circle key={i}
            cx={(i * 137 + 29) % screenW} cy={(i * 211 + 71) % screenH}
            r={0.4 + (i % 5) * 0.25} color={`rgba(255,255,255,${0.1 + (i % 7) * 0.05})`} />
        ))}
      </Canvas>

      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="뒤로 가기">
          <View style={styles.chevron} />
        </Pressable>
        <Text style={styles.title}>카드 뽑기</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable onPress={() => router.push('/collection')} style={styles.collectionBtn} accessibilityLabel="컬렉션 보기">
            <Text style={styles.collectionText}>📚</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/coin-shop')} style={styles.coinBadge} accessibilityLabel={`코인 ${balance.toLocaleString()}개, 코인샵으로 이동`}>
            <Text style={styles.coinText}>💰 {balance.toLocaleString()}</Text>
          </Pressable>
        </View>
      </View>

      {phase === 'lobby' && (
        <ScrollView contentContainerStyle={styles.lobby} showsVerticalScrollIndicator={false}>
          {dailyClaimed && (
            <View style={styles.bonusBanner}>
              <Text style={styles.bonusText}>🎁 오늘의 코인 +{100} 지급됨!</Text>
            </View>
          )}

          {/* 무료 뽑기 */}
          <Pressable
            style={[styles.freePullBtn, freePulls <= 0 && styles.pullBtnDisabled]}
            onPress={handleFreePull}
            disabled={spinning || freePulls <= 0}
          >
            <Text style={styles.freePullMain}>
              {freePulls > 0 ? '🎁 무료 뽑기 1회' : '✓ 오늘 무료 뽑기 완료'}
            </Text>
            <Text style={styles.freePullSub}>매일 1회 무료</Text>
          </Pressable>

          {/* 팩 아트 */}
          <View style={{ alignItems: 'center' }}>
            <Animated.View style={[packGlowStyle, { position: 'absolute', zIndex: 0 }]} pointerEvents="none">
              <Canvas style={{ width: CARD_W + 80, height: CARD_W + 80 }}>
                <Circle cx={(CARD_W + 80) / 2} cy={(CARD_W + 80) / 2} r={(CARD_W + 80) * 0.42} color="rgba(160,80,255,0.35)">
                  <BlurMask blur={55} style="normal" />
                </Circle>
              </Canvas>
            </Animated.View>
            <View style={{ width: CARD_W, height: CARD_W * 1.42, borderRadius: CORNER, overflow: 'hidden', zIndex: 1 }}>
              <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
                <Rect x={0} y={0} width={CARD_W} height={CARD_W * 1.42}>
                  <LinearGradient start={vec(0, 0)} end={vec(CARD_W, CARD_W * 1.42)} colors={['#0E0020', '#1a0035', '#0a001a']} />
                </Rect>
                {Array.from({ length: 8 }, (_, i) => {
                  const angle = (i / 8) * Math.PI * 2;
                  const cx = CARD_W / 2; const cy = CARD_W * 0.71;
                  const r0 = CARD_W * 0.10; const r1 = CARD_W * 0.40;
                  const p = Skia.Path.Make();
                  p.moveTo(cx + Math.cos(angle) * r0, cy + Math.sin(angle) * r0);
                  p.lineTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
                  return <Path key={i} path={p} color="rgba(200,150,255,0.30)" style="stroke" strokeWidth={1.5} />;
                })}
                <Circle cx={CARD_W / 2} cy={CARD_W * 0.71} r={CARD_W * 0.36} color="rgba(140,60,255,0.18)">
                  <BlurMask blur={14} style="normal" />
                </Circle>
                <Circle cx={CARD_W / 2} cy={CARD_W * 0.71} r={CARD_W * 0.36} color="rgba(180,100,255,0.40)" style="stroke" strokeWidth={1.2} />
                <Circle cx={CARD_W / 2} cy={CARD_W * 0.71} r={CARD_W * 0.20} color="rgba(180,100,255,0.30)" style="stroke" strokeWidth={0.8} />
                {Array.from({ length: 30 }, (_, i) => (
                  <Circle key={i}
                    cx={(i * 127 + 41) % CARD_W} cy={(i * 193 + 71) % (CARD_W * 1.42)}
                    r={0.5 + (i % 4) * 0.3} color={`rgba(255,255,255,${0.12 + (i % 6) * 0.05})`} />
                ))}
                <RoundedRect x={0} y={0} width={CARD_W} height={CARD_W * 1.42} r={CORNER}
                  color="rgba(160,80,255,0.80)" style="stroke" strokeWidth={2.5} />
              </Canvas>
              <View style={{ ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: 'rgba(210,170,255,0.70)', fontSize: 32, fontWeight: '900', letterSpacing: 8 }}>UNSE</Text>
                <Text style={{ color: 'rgba(180,140,255,0.45)', fontSize: 11, letterSpacing: 3, marginTop: 4 }}>CARD</Text>
              </View>
            </View>
          </View>

          {/* 확률 안내 */}
          <View style={styles.rateBox}>
            <Text style={styles.rateTitle}>획득 확률</Text>
            <View style={styles.rateRow}>
              {(['common', 'rare', 'epic', 'legendary'] as Rarity[]).map(r => (
                <View key={r} style={styles.rateItem}>
                  <Text style={[styles.rateLabel, { color: RARITY_COLOR[r] }]}>{RARITY_LABEL[r]}</Text>
                  <Text style={styles.ratePct}>
                    {r === 'common' ? '60%' : r === 'rare' ? '30%' : r === 'epic' ? '8%' : '2%'}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* 뽑기 버튼 */}
          <Pressable
            style={[styles.pullBtn, balance < PULL_COST && styles.pullBtnDisabled]}
            onPress={() => handlePull(false)}
            disabled={spinning || balance < PULL_COST}
            accessibilityLabel={`1회 뽑기 ${PULL_COST}코인`}
          >
            {spinning ? <ActivityIndicator color="#111" /> : <>
              <Text style={styles.pullBtnMain}>✦ 1회 뽑기</Text>
              <Text style={styles.pullBtnSub}>💰 {PULL_COST} 코인</Text>
            </>}
          </Pressable>

          <Pressable
            style={[styles.pullBtn10, balance < MULTI_PULL_COST && styles.pullBtnDisabled]}
            onPress={() => handlePull(true)}
            disabled={spinning || balance < MULTI_PULL_COST}
            accessibilityLabel={`10회 뽑기 ${MULTI_PULL_COST}코인 레어 보장`}
          >
            <Text style={styles.pullBtn10Main}>✦ 10회 뽑기</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.pullBtn10Sub}>💰 {MULTI_PULL_COST} 코인</Text>
              <View style={styles.discountBadge}><Text style={styles.discountText}>Rare 보장</Text></View>
            </View>
          </Pressable>

          {/* 광고 보기 버튼 */}
          <Pressable
            style={[styles.adBtn, adsLeft <= 0 && styles.pullBtnDisabled]}
            onPress={handleAdReward}
            disabled={spinning || adsLeft <= 0}
          >
            {spinning ? (
              <ActivityIndicator color="#aaa" size="small" />
            ) : (
              <>
                <Text style={styles.adBtnText}>
                  {adsLeft > 0 ? `📺 광고 보기 → +${COINS_PER_AD}코인` : '오늘 광고 모두 시청 완료'}
                </Text>
                <Text style={styles.adBtnSub}>{adsLeft}/{MAX_ADS_PER_DAY} 남음</Text>
              </>
            )}
          </Pressable>

          <Text style={styles.footNote}>매일 앱 실행 시 100코인 자동 지급 · 10회 뽑기 시 Rare 이상 1장 보장</Text>
        </ScrollView>
      )}

      {/* 단일 결과 */}
      {phase === 'single_result' && result && synthPhase === 'idle' && (
        <View style={styles.resultContainer}>
          <Text style={styles.getLabel}>✨ 획득!</Text>
          <ResultCard card={result} cardW={CARD_W} />
          <Text style={[styles.rarityBig, { color: RARITY_COLOR[result.rarity] }]}>
            {CATEGORY_LABEL[result.category]} · {RARITY_LABEL[result.rarity]}
          </Text>
          <View style={styles.resultBtns}>
            <Pressable style={styles.againBtn} onPress={backToLobby}>
              <Text style={styles.againBtnText}>다시 뽑기</Text>
            </Pressable>
            <Pressable style={styles.okBtn} onPress={() => router.back()}>
              <Text style={styles.okBtnText}>확인</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ── 합성 모달 ── */}
      {synthCard && synthPhase !== 'idle' && (() => {
        const required = SYNTHESIS_REQUIRED[synthCard.rarity];
        const rate = Math.round((SYNTHESIS_RATES[synthCard.rarity] ?? 0) * 100);
        const elemColor = ELEM_COLOR[synthCard.element] ?? '#FFE500';
        const targetId = getSynthesisTarget(synthCard.id);
        const targetDef = targetId ? CARD_POOL.find(c => c.id === targetId) : null;

        return (
          <View style={styles.synthOverlay}>
            <View style={[styles.synthBox, { borderColor: `${elemColor}55` }]}>

              {/* 헤더 */}
              <Text style={styles.synthTitle}>
                {synthPhase === 'confirm' ? '⚗️ 합성 가능!' :
                 synthPhase === 'rolling' ? '🎲 합성 중...' :
                 synthPhase === 'success' ? '🎉 합성 성공!' : '💨 합성 실패'}
              </Text>

              {/* 카드 시각화 */}
              <View style={styles.synthCardRow}>
                <View style={[styles.synthMiniCard, { borderColor: `${elemColor}88` }]}>
                  <Text style={{ fontSize: 30 }}>
                    {synthCard.category === 'fortune' ? '🔮' : synthCard.category === 'skin' ? '🖼️' : '🐲'}
                  </Text>
                  <Text style={{ color: elemColor, fontSize: 10, fontWeight: '700' }}>{synthCard.nameKo}</Text>
                  <Text style={{ color: RARITY_COLOR[synthCard.rarity], fontSize: 9 }}>{RARITY_LABEL[synthCard.rarity]}</Text>
                </View>

                <View style={{ alignItems: 'center', gap: 4 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>×{required}</Text>
                  <Animated.Text style={[{ fontSize: 22 }, synthRollStyle]}>
                    {synthPhase === 'rolling' ? '⚙️' : synthPhase === 'success' ? '✅' : synthPhase === 'fail' ? '❌' : '→'}
                  </Animated.Text>
                </View>

                <View style={[styles.synthMiniCard, {
                  borderColor: targetDef ? `${ELEM_COLOR[targetDef.element] ?? elemColor}88` : 'rgba(255,255,255,0.2)',
                  opacity: synthPhase === 'success' ? 1 : 0.5,
                }]}>
                  {synthPhase === 'success' && targetDef ? (
                    <>
                      <Text style={{ fontSize: 30 }}>✨</Text>
                      <Text style={{ color: ELEM_COLOR[targetDef.element] ?? elemColor, fontSize: 10, fontWeight: '700' }}>{targetDef.nameKo}</Text>
                      <Text style={{ color: RARITY_COLOR[targetDef.rarity], fontSize: 9 }}>{RARITY_LABEL[targetDef.rarity]}</Text>
                    </>
                  ) : (
                    <>
                      <Text style={{ fontSize: 30 }}>❓</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>
                        {targetDef ? RARITY_LABEL[targetDef.rarity] : '???'}
                      </Text>
                    </>
                  )}
                </View>
              </View>

              {/* 확률 / 결과 메시지 */}
              {synthPhase === 'confirm' && (
                <View style={styles.synthInfo}>
                  <Text style={styles.synthInfoText}>
                    보유 <Text style={{ color: elemColor, fontWeight: '800' }}>{ownedCount}장</Text>
                    {' '}/ 필요 <Text style={{ color: '#FFE500', fontWeight: '800' }}>{required}장</Text>
                  </Text>
                  <Text style={styles.synthInfoText}>
                    성공 확률: <Text style={{ color: '#44FF88', fontWeight: '800' }}>{rate}%</Text>
                    {'  '}실패 시 재료 전량 소각
                  </Text>
                </View>
              )}

              {synthPhase === 'success' && targetDef && (
                <View style={styles.synthInfo}>
                  <Text style={[styles.synthSuccessText, { color: RARITY_COLOR[targetDef.rarity] }]}>
                    {targetDef.nameKo} 획득!
                  </Text>
                </View>
              )}

              {synthPhase === 'fail' && (
                <View style={styles.synthInfo}>
                  <Text style={styles.synthFailText}>
                    재료 {required}장이 모두 소각됐습니다.
                  </Text>
                </View>
              )}

              {/* 버튼 */}
              {synthPhase === 'confirm' && (
                <View style={styles.synthBtns}>
                  <Pressable style={styles.synthSkipBtn} onPress={closeSynthesis}>
                    <Text style={styles.synthSkipText}>나중에</Text>
                  </Pressable>
                  <Pressable style={[styles.synthGoBtn, { borderColor: elemColor, backgroundColor: `${elemColor}18` }]}
                    onPress={doSynthesis}>
                    <Text style={[styles.synthGoText, { color: elemColor }]}>합성 시도!</Text>
                  </Pressable>
                </View>
              )}

              {(synthPhase === 'success' || synthPhase === 'fail') && (
                <View style={styles.synthBtns}>
                  <Pressable style={styles.synthGoBtn} onPress={() => {
                    closeSynthesis();
                    if (synthPhase === 'success') setPhase('single_result');
                  }}>
                    <Text style={styles.synthGoText}>확인</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        );
      })()}

      {/* 10연차 결과 */}
      {phase === 'multi_result' && multiResult.length > 0 && (
        <View style={{ flex: 1, width: '100%' }}>
          <Text style={[styles.getLabel, { marginTop: 0 }]}>✨ {multiResult.length}장 획득!</Text>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 14 }}>
            <MultiResultGrid cards={multiResult} miniW={MINI_W} />
            {/* 하이라이트: Rare 이상 카드 */}
            {multiResult.filter(c => c.rarity !== 'common').map(c => (
              <View key={c.uid} style={styles.highlightRow}>
                <Text style={{ fontSize: 18 }}>
                  {c.category === 'character' ? '🐲' : c.category === 'skin' ? '🎨' : '🔮'}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: RARITY_COLOR[c.rarity], fontWeight: '700', fontSize: 13 }}>{c.nameKo}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{ELEM_LABEL[c.element]} · {RARITY_LABEL[c.rarity]}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={[styles.resultBtns, { paddingBottom: 24 }]}>
            <Pressable style={styles.againBtn} onPress={backToLobby}>
              <Text style={styles.againBtnText}>다시 뽑기</Text>
            </Pressable>
            <Pressable style={styles.okBtn} onPress={() => router.back()}>
              <Text style={styles.okBtnText}>확인</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#080B18' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#080B18' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 52, paddingHorizontal: 20, paddingBottom: 12,
  },
  backBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  chevron: {
    width: 10, height: 10,
    borderLeftWidth: 2, borderBottomWidth: 2,
    borderColor: '#FFF',
    transform: [{ rotate: '45deg' }, { translateX: 2 }],
  },
  title: { fontSize: 18, fontWeight: '800', color: '#FFF', letterSpacing: 1 },
  collectionBtn: {
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12,
  },
  collectionText: { fontSize: 16 },
  coinBadge: {
    backgroundColor: 'rgba(255,220,0,0.12)', borderWidth: 1, borderColor: 'rgba(255,220,0,0.35)',
    paddingVertical: 5, paddingHorizontal: 12, borderRadius: 14,
  },
  coinText: { color: '#FFE500', fontWeight: '700', fontSize: 13 },
  freePullBtn: {
    backgroundColor: 'rgba(0,200,120,0.15)', borderWidth: 1.5, borderColor: 'rgba(0,200,120,0.45)',
    borderRadius: 24, width: '100%', paddingVertical: 14, alignItems: 'center', gap: 2,
  },
  freePullMain: { color: '#00DD88', fontWeight: '900', fontSize: 16 },
  freePullSub: { color: 'rgba(0,200,120,0.6)', fontSize: 11 },
  adBtn: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16, width: '100%', paddingVertical: 12, alignItems: 'center', gap: 2,
  },
  adBtnText: { color: 'rgba(255,255,255,0.7)', fontWeight: '700', fontSize: 14 },
  adBtnSub: { color: 'rgba(255,255,255,0.35)', fontSize: 11 },

  lobby: { paddingHorizontal: 24, paddingBottom: 40, gap: 16, alignItems: 'center' },

  bonusBanner: {
    backgroundColor: 'rgba(255,220,0,0.10)', borderWidth: 1, borderColor: 'rgba(255,220,0,0.3)',
    borderRadius: 12, paddingVertical: 8, paddingHorizontal: 20, width: '100%', alignItems: 'center',
  },
  bonusText: { color: '#FFE500', fontWeight: '700', fontSize: 13 },

  rateBox: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 14, padding: 14, width: '100%', gap: 8,
  },
  rateTitle: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  rateRow: { flexDirection: 'row', justifyContent: 'space-around' },
  rateItem: { alignItems: 'center', gap: 3 },
  rateLabel: { fontSize: 11, fontWeight: '700' },
  ratePct: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600' },

  pullBtn: {
    backgroundColor: '#FFE500', borderRadius: 24, width: '100%',
    paddingVertical: 16, alignItems: 'center', gap: 2,
    shadowColor: '#FFE500', shadowOpacity: 0.40, shadowOffset: { width: 0, height: 4 }, shadowRadius: 16, elevation: 8,
  },
  pullBtnMain: { color: '#111', fontWeight: '900', fontSize: 17 },
  pullBtnSub: { color: '#555', fontSize: 12 },
  pullBtn10: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1.5, borderColor: 'rgba(255,220,0,0.45)',
    borderRadius: 24, width: '100%', paddingVertical: 16, alignItems: 'center', gap: 4,
  },
  pullBtn10Main: { color: '#FFE500', fontWeight: '900', fontSize: 17 },
  pullBtn10Sub: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  pullBtnDisabled: { opacity: 0.38 },
  discountBadge: {
    backgroundColor: 'rgba(0,200,100,0.18)', borderWidth: 1, borderColor: 'rgba(0,200,100,0.4)',
    borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2,
  },
  discountText: { color: '#00DD77', fontSize: 10, fontWeight: '700' },
  footNote: { color: 'rgba(255,255,255,0.25)', fontSize: 11, textAlign: 'center' },

  resultContainer: { flex: 1, alignItems: 'center', paddingHorizontal: 24, gap: 16, paddingTop: 8 },
  getLabel: { color: '#FFF', fontSize: 22, fontWeight: '900', letterSpacing: 1, marginTop: 8 },
  rarityBig: { fontSize: 15, fontWeight: '700', letterSpacing: 0.6 },
  resultBtns: { flexDirection: 'row', gap: 12, paddingHorizontal: 24 },
  againBtn: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 22, paddingVertical: 14, alignItems: 'center',
  },
  againBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  okBtn: {
    flex: 1, backgroundColor: '#FFE500', borderRadius: 22, paddingVertical: 14, alignItems: 'center',
    shadowColor: '#FFE500', shadowOpacity: 0.35, shadowOffset: { width: 0, height: 3 }, shadowRadius: 10, elevation: 6,
  },
  okBtnText: { color: '#111', fontWeight: '900', fontSize: 15 },

  highlightRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 12,
  },

  // ── 합성 모달 ──────────────────────────────────────────────────────────────
  synthOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.80)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 100,
  },
  synthBox: {
    width: '88%', backgroundColor: '#0E0B22',
    borderRadius: 24, borderWidth: 1.5,
    padding: 24, gap: 20, alignItems: 'center',
  },
  synthTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', letterSpacing: 0.5 },
  synthCardRow: { flexDirection: 'row', alignItems: 'center', gap: 16, justifyContent: 'center' },
  synthMiniCard: {
    width: 88, height: 110, borderRadius: 12, borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center', gap: 4, padding: 6,
  },
  synthInfo: { alignItems: 'center', gap: 6 },
  synthInfoText: { color: 'rgba(255,255,255,0.65)', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  synthSuccessText: { fontSize: 17, fontWeight: '900', letterSpacing: 0.5 },
  synthFailText: { color: 'rgba(255,100,100,0.85)', fontSize: 13, textAlign: 'center' },
  synthBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  synthSkipBtn: {
    flex: 1, borderRadius: 16, paddingVertical: 13, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  synthSkipText: { color: 'rgba(255,255,255,0.55)', fontWeight: '700', fontSize: 14 },
  synthGoBtn: {
    flex: 1, borderRadius: 16, paddingVertical: 13, alignItems: 'center',
    borderWidth: 1.5, backgroundColor: 'rgba(255,220,0,0.10)', borderColor: '#FFE500',
  },
  synthGoText: { color: '#FFE500', fontWeight: '900', fontSize: 14 },
});
