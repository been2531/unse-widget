// BFS flood-fill: 모서리에서 흰 배경 → 투명으로 제거
const Jimp = require('jimp-compact');
const path = require('path');
const fs = require('fs');

const CHAR_DIR = path.join(__dirname, '../src/assets/character');

// 흰색 임계값 (RGB 각각 230 이상이면 흰색으로 간주)
const WHITE_THRESHOLD = 230;

function isWhiteish(r, g, b, a) {
  return a > 10 && r >= WHITE_THRESHOLD && g >= WHITE_THRESHOLD && b >= WHITE_THRESHOLD;
}

async function removeWhiteBg(filePath) {
  const img = await Jimp.read(filePath);
  const w = img.getWidth();
  const h = img.getHeight();

  const visited = new Uint8Array(w * h);
  const queue = [];

  // 4 모서리에서 시작
  const seeds = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]];
  for (const [sx, sy] of seeds) {
    const idx = sy * w + sx;
    if (!visited[idx]) {
      const c = Jimp.intToRGBA(img.getPixelColor(sx, sy));
      if (isWhiteish(c.r, c.g, c.b, c.a)) {
        visited[idx] = 1;
        queue.push([sx, sy]);
      }
    }
  }

  // BFS
  const dx = [1, -1, 0, 0];
  const dy = [0, 0, 1, -1];
  let qi = 0;
  while (qi < queue.length) {
    const [x, y] = queue[qi++];
    img.setPixelColor(Jimp.rgbaToInt(0, 0, 0, 0), x, y);

    for (let d = 0; d < 4; d++) {
      const nx = x + dx[d];
      const ny = y + dy[d];
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
      const nidx = ny * w + nx;
      if (visited[nidx]) continue;
      const c = Jimp.intToRGBA(img.getPixelColor(nx, ny));
      if (isWhiteish(c.r, c.g, c.b, c.a)) {
        visited[nidx] = 1;
        queue.push([nx, ny]);
      }
    }
  }

  await img.writeAsync(filePath);
  console.log(`✓ ${path.basename(filePath)} (${queue.length}px 제거)`);
}

// element_N.png 파일만 처리 (egg/newborn 등 기존 pet 이미지 제외)
const targets = fs.readdirSync(CHAR_DIR)
  .filter(f => /^(fire|water|lightning|nature|dark|light)_\d+\.png$/.test(f))
  .map(f => path.join(CHAR_DIR, f));

console.log(`처리 대상: ${targets.length}개`);
(async () => {
  for (const f of targets) {
    await removeWhiteBg(f);
  }
  console.log('완료');
})().catch(console.error);
