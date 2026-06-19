import { Skia, SkPath } from '@shopify/react-native-skia';

export function makeFirePath(cx: number, seed: number, charH: number): SkPath {
  const path = Skia.Path.Make();
  const SEGS = 6;
  path.moveTo(cx, charH - 10);
  for (let i = 0; i < SEGS; i++) {
    const t0 = i / SEGS, t1 = (i + 1) / SEGS;
    const y0 = charH - 10 - t0 * (charH - 20);
    const y1 = charH - 10 - t1 * (charH - 20);
    const wave = Math.sin((t0 + seed * 0.4) * Math.PI * 2.5) * 13 * (1 - t0 * 0.6);
    path.cubicTo(cx + wave, y0 - 10, cx - wave * 0.7, y1 + 8, cx + wave * 0.3, y1);
  }
  return path;
}

export function makeWaterPath(baseY: number, seed: number, cardW: number): SkPath {
  const path = Skia.Path.Make();
  path.moveTo(0, baseY);
  for (let i = 1; i <= 14; i++) {
    const t = i / 14;
    path.lineTo(t * cardW, baseY + Math.sin(t * Math.PI * 5 + seed) * 10);
  }
  return path;
}

export function makeLightningPath(cx: number, seed: number, charH: number): SkPath {
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

export function makeNaturePath(startX: number, seed: number, charH: number): SkPath {
  const path = Skia.Path.Make();
  path.moveTo(startX, charH - 10);
  for (let i = 0; i < 5; i++) {
    const t = (i + 1) / 5;
    const x = startX + Math.sin(t * Math.PI * 2 + seed) * 20;
    const y = charH - 10 - t * (charH - 20);
    path.cubicTo(startX + 18, y + 15, x - 12, y - 10, x, y);
  }
  return path;
}

export function makeDarkPath(cx: number, cy: number, seed: number, r: number): SkPath {
  const path = Skia.Path.Make();
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const angle = t * Math.PI * 4 + seed;
    const radius = r * (0.1 + t * 0.9);
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius * 0.6;
    if (i === 0) path.moveTo(x, y); else path.lineTo(x, y);
  }
  return path;
}

export function makeLightPaths(cx: number, cy: number, seed: number, len: number): SkPath[] {
  return Array.from({ length: 8 }, (_, i) => {
    const path = Skia.Path.Make();
    const angle = (i / 8) * Math.PI * 2 + seed * 0.3;
    path.moveTo(cx + Math.cos(angle) * len * 0.22, cy + Math.sin(angle) * len * 0.22);
    path.lineTo(cx + Math.cos(angle) * len * (0.55 + (i % 3) * 0.12), cy + Math.sin(angle) * len * (0.55 + (i % 3) * 0.12));
    return path;
  });
}

export type ElementEffectConfig = {
  paths: SkPath[];
  color: string;
  strokeWidth: number;
};

export function makeElementEffects(element: string, cardW: number, charH: number): ElementEffectConfig {
  switch (element) {
    case 'fire':
      return {
        paths: [makeFirePath(cardW * 0.30, 3, charH), makeFirePath(cardW * 0.70, 7, charH)],
        color: 'rgba(255,100,0,0.55)', strokeWidth: 2.2,
      };
    case 'water':
      return {
        paths: [makeWaterPath(charH * 0.30, 2, cardW), makeWaterPath(charH * 0.55, 5, cardW), makeWaterPath(charH * 0.78, 8, cardW)],
        color: 'rgba(0,180,255,0.50)', strokeWidth: 2,
      };
    case 'lightning':
      return {
        paths: [makeLightningPath(cardW * 0.28, 3, charH), makeLightningPath(cardW * 0.72, 7, charH)],
        color: 'rgba(255,230,0,0.65)', strokeWidth: 2.5,
      };
    case 'nature':
      return {
        paths: [makeNaturePath(cardW * 0.25, 2, charH), makeNaturePath(cardW * 0.75, 5, charH)],
        color: 'rgba(50,220,100,0.50)', strokeWidth: 2,
      };
    case 'dark':
      return {
        paths: [makeDarkPath(cardW / 2, charH / 2, 0, cardW * 0.36)],
        color: 'rgba(180,0,255,0.45)', strokeWidth: 1.8,
      };
    case 'light':
      return {
        paths: makeLightPaths(cardW / 2, charH / 2, 0, cardW * 0.42),
        color: 'rgba(255,220,80,0.55)', strokeWidth: 2,
      };
    default:
      return { paths: [], color: '#FFF', strokeWidth: 2 };
  }
}
