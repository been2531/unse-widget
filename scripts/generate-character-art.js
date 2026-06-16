// Procedurally generates the 35 character sprites (7 growth stages x 5
// moods). Earlier version painted smooth ellipses/triangles onto a large
// canvas and downsampled with bilinear filtering — that produced a blurry
// shape that was neither crisp pixel art nor a clean illustration. This
// version commits fully to pixel art instead: every sprite is authored on
// a small 40x40 logical grid (hard per-cell colors, no blending), a 1-cell
// outline is grown around the silhouette, and each logical cell is blitted
// as a flat SCALE x SCALE block — no resize/blur step exists at all.
//
// Run with: node scripts/generate-character-art.js
const path = require('path');
const Jimp = require('jimp-compact');

const LOGICAL = 40;
const SCALE = 6;
const CANVAS = LOGICAL * SCALE; // 240, matches existing <Image>/widget usage

const CHARACTER_DIR = path.join(__dirname, '../src/assets/character');

// ---- color helpers (plain [r,g,b] triples, no alpha — pixel art here is
// flat colors only) -------------------------------------------------------

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

const FACE_COLOR = hexToRgb('#3B362E');
const TEAR_COLOR = hexToRgb('#8FCBEA');
const BLUSH_COLOR = hexToRgb('#F2849E');
const OUTLINE_COLOR = hexToRgb('#2B2722'); // shared across every stage so the 7 sprites read as one evolution line

const MOOD_BODY_ADJUST = {
  joyful: (c) => brighten(c, 0.08),
  content: (c) => c,
  neutral: (c) => desaturate(c, 0.05),
  down: (c) => desaturate(darken(c, 0.12), 0.15),
  lonely: (c) => desaturate(darken(c, 0.18), 0.25),
};

const STAGE_PALETTE = {
  egg: { body: hexToRgb('#F4E4C1'), accent: hexToRgb('#DDBE8C'), dark: hexToRgb('#B89A6A') },
  newborn: { body: hexToRgb('#FBE3D6'), accent: hexToRgb('#F2A6A6'), shell: hexToRgb('#F4E4C1') },
  infant: { body: hexToRgb('#D7EFC4'), accent: hexToRgb('#94C77A') },
  child: { body: hexToRgb('#BFE3DE'), accent: hexToRgb('#5FAFA3') },
  adolescent: { body: hexToRgb('#9FCBDB'), accent: hexToRgb('#4F8EA8'), accent2: hexToRgb('#2F6E86') },
  youngAdult: { body: hexToRgb('#F2A65A'), accent: hexToRgb('#D98A3D'), accent2: hexToRgb('#E84F6B') },
  elder: { body: hexToRgb('#C9C3D6'), accent: hexToRgb('#9A93AE'), accent2: hexToRgb('#E8D9A0') },
};

// ---- grid engine ---------------------------------------------------------
// Every shape helper below writes into a 40x40 logical grid (cell = null or
// an [r,g,b] color) instead of a raster image. The image only gets created
// once, at blit time.

function createGrid() {
  return Array.from({ length: LOGICAL }, () => new Array(LOGICAL).fill(null));
}

function inBounds(x, y) {
  return x >= 0 && y >= 0 && x < LOGICAL && y < LOGICAL;
}

function setCell(grid, x, y, color) {
  const ix = Math.round(x);
  const iy = Math.round(y);
  if (!inBounds(ix, iy)) return;
  grid[iy][ix] = color;
}

function stampEllipse(grid, cx, cy, rx, ry, color) {
  if (rx <= 0 || ry <= 0) return;
  const minX = Math.floor(cx - rx - 1);
  const maxX = Math.ceil(cx + rx + 1);
  const minY = Math.floor(cy - ry - 1);
  const maxY = Math.ceil(cy + ry + 1);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1) setCell(grid, x, y, color);
    }
  }
}

function stampRotatedEllipse(grid, cx, cy, rx, ry, angleDeg, color) {
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
      if ((lx * lx) / (rx * rx) + (ly * ly) / (ry * ry) <= 1) setCell(grid, x, y, color);
    }
  }
}

function triangleSign(p1, p2, p3) {
  return (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1]);
}

function stampTriangle(grid, v1, v2, v3, color) {
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
      if (!(hasNeg && hasPos)) setCell(grid, x, y, color);
    }
  }
}

function stampRect(grid, x0, y0, x1, y1, color) {
  for (let y = Math.round(y0); y <= Math.round(y1); y++) {
    for (let x = Math.round(x0); x <= Math.round(x1); x++) {
      setCell(grid, x, y, color);
    }
  }
}

// Stamps a small named pixel pattern (face features, speckles, cracks) —
// `offsets` is a list of [dx, dy] cells relative to an anchor point.
function stampOffsets(grid, ox, oy, offsets, color) {
  for (const [dx, dy] of offsets) setCell(grid, ox + dx, oy + dy, color);
}

// The raw ellipse inequality leaves a wide flat plateau at the poles at
// this resolution (the width-vs-height curve is steepest right at the tip,
// so the first 1-2 rows already span several cells) — it reads as a
// flat-topped cylinder instead of a rounded/pointed cap. Hand-taper those
// rows down to a narrower width so the silhouette actually curves to a tip.
function narrowCapRow(grid, y, cx, halfWidth) {
  if (y < 0 || y >= LOGICAL) return;
  for (let x = 0; x < LOGICAL; x++) {
    if (Math.abs(x + 0.5 - cx) > halfWidth) grid[y][x] = null;
  }
}

// Dilates the silhouette by 1 logical cell and returns just the new ring —
// painted *underneath* the body grid at blit time, so it only ever shows up
// as a 1-cell border (the dilated cells are by definition not part of the
// original silhouette).
function computeOutline(grid) {
  const outline = createGrid();
  for (let y = 0; y < LOGICAL; y++) {
    for (let x = 0; x < LOGICAL; x++) {
      if (grid[y][x]) continue;
      const neighbors = [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ];
      for (const [nx, ny] of neighbors) {
        if (inBounds(nx, ny) && grid[ny][nx]) {
          outline[y][x] = OUTLINE_COLOR;
          break;
        }
      }
    }
  }
  return outline;
}

// ---- stage silhouettes ---------------------------------------------------
// Drawn back-to-front: tail/wings, then torso, then limbs, then head (so the
// head cleanly overlaps the ear bases), then frontmost details (tuft/crest).

function drawEgg(grid, palette) {
  stampEllipse(grid, 20, 23, 9, 12, palette.body);
  stampEllipse(grid, 17, 17, 4, 5, palette.bodyLight);
  const speckles = [
    [15, 14],
    [25, 16],
    [16, 27],
    [24, 29],
    [20, 12],
    [26, 22],
    [14, 21],
  ];
  for (const [sx, sy] of speckles) setCell(grid, sx, sy, palette.accent);
  narrowCapRow(grid, 11, 20, 1);
  narrowCapRow(grid, 12, 20, 3);
  narrowCapRow(grid, 13, 20, 6);
  narrowCapRow(grid, 34, 20, 1);
  narrowCapRow(grid, 33, 20, 3);
  narrowCapRow(grid, 32, 20, 6);
}

function paintEggCracks(grid, palette, mood) {
  const crackColor = palette.dark;
  const baseCrack = [
    [20, 11],
    [19, 12],
    [21, 13],
    [19, 14],
    [20, 15],
  ];
  stampOffsets(grid, 0, 0, baseCrack, crackColor);
  if (mood === 'down' || mood === 'lonely') {
    stampOffsets(
      grid,
      0,
      0,
      [
        [26, 18],
        [25, 19],
        [26, 20],
        [25, 21],
      ],
      crackColor
    );
  }
  if (mood === 'lonely') {
    stampOffsets(
      grid,
      0,
      0,
      [
        [14, 24],
        [15, 25],
        [14, 26],
      ],
      crackColor
    );
  }
}

function drawNewborn(grid, palette) {
  stampTriangle(grid, [6, 34], [14, 34], [9, 39], palette.shell);
  stampTriangle(grid, [26, 34], [34, 34], [31, 39], palette.shell);
  stampEllipse(grid, 20, 27, 10, 9, palette.body); // body
  stampEllipse(grid, 8, 27, 3, 4, palette.body); // stub arms
  stampEllipse(grid, 32, 27, 3, 4, palette.body);
  stampEllipse(grid, 20, 16, 11, 10, palette.body); // head (drawn after arms/body)
  stampTriangle(grid, [17, 5], [23, 5], [20, 1], palette.accent); // tuft
}

function drawInfant(grid, palette) {
  stampEllipse(grid, 33, 30, 3, 3, palette.accent); // tail nub
  stampEllipse(grid, 20, 28, 11, 10, palette.body); // body
  stampRect(grid, 13, 35, 17, 38, palette.body); // legs
  stampRect(grid, 23, 35, 27, 38, palette.body);
  stampEllipse(grid, 11, 8, 3, 4, palette.accent); // ears
  stampEllipse(grid, 29, 8, 3, 4, palette.accent);
  stampEllipse(grid, 20, 13, 10, 9, palette.body); // head
}

function drawChild(grid, palette) {
  stampRotatedEllipse(grid, 32, 26, 6, 3, -25, palette.accent); // tail
  stampEllipse(grid, 36, 20, 3, 3, palette.accent);
  stampEllipse(grid, 20, 27, 10, 11, palette.body); // torso
  stampEllipse(grid, 20, 29, 5, 7, palette.bodyLight); // belly patch
  stampRect(grid, 8, 22, 11, 30, palette.body); // arms
  stampRect(grid, 29, 22, 32, 30, palette.body);
  stampRect(grid, 14, 35, 18, 39, palette.body); // legs
  stampRect(grid, 22, 35, 26, 39, palette.body);
  stampTriangle(grid, [10, 6], [16, 4], [14, 12], palette.accent); // ears
  stampTriangle(grid, [30, 6], [24, 4], [26, 12], palette.accent);
  stampEllipse(grid, 20, 11, 9, 8, palette.body); // head
}

function drawAdolescent(grid, palette) {
  stampRotatedEllipse(grid, 33, 24, 7, 3, -30, palette.accent); // tail
  stampEllipse(grid, 38, 16, 3, 3, palette.accent);
  stampTriangle(grid, [6, 20], [2, 12], [10, 18], palette.accent2); // wing buds
  stampTriangle(grid, [34, 20], [38, 12], [30, 18], palette.accent2);
  stampEllipse(grid, 20, 26, 9, 12, palette.body); // torso, lankier
  stampRotatedEllipse(grid, 20, 24, 3, 8, 0, palette.accent2); // marking stripe
  stampRect(grid, 7, 18, 10, 31, palette.body); // longer arms
  stampRect(grid, 30, 18, 33, 31, palette.body);
  stampRect(grid, 14, 36, 18, 39, palette.body); // longer legs
  stampRect(grid, 22, 36, 26, 39, palette.body);
  stampTriangle(grid, [9, 5], [15, 2], [14, 11], palette.accent); // ears
  stampTriangle(grid, [31, 5], [25, 2], [26, 11], palette.accent);
  stampEllipse(grid, 20, 10, 8, 7, palette.body); // head
  stampTriangle(grid, [16, 2], [20, 0], [20, 4], palette.accent); // spiky tuft
  stampTriangle(grid, [20, 1], [24, 0], [24, 4], palette.accent);
}

function drawYoungAdult(grid, palette) {
  stampRotatedEllipse(grid, 34, 25, 8, 3, -30, palette.accent); // tail
  stampEllipse(grid, 39, 15, 3, 3, palette.accent);
  stampRotatedEllipse(grid, 6, 18, 9, 4, -35, palette.accent2); // spread wings
  stampRotatedEllipse(grid, 34, 18, 9, 4, 35, palette.accent2);
  stampEllipse(grid, 20, 25, 9, 12, palette.body); // athletic torso
  stampRotatedEllipse(grid, 20, 23, 3, 9, 0, palette.accent2); // markings
  stampRotatedEllipse(grid, 14, 25, 2, 6, 10, palette.accent2);
  stampRotatedEllipse(grid, 26, 25, 2, 6, -10, palette.accent2);
  stampRect(grid, 8, 17, 11, 29, palette.body); // arms
  stampRect(grid, 29, 17, 32, 29, palette.body);
  stampRect(grid, 14, 35, 18, 39, palette.body); // legs
  stampRect(grid, 22, 35, 26, 39, palette.body);
  stampTriangle(grid, [9, 4], [15, 1], [14, 10], palette.accent); // ears
  stampTriangle(grid, [31, 4], [25, 1], [26, 10], palette.accent);
  stampEllipse(grid, 20, 9, 8, 7, palette.body); // head
  stampTriangle(grid, [18, 1], [22, 0], [22, 5], palette.accent2); // crest
}

function drawElder(grid, palette) {
  stampRotatedEllipse(grid, 32, 27, 6, 3, -20, palette.accent); // curled tail
  stampEllipse(grid, 36, 22, 2, 2, palette.accent);
  stampRotatedEllipse(grid, 9, 22, 5, 3, -20, palette.accent2); // folded wings
  stampRotatedEllipse(grid, 31, 22, 5, 3, 20, palette.accent2);
  stampEllipse(grid, 20, 27, 9, 11, palette.body); // stooped torso
  stampRect(grid, 9, 20, 12, 30, palette.body); // arms
  stampRect(grid, 28, 20, 31, 30, palette.body);
  stampRect(grid, 14, 35, 18, 39, palette.body); // legs
  stampRect(grid, 22, 35, 26, 39, palette.body);
  stampTriangle(grid, [10, 7], [16, 5], [14, 13], palette.accent); // drooped ears
  stampTriangle(grid, [30, 7], [24, 5], [26, 13], palette.accent);
  stampEllipse(grid, 20, 12, 8, 7, palette.body); // head
  stampRect(grid, 4, 16, 11, 17, palette.accent2); // long whiskers
  stampRect(grid, 29, 16, 36, 17, palette.accent2);
  stampEllipse(grid, 20, 9, 2, 2, palette.accent2); // wisdom mark
}

const STAGE_DRAW = {
  newborn: drawNewborn,
  infant: drawInfant,
  child: drawChild,
  adolescent: drawAdolescent,
  youngAdult: drawYoungAdult,
  elder: drawElder,
};

const STAGE_FACE = {
  newborn: { cx: 20, cy: 17, eyeDX: 5, mouthY: 21 },
  infant: { cx: 20, cy: 14, eyeDX: 5, mouthY: 18 },
  child: { cx: 20, cy: 12, eyeDX: 4, mouthY: 15 },
  adolescent: { cx: 20, cy: 11, eyeDX: 4, mouthY: 14 },
  youngAdult: { cx: 20, cy: 10, eyeDX: 4, mouthY: 13 },
  elder: { cx: 20, cy: 13, eyeDX: 4, mouthY: 16 },
};

// ---- mood faces ------------------------------------------------------
// Blocky pixel patterns instead of antialiased arcs — reads as intentional
// at this resolution instead of as a smoothing artifact. Same per-mood
// meaning as before: joyful=closed happy ^, content=small round eye,
// neutral=flat dot, down=droopy+eyebrow, lonely=droopy+tear (no eyebrow).

const EYE_OFFSETS = {
  joyful: [[-1, 1], [0, 0], [1, 1]],
  content: [[0, -1], [-1, 0], [0, 0], [1, 0], [0, 1]],
  neutral: [[0, -1], [0, 0], [0, 1]],
  down: [[-1, 0], [0, 0], [1, 0]],
  lonely: [[-1, 0], [0, 0], [1, 0]],
};

const MOUTH_OFFSETS = {
  joyful: [[-2, 0], [-1, 1], [0, 1], [1, 1], [2, 0]],
  content: [[-1, 0], [0, 1], [1, 0]],
  neutral: [[-1, 0], [0, 0], [1, 0]],
  down: [[-1, 1], [0, 0], [1, 1]],
  lonely: [[-1, 1], [0, 0], [1, 1]],
};

const EYEBROW_LEFT = [[-1, -3], [0, -2], [1, -2]];
const EYEBROW_RIGHT = [[1, -3], [0, -2], [-1, -2]];

function paintFace(grid, face, mood) {
  const { cx, cy, eyeDX, mouthY } = face;
  const leftEyeX = cx - eyeDX;
  const rightEyeX = cx + eyeDX;

  stampOffsets(grid, leftEyeX, cy, EYE_OFFSETS[mood], FACE_COLOR);
  stampOffsets(grid, rightEyeX, cy, EYE_OFFSETS[mood], FACE_COLOR);
  stampOffsets(grid, cx, mouthY, MOUTH_OFFSETS[mood], FACE_COLOR);

  if (mood === 'down') {
    stampOffsets(grid, leftEyeX, cy, EYEBROW_LEFT, FACE_COLOR);
    stampOffsets(grid, rightEyeX, cy, EYEBROW_RIGHT, FACE_COLOR);
  }

  if (mood === 'joyful') {
    setCell(grid, leftEyeX - 2, cy + 2, BLUSH_COLOR);
    setCell(grid, rightEyeX + 2, cy + 2, BLUSH_COLOR);
  }

  if (mood === 'lonely') {
    setCell(grid, rightEyeX + 1, cy + 2, TEAR_COLOR);
    setCell(grid, rightEyeX + 1, cy + 3, TEAR_COLOR);
  }
}

// ---- orchestration -----------------------------------------------------

function createImage() {
  return new Promise((resolve, reject) => {
    new Jimp(CANVAS, CANVAS, Jimp.rgbaToInt(0, 0, 0, 0), (err, img) => (err ? reject(err) : resolve(img)));
  });
}

function setPixelOpaque(image, x, y, r, g, b) {
  const w = image.bitmap.width;
  const h = image.bitmap.height;
  if (x < 0 || y < 0 || x >= w || y >= h) return;
  const idx = (y * w + x) * 4;
  const data = image.bitmap.data;
  data[idx + 0] = r;
  data[idx + 1] = g;
  data[idx + 2] = b;
  data[idx + 3] = 255;
}

function blitGrid(image, bodyGrid, outlineGrid) {
  for (let gy = 0; gy < LOGICAL; gy++) {
    for (let gx = 0; gx < LOGICAL; gx++) {
      const color = bodyGrid[gy][gx] || outlineGrid[gy][gx];
      if (!color) continue;
      const r = Math.round(color[0]);
      const g = Math.round(color[1]);
      const b = Math.round(color[2]);
      const baseX = gx * SCALE;
      const baseY = gy * SCALE;
      for (let sy = 0; sy < SCALE; sy++) {
        for (let sx = 0; sx < SCALE; sx++) {
          setPixelOpaque(image, baseX + sx, baseY + sy, r, g, b);
        }
      }
    }
  }
}

function writeImage(image, outPath) {
  return new Promise((resolve, reject) => {
    image.write(outPath, (err) => (err ? reject(err) : resolve()));
  });
}

const STAGES = ['egg', 'newborn', 'infant', 'child', 'adolescent', 'youngAdult', 'elder'];
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

      const grid = createGrid();
      if (stage === 'egg') {
        drawEgg(grid, palette);
      } else {
        STAGE_DRAW[stage](grid, palette);
      }
      const outline = computeOutline(grid);
      if (stage === 'egg') {
        paintEggCracks(grid, palette, mood);
      } else {
        paintFace(grid, STAGE_FACE[stage], mood);
      }

      const image = await createImage();
      blitGrid(image, grid, outline);
      const outPath = path.join(CHARACTER_DIR, `${stage}-${mood}.png`);
      await writeImage(image, outPath);
      console.log('wrote', outPath);
    }
  }
}

generateCharacterSprites().catch((err) => {
  console.error(err);
  process.exit(1);
});
