// 캐릭터 PNG 흰 배경 제거 — jimp-compact 사용
// 실행: node scripts/remove-bg.js
// 처리: src/assets/character/{element}_{n}.png → 인플레이스 업데이트

const Jimp = require('jimp-compact');
const fs   = require('fs');
const path = require('path');

const CHAR_DIR = path.join(__dirname, '../src/assets/character');
const THRESHOLD = 28; // 흰색 인식 임계값 (0~255, 높을수록 더 많이 제거)

const FILES = fs.readdirSync(CHAR_DIR).filter(f =>
  /^(fire|water|lightning|nature|dark|light)_\d\.png$/.test(f),
);

// 픽셀이 "흰색에 가까운지" 판단
function isWhitish(r, g, b) {
  return r > 255 - THRESHOLD && g > 255 - THRESHOLD && b > 255 - THRESHOLD;
}

// BFS flood fill — 모서리에서 시작해 연결된 흰 영역을 투명화
function floodFillTransparent(img) {
  const { width, height, data } = img.bitmap;
  const visited = new Uint8Array(width * height);
  const queue = [];

  // 전체 4개 엣지를 시작점으로
  const seeds = [];
  for (let x = 0; x < width; x++) { seeds.push([x, 0]); seeds.push([x, height - 1]); }
  for (let y = 0; y < height; y++) { seeds.push([0, y]); seeds.push([width - 1, y]); }

  for (const [cx, cy] of seeds) {
    const idx = (cy * width + cx) * 4;
    if (!visited[cy * width + cx] && isWhitish(data[idx], data[idx+1], data[idx+2])) {
      queue.push([cx, cy]);
      visited[cy * width + cx] = 1;
    }
  }

  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  while (queue.length > 0) {
    const [x, y] = queue.shift();
    const idx = (y * width + x) * 4;
    data[idx + 3] = 0; // 투명

    for (const [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      const npos = ny * width + nx;
      if (visited[npos]) continue;
      const nidx = npos * 4;
      if (isWhitish(data[nidx], data[nidx+1], data[nidx+2])) {
        visited[npos] = 1;
        queue.push([nx, ny]);
      }
    }
  }
}

async function processFile(filename) {
  const filePath = path.join(CHAR_DIR, filename);
  const img = await Jimp.read(filePath);
  floodFillTransparent(img);
  await img.writeAsync(filePath);
  process.stdout.write(` 완료\n`);
}

async function main() {
  console.log(`배경 제거 시작 — ${FILES.length}개 파일\n`);
  for (const f of FILES) {
    process.stdout.write(`  ${f} ...`);
    try {
      await processFile(f);
    } catch (e) {
      console.log(` 실패: ${e.message}`);
    }
  }
  console.log('\n완료 — src/assets/character/ 업데이트됨');
}

main().catch(e => { console.error(e); process.exit(1); });
