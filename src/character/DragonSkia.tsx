/**
 * DragonSkia v3 — 원소×단계별 오리지널 캐릭터
 * 6원소 × 3단계 = 18가지 비주얼 정체성
 * Canvas 240×240, S = size/240
 */
import {
  BlurMask, Canvas, Circle, Group,
  LinearGradient, Oval, Path, RadialGradient, RoundedRect, Skia, vec,
} from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import {
  Easing, useDerivedValue, useSharedValue,
  withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import type { ElementType } from '@/gacha/types';
import type { Mood } from './types';

export type { ElementType };
export type Stage = 'young' | 'teen' | 'adult';

// ── 원소 팔레트 ──────────────────────────────────────────────────────────────
interface Palette {
  bodyLt: string; bodyMid: string; bodyDk: string;
  belly: string; bellyDk: string;
  accentLt: string; accentDk: string;
  iris: string; outline: string; blush: string;
  shadowColor: string; glowColor: string;
}

const PAL: Record<ElementType, Palette> = {
  fire: {
    bodyLt: '#FF8855', bodyMid: '#DD4422', bodyDk: '#991100',
    belly: '#FFE0D0', bellyDk: '#FFAA88',
    accentLt: '#FFD060', accentDk: '#FF6600',
    iris: '#FF2200', outline: '#2A0800',
    blush: 'rgba(255,80,40,0.35)', shadowColor: 'rgba(180,40,0,0.20)',
    glowColor: 'rgba(255,80,0,0.15)',
  },
  water: {
    bodyLt: '#8AEEF6', bodyMid: '#2EC5D0', bodyDk: '#1A8090',
    belly: '#F0FDFF', bellyDk: '#B8EEF6',
    accentLt: '#AAFFFF', accentDk: '#0099CC',
    iris: '#0066BB', outline: '#012233',
    blush: 'rgba(80,180,220,0.30)', shadowColor: 'rgba(20,100,110,0.22)',
    glowColor: 'rgba(0,180,220,0.12)',
  },
  lightning: {
    bodyLt: '#FFE866', bodyMid: '#DDBB00', bodyDk: '#998800',
    belly: '#FFFFE0', bellyDk: '#FFE888',
    accentLt: '#FFFFFF', accentDk: '#FFCC00',
    iris: '#CC6600', outline: '#221100',
    blush: 'rgba(255,200,0,0.30)', shadowColor: 'rgba(160,120,0,0.18)',
    glowColor: 'rgba(255,220,0,0.12)',
  },
  nature: {
    bodyLt: '#77EE77', bodyMid: '#33AA33', bodyDk: '#1A6622',
    belly: '#EEFFEE', bellyDk: '#AADDAA',
    accentLt: '#CCFFCC', accentDk: '#226622',
    iris: '#1A5522', outline: '#0A1A0A',
    blush: 'rgba(60,180,60,0.28)', shadowColor: 'rgba(20,80,20,0.20)',
    glowColor: 'rgba(50,200,50,0.10)',
  },
  dark: {
    bodyLt: '#9966EE', bodyMid: '#5522AA', bodyDk: '#220066',
    belly: '#EDE0FF', bellyDk: '#C8AAFF',
    accentLt: '#CC99FF', accentDk: '#770099',
    iris: '#CC00EE', outline: '#0A0015',
    blush: 'rgba(160,0,220,0.28)', shadowColor: 'rgba(40,0,80,0.25)',
    glowColor: 'rgba(130,0,200,0.13)',
  },
  light: {
    bodyLt: '#FFE877', bodyMid: '#DDBB33', bodyDk: '#AA8800',
    belly: '#FFFFFF', bellyDk: '#FFFACC',
    accentLt: '#FFFFFF', accentDk: '#FFEE44',
    iris: '#9966FF', outline: '#1A1000',
    blush: 'rgba(255,220,100,0.30)', shadowColor: 'rgba(140,100,0,0.18)',
    glowColor: 'rgba(255,230,80,0.18)',
  },
};

// ── 단계별 비례 파라미터 ──────────────────────────────────────────────────────
interface StageParams {
  headR: number;    // 머리 반지름 (기준 64)
  headY: number;    // 머리 중심 Y
  bodyY: number;    // 몸통 Y
  bodyH: number;    // 몸통 높이
  wingScale: number; // 날개 크기 배율
  blushR: number;   // 볼터치 반지름 (0=없음)
  eyeR: number;     // 눈 반지름
  snoutScale: number; // 주둥이 크기
}

const STAGE_P: Record<Stage, StageParams> = {
  young: { headR: 64, headY: 90, bodyY: 116, bodyH: 94,  wingScale: 0.70, blushR: 16, eyeR: 15, snoutScale: 1.05 },
  teen:  { headR: 62, headY: 88, bodyY: 114, bodyH: 98,  wingScale: 1.00, blushR: 12, eyeR: 14, snoutScale: 1.00 },
  adult: { headR: 57, headY: 83, bodyY: 110, bodyH: 108, wingScale: 1.40, blushR: 0,  eyeR: 13, snoutScale: 0.88 },
};

// ── 감정 파라미터 ─────────────────────────────────────────────────────────────
const BLINK_MS: Record<Mood, number> = { joyful: 2000, neutral: 3600, lonely: 6000 };
const TAIL_P:   Record<Mood, { amp: number; dur: number }> = {
  joyful:  { amp: 20, dur: 350 },
  neutral: { amp: 9,  dur: 1800 },
  lonely:  { amp: 3,  dur: 5000 },
};
const ARM_ROT:  Record<Mood, number> = { joyful: -70, neutral: -15, lonely: 10 };
const BROW_ANG: Record<Mood, number> = { joyful: -18, neutral: 0,   lonely: 15 };
const MOUTH_C = '#6A1010';

interface Props {
  mood: Mood;
  size: number;
  element?: ElementType;
  stage?: Stage;
}

export default function DragonSkia({ mood, size, element = 'lightning', stage = 'young' }: Props) {
  const S  = size / 240;
  const P  = PAL[element];
  const SP = STAGE_P[stage];
  const OW = 2 * S;

  // 눈 상수
  const EYE_R  = SP.eyeR * S;
  const IRIS_R = (SP.eyeR - 5) * S;
  const PUP_R  = (SP.eyeR - 8.5) * S;

  // ── 애니메이션 ─────────────────────────────────────────────────────────────
  const breathY = useSharedValue(0);
  const blinkPg = useSharedValue(1);
  const tailAng = useSharedValue(0);
  const armRot  = useSharedValue(ARM_ROT[mood]);
  const browAng = useSharedValue(BROW_ANG[mood]);
  const glowR   = useSharedValue(30 * S);

  useEffect(() => {
    breathY.value = withRepeat(
      withSequence(
        withTiming(-3.5 * S, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0,         { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      ), -1, false,
    );
    armRot.value  = withTiming(ARM_ROT[mood],  { duration: 500 });
    browAng.value = withTiming(BROW_ANG[mood], { duration: 500 });

    const { amp, dur } = TAIL_P[mood];
    tailAng.value = withRepeat(
      withSequence(
        withTiming( amp, { duration: dur, easing: Easing.inOut(Easing.sin) }),
        withTiming(-amp, { duration: dur, easing: Easing.inOut(Easing.sin) }),
      ), -1, true,
    );

    glowR.value = withRepeat(
      withSequence(
        withTiming(38 * S, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(24 * S, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
      ), -1, true,
    );

    let t: ReturnType<typeof setTimeout>;
    const blink = () => {
      t = setTimeout(() => {
        blinkPg.value = withSequence(
          withTiming(0.06, { duration: 60 }),
          withTiming(1.00, { duration: 70 }),
        );
        blink();
      }, BLINK_MS[mood] + Math.random() * 1000);
    };
    blink();
    return () => clearTimeout(t);
  }, [mood, size, element, stage]);

  // ── Derived transforms ─────────────────────────────────────────────────────
  const bodyT = useDerivedValue(() => [{ translateY: breathY.value }]);

  const tailT = useDerivedValue(() => {
    'worklet';
    const rad = (tailAng.value * Math.PI) / 180;
    const ox = 158 * S, oy = SP.bodyY * S + SP.bodyH * S * 0.5;
    return [
      { translateX: ox }, { translateY: oy },
      { rotate: rad },
      { translateX: -ox }, { translateY: -oy },
    ];
  });

  const lArmT = useDerivedValue(() => {
    'worklet';
    const rad = (armRot.value * Math.PI) / 180;
    const px = 60 * S, py = (SP.bodyY + 34) * S;
    return [{ translateX: px }, { translateY: py }, { rotate: rad }, { translateX: -px }, { translateY: -py }];
  });

  const rArmT = useDerivedValue(() => {
    'worklet';
    const rad = (-armRot.value * Math.PI) / 180;
    const px = 180 * S, py = (SP.bodyY + 34) * S;
    return [{ translateX: px }, { translateY: py }, { rotate: rad }, { translateX: -px }, { translateY: -py }];
  });

  const lBrowT = useDerivedValue(() => {
    'worklet';
    const rad = (browAng.value * Math.PI) / 180;
    const px = 97 * S, py = (SP.headY - 28) * S;
    return [{ translateX: px }, { translateY: py }, { rotate: rad }, { translateX: -px }, { translateY: -py }];
  });

  const rBrowT = useDerivedValue(() => {
    'worklet';
    const rad = (-browAng.value * Math.PI) / 180;
    const px = 143 * S, py = (SP.headY - 28) * S;
    return [{ translateX: px }, { translateY: py }, { rotate: rad }, { translateX: -px }, { translateY: -py }];
  });

  // 눈 깜빡임
  const eY      = SP.headY * S;
  const eyeTopY = useDerivedValue(() => eY - blinkPg.value * EYE_R);
  const eyeH    = useDerivedValue(() => blinkPg.value * EYE_R * 2);
  const irisTopY = useDerivedValue(() => eY - blinkPg.value * IRIS_R);
  const irisH    = useDerivedValue(() => blinkPg.value * IRIS_R * 2);
  const pupTopY  = useDerivedValue(() => eY - blinkPg.value * PUP_R);
  const pupH     = useDerivedValue(() => blinkPg.value * PUP_R * 2);

  // ── 정적 Path ─────────────────────────────────────────────────────────────

  // 꼬리 (원소별 형태)
  const tailPath = useMemo(() => {
    const bY = (SP.bodyY + SP.bodyH * 0.5) * S;
    switch (element) {
      case 'fire': // 불꽃 형태 꼬리
        return Skia.PathBuilder.Make()
          .moveTo(158*S, bY)
          .cubicTo(200*S, bY - 40*S, 222*S, bY - 85*S, 208*S, bY - 105*S)
          .cubicTo(200*S, bY - 118*S, 184*S, bY - 112*S, 188*S, bY - 95*S)
          .cubicTo(194*S, bY - 70*S, 178*S, bY - 38*S, 158*S, bY)
          .close().detach();
      case 'water': // 물고기 꼬리
        return Skia.PathBuilder.Make()
          .moveTo(158*S, bY)
          .cubicTo(190*S, bY - 20*S, 220*S, bY - 40*S, 222*S, bY - 70*S)
          .cubicTo(224*S, bY - 90*S, 204*S, bY - 85*S, 200*S, bY - 68*S)
          .cubicTo(196*S, bY - 50*S, 180*S, bY - 28*S, 158*S, bY)
          .close().detach();
      case 'nature': // 덩굴 꼬리
        return Skia.PathBuilder.Make()
          .moveTo(158*S, bY)
          .cubicTo(188*S, bY - 30*S, 210*S, bY - 60*S, 205*S, bY - 90*S)
          .cubicTo(202*S, bY - 108*S, 188*S, bY - 105*S, 190*S, bY - 88*S)
          .cubicTo(192*S, bY - 68*S, 175*S, bY - 42*S, 158*S, bY)
          .close().detach();
      default: // lightning/dark/light — 뾰족한 꼬리
        return Skia.PathBuilder.Make()
          .moveTo(158*S, bY)
          .cubicTo(202*S, bY - 32*S, 220*S, bY - 74*S, 206*S, bY - 96*S)
          .cubicTo(199*S, bY - 108*S, 183*S, bY - 106*S, 187*S, bY - 89*S)
          .cubicTo(193*S, bY - 62*S, 178*S, bY - 30*S, 158*S, bY)
          .close().detach();
    }
  }, [element, size, stage]);

  // 꼬리 끝 장식
  const tailTipPath = useMemo(() => {
    const bY = (SP.bodyY + SP.bodyH * 0.5) * S;
    if (element === 'fire') {
      return Skia.PathBuilder.Make()
        .moveTo(198*S, bY - 112*S)
        .lineTo(188*S, bY - 124*S)
        .lineTo(180*S, bY - 112*S)
        .lineTo(188*S, bY - 96*S)
        .close().detach();
    }
    if (element === 'water') {
      // 물고기 지느러미 꼬리 끝
      return Skia.PathBuilder.Make()
        .moveTo(210*S, bY - 68*S)
        .cubicTo(224*S, bY - 55*S, 228*S, bY - 85*S, 222*S, bY - 70*S)
        .cubicTo(230*S, bY - 88*S, 218*S, bY - 100*S, 210*S, bY - 68*S)
        .close().detach();
    }
    // 기본 꼬리 끝
    return Skia.PathBuilder.Make()
      .moveTo(198*S, bY - 93*S)
      .lineTo(190*S, bY - 105*S)
      .lineTo(182*S, bY - 93*S)
      .lineTo(190*S, bY - 77*S)
      .close().detach();
  }, [element, size, stage]);

  // 날개 (단계별 크기)
  const ws = SP.wingScale;
  const lWingPath = useMemo(() => {
    const wx = 72 * S, wy = (SP.bodyY + 4) * S;
    const wo = 50 * S * ws;
    return Skia.PathBuilder.Make()
      .moveTo(wx, wy + 30*S)
      .cubicTo(wx - wo*0.5, wy + 14*S, wx - wo, wy - 4*S, wx - wo*0.7, wy - 18*S)
      .cubicTo(wx - wo*0.4, wy - 28*S, wx - wo*0.1, wy - 16*S, wx, wy - 2*S)
      .lineTo(wx, wy + 30*S)
      .close().detach();
  }, [size, stage]);

  const rWingPath = useMemo(() => {
    const wx = 168 * S, wy = (SP.bodyY + 4) * S;
    const wo = 50 * S * ws;
    return Skia.PathBuilder.Make()
      .moveTo(wx, wy + 30*S)
      .cubicTo(wx + wo*0.5, wy + 14*S, wx + wo, wy - 4*S, wx + wo*0.7, wy - 18*S)
      .cubicTo(wx + wo*0.4, wy - 28*S, wx + wo*0.1, wy - 16*S, wx, wy - 2*S)
      .lineTo(wx, wy + 30*S)
      .close().detach();
  }, [size, stage]);

  // 입 (감정별)
  const mouthPath = useMemo(() => {
    const mx = 120 * S;
    const snoutMY = (SP.headY + SP.snoutScale * 20 + 10) * S;
    if (mood === 'joyful') {
      return Skia.PathBuilder.Make()
        .moveTo(mx - 16*S*SP.snoutScale, snoutMY - 2*S)
        .cubicTo(mx - 7*S, snoutMY + 14*S, mx + 7*S, snoutMY + 14*S, mx + 16*S*SP.snoutScale, snoutMY - 2*S)
        .detach();
    } else if (mood === 'neutral') {
      return Skia.PathBuilder.Make()
        .moveTo(mx - 12*S, snoutMY + 2*S)
        .cubicTo(mx - 4*S, snoutMY + 9*S, mx + 4*S, snoutMY + 9*S, mx + 12*S, snoutMY + 2*S)
        .detach();
    } else {
      return Skia.PathBuilder.Make()
        .moveTo(mx - 14*S, snoutMY + 6*S)
        .cubicTo(mx - 5*S, snoutMY, mx + 5*S, snoutMY, mx + 14*S, snoutMY + 6*S)
        .detach();
    }
  }, [mood, size, stage]);

  // 눈썹
  const headOffY = SP.headY * S;
  const lBrowPath = useMemo(() =>
    Skia.PathBuilder.Make()
      .moveTo(80*S, headOffY - 25*S)
      .cubicTo(88*S, headOffY - 32*S, 102*S, headOffY - 32*S, 114*S, headOffY - 27*S)
      .detach()
  , [size, stage]);

  const rBrowPath = useMemo(() =>
    Skia.PathBuilder.Make()
      .moveTo(126*S, headOffY - 27*S)
      .cubicTo(138*S, headOffY - 32*S, 152*S, headOffY - 32*S, 160*S, headOffY - 25*S)
      .detach()
  , [size, stage]);

  // ── 원소별 머리 장식 ─────────────────────────────────────────────────────────
  const headDecoPaths = useMemo(() => {
    const hy = SP.headY * S;
    const adultScale = stage === 'adult' ? 1.2 : stage === 'teen' ? 1.0 : 0.85;

    switch (element) {
      case 'fire': {
        // 불꽃 크레스트 — 위로 솟은 불꽃 2~3개
        const flames = [
          { cx: 105, amp: 12 * adultScale },
          { cx: 120, amp: 16 * adultScale },
          { cx: 135, amp: 12 * adultScale },
        ];
        return flames.map(({ cx, amp }) => {
          const p = Skia.PathBuilder.Make();
          p.moveTo(cx*S, hy - 10*S);
          p.cubicTo((cx - amp)*S, hy - 30*S, (cx - amp/2)*S, hy - 55*S * adultScale, cx*S, hy - 65*S * adultScale);
          p.cubicTo((cx + amp/2)*S, hy - 55*S * adultScale, (cx + amp)*S, hy - 30*S, cx*S, hy - 10*S);
          p.close();
          return p.detach();
        });
      }
      case 'water': {
        // 물결 지느러미 귀 — 양 옆
        const lFin = Skia.PathBuilder.Make()
          .moveTo(68*S, hy - 10*S)
          .cubicTo(50*S, hy - 30*S * adultScale, 32*S, hy - 45*S * adultScale, 38*S, hy - 60*S * adultScale)
          .cubicTo(46*S, hy - 70*S * adultScale, 58*S, hy - 55*S * adultScale, 64*S, hy - 38*S)
          .cubicTo(68*S, hy - 24*S, 70*S, hy - 14*S, 68*S, hy - 10*S)
          .close().detach();
        const rFin = Skia.PathBuilder.Make()
          .moveTo(172*S, hy - 10*S)
          .cubicTo(190*S, hy - 30*S * adultScale, 208*S, hy - 45*S * adultScale, 202*S, hy - 60*S * adultScale)
          .cubicTo(194*S, hy - 70*S * adultScale, 182*S, hy - 55*S * adultScale, 176*S, hy - 38*S)
          .cubicTo(172*S, hy - 24*S, 170*S, hy - 14*S, 172*S, hy - 10*S)
          .close().detach();
        return [lFin, rFin];
      }
      case 'lightning': {
        // 번개 스파이크 — 3개의 지그재그 뿔
        const spikes = [
          { x: 105, w: 8, h: 42 * adultScale },
          { x: 120, w: 10, h: 58 * adultScale },
          { x: 135, w: 8, h: 42 * adultScale },
        ];
        return spikes.map(({ x, w, h }) => {
          const p = Skia.PathBuilder.Make();
          p.moveTo((x - w)*S, hy - 12*S);
          p.lineTo((x - w/2)*S, hy - h*0.5*S);
          p.lineTo((x - w*1.5)*S, hy - h*0.55*S);
          p.lineTo(x*S, hy - h*S);
          p.lineTo((x + w*1.5)*S, hy - h*0.55*S);
          p.lineTo((x + w/2)*S, hy - h*0.5*S);
          p.lineTo((x + w)*S, hy - 12*S);
          p.close();
          return p.detach();
        });
      }
      case 'nature': {
        // 나뭇가지 뿔 — 양 갈래 덩굴
        const lAntler = Skia.PathBuilder.Make()
          .moveTo(95*S, hy - 12*S)
          .lineTo(82*S, hy - 35*S * adultScale)
          .lineTo(68*S, hy - 60*S * adultScale) // main branch
          .moveTo(82*S, hy - 35*S * adultScale)
          .lineTo(62*S, hy - 42*S * adultScale) // left branch
          .moveTo(82*S, hy - 35*S * adultScale)
          .lineTo(84*S, hy - 52*S * adultScale) // right branch
          .detach();
        const rAntler = Skia.PathBuilder.Make()
          .moveTo(145*S, hy - 12*S)
          .lineTo(158*S, hy - 35*S * adultScale)
          .lineTo(172*S, hy - 60*S * adultScale)
          .moveTo(158*S, hy - 35*S * adultScale)
          .lineTo(178*S, hy - 42*S * adultScale)
          .moveTo(158*S, hy - 35*S * adultScale)
          .lineTo(156*S, hy - 52*S * adultScale)
          .detach();
        return [lAntler, rAntler];
      }
      case 'dark': {
        // 암흑 뿔 — 뒤로 굽은 날카로운 곡선 뿔
        const lHorn = Skia.PathBuilder.Make()
          .moveTo(98*S, hy - 12*S)
          .cubicTo(82*S, hy - 30*S, 60*S, hy - 50*S * adultScale, 62*S, hy - 72*S * adultScale)
          .cubicTo(64*S, hy - 82*S * adultScale, 76*S, hy - 78*S * adultScale, 80*S, hy - 65*S * adultScale)
          .cubicTo(84*S, hy - 52*S * adultScale, 90*S, hy - 36*S, 98*S, hy - 12*S)
          .close().detach();
        const rHorn = Skia.PathBuilder.Make()
          .moveTo(142*S, hy - 12*S)
          .cubicTo(158*S, hy - 30*S, 180*S, hy - 50*S * adultScale, 178*S, hy - 72*S * adultScale)
          .cubicTo(176*S, hy - 82*S * adultScale, 164*S, hy - 78*S * adultScale, 160*S, hy - 65*S * adultScale)
          .cubicTo(156*S, hy - 52*S * adultScale, 150*S, hy - 36*S, 142*S, hy - 12*S)
          .close().detach();
        return [lHorn, rHorn];
      }
      case 'light': {
        // 빛 후광 — 머리 위 원형 링 + 광선
        const rays: ReturnType<typeof Skia.PathBuilder.Make.prototype.detach>[] = [];
        const rayCount = stage === 'adult' ? 8 : 6;
        for (let i = 0; i < rayCount; i++) {
          const angle = (i / rayCount) * Math.PI * 2 - Math.PI / 2;
          const r0 = 28 * adultScale * S;
          const r1 = 44 * adultScale * S;
          const p = Skia.PathBuilder.Make();
          p.moveTo(120*S + Math.cos(angle) * r0, (hy - 50*S * adultScale) + Math.sin(angle) * r0);
          p.lineTo(120*S + Math.cos(angle) * r1, (hy - 50*S * adultScale) + Math.sin(angle) * r1);
          rays.push(p.detach());
        }
        return rays;
      }
    }
  }, [element, size, stage]);

  const lEX = 97 * S, rEX = 143 * S;
  const snoutW = 52 * S * SP.snoutScale;
  const snoutH = 30 * S * SP.snoutScale;
  const snoutX = 120 * S - snoutW / 2;
  const snoutY = headOffY + 12 * S;

  return (
    <Canvas style={{ width: size, height: size }}>

      {/* 바닥 그림자 */}
      <Oval x={66*S} y={213*S} width={108*S} height={13*S}
        color={P.shadowColor}>
        <BlurMask blur={10*S} style="normal" />
      </Oval>

      {/* 원소 글로우 — 캐릭터 중심 */}
      <Circle cx={120*S} cy={140*S} r={glowR} color={P.glowColor}>
        <BlurMask blur={22*S} style="normal" />
      </Circle>

      {/* ── 꼬리 ── */}
      <Group transform={tailT}>
        <Path path={tailPath} color={P.outline} style="stroke" strokeWidth={3.5*S} strokeJoin="round" />
        <Path path={tailPath}>
          <LinearGradient start={vec(158*S, 158*S)} end={vec(205*S, 62*S)} colors={[P.bodyMid, P.bodyDk]} />
        </Path>
        <Path path={tailTipPath} color={P.outline} />
        <Path path={tailTipPath}>
          <LinearGradient start={vec(190*S, 40*S)} end={vec(190*S, 68*S)} colors={[P.accentLt, P.bodyMid]} />
        </Path>
      </Group>

      {/* ── 날개 ── */}
      <Path path={lWingPath} color={P.outline} />
      <Path path={lWingPath}>
        <LinearGradient start={vec(72*S, SP.bodyY*S)} end={vec(72*S, (SP.bodyY+40)*S)} colors={[P.accentLt, P.bodyMid]} />
      </Path>
      <Path path={rWingPath} color={P.outline} />
      <Path path={rWingPath}>
        <LinearGradient start={vec(168*S, SP.bodyY*S)} end={vec(168*S, (SP.bodyY+40)*S)} colors={[P.accentLt, P.bodyMid]} />
      </Path>

      {/* ── 몸통 ── */}
      <Group transform={bodyT}>
        <Oval x={63*S - OW} y={SP.bodyY*S - OW} width={114*S + OW*2} height={SP.bodyH*S + OW*2} color={P.outline} />
        <Oval x={63*S} y={SP.bodyY*S} width={114*S} height={SP.bodyH*S}>
          <RadialGradient c={vec(98*S, (SP.bodyY+18)*S)} r={62*S} colors={[P.bodyLt, P.bodyMid, P.bodyDk]} />
        </Oval>
        {/* 배 */}
        <Oval x={86*S - OW} y={(SP.bodyY+28)*S - OW} width={68*S + OW*2} height={54*S + OW*2} color={P.outline} />
        <Oval x={86*S} y={(SP.bodyY+28)*S} width={68*S} height={54*S}>
          <RadialGradient c={vec(116*S, (SP.bodyY+44)*S)} r={30*S} colors={[P.belly, P.bellyDk]} />
        </Oval>
        {stage !== 'adult' && <>
          <Oval x={97*S} y={(SP.bodyY+46)*S} width={46*S} height={12*S} color="rgba(200,180,160,0.20)" />
          <Oval x={102*S} y={(SP.bodyY+58)*S} width={36*S} height={9*S} color="rgba(200,180,160,0.15)" />
        </>}
      </Group>

      {/* ── 팔 ── */}
      <Group transform={lArmT}>
        <RoundedRect x={48*S - OW} y={(SP.bodyY+34)*S - OW} width={24*S + OW*2} height={34*S + OW*2} r={12*S + OW} color={P.outline} />
        <RoundedRect x={48*S} y={(SP.bodyY+34)*S} width={24*S} height={34*S} r={12*S}>
          <RadialGradient c={vec(58*S, (SP.bodyY+44)*S)} r={18*S} colors={[P.bodyLt, P.bodyDk]} />
        </RoundedRect>
        {[0, 9, 18].map((dx, i) => (
          <Group key={i}>
            <Circle cx={(53+dx)*S} cy={(SP.bodyY+70)*S} r={7*S} color={P.outline} />
            <Circle cx={(53+dx)*S} cy={(SP.bodyY+70)*S} r={5*S} color={P.bodyMid} />
          </Group>
        ))}
      </Group>
      <Group transform={rArmT}>
        <RoundedRect x={168*S - OW} y={(SP.bodyY+34)*S - OW} width={24*S + OW*2} height={34*S + OW*2} r={12*S + OW} color={P.outline} />
        <RoundedRect x={168*S} y={(SP.bodyY+34)*S} width={24*S} height={34*S} r={12*S}>
          <RadialGradient c={vec(180*S, (SP.bodyY+44)*S)} r={18*S} colors={[P.bodyLt, P.bodyDk]} />
        </RoundedRect>
        {[0, 9, 18].map((dx, i) => (
          <Group key={i}>
            <Circle cx={(173+dx)*S} cy={(SP.bodyY+70)*S} r={7*S} color={P.outline} />
            <Circle cx={(173+dx)*S} cy={(SP.bodyY+70)*S} r={5*S} color={P.bodyMid} />
          </Group>
        ))}
      </Group>

      {/* ── 머리 그룹 ── */}
      <Group transform={bodyT}>

        {/* 원소별 머리 장식 */}
        {element === 'fire' && headDecoPaths.map((p, i) => (
          <Group key={i}>
            <Path path={p} color={P.outline} style="stroke" strokeWidth={1.5*S} strokeJoin="round" />
            <Path path={p}>
              <LinearGradient start={vec(120*S, headOffY)} end={vec(120*S, headOffY - 70*S)}
                colors={[P.accentDk, P.accentLt]} />
            </Path>
          </Group>
        ))}

        {element === 'water' && headDecoPaths.map((p, i) => (
          <Group key={i}>
            <Path path={p} color={P.outline} />
            <Path path={p}>
              <LinearGradient start={vec(i===0?38*S:202*S, headOffY - 60*S)} end={vec(i===0?68*S:172*S, headOffY)}
                colors={[P.accentLt, P.bodyMid]} />
            </Path>
          </Group>
        ))}

        {element === 'lightning' && headDecoPaths.map((p, i) => (
          <Group key={i}>
            <Path path={p} color={P.outline} />
            <Path path={p}>
              <LinearGradient start={vec(120*S, headOffY - 60*S)} end={vec(120*S, headOffY - 12*S)}
                colors={[P.accentLt, P.accentDk]} />
            </Path>
          </Group>
        ))}

        {element === 'nature' && headDecoPaths.map((p, i) => (
          <Path key={i} path={p} color={P.accentDk}
            style="stroke" strokeWidth={5*S * (stage === 'adult' ? 1.2 : 1.0)} strokeCap="round" strokeJoin="round" />
        ))}
        {element === 'nature' && ( // 잎 끝 장식
          <>
            <Circle cx={68*S} cy={headOffY - 60*S * (stage==='adult'?1.2:stage==='teen'?1.0:0.85)} r={6*S} color={P.bodyLt} />
            <Circle cx={172*S} cy={headOffY - 60*S * (stage==='adult'?1.2:stage==='teen'?1.0:0.85)} r={6*S} color={P.bodyLt} />
          </>
        )}

        {element === 'dark' && headDecoPaths.map((p, i) => (
          <Group key={i}>
            <Path path={p} color={P.outline} />
            <Path path={p}>
              <LinearGradient start={vec(i===0?62*S:178*S, headOffY - 72*S)} end={vec(i===0?98*S:142*S, headOffY)}
                colors={[P.accentLt, P.bodyDk]} />
            </Path>
            {/* 뿔의 별 */}
            <Circle cx={i===0?66*S:174*S} cy={headOffY - 72*S * (stage==='adult'?1.2:stage==='teen'?1.0:0.85)}
              r={4*S} color={P.accentLt}>
              <BlurMask blur={3*S} style="normal" />
            </Circle>
          </Group>
        ))}

        {element === 'light' && (
          <>
            {/* 후광 링 */}
            <Circle cx={120*S} cy={headOffY - 50*S * (stage==='adult'?1.2:stage==='teen'?1.0:0.85)}
              r={30 * (stage==='adult'?1.2:stage==='teen'?1.0:0.85) * S}
              color={P.accentLt} style="stroke" strokeWidth={4*S}>
              <BlurMask blur={3*S} style="normal" />
            </Circle>
            {headDecoPaths.map((p, i) => (
              <Path key={i} path={p} color={P.accentLt}
                style="stroke" strokeWidth={2.5*S} strokeCap="round">
                <BlurMask blur={2*S} style="normal" />
              </Path>
            ))}
          </>
        )}

        {/* 머리 */}
        <Circle cx={120*S} cy={headOffY} r={SP.headR*S + OW + 1*S} color={P.outline} />
        <Circle cx={120*S} cy={headOffY} r={SP.headR*S}>
          <RadialGradient c={vec(94*S, headOffY - 24*S)} r={SP.headR*S}
            colors={[P.bodyLt, P.bodyMid, P.bodyDk]} />
        </Circle>

        {/* 주둥이 */}
        <Oval x={snoutX - OW} y={snoutY - OW} width={snoutW + OW*2} height={snoutH + OW*2} color={P.outline} />
        <Oval x={snoutX} y={snoutY} width={snoutW} height={snoutH}>
          <RadialGradient c={vec(120*S, snoutY + snoutH*0.4)} r={snoutW*0.5}
            colors={[P.belly, P.bellyDk]} />
        </Oval>

        {/* 콧구멍 */}
        <Oval x={107*S} y={snoutY + 7*S} width={9*S} height={5.5*S} color={`${P.outline}99`} />
        <Oval x={124*S} y={snoutY + 7*S} width={9*S} height={5.5*S} color={`${P.outline}99`} />

        {/* 입 */}
        <Path path={mouthPath} color={MOUTH_C}
          style="stroke" strokeWidth={3.2*S} strokeCap="round" strokeJoin="round" />

        {/* 볼터치 (young/teen만) */}
        {SP.blushR > 0 && <>
          <Circle cx={80*S} cy={snoutY + 4*S} r={SP.blushR*S} color={P.blush}>
            <BlurMask blur={9*S} style="normal" />
          </Circle>
          <Circle cx={160*S} cy={snoutY + 4*S} r={SP.blushR*S} color={P.blush}>
            <BlurMask blur={9*S} style="normal" />
          </Circle>
        </>}

        {/* 눈썹 */}
        <Group transform={lBrowT}>
          <Path path={lBrowPath} color={P.outline} style="stroke" strokeWidth={5*S} strokeCap="round" />
        </Group>
        <Group transform={rBrowT}>
          <Path path={rBrowPath} color={P.outline} style="stroke" strokeWidth={5*S} strokeCap="round" />
        </Group>

        {/* 왼눈 */}
        <Circle cx={lEX} cy={eY} r={EYE_R + OW + 1*S} color={P.outline} />
        <Circle cx={lEX} cy={eY} r={EYE_R} color="white" />
        <Oval x={lEX - IRIS_R} y={irisTopY} width={IRIS_R * 2} height={irisH} color={P.iris}>
          <RadialGradient c={vec(lEX - 3*S, eY - 3*S)} r={IRIS_R} colors={[P.accentLt, P.iris]} />
        </Oval>
        <Oval x={lEX - PUP_R} y={pupTopY} width={PUP_R * 2} height={pupH} color="#0A0A18" />
        <Circle cx={lEX + 5*S} cy={eY - 5*S} r={4.5*S} color="white" />
        <Circle cx={lEX - 4*S} cy={eY + 4*S} r={2*S} color="rgba(255,255,255,0.65)" />

        {/* 오른눈 */}
        <Circle cx={rEX} cy={eY} r={EYE_R + OW + 1*S} color={P.outline} />
        <Circle cx={rEX} cy={eY} r={EYE_R} color="white" />
        <Oval x={rEX - IRIS_R} y={irisTopY} width={IRIS_R * 2} height={irisH} color={P.iris}>
          <RadialGradient c={vec(rEX - 3*S, eY - 3*S)} r={IRIS_R} colors={[P.accentLt, P.iris]} />
        </Oval>
        <Oval x={rEX - PUP_R} y={pupTopY} width={PUP_R * 2} height={pupH} color="#0A0A18" />
        <Circle cx={rEX + 5*S} cy={eY - 5*S} r={4.5*S} color="white" />
        <Circle cx={rEX - 4*S} cy={eY + 4*S} r={2*S} color="rgba(255,255,255,0.65)" />

        {/* 머리 하이라이트 */}
        <Circle cx={93*S} cy={headOffY - 23*S} r={16*S} color="rgba(255,255,255,0.18)" />

        {/* adult: 눈 주변 날카로운 각도 강조 */}
        {stage === 'adult' && (
          <>
            <Path path={Skia.PathBuilder.Make()
              .moveTo((lEX - EYE_R - 4*S), eY - 4*S)
              .lineTo((lEX - EYE_R - 12*S), eY - 14*S)
              .lineTo((lEX - EYE_R - 2*S), eY - 8*S)
              .detach()}
              color={P.outline} style="stroke" strokeWidth={2.5*S} strokeCap="round" />
            <Path path={Skia.PathBuilder.Make()
              .moveTo((rEX + EYE_R + 4*S), eY - 4*S)
              .lineTo((rEX + EYE_R + 12*S), eY - 14*S)
              .lineTo((rEX + EYE_R + 2*S), eY - 8*S)
              .detach()}
              color={P.outline} style="stroke" strokeWidth={2.5*S} strokeCap="round" />
          </>
        )}
      </Group>
    </Canvas>
  );
}
