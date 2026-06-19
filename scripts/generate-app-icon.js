// 앱 아이콘 & 스플래시 생성
// 실행: node scripts/generate-app-icon.js
const path = require('path');
const Jimp = require('jimp-compact');

const OUT = path.join(__dirname, '../assets/images');

function setPixel(img, x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0 || x >= img.bitmap.width || y >= img.bitmap.height) return;
  const idx = (y * img.bitmap.width + x) * 4;
  img.bitmap.data[idx]     = r;
  img.bitmap.data[idx + 1] = g;
  img.bitmap.data[idx + 2] = b;
  img.bitmap.data[idx + 3] = a;
}

function lerp(a, b, t) { return a + (b - a) * t; }

// 방사형 그라디언트 배경
function fillRadialGradient(img, cx, cy, innerColor, outerColor) {
  const W = img.bitmap.width, H = img.bitmap.height;
  const maxR = Math.sqrt(cx * cx + cy * cy) * 1.2;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const t = Math.min(dist / maxR, 1);
      const ease = t * t;
      setPixel(img, x, y,
        Math.round(lerp(innerColor[0], outerColor[0], ease)),
        Math.round(lerp(innerColor[1], outerColor[1], ease)),
        Math.round(lerp(innerColor[2], outerColor[2], ease)),
      );
    }
  }
}

// 원 그리기 (안티앨리어싱)
function drawCircle(img, cx, cy, r, color, thickness = 1) {
  const [cr, cg, cb, ca = 255] = color;
  for (let y = Math.floor(cy - r - 2); y <= Math.ceil(cy + r + 2); y++) {
    for (let x = Math.floor(cx - r - 2); x <= Math.ceil(cx + r + 2); x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const diff = Math.abs(dist - r);
      if (diff < thickness + 1) {
        const alpha = Math.max(0, 1 - diff / (thickness + 0.5));
        const a = Math.round(alpha * ca);
        if (a > 0) setPixel(img, x, y, cr, cg, cb, a);
      }
    }
  }
}

// 원 채우기 (안티앨리어싱)
function fillCircle(img, cx, cy, r, color) {
  const [cr, cg, cb, ca = 255] = color;
  for (let y = Math.floor(cy - r - 1); y <= Math.ceil(cy + r + 1); y++) {
    for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r + 1); x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const alpha = Math.max(0, Math.min(1, r - dist + 0.5));
      const a = Math.round(alpha * ca);
      if (a > 0) setPixel(img, x, y, cr, cg, cb, a);
    }
  }
}

// 선 그리기
function drawLine(img, x0, y0, x1, y1, color, thickness = 1) {
  const [cr, cg, cb, ca = 255] = color;
  const dx = x1 - x0, dy = y1 - y0;
  const len = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.ceil(len * 2);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const px = x0 + dx * t, py = y0 + dy * t;
    for (let oy = -thickness; oy <= thickness; oy++) {
      for (let ox = -thickness; ox <= thickness; ox++) {
        const d = Math.sqrt(ox * ox + oy * oy);
        const a = Math.max(0, 1 - d / (thickness + 0.5));
        if (a > 0) setPixel(img, Math.round(px + ox), Math.round(py + oy), cr, cg, cb, Math.round(a * ca));
      }
    }
  }
}

// 8방향 별 (끝이 뾰족한 다이아몬드형)
function drawStar(img, cx, cy, outerR, innerR, points, color) {
  const [cr, cg, cb] = color;
  const step = (Math.PI * 2) / points;
  // 래스터화: 별 내부 픽셀 채우기
  const minX = Math.floor(cx - outerR - 1), maxX = Math.ceil(cx + outerR + 1);
  const minY = Math.floor(cy - outerR - 1), maxY = Math.ceil(cy + outerR + 1);

  // 별 꼭짓점 좌표 생성
  const verts = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    verts.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
  }

  // 폴리곤 내부 픽셀 채우기 (ray casting)
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      let inside = false;
      let j = verts.length - 1;
      for (let i = 0; i < verts.length; i++) {
        const [xi, yi] = verts[i], [xj, yj] = verts[j];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
          inside = !inside;
        }
        j = i;
      }
      if (inside) setPixel(img, x, y, cr, cg, cb, 255);
    }
  }
}

async function generateIcon(size, filename, opts = {}) {
  const { bgInner = [18, 4, 50], bgOuter = [5, 0, 20], forAdaptive = false } = opts;
  const img = new Jimp(size, size, 0x00000000);
  const cx = size / 2, cy = size / 2;

  // 배경
  if (!forAdaptive) {
    fillRadialGradient(img, cx, cy, bgInner, bgOuter);
  }

  const scale = size / 1024;

  // ── 방사선 (12간지 상징) ──
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const r0 = 130 * scale, r1 = 360 * scale;
    const x0 = cx + Math.cos(angle) * r0, y0 = cy + Math.sin(angle) * r0;
    const x1 = cx + Math.cos(angle) * r1, y1 = cy + Math.sin(angle) * r1;
    const isMain = i % 2 === 0;
    drawLine(img, x0, y0, x1, y1,
      isMain ? [255, 210, 80, 60] : [180, 100, 255, 40],
      isMain ? Math.max(1, 1.5 * scale) : Math.max(1, 0.8 * scale),
    );
  }

  // ── 동심원 ──
  drawCircle(img, cx, cy, 360 * scale, [255, 210, 80, 70], 1.5 * scale);
  drawCircle(img, cx, cy, 280 * scale, [180, 100, 255, 50], 1.2 * scale);
  drawCircle(img, cx, cy, 190 * scale, [255, 210, 80, 45], 1.2 * scale);

  // ── 글로우 (중앙 빛) ──
  for (let r = 160 * scale; r > 0; r -= 2 * scale) {
    const t = r / (160 * scale);
    const a = Math.round((1 - t) * (1 - t) * 40);
    if (a > 0) fillCircle(img, cx, cy, r, [180, 80, 255, a]);
  }

  // ── 8각 별 ──
  drawStar(img, cx, cy, 140 * scale, 56 * scale, 8, [255, 210, 80]);

  // ── 별 중앙 흰 코어 ──
  fillCircle(img, cx, cy, 42 * scale, [255, 255, 255, 220]);
  fillCircle(img, cx, cy, 28 * scale, [255, 210, 80, 255]);

  // ── 별자리 점들 ──
  const dots = [
    [0.18, 0.22], [0.82, 0.22], [0.18, 0.78], [0.82, 0.78],
    [0.12, 0.50], [0.88, 0.50], [0.50, 0.12], [0.50, 0.88],
    [0.28, 0.30], [0.72, 0.30], [0.28, 0.70], [0.72, 0.70],
  ];
  for (const [dx, dy] of dots) {
    fillCircle(img, dx * size, dy * size, 3 * scale, [255, 220, 120, 130]);
  }

  await img.writeAsync(path.join(OUT, filename));
  console.log(`✓ ${filename} (${size}×${size})`);
}

async function generateSplash(filename) {
  const W = 288, H = 288;
  const img = new Jimp(W, H, 0x00000000);
  const cx = W / 2, cy = H / 2;
  const scale = W / 1024;

  // 투명 배경 (스플래시 배경은 app.json으로 설정)
  const r0 = 100, r1 = 40;

  // 글로우
  for (let r = 90; r > 0; r -= 1) {
    const t = r / 90;
    fillCircle(img, cx, cy, r, [180, 80, 255, Math.round((1 - t) * (1 - t) * 50)]);
  }

  // 방사선
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const x0 = cx + Math.cos(angle) * 32, y0 = cy + Math.sin(angle) * 32;
    const x1 = cx + Math.cos(angle) * 88, y1 = cy + Math.sin(angle) * 88;
    drawLine(img, x0, y0, x1, y1, i % 2 === 0 ? [255, 210, 80, 55] : [180, 100, 255, 35], 1);
  }

  // 동심원
  drawCircle(img, cx, cy, 88, [255, 210, 80, 65], 1.2);
  drawCircle(img, cx, cy, 68, [180, 100, 255, 45], 1);
  drawCircle(img, cx, cy, 48, [255, 210, 80, 40], 1);

  // 8각 별
  drawStar(img, cx, cy, 34, 14, 8, [255, 210, 80]);
  fillCircle(img, cx, cy, 10, [255, 255, 255, 220]);
  fillCircle(img, cx, cy, 7, [255, 210, 80, 255]);

  await img.writeAsync(path.join(OUT, filename));
  console.log(`✓ ${filename}`);
}

async function generateAdaptiveBg(filename) {
  const S = 1024;
  const img = new Jimp(S, S, 0xFF);
  fillRadialGradient(img, S / 2, S / 2, [18, 4, 50], [5, 0, 20]);
  await img.writeAsync(path.join(OUT, filename));
  console.log(`✓ ${filename}`);
}

(async () => {
  console.log('아이콘 생성 중...');
  await generateIcon(1024, 'icon.png');
  await generateIcon(1024, 'android-icon-foreground.png', { forAdaptive: true });
  await generateAdaptiveBg('android-icon-background.png');
  await generateSplash('splash-icon.png');
  console.log('완료!');
})().catch(console.error);
