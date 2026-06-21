// 생성된 카드 아트: 흰 배경 제거 → src/assets/character/ 복사
// 실행: node scripts/apply-card-art.js
const Jimp = require('jimp-compact');
const fs   = require('fs');
const path = require('path');

const SRC  = path.join(__dirname, 'test-output', 'cards');
const DEST = path.join(__dirname, '../src/assets/character');
const WHITE_THRESHOLD = 230;

function isWhiteish(r, g, b, a) {
  return a > 10 && r >= WHITE_THRESHOLD && g >= WHITE_THRESHOLD && b >= WHITE_THRESHOLD;
}

async function removeWhiteBg(img) {
  const w = img.getWidth(), h = img.getHeight();
  const visited = new Uint8Array(w * h);
  const queue = [];

  for (const [sx, sy] of [[0,0],[w-1,0],[0,h-1],[w-1,h-1]]) {
    const idx = sy * w + sx;
    if (!visited[idx]) {
      const c = Jimp.intToRGBA(img.getPixelColor(sx, sy));
      if (isWhiteish(c.r, c.g, c.b, c.a)) { visited[idx] = 1; queue.push([sx, sy]); }
    }
  }

  const dx = [1,-1,0,0], dy = [0,0,1,-1];
  let qi = 0, removed = 0;
  while (qi < queue.length) {
    const [x, y] = queue[qi++];
    img.setPixelColor(Jimp.rgbaToInt(0,0,0,0), x, y);
    removed++;
    for (let d = 0; d < 4; d++) {
      const nx = x+dx[d], ny = y+dy[d];
      if (nx<0||nx>=w||ny<0||ny>=h) continue;
      const nidx = ny*w+nx;
      if (visited[nidx]) continue;
      const c = Jimp.intToRGBA(img.getPixelColor(nx, ny));
      if (isWhiteish(c.r,c.g,c.b,c.a)) { visited[nidx]=1; queue.push([nx,ny]); }
    }
  }
  return removed;
}

async function main() {
  const files = fs.readdirSync(SRC).filter(f => f.endsWith('.png'));
  if (files.length === 0) {
    console.error('test-output/cards/ 에 PNG 없음 — 먼저 generate-card-art.js 실행');
    process.exit(1);
  }

  console.log(`처리 대상: ${files.length}장\n`);
  for (const f of files) {
    const src  = path.join(SRC, f);
    const dest = path.join(DEST, f);
    process.stdout.write(`${f} ... `);
    try {
      const img = await Jimp.read(src);
      const removed = await removeWhiteBg(img);
      await img.writeAsync(dest);
      console.log(`완료 (배경 ${removed}px 제거)`);
    } catch (e) {
      console.log(`실패: ${e.message}`);
    }
  }
  console.log('\n✅ 완료 — src/assets/character/ 에 저장됨');
}

main().catch(console.error);
