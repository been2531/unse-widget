// 생성된 카드 아트 → src/assets/character/ 복사 (배경 유지)
// 실행: node scripts/apply-card-art.js
const fs   = require('fs');
const path = require('path');

const SRC  = path.join(__dirname, 'test-output', 'cards');
const DEST = path.join(__dirname, '../src/assets/character');

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
      fs.copyFileSync(src, dest);
      console.log('완료');
    } catch (e) {
      console.log(`실패: ${e.message}`);
    }
  }
  console.log('\n완료 — src/assets/character/ 에 저장됨');
}

main().catch(console.error);
