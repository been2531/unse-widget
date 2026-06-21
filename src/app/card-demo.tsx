import {
  BlurMask, Canvas, Circle, Group, LinearGradient,
  Path, RoundedRect, Skia, vec,
} from '@shopify/react-native-skia';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing, interpolate, useAnimatedStyle,
  useDerivedValue, useSharedValue,
  withRepeat, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';

import { F } from '@/shared/fonts';
import DragonSkia from '@/character/DragonSkia';

const CARD_W = 280;
const CARD_H = 392;
const CHAR_H = 220;
const CORNER = 16;

const HOLO_COLORS = [
  'rgba(255,0,128,0.50)',
  'rgba(255,140,0,0.50)',
  'rgba(255,230,0,0.50)',
  'rgba(0,255,128,0.50)',
  'rgba(0,184,255,0.50)',
  'rgba(128,0,255,0.50)',
  'rgba(255,0,128,0.50)',
];

function makeLightPath(offsetX: number, seed: number) {
  const path = Skia.Path.Make();
  const sx = CARD_W / 2 + offsetX;
  const steps = 7;
  const stepH = (CHAR_H - 30) / steps;
  path.moveTo(sx, 15);
  for (let i = 1; i <= steps; i++) {
    const sign = (i + seed) % 2 === 0 ? 1 : -1;
    path.lineTo(sx + sign * (12 + (i * 13 + seed * 7) % 22), 15 + stepH * i);
  }
  return path;
}

export default function CardDemoScreen() {
  const [flipped, setFlipped] = useState(false);
  const flipProg = useSharedValue(0);
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const lightA1 = useSharedValue(0);
  const lightA2 = useSharedValue(0);
  const glowR = useSharedValue(55);

  const lightPaths = useMemo(() => [
    makeLightPath(-8, 3),
    makeLightPath(14, 7),
    makeLightPath(-20, 11),
  ], []);

  useEffect(() => {
    // 번개 깜빡임
    lightA1.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 55 }),
        withTiming(0,   { duration: 75 }),
        withTiming(0.6, { duration: 45 }),
        withTiming(0,   { duration: 550 }),
      ), -1, false,
    );
    lightA2.value = withRepeat(
      withSequence(
        withTiming(0,   { duration: 250 }),
        withTiming(0.75, { duration: 55 }),
        withTiming(0,    { duration: 70 }),
        withTiming(0.45, { duration: 45 }),
        withTiming(0,    { duration: 380 }),
      ), -1, false,
    );
    // 발광 펄스
    glowR.value = withRepeat(
      withSequence(
        withTiming(65, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(52, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      ), -1, true,
    );
  }, []);

  // 홀로그램 그래디언트 위치 (틸트 연동)
  const holoStart = useDerivedValue(() => ({
    x: CARD_W * (0.5 + tiltX.value * 0.9),
    y: CARD_H * (0.1 + tiltY.value * 0.25),
  }));
  const holoEnd = useDerivedValue(() => ({
    x: CARD_W * (0.5 - tiltX.value * 0.9),
    y: CARD_H * (0.9 - tiltY.value * 0.25),
  }));

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      tiltX.value = Math.max(-1, Math.min(1, (e.x - CARD_W / 2) / (CARD_W / 2)));
      tiltY.value = Math.max(-1, Math.min(1, (e.y - CARD_H / 2) / (CARD_H / 2)));
    })
    .onEnd(() => {
      tiltX.value = withSpring(0, { damping: 12, stiffness: 220 });
      tiltY.value = withSpring(0, { damping: 12, stiffness: 220 });
    });

  // 3D 틸트 (팬 제스처)
  const tiltStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateX: `${-tiltY.value * 20}deg` },
      { rotateY: `${tiltX.value * 20}deg` },
    ],
  }));

  // 카드 뒤집기
  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1100 },
      { rotateY: `${interpolate(flipProg.value, [0, 1], [0, 180])}deg` },
    ],
    backfaceVisibility: 'hidden',
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1100 },
      { rotateY: `${interpolate(flipProg.value, [0, 1], [180, 360])}deg` },
    ],
    backfaceVisibility: 'hidden',
    position: 'absolute',
    top: 0, left: 0,
  }));

  function handleFlip() {
    const next = !flipped;
    setFlipped(next);
    flipProg.value = withTiming(next ? 1 : 0, {
      duration: 620,
      easing: Easing.inOut(Easing.cubic),
    });
  }

  return (
    <View style={styles.screen}>
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>← 뒤로</Text>
      </Pressable>

      <View style={styles.center}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={tiltStyle}>
            <View style={{ width: CARD_W, height: CARD_H }}>

              {/* ── 앞면 ── */}
              <Animated.View style={[{ width: CARD_W, height: CARD_H }, frontStyle]}>
                {/* Skia 레이어: 배경 + 이펙트 */}
                <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
                  {/* 카드 배경 */}
                  <RoundedRect x={0} y={0} width={CARD_W} height={CARD_H} r={CORNER}>
                    <LinearGradient
                      start={vec(CARD_W * 0.3, 0)}
                      end={vec(CARD_W * 0.7, CARD_H)}
                      colors={['#12103a', '#0c1e3e', '#0a1028']}
                    />
                  </RoundedRect>

                  {/* 캐릭터 영역 배경 */}
                  <RoundedRect x={10} y={10} width={CARD_W - 20} height={CHAR_H} r={10}
                    color="rgba(255,255,255,0.03)" />

                  {/* 번개 발광 (배경) */}
                  <Circle cx={CARD_W / 2} cy={CHAR_H / 2} r={glowR}
                    color="rgba(255,220,0,0.07)">
                    <BlurMask blur={28} style="normal" />
                  </Circle>

                  {/* 번개 볼트 1 */}
                  <Group opacity={lightA1}>
                    <Path path={lightPaths[0]}
                      color="#FFE500" style="stroke" strokeWidth={3} strokeCap="round">
                      <BlurMask blur={5} style="solid" />
                    </Path>
                    <Path path={lightPaths[0]}
                      color="white" style="stroke" strokeWidth={1.2} strokeCap="round" />
                  </Group>

                  {/* 번개 볼트 2 */}
                  <Group opacity={lightA2}>
                    <Path path={lightPaths[1]}
                      color="#FFE500" style="stroke" strokeWidth={2.2} strokeCap="round">
                      <BlurMask blur={4} style="solid" />
                    </Path>
                  </Group>

                  {/* 구분선 */}
                  <RoundedRect
                    x={12} y={CHAR_H + 12}
                    width={CARD_W - 24} height={1} r={0.5}
                    color="rgba(255,220,60,0.45)" />

                  {/* 골드 테두리 */}
                  <RoundedRect x={2} y={2} width={CARD_W - 4} height={CARD_H - 4}
                    r={CORNER - 2}
                    color="rgba(255,210,60,0.65)" style="stroke" strokeWidth={2.5} />

                  {/* 홀로그램 시머 (틸트 연동) */}
                  <RoundedRect x={0} y={0} width={CARD_W} height={CARD_H} r={CORNER}>
                    <LinearGradient start={holoStart} end={holoEnd} colors={HOLO_COLORS} />
                  </RoundedRect>
                </Canvas>

                {/* 드래곤 캐릭터 */}
                <View style={styles.charArea} pointerEvents="none">
                  <DragonSkia mood="joyful" size={190} />
                </View>

                {/* 카드 정보 */}
                <View style={styles.infoArea} pointerEvents="none">
                  <View style={styles.nameRow}>
                    <Text style={styles.cardName}>번개 드래곤</Text>
                    <Text style={styles.cardType}>⚡ 전기</Text>
                  </View>
                  <Text style={styles.cardDesc}>
                    폭풍을 타고 태어난 드래곤. 눈빛에서 번개가 튀긴다.
                  </Text>
                  <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>ATK</Text>
                      <Text style={styles.statVal}>85</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>DEF</Text>
                      <Text style={styles.statVal}>62</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>SPD</Text>
                      <Text style={styles.statVal}>91</Text>
                    </View>
                    <View style={[styles.statBox, styles.rarityBox]}>
                      <Text style={styles.rarityText}>★★★★</Text>
                    </View>
                  </View>
                </View>
              </Animated.View>

              {/* ── 뒷면 ── */}
              <Animated.View style={[{ width: CARD_W, height: CARD_H }, backStyle]}>
                <Canvas style={{ width: CARD_W, height: CARD_H }}>
                  <RoundedRect x={0} y={0} width={CARD_W} height={CARD_H} r={CORNER}>
                    <LinearGradient
                      start={vec(0, 0)} end={vec(CARD_W, CARD_H)}
                      colors={['#0c1e3e', '#12103a']}
                    />
                  </RoundedRect>
                  {/* 뒷면 심볼 */}
                  <Circle cx={CARD_W / 2} cy={CARD_H / 2} r={72}
                    color="rgba(255,220,60,0.06)" />
                  <Circle cx={CARD_W / 2} cy={CARD_H / 2} r={52}
                    color="rgba(255,220,60,0.08)" />
                  <Circle cx={CARD_W / 2} cy={CARD_H / 2} r={32}
                    color="rgba(255,220,60,0.12)" />
                  <RoundedRect x={2} y={2} width={CARD_W - 4} height={CARD_H - 4}
                    r={CORNER - 2}
                    color="rgba(255,210,60,0.5)" style="stroke" strokeWidth={2} />
                </Canvas>
                <View style={styles.backLabel} pointerEvents="none">
                  <Text style={styles.backSymbol}>✦</Text>
                </View>
              </Animated.View>

            </View>
          </Animated.View>
        </GestureDetector>

        <Text style={styles.hint}>드래그 → 홀로그램 · 버튼 → 뒤집기</Text>

        <Pressable style={styles.flipBtn} onPress={handleFlip}>
          <Text style={styles.flipText}>{flipped ? '앞면 보기' : '뒤집기'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#06060f' },
  backBtn: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 8 },
  backText: { color: '#888', fontSize: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },

  charArea: {
    position: 'absolute',
    top: 10, left: 10, right: 10,
    height: CHAR_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoArea: {
    position: 'absolute',
    top: CHAR_H + 24,
    left: 0, right: 0,
    paddingHorizontal: 16,
    gap: 8,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardName: { fontFamily: F.eb, color: '#FFE500', fontSize: 17, letterSpacing: 0.3 },
  cardType: { fontFamily: F.sb, color: '#FFE500', fontSize: 12, opacity: 0.8 },
  cardDesc: { fontFamily: F.r, color: 'rgba(255,255,255,0.65)', fontSize: 12, lineHeight: 18 },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  statBox: {
    flex: 1, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8, paddingVertical: 6,
  },
  statLabel: { fontFamily: F.sb, color: 'rgba(255,255,255,0.45)', fontSize: 10 },
  statVal: { fontFamily: F.eb, color: 'white', fontSize: 15 },
  rarityBox: { backgroundColor: 'rgba(255,220,60,0.12)' },
  rarityText: { fontFamily: F.b, color: '#FFE500', fontSize: 12, marginTop: 2 },

  backLabel: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  backSymbol: { color: 'rgba(255,220,60,0.5)', fontSize: 48 },

  hint: { fontFamily: F.r, color: 'rgba(255,255,255,0.3)', fontSize: 12 },
  flipBtn: {
    backgroundColor: 'rgba(255,220,60,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,220,60,0.4)',
    paddingVertical: 12, paddingHorizontal: 36, borderRadius: 24,
  },
  flipText: { fontFamily: F.b, color: '#FFE500', fontSize: 15 },
});
