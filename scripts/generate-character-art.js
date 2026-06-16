// Procedurally generates the 20 character sprites (4 growth stages x 5
// moods) and the 3 companion age-tier accessory overlays, replacing the
// flat "PLACEHOLDER ART" circles with a distinct silhouette per stage and a
// distinct face/posture per mood. No external art assets or native image
// libs needed — everything is rasterized with simple shape-membership tests
// onto a 2x canvas, then downsampled with bilinear filtering for cheap
// anti-aliasing.
//
// Run with: node scripts/generate-character-art.js
const path = require('path');
const Jimp = require('jimp-compact');

const SCALE = 2;
const SIZE = 240;
const CANVAS = SIZE * SCALE;

const CHARACTER_DIR = path.join(__dirname, '../src/assets/character');
const ACCESSORY_DIR = path.join(CHARACTER_DIR, 'age-accessories');

// ---- color helpers --------------------------------------------------

function hexToRgb(hex) {
  const v = hex.replace('#', '');
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function brighten([r, g, b], t) {
  return [lerp(r, 255, t), lerp(g, 255, t), lerp(b, 255, t)];
}

function darken([r, g, b], t) {
  return [lerp(r, 0, t), lerp(g, 0, t), lerp(b, 0, t)];
}

function desaturate([r, g, b], t) {
  const gray = 0.3 * r + 0.59 * g + 0.11 * b;
  return [lerp(r, gray, t), lerp(g, gray, t), lerp(b, gray, t)];
}

function rgba([r, g, b], a = 1) {
  return [r, g, b, a];
}

const FACE_COLOR = hexToRgb('#3B362E');
const WHITE = [255, 255, 255];
const TEAR_COLOR = hexToRgb('#8FCBEA');
const BLUSH_COLOR = hexToRgb('#F2849E');

const MOOD_BODY_ADJUST = {
  joyful: (c) => brighten(c, 0.08),
  content: (c) => c,
  neutral: (c) => desaturate(c, 0.05),
  down: (c) => desaturate(darken(c, 0.12), 0.15),
  lonely: (c) => desaturate(darken(c, 0.18), 0.25),
};

const STAGE_PALETTE = {
  egg: { body: hexToRgb('#F4E4C1'), accent: hexToRgb('#DDBE8C'), dark: hexToRgb('#B89A6A') },
  hatchling: { body: hexToRgb('#CFE7A0'), accent: hexToRgb('#94B86A'), shell: hexToRgb('#F4E4C1') },
  juvenile: { body: hexToRgb('#7FC8C0'), accent: hexToRgb('#4F968D') },
  companion: { body: hexToRgb('#F2A65A'), accent: hexToRgb('#D98A3D') },
};

// ---- raw pixel + shape primitives (operate in actual canvas pixels) ----

function setPixelRGBA(image, x, y, color) {
  const w = image.bitmap.width;
  const h = image.bitmap.height;
  if (x < 0 || y < 0 || x >= w || y >= h) return;
  const [r, g, b, a = 1] = color;
  if (a <= 0) return;
  const idx = (y * w + x) * 4;
  const data = image.bitmap.data;
  const dstA = data[idx + 3] / 255;
  const outA = a + dstA * (1 - a);
  if (outA <= 0) {
    data[idx + 3] = 0;
    return;
  }
  data[idx + 0] = Math.round((r * a + data[idx + 0] * dstA * (1 - a)) / outA);
  data[idx + 1] = Math.round((g * a + data[idx + 1] * dstA * (1 - a)) / outA);
  data[idx + 2] = Math.round((b * a + data[idx + 2] * dstA * (1 - a)) / outA);
  data[idx + 3] = Math.round(outA * 255);
}

function fillRotatedEllipseRaw(image, cx, cy, rx, ry, angleDeg, color) {
  if (rx <= 0 || ry <= 0) return;
  const rad = (-angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const maxR = Math.max(rx, ry);
  const minX = Math.floor(cx - maxR - 1);
  const maxX = Math.ceil(cx + maxR + 1);
  const minY = Math.floor(cy - maxR - 1);
  const maxY = Math.ceil(cy + maxR + 1);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const lx = dx * cos - dy * sin;
      const ly = dx * sin + dy * cos;
      if ((lx * lx) / (rx * rx) + (ly * ly) / (ry * ry) <= 1) setPixelRGBA(image, x, y, color);
    }
  }
}

function triangleSign(p1, p2, p3) {
  return (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1]);
}

function fillTriangleRaw(image, v1, v2, v3, color) {
  const xs = [v1[0], v2[0], v3[0]];
  const ys = [v1[1], v2[1], v3[1]];
  const minX = Math.floor(Math.min(...xs));
  const maxX = Math.ceil(Math.max(...xs));
  const minY = Math.floor(Math.min(...ys));
  const maxY = Math.ceil(Math.max(...ys));
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const pt = [x + 0.5, y + 0.5];
      const d1 = triangleSign(pt, v1, v2);
      const d2 = triangleSign(pt, v2, v3);
      const d3 = triangleSign(pt, v3, v1);
      const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
      const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
      if (!(hasNeg && hasPos)) setPixelRGBA(image, x, y, color);
    }
  }
}

// ---- logical-space (240x240) shape helpers -----------------------------
// Everything above the generator functions works in actual canvas pixels;
// everything below works in the logical 240x240 grid the stage/face layouts
// are designed in, scaling up by SCALE at the last moment.

function fillEllipse(image, cx, cy, rx, ry, color) {
  fillRotatedEllipseRaw(image, cx * SCALE, cy * SCALE, rx * SCALE, ry * SCALE, 0, color);
}

function fillRotatedEllipse(image, cx, cy, rx, ry, angleDeg, color) {
  fillRotatedEllipseRaw(image, cx * SCALE, cy * SCALE, rx * SCALE, ry * SCALE, angleDeg, color);
}

function fillTriangle(image, p1, p2, p3, color) {
  const scaled = (p) => [p[0] * SCALE, p[1] * SCALE];
  fillTriangleRaw(image, scaled(p1), scaled(p2), scaled(p3), color);
}

// Stamps small circles along a parabola to approximate a curved stroke —
// used for mouths (smile/frown) and closed happy-eyes alike. Positive
// amplitude bows the center downward (smile/U); negative bows it upward
// (frown/∩).
function drawArcStroke(image, cx, cy, halfWidth, amplitude, thickness, color) {
  const steps = 28;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const dx = -halfWidth + t * halfWidth * 2;
    const dy = amplitude * (1 - (dx / halfWidth) ** 2);
    fillEllipse(image, cx + dx, cy + dy, thickness / 2, thickness / 2, color);
  }
}

// ---- stage silhouettes ---------------------------------------------------

function drawEgg(image, palette) {
  fillEllipse(image, 120, 132, 56, 70, rgba(palette.body, 1));
  const speckles = [
    [95, 90], [140, 95], [105, 160], [150, 150], [88, 130], [150, 118], [118, 182], [100, 118],
  ];
  for (const [sx, sy] of speckles) fillEllipse(image, sx, sy, 4, 4, rgba(palette.accent, 0.55));
  fillTriangle(image, [108, 68], [128, 62], [118, 90], rgba(palette.dark, 0.5));
}

function drawHatchling(image, palette) {
  fillTriangle(image, [40, 205], [80, 205], [55, 235], rgba(palette.shell, 1));
  fillTriangle(image, [160, 205], [200, 205], [185, 235], rgba(palette.shell, 1));
  fillEllipse(image, 120, 140, 58, 56, rgba(palette.body, 1));
  fillEllipse(image, 64, 150, 15, 11, rgba(palette.body, 1));
  fillEllipse(image, 176, 150, 15, 11, rgba(palette.body, 1));
  fillTriangle(image, [108, 70], [120, 40], [132, 70], rgba(palette.accent, 1));
}

function drawJuvenile(image, palette) {
  fillRotatedEllipse(image, 178, 175, 22, 12, -30, rgba(palette.accent, 1));
  fillRotatedEllipse(image, 70, 130, 26, 14, -35, rgba(palette.accent, 1));
  fillRotatedEllipse(image, 170, 130, 26, 14, 35, rgba(palette.accent, 1));
  fillEllipse(image, 120, 160, 50, 56, rgba(palette.body, 1));
  fillEllipse(image, 96, 215, 14, 10, rgba(palette.body, 1));
  fillEllipse(image, 144, 215, 14, 10, rgba(palette.body, 1));
  fillEllipse(image, 120, 88, 40, 40, rgba(palette.body, 1));
  fillEllipse(image, 92, 60, 10, 14, rgba(palette.accent, 1));
  fillEllipse(image, 148, 60, 10, 14, rgba(palette.accent, 1));
}

function drawCompanion(image, palette) {
  fillRotatedEllipse(image, 184, 178, 28, 15, -35, rgba(palette.accent, 1));
  fillRotatedEllipse(image, 62, 132, 30, 16, -40, rgba(palette.accent, 1));
  fillRotatedEllipse(image, 178, 132, 30, 16, 40, rgba(palette.accent, 1));
  fillEllipse(image, 120, 158, 56, 62, rgba(palette.body, 1));
  fillEllipse(image, 120, 170, 28, 34, rgba(palette.bodyLight, 1));
  fillEllipse(image, 92, 218, 16, 11, rgba(palette.body, 1));
  fillEllipse(image, 148, 218, 16, 11, rgba(palette.body, 1));
  fillEllipse(image, 120, 80, 44, 44, rgba(palette.body, 1));
  fillTriangle(image, [82, 55], [100, 20], [108, 58], rgba(palette.accent, 1));
  fillTriangle(image, [158, 55], [140, 20], [132, 58], rgba(palette.accent, 1));
}

const STAGE_DRAW = { egg: drawEgg, hatchling: drawHatchling, juvenile: drawJuvenile, companion: drawCompanion };

const STAGE_FACE = {
  egg: { cx: 120, cy: 148, eyeDX: 16, eyeR: 7, mouthY: 168, mouthHalf: 14 },
  hatchling: { cx: 120, cy: 138, eyeDX: 20, eyeR: 10, mouthY: 158, mouthHalf: 16 },
  juvenile: { cx: 120, cy: 90, eyeDX: 14, eyeR: 7, mouthY: 102, mouthHalf: 12 },
  companion: { cx: 120, cy: 82, eyeDX: 15, eyeR: 8, mouthY: 96, mouthHalf: 13 },
};

// ---- mood faces ------------------------------------------------------

function paintFace(image, face, mood) {
  const { cx, cy, eyeDX, eyeR, mouthY, mouthHalf } = face;
  const leftEyeX = cx - eyeDX;
  const rightEyeX = cx + eyeDX;
  const faceColor = rgba(FACE_COLOR, 1);

  if (mood === 'joyful') {
    drawArcStroke(image, leftEyeX, cy, eyeR * 0.9, eyeR * 0.7, eyeR * 0.55, faceColor);
    drawArcStroke(image, rightEyeX, cy, eyeR * 0.9, eyeR * 0.7, eyeR * 0.55, faceColor);
    drawArcStroke(image, cx, mouthY, mouthHalf * 1.1, mouthHalf * 0.9, mouthHalf * 0.5, faceColor);
    fillEllipse(image, leftEyeX - eyeR * 0.9, cy + eyeR * 1.6, eyeR * 0.9, eyeR * 0.6, rgba(BLUSH_COLOR, 0.35));
    fillEllipse(image, rightEyeX + eyeR * 0.9, cy + eyeR * 1.6, eyeR * 0.9, eyeR * 0.6, rgba(BLUSH_COLOR, 0.35));
    return;
  }

  if (mood === 'content') {
    fillEllipse(image, leftEyeX, cy, eyeR * 0.85, eyeR * 0.85, faceColor);
    fillEllipse(image, rightEyeX, cy, eyeR * 0.85, eyeR * 0.85, faceColor);
    fillEllipse(image, leftEyeX - eyeR * 0.3, cy - eyeR * 0.3, eyeR * 0.25, eyeR * 0.25, rgba(WHITE, 0.9));
    fillEllipse(image, rightEyeX - eyeR * 0.3, cy - eyeR * 0.3, eyeR * 0.25, eyeR * 0.25, rgba(WHITE, 0.9));
    drawArcStroke(image, cx, mouthY, mouthHalf * 0.8, mouthHalf * 0.4, mouthHalf * 0.4, faceColor);
    return;
  }

  if (mood === 'neutral') {
    fillEllipse(image, leftEyeX, cy, eyeR * 0.8, eyeR * 0.8, faceColor);
    fillEllipse(image, rightEyeX, cy, eyeR * 0.8, eyeR * 0.8, faceColor);
    fillRotatedEllipse(image, cx, mouthY, mouthHalf * 0.7, mouthHalf * 0.18, 0, faceColor);
    return;
  }

  if (mood === 'down') {
    fillRotatedEllipse(image, leftEyeX, cy + eyeR * 0.2, eyeR * 0.85, eyeR * 0.4, 0, faceColor);
    fillRotatedEllipse(image, rightEyeX, cy + eyeR * 0.2, eyeR * 0.85, eyeR * 0.4, 0, faceColor);
    fillRotatedEllipse(image, leftEyeX - eyeR * 0.1, cy - eyeR * 1.3, eyeR * 0.9, eyeR * 0.22, -18, faceColor);
    fillRotatedEllipse(image, rightEyeX + eyeR * 0.1, cy - eyeR * 1.3, eyeR * 0.9, eyeR * 0.22, 18, faceColor);
    drawArcStroke(image, cx, mouthY, mouthHalf * 0.9, -mouthHalf * 0.55, mouthHalf * 0.4, faceColor);
    return;
  }

  // lonely — droopy eyes like `down` but no eyebrows, a single tear, and a
  // shallower frown: meant to read as wistful/isolated rather than upset.
  fillRotatedEllipse(image, leftEyeX, cy + eyeR * 0.2, eyeR * 0.85, eyeR * 0.4, 0, faceColor);
  fillRotatedEllipse(image, rightEyeX, cy + eyeR * 0.2, eyeR * 0.85, eyeR * 0.4, 0, faceColor);
  drawArcStroke(image, cx, mouthY, mouthHalf * 0.7, -mouthHalf * 0.3, mouthHalf * 0.4, faceColor);
  const tearX = rightEyeX + eyeR * 0.3;
  const tearY = cy + eyeR * 1.4;
  fillEllipse(image, tearX, tearY, eyeR * 0.32, eyeR * 0.45, rgba(TEAR_COLOR, 0.85));
  fillTriangle(
    image,
    [tearX - eyeR * 0.32, tearY - eyeR * 0.25],
    [tearX + eyeR * 0.32, tearY - eyeR * 0.25],
    [tearX, tearY - eyeR * 0.55],
    rgba(TEAR_COLOR, 0.85)
  );
}

// ---- accessory overlays (companion age tiers) ---------------------------

function drawBow(image) {
  const color = rgba(hexToRgb('#E8748A'), 1);
  const knot = rgba(hexToRgb('#C24F66'), 1);
  const cx = 120;
  const cy = 40;
  fillTriangle(image, [cx - 24, cy - 11], [cx - 3, cy], [cx - 24, cy + 11], color);
  fillTriangle(image, [cx + 24, cy - 11], [cx + 3, cy], [cx + 24, cy + 11], color);
  fillEllipse(image, cx, cy, 6, 6, knot);
}

function drawSparkle(image) {
  const color = rgba(hexToRgb('#FFD166'), 1);
  const cx = 120;
  const cy = 38;
  fillRotatedEllipse(image, cx, cy, 22, 6, 0, color);
  fillRotatedEllipse(image, cx, cy, 22, 6, 90, color);
}

function drawCrown(image) {
  const color = rgba(hexToRgb('#F2B705'), 1);
  const jewel = rgba(hexToRgb('#E8483A'), 1);
  const baseY = 46;
  fillRotatedEllipse(image, 120, baseY, 30, 7, 0, color);
  fillTriangle(image, [96, baseY], [104, baseY - 26], [112, baseY], color);
  fillTriangle(image, [110, baseY], [120, baseY - 32], [130, baseY], color);
  fillTriangle(image, [128, baseY], [136, baseY - 26], [144, baseY], color);
  fillEllipse(image, 120, baseY - 30, 4, 4, jewel);
}

// ---- orchestration -----------------------------------------------------

function createImage() {
  return new Promise((resolve, reject) => {
    new Jimp(CANVAS, CANVAS, Jimp.rgbaToInt(0, 0, 0, 0), (err, img) => (err ? reject(err) : resolve(img)));
  });
}

function writeImage(image, outPath) {
  image.resize(SIZE, SIZE, Jimp.RESIZE_BILINEAR);
  return new Promise((resolve, reject) => {
    image.write(outPath, (err) => (err ? reject(err) : resolve()));
  });
}

const STAGES = ['egg', 'hatchling', 'juvenile', 'companion'];
const MOODS = ['joyful', 'content', 'neutral', 'down', 'lonely'];

async function generateCharacterSprites() {
  for (const stage of STAGES) {
    const basePalette = STAGE_PALETTE[stage];
    for (const mood of MOODS) {
      const adjust = MOOD_BODY_ADJUST[mood];
      const palette = {
        ...basePalette,
        body: adjust(basePalette.body),
        bodyLight: brighten(adjust(basePalette.body), 0.25),
      };
      const image = await createImage();
      STAGE_DRAW[stage](image, palette);
      paintFace(image, STAGE_FACE[stage], mood);
      const outPath = path.join(CHARACTER_DIR, `${stage}-${mood}.png`);
      await writeImage(image, outPath);
      console.log('wrote', outPath);
    }
  }
}

async function generateAccessories() {
  const accessories = [
    ['tier1.png', drawBow],
    ['tier2.png', drawSparkle],
    ['tier3.png', drawCrown],
  ];
  for (const [fileName, draw] of accessories) {
    const image = await createImage();
    draw(image);
    const outPath = path.join(ACCESSORY_DIR, fileName);
    await writeImage(image, outPath);
    console.log('wrote', outPath);
  }
}

async function main() {
  await generateCharacterSprites();
  await generateAccessories();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
