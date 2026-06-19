// 생성된 AI 아트를 src/assets/character/ 에 복사
// 실행: node scripts/apply-ai-art.js
const fs   = require('fs');
const path = require('path');

const SRC  = path.join(__dirname, 'test-output', 'ai');
const DEST = path.join(__dirname, '../src/assets/character');

const files = fs.readdirSync(SRC).filter(f => f.endsWith('.png'));
if (files.length === 0) {
  console.error('test-output/ai/ 에 PNG 파일이 없습니다. 먼저 generate-character-art-ai.js 를 실행하세요.');
  process.exit(1);
}

let copied = 0;
for (const f of files) {
  fs.copyFileSync(path.join(SRC, f), path.join(DEST, f));
  console.log(`복사: ${f}`);
  copied++;
}
console.log(`\n완료 — ${copied}장 복사됨 → ${DEST}`);
